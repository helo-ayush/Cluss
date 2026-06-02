const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\.env' });

const MONGO_URI = process.env.MONGO_URI;
const CourseModel = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\models\\Course.js');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB.");
        
        // Find most recently updated or created course
        const course = await CourseModel.findOne({}).sort({ updatedAt: -1 });
        if (!course) {
            console.log("No courses found in database.");
        } else {
            console.log("Found newest course:", course.course_title, "updated at:", course.updatedAt);
            course.modules.forEach((mod, mIdx) => {
                mod.subtopics.forEach((sub, sIdx) => {
                    if (sub.lessonContent && sub.lessonContent.blocks) {
                        sub.lessonContent.blocks.forEach((block, bIdx) => {
                            if (block.type === 'diagram' || (block.body && block.body.includes('mermaid'))) {
                                console.log(`\n=== Module ${mIdx+1}, Subtopic ${sIdx+1}, Block ${bIdx+1} (${block.type}) ===`);
                                console.log(block.body);
                            }
                        });
                    }
                });
            });
        }
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
