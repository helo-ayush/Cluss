function calculateGuidedProgress(course) {
    const modules = course.modules || [];
    let totalSubtopics = 0;
    let completedSubtopics = 0;

    modules.forEach((module) => {
        (module.subtopics || []).forEach((subtopic) => {
            totalSubtopics += 1;
            if (subtopic.status === 'completed') completedSubtopics += 1;
        });
    });

    const progress = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    return {
        totalSubtopics,
        completedSubtopics,
        totalModules: modules.length,
        progress,
        totalUnits: totalSubtopics,
        completedUnits: completedSubtopics
    };
}

function calculatePlaylistProgress(course) {
    const days = course.days || [];
    const totalDays = days.length;
    const completedDays = days.filter((day) => day.status === 'ready' || day.checkpoint?.status === 'passed').length;
    const totalVideos = days.reduce((sum, day) => sum + ((day.videos || []).length), 0);
    const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
        totalDays,
        completedDays,
        totalVideos,
        progress,
        totalUnits: totalDays,
        completedUnits: completedDays
    };
}

function serializeStudyPlan(courseDoc) {
    const course = courseDoc.toObject ? courseDoc.toObject() : courseDoc;
    const sourceType = course.sourceType;
    const metrics = sourceType === 'playlist'
        ? calculatePlaylistProgress(course)
        : calculateGuidedProgress(course);

    return {
        ...course,
        ...metrics
    };
}

function summarizeStudyPlans(courseDocs) {
    return courseDocs.reduce((summary, courseDoc) => {
        const plan = serializeStudyPlan(courseDoc);
        summary.totalPlans += 1;
        summary.completedSubtopics += plan.completedUnits;
        summary.totalSubtopics += plan.totalUnits;
        return summary;
    }, {
        totalPlans: 0,
        completedSubtopics: 0,
        totalSubtopics: 0
    });
}

module.exports = {
    calculateGuidedProgress,
    calculatePlaylistProgress,
    serializeStudyPlan,
    summarizeStudyPlans
};
