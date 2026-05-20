require('dotenv').config();
const mongoose = require('mongoose');

const Course = require('./src/models/Course');
const Activity = require('./src/models/Activity');

async function cleanDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB. Deleting all courses and activities...');
  await Course.deleteMany({});
  await Activity.deleteMany({});
  console.log('Database cleaned.');
  process.exit(0);
}

cleanDb().catch(err => {
  console.error(err);
  process.exit(1);
});
