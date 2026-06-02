const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const CourseModel = require('../src/models/Course.js');

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB.");

    const course = await CourseModel.findById("6a1bf0aea08e6bf5aa93308c");
    if (!course) {
      console.log("Course not found!");
      return;
    }

    console.log(`Course: ${course.course_title}`);
    for (const mod of course.modules) {
      for (const sub of mod.subtopics) {
        if (sub.lessonContent && sub.lessonContent.blocks) {
          for (const block of sub.lessonContent.blocks) {
            if (block.body && block.body.includes("```mermaid")) {
              console.log(`\n========================================`);
              console.log(`Subtopic: ${sub.title}`);
              console.log(`Block Title: ${block.title}`);
              console.log("--- RAW BODY MERMAID BLOCK ---");
              console.log(block.body);
              console.log("--- END ---");
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
