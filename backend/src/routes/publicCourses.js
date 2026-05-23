const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Course = require('../models/Course');
const User = require('../models/User');
const PublishedCourse = require('../models/PublishedCourse');
const CourseLike = require('../models/CourseLike');
const CourseBookmark = require('../models/CourseBookmark');
const CourseReadingProgress = require('../models/CourseReadingProgress');
const CreatorFollow = require('../models/CreatorFollow');
const CourseViewEvent = require('../models/CourseViewEvent');

const normalizeIndex = (value, fallback = 0) => {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const clampPercent = (value) => {
    const number = Number(value) || 0;
    return Math.max(0, Math.min(100, Math.round(number)));
};

const slugify = (value) => String(value || 'course')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'course';

const compactText = (parts) => parts
    .flat()
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const safeModuleCopy = (modules = []) => (modules || []).map((module) => ({
    module_id: module.module_id,
    module_title: module.module_title || '',
    subtopics: (module.subtopics || [])
        .filter((subtopic) => subtopic.generationStatus === 'ready' || subtopic.lessonContent?.generatedAt)
        .map((subtopic) => ({
            subtopic_id: subtopic.subtopic_id,
            subtopic_title: subtopic.subtopic_title || '',
            subtopic_type: subtopic.subtopic_type || 'lesson',
            lessonContent: subtopic.lessonContent || {},
            tutorContextSummary: subtopic.tutorContextSummary || ''
        }))
})).filter((module) => module.subtopics.length > 0);

const buildSearchText = (course, publicModules) => compactText([
    course.course_title,
    course.course_query,
    course.learningGoal,
    publicModules.map((module) => [
        module.module_title,
        module.subtopics.map((subtopic) => [
            subtopic.subtopic_title,
            subtopic.lessonContent?.overview,
            subtopic.lessonContent?.summary,
            subtopic.lessonContent?.keyPoints,
            (subtopic.lessonContent?.blocks || []).map((block) => [block.title, block.blockSummary, block.body])
        ])
    ])
]);

const buildTags = (course, publicModules) => {
    const raw = compactText([
        course.course_title,
        course.course_query,
        course.learningGoal,
        publicModules.slice(0, 5).map((module) => module.module_title)
    ]).toLowerCase();

    const blocked = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'course', 'learn', 'guide']);
    return [...new Set(raw.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !blocked.has(word)))]
        .slice(0, 14);
};

const buildCard = async (course, viewerClerkId) => {
    const progressPromise = viewerClerkId
        ? CourseReadingProgress.findOne({ courseId: course._id, clerkId: viewerClerkId }).lean()
        : Promise.resolve(null);
    const likedPromise = viewerClerkId
        ? CourseLike.exists({ courseId: course._id, clerkId: viewerClerkId })
        : Promise.resolve(null);
    const bookmarkedPromise = viewerClerkId
        ? CourseBookmark.exists({ courseId: course._id, clerkId: viewerClerkId })
        : Promise.resolve(null);

    const [progress, liked, bookmarked] = await Promise.all([progressPromise, likedPromise, bookmarkedPromise]);
    const lessonCount = (course.modules || []).reduce((sum, module) => sum + (module.subtopics || []).length, 0);

    return {
        _id: course._id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        creatorClerkId: course.creatorClerkId,
        creatorName: course.creatorName,
        tags: course.tags || [],
        metrics: course.metrics || {},
        lessonCount,
        moduleCount: (course.modules || []).length,
        publishedAt: course.publishedAt,
        viewer: {
            liked: !!liked,
            bookmarked: !!bookmarked,
            progress
        }
    };
};

async function uniqueSlug(baseTitle) {
    const base = slugify(baseTitle);
    let candidate = base;
    let suffix = 2;
    while (await PublishedCourse.exists({ slug: candidate })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

router.post('/publish/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { clerkId, creatorName } = req.body;

        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });
        if (!mongoose.Types.ObjectId.isValid(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

        const [user, course] = await Promise.all([
            User.findOne({ clerkId }),
            Course.findById(courseId)
        ]);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (String(course.userId) !== String(user._id)) return res.status(403).json({ success: false, message: 'Only the creator can publish this course' });
        if (course.sourceType !== 'guided-topic') return res.status(400).json({ success: false, message: 'Only guided courses can be published right now' });

        const publicModules = safeModuleCopy(course.modules || []);
        const readyLessons = publicModules.reduce((sum, module) => sum + module.subtopics.length, 0);
        if (readyLessons < 1) {
            return res.status(400).json({
                success: false,
                message: 'Generate at least one lesson before publishing this course.'
            });
        }

        const existing = await PublishedCourse.findOne({
            sourcePrivateCourseId: course._id,
            creatorClerkId: clerkId,
            status: 'published'
        });

        if (existing) {
            return res.json({
                success: true,
                alreadyPublished: true,
                course: await buildCard(existing, clerkId)
            });
        }

        const slug = await uniqueSlug(course.course_title);
        const searchText = buildSearchText(course, publicModules);
        const tags = buildTags(course, publicModules);

        const published = await PublishedCourse.create({
            sourcePrivateCourseId: course._id,
            creatorUserId: user._id,
            creatorClerkId: clerkId,
            creatorName: creatorName || user.name || 'Creator',
            title: course.course_title,
            slug,
            description: course.learningGoal || course.course_query || '',
            learningGoal: course.learningGoal || '',
            sourceQuery: course.course_query || '',
            modules: publicModules,
            studyConfig: course.studyConfig || null,
            tags,
            searchText
        });

        return res.status(201).json({
            success: true,
            course: await buildCard(published, clerkId)
        });
    } catch (error) {
        console.error('Publish public course error:', error);
        return res.status(500).json({ success: false, message: 'Failed to publish course', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const {
            tab = 'latest',
            q = '',
            clerkId,
            viewerClerkId,
            page = 1,
            limit = 12
        } = req.query;

        const safeLimit = Math.min(30, Math.max(1, normalizeIndex(limit, 12)));
        const safePage = Math.max(1, normalizeIndex(page, 1));
        const viewer = viewerClerkId || clerkId || '';
        const query = { status: 'published' };
        const search = String(q || '').trim();

        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { learningGoal: new RegExp(search, 'i') },
                { searchText: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ];
        }

        if (tab === 'following') {
            if (!viewer) return res.json({ success: true, courses: [], total: 0, page: safePage, totalPages: 0 });
            const follows = await CreatorFollow.find({ followerClerkId: viewer }).select('creatorClerkId').lean();
            query.creatorClerkId = { $in: follows.map((follow) => follow.creatorClerkId) };
        }

        const sort = tab === 'top'
            ? { 'metrics.likes': -1, 'metrics.bookmarks': -1, 'metrics.readStarts': -1, 'metrics.views': -1, publishedAt: -1 }
            : { publishedAt: -1 };

        const [courses, total] = await Promise.all([
            PublishedCourse.find(query).sort(sort).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
            PublishedCourse.countDocuments(query)
        ]);

        const cards = await Promise.all(courses.map((course) => buildCard(course, viewer)));
        return res.json({
            success: true,
            courses: cards,
            total,
            page: safePage,
            totalPages: Math.ceil(total / safeLimit)
        });
    } catch (error) {
        console.error('Public courses list error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load public courses', error: error.message });
    }
});

router.get('/me/bookmarks/:clerkId', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const bookmarks = await CourseBookmark.find({ clerkId }).sort({ createdAt: -1 }).populate('courseId').lean();
        const courses = bookmarks.map((bookmark) => bookmark.courseId).filter(Boolean).filter((course) => course.status === 'published');
        const cards = await Promise.all(courses.map((course) => buildCard(course, clerkId)));
        return res.json({ success: true, courses: cards });
    } catch (error) {
        console.error('Bookmarks fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load bookmarks', error: error.message });
    }
});

router.get('/me/progress/:clerkId', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const progressRows = await CourseReadingProgress.find({ clerkId })
            .sort({ lastReadAt: -1 })
            .limit(30)
            .populate('courseId')
            .lean();
        const courses = progressRows.map((row) => row.courseId).filter(Boolean).filter((course) => course.status === 'published');
        const cards = await Promise.all(courses.map((course) => buildCard(course, clerkId)));
        return res.json({ success: true, courses: cards });
    } catch (error) {
        console.error('Progress fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load reading progress', error: error.message });
    }
});

router.get('/profile/:clerkId/analytics', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const days = Math.min(90, Math.max(7, normalizeIndex(req.query.days, 30)));
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (days - 1));

        const [user, courses, followers, following, allCreatorStats, viewEvents, followEvents, readingRows] = await Promise.all([
            User.findOne({ clerkId }).lean(),
            PublishedCourse.find({ creatorClerkId: clerkId, status: 'published' }).sort({ publishedAt: -1 }).lean(),
            CreatorFollow.countDocuments({ creatorClerkId: clerkId }),
            CreatorFollow.countDocuments({ followerClerkId: clerkId }),
            PublishedCourse.aggregate([
                { $match: { status: 'published' } },
                {
                    $group: {
                        _id: '$creatorClerkId',
                        views: { $sum: '$metrics.views' },
                        likes: { $sum: '$metrics.likes' },
                        bookmarks: { $sum: '$metrics.bookmarks' },
                        readStarts: { $sum: '$metrics.readStarts' },
                        completions: { $sum: '$metrics.completions' },
                        courses: { $sum: 1 }
                    }
                }
            ]),
            CourseViewEvent.aggregate([
                { $match: { creatorClerkId: clerkId, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        views: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            CreatorFollow.aggregate([
                { $match: { creatorClerkId: clerkId, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        followers: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            CourseReadingProgress.find({ clerkId }).populate('courseId').sort({ lastReadAt: -1 }).limit(6).lean()
        ]);

        const totals = courses.reduce((acc, course) => {
            acc.views += course.metrics?.views || 0;
            acc.likes += course.metrics?.likes || 0;
            acc.bookmarks += course.metrics?.bookmarks || 0;
            acc.readStarts += course.metrics?.readStarts || 0;
            acc.completions += course.metrics?.completions || 0;
            return acc;
        }, { views: 0, likes: 0, bookmarks: 0, readStarts: 0, completions: 0 });

        const creatorRows = allCreatorStats.map((row) => ({
            creatorClerkId: row._id,
            followers: 0,
            views: row.views || 0,
            likes: row.likes || 0,
            bookmarks: row.bookmarks || 0,
            courses: row.courses || 0,
            score: (row.views || 0) + (row.likes || 0) * 8 + (row.bookmarks || 0) * 5 + (row.completions || 0) * 12
        }));

        const followerCounts = await CreatorFollow.aggregate([
            { $group: { _id: '$creatorClerkId', followers: { $sum: 1 } } }
        ]);
        const followerMap = new Map(followerCounts.map((row) => [row._id, row.followers]));
        creatorRows.forEach((row) => {
            row.followers = followerMap.get(row.creatorClerkId) || 0;
            row.score += row.followers * 20;
        });
        if (!creatorRows.some((row) => row.creatorClerkId === clerkId)) {
            creatorRows.push({
                creatorClerkId: clerkId,
                followers,
                views: totals.views,
                likes: totals.likes,
                bookmarks: totals.bookmarks,
                courses: courses.length,
                score: totals.views + totals.likes * 8 + totals.bookmarks * 5 + totals.completions * 12 + followers * 20
            });
        }

        const rankBy = (field) => {
            const sorted = [...creatorRows].sort((a, b) => (b[field] || 0) - (a[field] || 0));
            const index = sorted.findIndex((row) => row.creatorClerkId === clerkId);
            return index >= 0 ? index + 1 : sorted.length + 1;
        };

        const chartMap = new Map();
        for (let i = 0; i < days; i += 1) {
            const date = new Date(since);
            date.setDate(since.getDate() + i);
            chartMap.set(date.toISOString().slice(0, 10), { date: date.toISOString().slice(0, 10), views: 0, followers: 0 });
        }
        viewEvents.forEach((row) => {
            const entry = chartMap.get(row._id);
            if (entry) entry.views = row.views;
        });
        followEvents.forEach((row) => {
            const entry = chartMap.get(row._id);
            if (entry) entry.followers = row.followers;
        });

        const topCourses = courses
            .map((course) => ({
                _id: course._id,
                title: course.title,
                slug: course.slug,
                metrics: course.metrics || {},
                publishedAt: course.publishedAt
            }))
            .sort((a, b) => ((b.metrics.views || 0) + (b.metrics.likes || 0) * 8) - ((a.metrics.views || 0) + (a.metrics.likes || 0) * 8))
            .slice(0, 5);

        const continueReading = readingRows
            .map((row) => row.courseId ? ({
                courseId: row.courseId._id,
                title: row.courseId.title,
                slug: row.courseId.slug,
                percent: row.percent,
                moduleIndex: row.moduleIndex,
                subtopicIndex: row.subtopicIndex,
                lastReadAt: row.lastReadAt
            }) : null)
            .filter(Boolean);

        return res.json({
            success: true,
            profile: {
                clerkId,
                name: user?.name || 'Creator',
                avatar: user?.avatar || 'none',
                followers,
                following,
                publishedCourses: courses.length,
                totals,
                rankings: {
                    followers: rankBy('followers'),
                    views: rankBy('views'),
                    influence: rankBy('score'),
                    totalCreators: Math.max(creatorRows.length, 1)
                },
                charts: Array.from(chartMap.values()),
                topCourses,
                continueReading
            }
        });
    } catch (error) {
        console.error('Profile analytics error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load profile analytics', error: error.message });
    }
});

router.get('/creator/:creatorClerkId', async (req, res) => {
    try {
        const { creatorClerkId } = req.params;
        const viewer = req.query.viewerClerkId || '';
        const [creatorUser, courses, followers, following, isFollowing] = await Promise.all([
            User.findOne({ clerkId: creatorClerkId }).lean(),
            PublishedCourse.find({ creatorClerkId, status: 'published' }).sort({ publishedAt: -1 }).lean(),
            CreatorFollow.countDocuments({ creatorClerkId }),
            CreatorFollow.countDocuments({ followerClerkId: creatorClerkId }),
            viewer ? CreatorFollow.exists({ creatorClerkId, followerClerkId: viewer }) : Promise.resolve(null)
        ]);

        const cards = await Promise.all(courses.map((course) => buildCard(course, viewer)));
        const totals = courses.reduce((acc, course) => {
            acc.views += course.metrics?.views || 0;
            acc.likes += course.metrics?.likes || 0;
            acc.bookmarks += course.metrics?.bookmarks || 0;
            return acc;
        }, { views: 0, likes: 0, bookmarks: 0 });

        return res.json({
            success: true,
            creator: {
                clerkId: creatorClerkId,
                name: creatorUser?.name || courses[0]?.creatorName || 'Creator',
                avatar: creatorUser?.avatar || 'none',
                followers,
                following,
                courseCount: courses.length,
                totals,
                viewer: { following: !!isFollowing }
            },
            courses: cards
        });
    } catch (error) {
        console.error('Creator profile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load creator profile', error: error.message });
    }
});

router.get('/creator/:creatorClerkId/followers', async (req, res) => {
    try {
        const rows = await CreatorFollow.find({ creatorClerkId: req.params.creatorClerkId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, followers: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to load followers', error: error.message });
    }
});

router.get('/creator/:creatorClerkId/following', async (req, res) => {
    try {
        const rows = await CreatorFollow.find({ followerClerkId: req.params.creatorClerkId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, following: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to load following', error: error.message });
    }
});

router.post('/creator/:creatorClerkId/follow', async (req, res) => {
    try {
        const { creatorClerkId } = req.params;
        const { clerkId } = req.body;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });
        if (clerkId === creatorClerkId) return res.status(400).json({ success: false, message: 'You cannot follow yourself' });

        const existing = await CreatorFollow.findOne({ followerClerkId: clerkId, creatorClerkId });
        if (existing) {
            await existing.deleteOne();
            const followers = await CreatorFollow.countDocuments({ creatorClerkId });
            return res.json({ success: true, following: false, followers });
        }

        await CreatorFollow.create({ followerClerkId: clerkId, creatorClerkId });
        const followers = await CreatorFollow.countDocuments({ creatorClerkId });
        return res.status(201).json({ success: true, following: true, followers });
    } catch (error) {
        console.error('Creator follow error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update follow', error: error.message });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const viewer = req.query.viewerClerkId || req.query.clerkId || '';
        const course = await PublishedCourse.findOne({ slug: req.params.slug, status: 'published' }).lean();
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const [card, user, following] = await Promise.all([
            buildCard(course, viewer),
            viewer ? User.findOne({ clerkId: viewer }).lean() : Promise.resolve(null),
            viewer ? CreatorFollow.exists({ creatorClerkId: course.creatorClerkId, followerClerkId: viewer }) : Promise.resolve(null)
        ]);

        return res.json({
            success: true,
            course: {
                ...course,
                viewer: {
                    ...card.viewer,
                    followingCreator: !!following,
                    canChat: !!user && user.plan !== 'free',
                    plan: user?.plan || 'free'
                }
            }
        });
    } catch (error) {
        console.error('Public course detail error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load course', error: error.message });
    }
});

router.post('/:courseId/view', async (req, res) => {
    try {
        const { clerkId } = req.body;
        const course = await PublishedCourse.findByIdAndUpdate(
            req.params.courseId,
            { $inc: { 'metrics.views': 1, ...(clerkId ? { 'metrics.readStarts': 1 } : {}) } },
            { new: true }
        ).lean();
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await CourseViewEvent.create({
            courseId: course._id,
            creatorClerkId: course.creatorClerkId,
            viewerClerkId: clerkId || ''
        });
        return res.json({ success: true, metrics: course.metrics });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to record view', error: error.message });
    }
});

router.post('/:courseId/like', async (req, res) => {
    try {
        const { clerkId } = req.body;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });

        const existing = await CourseLike.findOne({ courseId: req.params.courseId, clerkId });
        const increment = existing ? -1 : 1;
        if (existing) await existing.deleteOne();
        else await CourseLike.create({ courseId: req.params.courseId, clerkId });

        const course = await PublishedCourse.findByIdAndUpdate(
            req.params.courseId,
            { $inc: { 'metrics.likes': increment } },
            { new: true }
        ).lean();
        return res.json({ success: true, liked: !existing, metrics: course?.metrics || {} });
    } catch (error) {
        console.error('Course like error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update like', error: error.message });
    }
});

router.post('/:courseId/bookmark', async (req, res) => {
    try {
        const { clerkId } = req.body;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });

        const existing = await CourseBookmark.findOne({ courseId: req.params.courseId, clerkId });
        const increment = existing ? -1 : 1;
        if (existing) await existing.deleteOne();
        else await CourseBookmark.create({ courseId: req.params.courseId, clerkId });

        const course = await PublishedCourse.findByIdAndUpdate(
            req.params.courseId,
            { $inc: { 'metrics.bookmarks': increment } },
            { new: true }
        ).lean();
        return res.json({ success: true, bookmarked: !existing, metrics: course?.metrics || {} });
    } catch (error) {
        console.error('Course bookmark error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update bookmark', error: error.message });
    }
});

router.post('/:courseId/progress', async (req, res) => {
    try {
        const { clerkId, moduleIndex = 0, subtopicIndex = 0, percent = 0 } = req.body;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });

        const nextPercent = clampPercent(percent);
        const completed = nextPercent >= 100;
        const previous = await CourseReadingProgress.findOne({ courseId: req.params.courseId, clerkId }).lean();
        const progress = await CourseReadingProgress.findOneAndUpdate(
            { courseId: req.params.courseId, clerkId },
            {
                moduleIndex: normalizeIndex(moduleIndex),
                subtopicIndex: normalizeIndex(subtopicIndex),
                percent: nextPercent,
                completed,
                lastReadAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        if (completed && !previous?.completed) {
            await PublishedCourse.findByIdAndUpdate(req.params.courseId, { $inc: { 'metrics.completions': 1 } });
        }

        return res.json({ success: true, progress });
    } catch (error) {
        console.error('Course progress error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save progress', error: error.message });
    }
});

router.get('/:courseId/chat-access', async (req, res) => {
    try {
        const clerkId = req.query.clerkId || '';
        const user = clerkId ? await User.findOne({ clerkId }).lean() : null;
        return res.json({
            success: true,
            canChat: !!user && user.plan !== 'free',
            plan: user?.plan || 'free'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to check chat access', error: error.message });
    }
});

module.exports = router;
