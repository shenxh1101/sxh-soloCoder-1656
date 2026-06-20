import { LayoutDashboard, Users, PlayCircle, Dumbbell, BarChart3, UserRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: '仪表盘', path: '/' },
  { icon: Users, label: '会员', path: '/members' },
  { icon: PlayCircle, label: '上课', path: '/classes' },
  { icon: Dumbbell, label: '训练计划', path: '/plans' },
  { icon: BarChart3, label: '统计报表', path: '/reports' },
  { icon: UserRound, label: '会员端', path: '/member-view' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentCoachId = useAppStore((s) => s.currentCoachId);
  const coaches = useAppStore((s) => s.coaches);
  const members = useAppStore((s) => s.members);

  const currentCoach = coaches.find((c) => c.id === currentCoachId);
  const activeMembersCount = members.filter((m) => m.coachId === currentCoachId && m.status !== 'inactive').length;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-ink-100 flex flex-col z-40">
      <div className="px-5 py-6 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-soft">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-900 leading-tight">FitPulse</h1>
            <p className="text-xs text-ink-500">私教工作室管理</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn('nav-item w-full text-left', isActive && 'nav-item-active')}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-ink-100">
        <div className="bg-ink-50 rounded-xl p-3">
          <div className="flex items-center gap-3">
            {currentCoach?.avatarUrl ? (
              <img src={currentCoach.avatarUrl} alt={currentCoach.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-600 font-semibold text-sm">
                {currentCoach?.name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">{currentCoach?.name || '未设置教练'}</p>
              <p className="text-xs text-ink-500">
                {currentCoach?.specialty || '私教教练'} · {activeMembersCount} 位会员
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
