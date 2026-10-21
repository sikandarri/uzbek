import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RootLayout, RequireAuth, Workspace, studentNav, adminNav } from './components/layout';
import { FeaturePending } from './components/ui';
import Home from './pages/home';
import { EssentialsPage } from './pages/essentials';
import { EverydayTopicsPage, CalendarPage } from './pages/daily-library';
import AuthPage from './pages/auth';
import LessonPage from './pages/lesson';
import { CatalogPage, CoursePage } from './pages/catalog';
import { Dashboard, Profile, Settings, AdminOverview, MyCourses, PracticeResults } from './pages/workspace';
import { InfoPage, NotFound } from './pages/info';
import { useParams } from 'react-router-dom';
function GoToPublicLesson() {
  const { lessonId } = useParams();
  return <Navigate to={`/lessons/${lessonId}`} replace />;
}
function Pending({ area, label }: { area: 'admin' | 'student'; label: string }) {
  const { t } = useTranslation();
  return (
    <FeaturePending
      title={t(`${area}.${label}`)}
      description={label === 'ai' ? t('student.aiNotice') : undefined}
    />
  );
}
export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<CatalogPage />} />
        <Route path="essentials" element={<EssentialsPage />} />
        <Route path="essentials/calendar" element={<CalendarPage />} />
        <Route path="essentials/topics" element={<EverydayTopicsPage />} />
        <Route path="essentials/topics/:topicId" element={<EverydayTopicsPage />} />
        <Route path="essentials/:section" element={<EssentialsPage />} />
        <Route path="courses/:slug" element={<CoursePage />} />
        <Route path="lessons/:id" element={<LessonPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage register />} />
        {[
          'pricing',
          'placement-test',
          'how-it-works',
          'about',
          'blog',
          'faq',
          'contact',
          'privacy',
          'terms',
        ].map((path) => (
          <Route key={path} path={path} element={<InfoPage kind={path} />} />
        ))}
        <Route element={<RequireAuth />}>
          <Route path="app" element={<Workspace />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="results" element={<PracticeResults />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            {studentNav
              .filter(([, key]) => !['dashboard', 'courses', 'results', 'profile', 'settings'].includes(key!))
              .map(([path, key]) => (
                <Route key={path} path={path} element={<Pending area="student" label={key!} />} />
              ))}
            <Route path="learn/:lessonId" element={<GoToPublicLesson />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route element={<RequireAuth admin />}>
          <Route path="admin" element={<Workspace admin />}>
            <Route index element={<AdminOverview />} />
            {adminNav
              .filter(([path]) => path)
              .map(([path, key]) => (
                <Route key={path} path={path} element={<Pending area="admin" label={key!} />} />
              ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
