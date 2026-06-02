const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const CourseModel = require('../src/models/Course.js');

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB.");

    const courses = await CourseModel.find({
      "modules.subtopics.lessonContent.blocks.body": { $regex: "TAU", $options: "i" }
    });

    console.log(`Found ${courses.length} courses matching "TAU".`);

    for (const course of courses) {
      console.log(`\nCourse: ${course.course_title} (ID: ${course._id})`);
      for (const mod of course.modules) {
        for (const sub of mod.subtopics) {
          if (sub.lessonContent && sub.lessonContent.blocks) {
            for (const block of sub.lessonContent.blocks) {
              if (block.body && block.body.includes("TAU")) {
                console.log(`- Subtopic: ${sub.title}`);
                console.log("--- RAW BODY ---");
                console.log(block.body);
                console.log("--- END ---");
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
