import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NewHome from './pages/NewHome';
import Dashboard from './pages/Dashboard';
import CourseMap from './pages/CourseMap';
import LearnHub from './pages/LearnHub';
import PlaylistCourseMap from './pages/PlaylistCourseMap';
import PlaylistLearnHub from './pages/PlaylistLearnHub';
import Navbar from './components/Navbar';

// Old Home (kept for reference, commented out):
// import Home from './pages/Home';

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      {/* Show the Cluss-style Navbar globally (it handles all pages now) */}
      {!isLanding && <Navbar />}
      <Routes>
        {/* New Landing Page (has its own Navbar embedded) */}
        <Route path="/" element={<NewHome />} />
        {/* Old Landing Page (kept for reference):
        <Route path="/old" element={<Home />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/course/:courseId" element={<CourseMap />} />
        <Route path="/course/:courseId/learn/:moduleIndex" element={<LearnHub />} />
        <Route path="/playlist/:courseId" element={<PlaylistCourseMap />} />
        <Route path="/playlist/:courseId/day/:dayIndex" element={<PlaylistLearnHub />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
