<div align="center">
  <img src="Frontend/public/Logo.png" alt="Cluss Logo" width="120" />

# 🪄 Cluss

**Empowering Digital Education with AI, Gamification, and Seamless Design**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge\&logo=mongodb\&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)](https://tailwindcss.com/)

</div>

<br />

## 📖 Overview

Cluss is a highly interactive, AI-driven learning platform designed to transform traditional educational content into engaging, gamified experiences. Built with a modern, sleek, and minimalist UI, the platform dynamically generates courses, processes video transcripts, and provides real-time, context-aware assistance via an AI tutor.

Whether generating a learning map from a YouTube playlist or climbing the leaderboard through coding challenges, Cluss is built to make learning intuitive and highly rewarding.

---

## 🏗 System Architecture

<div align="center">

  <img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/3a4f46d8-6abe-4838-a399-d59a4756fdf9" />


*High-level system architecture detailing the flow between the client, backend services, database, and AI evaluators.*


</div>

---

## ✨ Key Features

* **Dynamic Course Mapping:** Automatically generates structured visual learning paths (`CourseMap` / `PlaylistCourseMap`) from raw topics or YouTube playlists.
* **Intelligent AI Tutor:** Integrated `TutorAgent` powered by Gemini AI offers real-time, personalized debugging and conceptual explanations.
* **Gamified Learning:** Features an interactive `Leaderboard` and reward system to keep learners motivated and engaged.
* **Automated Transcript Processing:** Utilizes Python scripts (`get_transcript.py`) to extract and analyze YouTube video content for precise quiz and checkpoint generation.
* **Immersive, Minimalist UI:** Built using Tailwind CSS and `magicui` components (BorderBeam, NeonGradientCard, MagicCard) for a sleek, dark-mode optimized aesthetic.

---

## 🛠️ Tech Stack

**Frontend:**

* React.js (Vite)
* Tailwind CSS
* Magic UI (Framer Motion)

**Backend:**

* Node.js & Express.js
* MongoDB & Mongoose
* Python (for video transcript extraction)

**AI & APIs:**

* Google Gemini AI (Evaluations, Quiz Generation, Tutor Agent)
* YouTube Data API

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Python (v3.8+)
* MongoDB Instance
* Gemini API Key

### Local Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/CodeVoyager3/cluss.git
   cd cluss
   ```

2. **Setup the Backend:**

   ```bash
   cd backend
   npm install

   # Install Python dependencies for transcript processing
   bash scripts/install_python_deps.sh
   ```

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Setup the Frontend:**

   ```bash
   cd ../Frontend
   npm install
   ```

   Create a `.env` file in the `Frontend` directory:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Run the Application:**
   Open two terminal tabs:

   *Terminal 1 (Backend):*

   ```bash
   cd backend
   npm start
   ```

   *Terminal 2 (Frontend):*

   ```bash
   cd Frontend
   npm run dev
   ```

---

## 🛡️ The Team

Built with 💻 and ☕ by **Team Code Galacticos**:

* **Amritesh Rai**
* **Ayush Kumar**
* **Kaustubh Sharma**

---

<div align="center">
  <i>Nation First. Innovate Always.</i>
</div>
