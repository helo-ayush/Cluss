const express = require('express');
const router = express.Router();
const guided = require('../controllers/guidedStudyController');
const { checkCredits } = require('../middleware/creditManager');

router.get('/user/:clerkId', guided.getStudyPlansForUser);
router.get('/guided/user/:clerkId', guided.getGuidedStudyPlansForUser);
router.post('/guided', checkCredits('courseScaffold'), guided.createGuidedStudyPlan);
router.get('/:courseId', guided.getStudyPlanById);
router.patch('/:courseId/config', guided.updateGuidedConfig);
router.post('/:courseId/subtopics/:subtopicId/generate', guided.generateSubtopicContent);
router.post('/:courseId/subtopics/:subtopicId/regenerate', (req, res, next) => {
    req.body = { ...(req.body || {}), regenerate: true };
    next();
}, guided.generateSubtopicContent);
router.post('/:courseId/subtopics/:subtopicId/blocks/:blockId/rewrite', guided.rewriteGuidedBlock);
router.post('/:courseId/subtopics/:subtopicId/blocks/:blockId/undo', guided.undoGuidedBlockRewrite);
router.post('/:courseId/subtopics/:subtopicId/practice', guided.generateSubtopicPractice);
router.post('/:courseId/subtopics/:subtopicId/submit', guided.submitGuidedAssessment);
router.post('/:courseId/tune', guided.tuneSyllabus);
router.post('/:courseId/tune/confirm', guided.confirmTune);
router.delete('/:courseId', guided.deleteStudyPlan);

module.exports = router;
