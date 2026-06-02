const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://user:ayush1234@frebies.49ugkbz.mongodb.net/';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const coursesCol = db.collection('courses');
    
    // Find the most recently updated course
    const course = await coursesCol.findOne({}, { sort: { updatedAt: -1 } });
    
    if (!course) {
      console.log('No courses found');
      process.exit(1);
    }
    
    console.log('Course ID:', course._id);
    console.log('Course Title:', course.course_title);
    console.log('Course StudyConfig:', JSON.stringify(course.studyConfig, null, 2));
    
    // Find the active or completed subtopics in modules
    let foundAny = false;
    for (let m = 0; m < course.modules.length; m++) {
      const module = course.modules[m];
      for (let s = 0; s < module.subtopics.length; s++) {
        const subtopic = module.subtopics[s];
        if (subtopic.generationStatus === 'ready') {
          console.log(`\n--- Module ${m}, Subtopic ${s}: "${subtopic.subtopic_title}" ---`);
          console.log('AppliedConfig:', JSON.stringify(subtopic.appliedConfig, null, 2));
          console.log('GenerationStatus:', subtopic.generationStatus);
          
          const blocks = subtopic.lessonContent?.blocks || [];
          console.log('Blocks count:', blocks.length);
          
          blocks.forEach((block, idx) => {
            console.log(`Block ${idx + 1} type: ${block.type}, title: "${block.title}"`);
            if (block.inlineChallenge) {
              console.log('  -> HAS inlineChallenge:', JSON.stringify(block.inlineChallenge, null, 2));
            }
          });
          foundAny = true;
        }
      }
    }
    
    if (!foundAny) {
      console.log('No generated subtopics found in the most recent course.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
