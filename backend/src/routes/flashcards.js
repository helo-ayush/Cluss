const express = require('express');
const { getDailyDeck, reviewCard } = require('../controllers/flashcardController');

const router = express.Router();

router.get('/daily/:clerkId', getDailyDeck);
router.post('/review', reviewCard);

module.exports = router;
