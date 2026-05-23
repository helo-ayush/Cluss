import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import PublicCoursesPage from './pages/PublicCoursesPage';
import PublicCourseReader from './pages/PublicCourseReader';
import BookmarksPage from './pages/BookmarksPage';
import CreatorProfilePage from './pages/CreatorProfilePage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewHome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/chat" element={<DashboardChatPage />} />
        <Route path="/dashboard/guided" element={<PlanLibraryPage type="guided" />} />
        <Route path="/dashboard/playlists" element={<PlanLibraryPage type="playlist" />} />
        <Route path="/dashboard/progress" element={<DashboardProgressPage />} />
        <Route path="/create/guided" element={<GuidedCreatePage />} />
        <Route path="/create/playlist" element={<PlaylistCreatePage />} />
        <Route path="/dashboard/guided/study-plan/:courseId" element={<GuidedStudyPlanMap />} />
        <Route path="/dashboard/guided/study-plan/:courseId/learn/:moduleIndex/:subtopicIndex" element={<GuidedStudyPlanHub />} />
        <Route path="/playlist/:courseId" element={<PlaylistCourseMap />} />
        <Route path="/playlist/:courseId/day/:dayIndex" element={<PlaylistLearnHub />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/bookmarks" element={<BookmarksPage />} />
        <Route path="/courses" element={<PublicCoursesPage />} />
        <Route path="/courses/:slug" element={<PublicCourseReader />} />
        <Route path="/creators/:creatorClerkId" element={<CreatorProfilePage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
