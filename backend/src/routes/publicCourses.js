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
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

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

const expandSearchText = (value = '') => {
    const text = String(value || '');
    const lower = text.toLowerCase();
    const expansions = [];
    if (/\baiml\b|\bai ml\b|\bai\/ml\b/.test(lower)) expansions.push('artificial intelligence machine learning deep learning neural networks data science');
    if (/\bml\b/.test(lower)) expansions.push('machine learning supervised unsupervised regression classification models');
    if (/\bai\b/.test(lower)) expansions.push('artificial intelligence intelligent agents generative ai machine learning');
    if (/\bdsa\b/.test(lower)) expansions.push('data structures algorithms graphs trees dynamic programming');
    if (/\btoc\b/.test(lower)) expansions.push('theory of computation automata turing machines complexity');
    return compactText([text, expansions]);
};

const buildSearchText = (course, publicModules, creatorName = '') => expandSearchText(compactText([
    course.course_title,
    course.course_query,
    course.learningGoal,
    creatorName,
    publicModules.map((module) => [
        module.module_title,
        module.subtopics.map((subtopic) => [
            subtopic.subtopic_title,
            subtopic.subtopic_type
        ])
    ])
]));

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

const normalizeVector = (vector = []) => {
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (Number(value) || 0) ** 2, 0));
    return magnitude ? vector.map((value) => (Number(value) || 0) / magnitude) : [];
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cosine = (left = [], right = []) => {
    const count = Math.min(left.length, right.length);
    if (!count) return 0;
    let score = 0;
    for (let index = 0; index < count; index += 1) score += (Number(left[index]) || 0) * (Number(right[index]) || 0);
    return score;
};

const generateEmbedding = async (text) => {
    if (!genAI || !text) return [];
    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text.slice(0, 8000));
        const values = result?.embedding?.values || result?.embedding || [];
        return normalizeVector(Array.isArray(values) ? values : []);
    } catch (error) {
        console.warn('Course embedding generation skipped:', error.message);
        return [];
    }
};

const textScore = (course, search) => {
    if (!search) return 0;
    const expanded = expandSearchText(search).toLowerCase();
    const haystack = expandSearchText([course.title, course.description, course.learningGoal, course.searchText, course.tags?.join(' ')].join(' ')).toLowerCase();
    const terms = [...new Set(expanded.split(/[^a-z0-9]+/).filter((term) => term.length > 1))];
    return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) / Math.max(terms.length, 1);
};

const rankCourses = async ({ baseQuery = {}, search = '', viewer = '', sort = 'latest', limit = 12, page = 1 }) => {
    const safeLimit = Math.min(30, Math.max(1, normalizeIndex(limit, 12)));
    const safePage = Math.max(1, normalizeIndex(page, 1));
    const expandedSearch = expandSearchText(search).trim();

    if (!expandedSearch) {
        const mongoSort = sort === 'top'
            ? { 'metrics.likes': -1, 'metrics.bookmarks': -1, 'metrics.readStarts': -1, 'metrics.views': -1, publishedAt: -1 }
            : { publishedAt: -1 };
        const [courses, total] = await Promise.all([
            PublishedCourse.find(baseQuery).sort(mongoSort).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
            PublishedCourse.countDocuments(baseQuery)
        ]);
        return { courses: await Promise.all(courses.map((course) => buildCard(course, viewer))), total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
    }

    const queryEmbedding = await generateEmbedding(expandedSearch);
    const regexTerms = expandedSearch.split(/\s+/).filter(Boolean).map(escapeRegExp);
    const regex = regexTerms.length ? new RegExp(regexTerms.join('|'), 'i') : null;
    const candidates = await PublishedCourse.find({
        ...baseQuery,
        ...(regex ? {
            $or: [
                { title: regex },
                { description: regex },
                { learningGoal: regex },
                { sourceQuery: regex },
                { searchText: regex },
                { tags: regex },
            ]
        } : { searchEmbedding: { $exists: true, $ne: [] } })
    }).limit(150).lean();

    const fallbackCandidates = candidates.length >= safeLimit
        ? candidates
        : await PublishedCourse.find(baseQuery).sort({ publishedAt: -1 }).limit(150).lean();

    const scored = fallbackCandidates.map((course) => {
        const semantic = queryEmbedding.length && course.searchEmbedding?.length ? cosine(queryEmbedding, course.searchEmbedding) : 0;
        const lexical = textScore(course, expandedSearch);
        const popularity = Math.min(0.2, ((course.metrics?.likes || 0) * 0.015) + ((course.metrics?.bookmarks || 0) * 0.01) + ((course.metrics?.views || 0) * 0.001));
        return { course, score: semantic * 0.62 + lexical * 0.32 + popularity };
    }).filter((item) => item.score > 0 || textScore(item.course, search) > 0);

    scored.sort((a, b) => b.score - a.score || new Date(b.course.publishedAt) - new Date(a.course.publishedAt));
    const total = scored.length;
    const pageCourses = scored.slice((safePage - 1) * safeLimit, safePage * safeLimit).map((item) => item.course);
    return { courses: await Promise.all(pageCourses.map((course) => buildCard(course, viewer))), total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
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
            if (!existing.searchEmbedding?.length || !existing.searchText) {
                existing.searchText = buildSearchText(course, publicModules, existing.creatorName || creatorName || user.name || 'Creator');
                existing.searchEmbedding = await generateEmbedding(existing.searchText);
                await existing.save();
            }
            return res.json({
                success: true,
                alreadyPublished: true,
                course: await buildCard(existing, clerkId)
            });
        }

        const slug = await uniqueSlug(course.course_title);
        const displayName = creatorName || user.name || 'Creator';
        const searchText = buildSearchText(course, publicModules, displayName);
        const tags = buildTags(course, publicModules);
        const searchEmbedding = await generateEmbedding(searchText);

        const published = await PublishedCourse.create({
            sourcePrivateCourseId: course._id,
            creatorUserId: user._id,
            creatorClerkId: clerkId,
            creatorName: displayName,
            title: course.course_title,
            slug,
            description: course.learningGoal || course.course_query || '',
            learningGoal: course.learningGoal || '',
            sourceQuery: course.course_query || '',
            modules: publicModules,
            studyConfig: course.studyConfig || null,
            tags,
            searchText,
            searchEmbedding
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

const courseProgress = (course) => {
    const subtopics = (course.modules || []).flatMap((module) => module.subtopics || []);
    if (!subtopics.length) return 0;
    const completed = subtopics.filter((subtopic) => (
        subtopic.status === 'completed'
        || subtopic.generationStatus === 'ready'
        || subtopic.lessonContent?.generatedAt
    )).length;
    return Math.round((completed / subtopics.length) * 100);
};

router.get('/sections', async (req, res) => {
    try {
        const viewer = req.query.viewerClerkId || req.query.clerkId || '';
        const q = String(req.query.q || '').trim();
        const page = normalizeIndex(req.query.page, 1);
        const limit = Math.min(18, Math.max(6, normalizeIndex(req.query.limit, 12)));
        const sections = [];

        if (q) {
            const searchResults = await rankCourses({ baseQuery: { status: 'published' }, search: q, viewer, sort: 'top', limit, page });
            return res.json({
                success: true,
                mode: 'search',
                sections: [{
                    key: 'search',
                    title: `Search results for "${q}"`,
                    subtitle: 'Matched by course title, outline, topics, tags, and semantic similarity.',
                    courses: searchResults.courses,
                    page: searchResults.page,
                    totalPages: searchResults.totalPages,
                    total: searchResults.total
                }]
            });
        }

        if (viewer) {
            const [progressRows, bookmarkRows, ownedRows] = await Promise.all([
                CourseReadingProgress.find({ clerkId: viewer }).sort({ lastReadAt: -1 }).limit(12).populate('courseId').lean(),
                CourseBookmark.find({ clerkId: viewer }).sort({ createdAt: -1 }).limit(12).populate('courseId').lean(),
                PublishedCourse.find({ creatorClerkId: viewer, status: 'published' }).sort({ publishedAt: -1 }).limit(12).lean()
            ]);
            const progressCourses = progressRows.map((row) => row.courseId).filter((course) => course?.status === 'published');
            const bookmarkCourses = bookmarkRows.map((row) => row.courseId).filter((course) => course?.status === 'published');

            if (progressCourses.length) sections.push({
                key: 'continue',
                title: 'Continue Reading',
                subtitle: 'Pick up where you stopped.',
                courses: await Promise.all(progressCourses.map((course) => buildCard(course, viewer)))
            });
            if (ownedRows.length) sections.push({
                key: 'mine',
                title: 'My Uploaded Courses',
                subtitle: 'Manage courses you published.',
                ownerSection: true,
                courses: await Promise.all(ownedRows.map((course) => buildCard(course, viewer)))
            });
            if (bookmarkCourses.length) sections.push({
                key: 'bookmarked',
                title: 'Bookmarked',
                subtitle: 'Saved courses from your library.',
                courses: await Promise.all(bookmarkCourses.map((course) => buildCard(course, viewer)))
            });
        }

        const [top, latest] = await Promise.all([
            rankCourses({ baseQuery: { status: 'published' }, viewer, sort: 'top', limit: 12, page: 1 }),
            rankCourses({ baseQuery: { status: 'published' }, viewer, sort: 'latest', limit: 12, page: Math.max(1, page) })
        ]);

        sections.push(
            { key: 'top', title: 'Top Courses', subtitle: 'Popular with learners right now.', courses: top.courses },
            { key: 'latest', title: page > 1 ? `Latest Courses · Page ${page}` : 'Latest Courses', subtitle: 'Freshly uploaded guided courses.', courses: latest.courses, page: latest.page, totalPages: latest.totalPages }
        );

        if (viewer) {
            const follows = await CreatorFollow.find({ followerClerkId: viewer }).select('creatorClerkId').lean();
            if (follows.length) {
                const following = await rankCourses({
                    baseQuery: { status: 'published', creatorClerkId: { $in: follows.map((follow) => follow.creatorClerkId) } },
                    viewer,
                    sort: 'latest',
                    limit: 12,
                    page: 1
                });
                if (following.courses.length) sections.push({ key: 'following', title: 'Following', subtitle: 'New from creators you follow.', courses: following.courses });
            }
        }

        const tagRows = await PublishedCourse.aggregate([
            { $match: { status: 'published', tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 4 }
        ]);
        for (const row of tagRows) {
            const tagged = await rankCourses({ baseQuery: { status: 'published', tags: row._id }, viewer, sort: 'top', limit: 12, page: 1 });
            if (tagged.courses.length) sections.push({
                key: `tag-${row._id}`,
                title: row._id.replace(/-/g, ' '),
                subtitle: 'Topic collection',
                courses: tagged.courses
            });
        }

        return res.json({ success: true, mode: 'browse', sections, page, hasMore: latest.page < latest.totalPages });
    } catch (error) {
        console.error('Public course sections error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load course sections', error: error.message });
    }
});

router.get('/me/uploadable/:clerkId', async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.params.clerkId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const [courses, published] = await Promise.all([
            Course.find({ userId: user._id, sourceType: 'guided-topic' }).sort({ updatedAt: -1 }).lean(),
            PublishedCourse.find({ creatorClerkId: req.params.clerkId, status: 'published' }).select('sourcePrivateCourseId slug').lean()
        ]);
        const publishedMap = new Map(published.map((course) => [String(course.sourcePrivateCourseId), course.slug]));
        const uploadable = courses
            .map((course) => {
                const progress = courseProgress(course);
                return {
                    _id: course._id,
                    title: course.course_title,
                    description: course.learningGoal || course.course_query || '',
                    progress,
                    moduleCount: course.modules?.length || 0,
                    lessonCount: (course.modules || []).reduce((sum, module) => sum + (module.subtopics || []).length, 0),
                    alreadyPublished: publishedMap.has(String(course._id)),
                    slug: publishedMap.get(String(course._id)) || null
                };
            })
            .filter((course) => course.progress >= 100 || course.alreadyPublished);
        return res.json({ success: true, courses: uploadable });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to load uploadable courses', error: error.message });
    }
});

router.get('/me/published/:clerkId', async (req, res) => {
    try {
        const courses = await PublishedCourse.find({ creatorClerkId: req.params.clerkId, status: 'published' }).sort({ publishedAt: -1 }).lean();
        const cards = await Promise.all(courses.map((course) => buildCard(course, req.params.clerkId)));
        return res.json({ success: true, courses: cards });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to load uploaded courses', error: error.message });
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

        const viewer = viewerClerkId || clerkId || '';
        const query = { status: 'published' };

        if (tab === 'following') {
            if (!viewer) return res.json({ success: true, courses: [], total: 0, page: normalizeIndex(page, 1), totalPages: 0 });
            const follows = await CreatorFollow.find({ followerClerkId: viewer }).select('creatorClerkId').lean();
            query.creatorClerkId = { $in: follows.map((follow) => follow.creatorClerkId) };
        }

        const result = await rankCourses({ baseQuery: query, search: q, viewer, sort: tab === 'top' ? 'top' : 'latest', limit, page });
        return res.json({
            success: true,
            ...result
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

router.delete('/:courseId', async (req, res) => {
    try {
        const clerkId = req.query.clerkId || req.body?.clerkId || '';
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });
        if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

        const course = await PublishedCourse.findById(req.params.courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.creatorClerkId !== clerkId) return res.status(403).json({ success: false, message: 'Only the creator can delete this course' });

        await Promise.all([
            CourseLike.deleteMany({ courseId: course._id }),
            CourseBookmark.deleteMany({ courseId: course._id }),
            CourseReadingProgress.deleteMany({ courseId: course._id }),
            CourseViewEvent.deleteMany({ courseId: course._id }),
            PublishedCourse.deleteOne({ _id: course._id })
        ]);

        return res.json({ success: true });
    } catch (error) {
        console.error('Public course delete error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete public course', error: error.message });
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
                    canChat: !!user,
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
            canChat: !!user,
            plan: user?.plan || 'free'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to check chat access', error: error.message });
    }
});

module.exports = router;

