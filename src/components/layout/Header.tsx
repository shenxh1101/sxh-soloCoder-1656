import { useMemo, useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { isLowClasses, isChurnRisk } from '@/utils/calculations';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/members': '会员管理',
  '/members/new': '新增会员',
  '/classes': '上课签到',
  '/plans': '训练计划中心',
  '/reports': '统计报表',
  '/member-view': '会员端',
};

export function Header() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentCoachId = useAppStore((s) => s.currentCoachId);
  const coaches = useAppStore((s) => s.coaches);
  const members = useAppStore((s) => s.members);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const currentCoach = coaches.find((c) => c.id === currentCoachId);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const alertCount = useMemo(() => {
    const coachMembers = members.filter((m) => m.coachId === currentCoachId);
    const low = coachMembers.filter(isLowClasses).length;
    const churn = coachMembers.filter(isChurnRisk).length;
    return low + churn;
  }, [members, currentCoachId]);

  const pageTitle = pageTitles[location.pathname] || '未知页面';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden btn-ghost p-2 !px-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-ink-500">FitPulse</span>
            <ChevronDown className="w-4 h-4 text-ink-300 rotate-[-90deg]" />
            <span className="text-ink-900 font-medium">{pageTitle}</span>
          </div>
          <h2 className="sm:hidden font-display font-semibold text-ink-900">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex items-center gap-1 bg-ink-50 rounded-lg px-3 py-2 w-64 border border-ink-100">
            <Search className="w-4 h-4 text-ink-500 shrink-0" />
            <input
              type="text"
              placeholder="搜索会员姓名、电话..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-ink-900 placeholder:text-ink-500 w-full"
            />
          </div>

          <div className="hidden md:flex flex-col items-end text-xs">
            <span className="text-ink-700 font-medium">{formatDate(currentTime, 'HH:mm')}</span>
            <span className="text-ink-500">{formatDate(currentTime, 'YYYY-MM-DD')}</span>
          </div>

          <button className="relative btn-ghost p-2 !px-0">
            <Bell className="w-5 h-5 text-ink-700" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-ink-100">
            {currentCoach?.avatarUrl ? (
              <img
                src={currentCoach.avatarUrl}
                alt={currentCoach.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-ink-100"
              />
            ) : (
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ring-2 ring-ink-100',
                'bg-brand-200 text-brand-600'
              )}>
                {currentCoach?.name?.[0] || '?'}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-ink-900 leading-tight">{currentCoach?.name}</p>
              <p className="text-xs text-ink-500 leading-tight">{currentCoach?.specialty}</p>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pb-4 border-t border-ink-100 pt-3 animate-fade-in">
          <div className="flex items-center gap-2 bg-ink-50 rounded-lg px-3 py-2 border border-ink-100">
            <Search className="w-4 h-4 text-ink-500 shrink-0" />
            <input
              type="text"
              placeholder="搜索会员..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-ink-900 placeholder:text-ink-500 w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
}
