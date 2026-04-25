import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NewHome from './pages/NewHome';
import Dashboard from './pages/Dashboard';
import CourseMap from './pages/CourseMap';
import LearnHub from './pages/LearnHub';
import PlaylistCourseMap from './pages/PlaylistCourseMap';
import PlaylistLearnHub from './pages/PlaylistLearnHub';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      {!isLanding && <Navbar />}
      <Routes>
        <Route path="/" element={<NewHome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/course/:courseId" element={<CourseMap />} />
        <Route path="/course/:courseId/learn/:moduleIndex" element={<LearnHub />} />
        <Route path="/playlist/:courseId" element={<PlaylistCourseMap />} />
        <Route path="/playlist/:courseId/day/:dayIndex" element={<PlaylistLearnHub />} />
        <Route path="/profile" element={<Profile />} />
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
