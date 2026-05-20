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
    
    // Look at modules[0] subtopics[1] (since the URL has /learn/1/2 - usually module 1, subtopic 2)
    const moduleIndex = 0; // 1st module
    const subtopicIndex = 1; // 2nd subtopic
    
    const mod = course.modules[moduleIndex];
    if (!mod) {
      console.log(`Module at index ${moduleIndex} not found!`);
      process.exit(0);
    }
    
    console.log(`Module Title: ${mod.module_title}`);
    const subtopic = mod.subtopics[subtopicIndex];
    if (!subtopic) {
      console.log(`Subtopic at index ${subtopicIndex} not found!`);
      process.exit(0);
    }
    
    console.log(`Subtopic Title: ${subtopic.subtopic_title}`);
    console.log(`Generation Status: ${subtopic.generationStatus}`);
    
    // Print lessonContent or practiceContent or blocks
    if (subtopic.lessonContent) {
      console.log('Lesson Content keys:', Object.keys(subtopic.lessonContent));
      console.log('Lesson Content summary:', subtopic.lessonContent.summary);
      if (subtopic.lessonContent.blocks) {
        console.log(`Has ${subtopic.lessonContent.blocks.length} blocks.`);
        subtopic.lessonContent.blocks.forEach((block, index) => {
          console.log(`Block ${index + 1}: [${block.type}] - ${block.title}`);
          if (block.body && block.body.includes('mermaid')) {
            console.log('---------- MERMAID BODY ----------');
            console.log(block.body);
            console.log('----------------------------------');
          }
        });
      } else {
        console.log('No blocks in lessonContent.');
      }
    } else {
      console.log('No lessonContent found.');
    }
    
  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
