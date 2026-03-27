import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/shared/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExerciseHistoryPage } from '@/pages/ExerciseHistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SessionDetailPage } from '@/pages/SessionDetailPage';
import { SessionEditPage } from '@/pages/SessionEditPage';
import { SessionListPage } from '@/pages/SessionListPage';
import { SessionNewPage } from '@/pages/SessionNewPage';

export function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sessions" element={<SessionListPage />} />
        <Route path="/sessions/new" element={<SessionNewPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/sessions/:id/edit" element={<SessionEditPage />} />
        <Route path="/exercises/:name" element={<ExerciseHistoryPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
