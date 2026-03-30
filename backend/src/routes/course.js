const express = require('express');
const router = express.Router();
const c = require('../controllers/courseController');
const { checkCourseCreation, checkTopicUnlock } = require('../middleware/usageLimiter');

// Course CRUD
router.post('/create', checkCourseCreation, c.createCourseHandler);
router.get('/user/:clerkId', c.getUserCourses);
router.get('/:courseId', c.getCourseById);

// Subtopic actions
router.post('/:courseId/module/:moduleIndex/subtopic/:subtopicIndex/watched', checkTopicUnlock, c.markSubtopicWatched);
router.post('/:courseId/module/:moduleIndex/subtopic/:subtopicIndex/generate-quiz', c.generateAndSaveQuiz);

// Module-level quiz grading
router.post('/:courseId/module/:moduleIndex/grade-module', c.gradeModuleQuiz);

// Module prep status (for polling) & manual trigger
router.get('/:courseId/module/:moduleIndex/prep-status', c.getModulePrepStatus);
// Manual trigger
router.post('/:courseId/module/:moduleIndex/prepare', c.triggerPrepare);

// Delete course
router.delete('/:courseId', c.deleteCourseHandler);

module.exports = router;
