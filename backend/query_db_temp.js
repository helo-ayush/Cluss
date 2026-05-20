const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\.env' });

const MONGO_URI = process.env.MONGO_URI;
const Course = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\models\\User.js'); // wait, let's require User and Course models
const User = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\models\\User.js');
const CourseModel = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\models\\Course.js');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB.");
        
        const users = await User.find({}).limit(5);
        console.log("Users in DB:");
        users.forEach(u => console.log(`- ${u.name} (clerkId: ${u.clerkId}, plan: ${u.plan})`));
        
        const courses = await CourseModel.find({}).limit(5);
        console.log("\nCourses in DB:");
        courses.forEach(c => console.log(`- ${c.course_title} (id: ${c._id}, sourceType: ${c.sourceType}, userId: ${c.userId})`));
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
