import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import MemberList from '@/pages/MemberList';
import MemberNew from '@/pages/MemberNew';
import MemberDetail from '@/pages/MemberDetail';
import ClassPanel from '@/pages/ClassPanel';
import PlanEditor from '@/pages/PlanEditor';
import Reports from '@/pages/Reports';
import MemberPortal from '@/pages/MemberPortal';
import { cn } from '@/lib/utils';

function MainLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-ink-50/60 flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 min-w-0 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div
            key={location.pathname}
            className={cn('animate-fade-in', 'animate-[fadeIn_0.25s_ease-out]')}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <div className="text-center">
        <h1 className="font-display text-8xl font-bold text-brand-500 mb-4">404</h1>
        <p className="text-ink-700 font-medium mb-2">页面未找到</p>
        <p className="text-ink-500 text-sm">你访问的页面不存在或已被移除</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
      <Routes>
        <Route path="/member-view" element={<MemberPortal />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/new" element={<MemberNew />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/classes" element={<ClassPanel />} />
          <Route path="/plans" element={<PlanEditor />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
