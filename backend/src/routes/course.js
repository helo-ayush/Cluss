const express = require('express');
const router = express.Router();
const playlist = require('../controllers/playlistStudyController');
const { checkCredits } = require('../middleware/creditManager');

router.post('/from-playlist', checkCredits('playlistImport'), playlist.createFromPlaylist);
router.get('/user/:clerkId/playlists', playlist.getUserPlaylistCourses);
router.get('/:courseId', playlist.getPlaylistStudyPlanById);
router.get('/:courseId/day/:dayIndex/checkpoint', playlist.getCheckpoint);
router.post('/:courseId/day/:dayIndex/checkpoint/submit', playlist.submitCheckpoint);
router.post('/:courseId/day/:dayIndex/ready', playlist.markDayReady);
router.delete('/:courseId', playlist.deleteStudyPlanHandler);

module.exports = router;
