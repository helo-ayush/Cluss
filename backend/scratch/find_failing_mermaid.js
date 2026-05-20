const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\.env' });

const MONGO_URI = process.env.MONGO_URI;
const CourseModel = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\models\\Course.js');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB.");
        
        // Find courses where a lesson block's body contains "Is the data symmetric?"
        const courses = await CourseModel.find({
            "modules.subtopics.lessonContent.blocks.body": { $regex: "Is the data symmetric?", $options: "i" }
        });
        
        console.log(`Found ${courses.length} courses matching.`);
        
        for (const course of courses) {
            console.log(`\nCourse: ${course.course_title} (ID: ${course._id})`);
            for (const mod of course.modules) {
                for (const sub of mod.subtopics) {
                    if (sub.lessonContent && sub.lessonContent.blocks) {
                        for (const block of sub.lessonContent.blocks) {
                            if (block.body && block.body.includes("Is the data symmetric?")) {
                                console.log(`- Block Type: ${block.type}, Title: ${block.title}`);
                                console.log("--- RAW BODY START ---");
                                console.log(block.body);
                                console.log("--- RAW BODY END ---");
                                
                                console.log("JSON representation of body:");
                                console.log(JSON.stringify(block.body));
                            }
                        }
                    }
                }
            }
        }
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
