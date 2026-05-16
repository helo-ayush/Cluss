import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NewHome from './pages/NewHome';
import Dashboard from './pages/Dashboard';
import DashboardChatPage from './pages/DashboardChatPage';
import DashboardProgressPage from './pages/DashboardProgressPage';
import GuidedCreatePage from './pages/GuidedCreatePage';
import GuidedStudyPlanMap from './pages/GuidedStudyPlanMap';
import GuidedStudyPlanHub from './pages/GuidedStudyPlanHub';
import PlaylistCreatePage from './pages/PlaylistCreatePage';
import PlaylistCourseMap from './pages/PlaylistCourseMap';
import PlaylistLearnHub from './pages/PlaylistLearnHub';
import PlanLibraryPage from './pages/PlanLibraryPage';
import Profile from './pages/Profile';
import FlashcardReview from './pages/FlashcardReview';
import Navbar from './components/Navbar';

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isDashboardWorkspace = location.pathname === '/dashboard'
    || location.pathname.startsWith('/dashboard/')
    || location.pathname.startsWith('/create/')
    || location.pathname.startsWith('/study-plan/')
    || location.pathname === '/profile';

  return (
    <>
      {!isLanding && !isDashboardWorkspace && <Navbar />}
      <Routes>
        <Route path="/" element={<NewHome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/chat" element={<DashboardChatPage />} />
        <Route path="/dashboard/guided" element={<PlanLibraryPage type="guided" />} />
        <Route path="/dashboard/playlists" element={<PlanLibraryPage type="playlist" />} />
        <Route path="/dashboard/progress" element={<DashboardProgressPage />} />
        <Route path="/create/guided" element={<GuidedCreatePage />} />
        <Route path="/create/playlist" element={<PlaylistCreatePage />} />
        <Route path="/study-plan/:courseId" element={<GuidedStudyPlanMap />} />
        <Route path="/study-plan/:courseId/learn/:moduleIndex/:subtopicIndex" element={<GuidedStudyPlanHub />} />
        <Route path="/playlist/:courseId" element={<PlaylistCourseMap />} />
        <Route path="/playlist/:courseId/day/:dayIndex" element={<PlaylistLearnHub />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/flashcards" element={<FlashcardReview />} />
      </Routes>


    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
