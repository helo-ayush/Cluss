const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');

const courseRoutes = require('./src/routes/course');
const studyPlanRoutes = require('./src/routes/studyPlans');
const activityRoutes = require('./src/routes/activity');
const userRoutes = require('./src/routes/user');
const leaderboardRoutes = require('./src/routes/leaderboard');
const tutorChatRoutes = require('./src/routes/tutorChat');
const paymentRoutes = require('./src/routes/payment');
const flashcardRoutes = require('./src/routes/flashcards');
const publicCourseRoutes = require('./src/routes/publicCourses');
const compilerRoutes = require('./src/routes/compiler');
const playgroundChatRoutes = require('./src/routes/playgroundChat');

const app = express();

connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
    res.send('The server is running');
});

app.use('/api/course', courseRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/tutor-chat', tutorChatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/public-courses', publicCourseRoutes);
app.use('/api/schedule', require('./src/routes/schedule'));
app.use('/api/compiler', compilerRoutes);
app.use('/api/playground', playgroundChatRoutes);

app.use((err, req, res, next) => {
    console.error('Global Catch-All Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred internally',
        error: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AI Assessment Engine Server listening on port ${PORT}`);
});
