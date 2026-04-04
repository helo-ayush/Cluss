import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CourseMap from './pages/CourseMap';
import LearnHub from './pages/LearnHub';
import PlaylistCourseMap from './pages/PlaylistCourseMap';
import PlaylistLearnHub from './pages/PlaylistLearnHub';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/course/:courseId" element={<CourseMap />} />
        <Route path="/course/:courseId/learn/:moduleIndex" element={<LearnHub />} />
        <Route path="/playlist/:courseId" element={<PlaylistCourseMap />} />
        <Route path="/playlist/:courseId/day/:dayIndex" element={<PlaylistLearnHub />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
