const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const CourseModel = require('../src/models/Course.js');

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB.");

    // Find all courses
    const courses = await CourseModel.find({});
    console.log(`Found ${courses.length} courses total.`);

    for (const course of courses) {
      let foundDiagram = false;
      for (const mod of course.modules) {
        for (const sub of mod.subtopics) {
          if (sub.lessonContent && sub.lessonContent.blocks) {
            for (const block of sub.lessonContent.blocks) {
              if (block.body && block.body.includes("```mermaid")) {
                console.log(`\n========================================`);
                console.log(`Course: ${course.course_title} (ID: ${course._id})`);
                console.log(`Subtopic: ${sub.title}`);
                console.log(`Block Type: ${block.type}, Title: ${block.title}`);
                console.log("--- RAW BODY MERMAID BLOCK ---");
                const match = block.body.match(/```mermaid([\s\S]*?)```/);
                if (match) {
                  console.log(match[0]);
                } else {
                  console.log(block.body);
                }
                foundDiagram = true;
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
