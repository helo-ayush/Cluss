const express = require('express');
const cors = require('cors');
require('dotenv').config();
// Trigger restart for robustness fix

const connectDB = require('./src/config/db');

// Initialize Express
const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse incoming JSON requests

// Routes Imports
const topicGenerator = require('./src/utils/topicGenerator');
const videoFinder = require('./src/routes/videoFinder');
const courseRoutes = require('./src/routes/course');
const activityRoutes = require('./src/routes/activity');
const userRoutes = require('./src/routes/user');
const leaderboardRoutes = require('./src/routes/leaderboard');
const tutorChatRoutes = require('./src/routes/tutorChat');

// Base status route
app.get('/', (req, res) => {
    res.send('AI Adaptive Learning Platform API is running...');
});

// Mount modular sub-routers
app.use('/topic-generator', topicGenerator);
app.use('/video-finder', videoFinder); // Legacy path
app.use('/api/search', videoFinder);   // Standard path
app.use('/api/course', courseRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/tutor-chat', tutorChatRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Catch-All Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred internally",
        error: err.message
    });
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AI Assessment Engine Server listening on port ${PORT}`);
});
