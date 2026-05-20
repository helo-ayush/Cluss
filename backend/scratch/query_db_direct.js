const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const db = mongoose.connection.db;
    const courseId = '6a003fe604a2ce069d51a581';
    
    const coursesCol = db.collection('courses');
    
    let course = await coursesCol.findOne({ _id: new mongoose.Types.ObjectId(courseId) });
    if (!course) {
      course = await coursesCol.findOne({ _id: courseId });
    }
    
    if (!course) {
      console.log('Course not found in DB!');
      process.exit(0);
    }
    
    console.log('Keys on course document:', Object.keys(course));
    console.log('sourceType:', course.sourceType);
    console.log('userId:', course.userId);
    console.log('topic:', course.topic);
    
    // Print a truncated JSON representation of course
    const courseStr = JSON.stringify(course, null, 2);
    console.log('Course JSON snippet:');
    console.log(courseStr.substring(0, 4000));
    
  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
