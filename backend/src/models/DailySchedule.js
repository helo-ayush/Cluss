const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  topicToLearn: { type: String, required: true },
  reason: { type: String, required: true }
});

const dailyScheduleSchema = new mongoose.Schema({
  clerkId: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  greeting: { type: String, required: true },
  plan: [scheduleItemSchema]
}, { timestamps: true });

// Ensure one schedule per user per day
dailyScheduleSchema.index({ clerkId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySchedule', dailyScheduleSchema);
