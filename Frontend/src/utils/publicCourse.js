export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function safeLessonBlocks(lessonContent = {}, fallbackTitle = 'Lesson notes') {
  if (Array.isArray(lessonContent.blocks) && lessonContent.blocks.length) return lessonContent.blocks;

  return [
    lessonContent.overview && { blockId: 'overview', type: 'intro', title: 'Start here', body: lessonContent.overview },
    lessonContent.explanation && { blockId: 'explanation', type: 'concept', title: fallbackTitle, body: lessonContent.explanation },
    lessonContent.example && { blockId: 'example', type: 'example', title: 'Example', body: lessonContent.example },
    lessonContent.summary && { blockId: 'summary', type: 'summary', title: 'Summary', body: lessonContent.summary },
  ].filter(Boolean);
}

export function lessonCount(course) {
  return (course?.modules || []).reduce((sum, module) => sum + (module.subtopics || []).length, 0);
}

export function progressPercent(course, moduleIndex, subtopicIndex) {
  const total = lessonCount(course);
  if (!total) return 0;
  let position = 0;
  for (let m = 0; m < (course.modules || []).length; m += 1) {
    const subtopics = course.modules[m].subtopics || [];
    for (let s = 0; s < subtopics.length; s += 1) {
      position += 1;
      if (m === moduleIndex && s === subtopicIndex) {
        return Math.min(100, Math.round((position / total) * 100));
      }
    }
  }
  return 0;
}
