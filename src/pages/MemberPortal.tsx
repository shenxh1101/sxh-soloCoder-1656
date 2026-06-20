import { useState, useMemo } from 'react';
import {
  QrCode,
  ChevronDown,
  Check,
  Dumbbell,
  Layers,
  Weight,
  TrendingDown,
  Home as HomeIcon,
  LineChart as LineChartIcon,
  User as UserIcon,
  Sparkles,
  Moon,
  BookOpen,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { WeekDay, PlanExercise } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { getWeekDay, formatDate, todayISO, formatDateTime } from '@/utils/date';
import { fmtWeight, fmtBodyFat } from '@/utils/formatters';
import { cn } from '@/lib/utils';

type TabKey = 'today' | 'trend' | 'mine';

const ENCOURAGE = [
  '每一次坚持，都是对自己的投资！',
  '汗水不会辜负你，继续加油！',
  '今天的你比昨天更强壮！',
  '相信自己，你可以突破极限！',
  '自律给你自由，运动改变人生！',
];

export default function MemberPortal() {
  const members = useAppStore((s) => s.members);
  const getMemberPlanExercisesByDay = useAppStore((s) => s.getMemberPlanExercisesByDay);
  const getMemberMeasurements = useAppStore((s) => s.getMemberMeasurements);
  const getSessionsByMember = useAppStore((s) => s.getSessionsByMember);
  const getCoachById = useAppStore((s) => s.getCoachById);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  const todayWeekDay = getWeekDay(todayISO()) as WeekDay;
  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const memberSessions = useMemo(
    () => (selectedMember ? getSessionsByMember(selectedMember.id).filter(s => s.status === 'completed') : []),
    [selectedMember, getSessionsByMember]
  );

  const todayExercises = useMemo(
    () => (selectedMember ? getMemberPlanExercisesByDay(selectedMember.id, todayWeekDay) : []),
    [selectedMember, getMemberPlanExercisesByDay, todayWeekDay]
  );

  const measurements = useMemo(
    () => (selectedMember ? getMemberMeasurements(selectedMember.id) : []),
    [selectedMember, getMemberMeasurements]
  );

  const sortedM = useMemo(
    () => [...measurements].sort((a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()),
    [measurements]
  );

  const chartData = useMemo(
    () =>
      sortedM.slice(-10).map((m) => ({
        date: formatDate(m.measureDate, 'MM/DD'),
        weight: m.weight,
      })),
    [sortedM]
  );

  const first = sortedM[0];
  const last = sortedM[sortedM.length - 1];
  const weightDelta = first && last ? Number((last.weight - first.weight).toFixed(1)) : 0;
  const fatDelta = first && last ? Number((last.bodyFat - first.bodyFat).toFixed(1)) : 0;

  const classPct = selectedMember ? Math.max(0, Math.min(100, (selectedMember.remainingClasses / Math.max(1, selectedMember.totalClasses)) * 100)) : 0;
  const encourage = ENCOURAGE[new Date().getDate() % ENCOURAGE.length];

  if (!selectedMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">FitPulse 会员端</h1>
            <p className="text-white/80">扫码或选择身份登录</p>
          </div>
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-28 h-28 rounded-2xl bg-ink-50 border-2 border-dashed border-ink-200 flex items-center justify-center mb-3">
                <QrCode className="w-14 h-14 text-ink-300" />
              </div>
              <p className="text-sm text-ink-500">模拟扫码登录</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-ink-50 border border-ink-200 hover:border-brand-300 transition-colors"
              >
                <span className={cn('text-sm', selectedMember ? 'font-medium text-ink-900' : 'text-ink-500')}>
                  {selectedMember?.name || '选择会员身份'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-ink-500 transition-transform', dropdownOpen && 'rotate-180')} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lift border border-ink-100 z-50 overflow-hidden max-h-64 overflow-y-auto scrollbar-thin animate-fade-in">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition-colors text-left',
                        m.id === selectedMemberId && 'bg-brand-50'
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-600 text-sm font-semibold shrink-0">
                        {m.name[0]}
                      </div>
                      <span className="font-medium text-ink-900">{m.name}</span>
                      {m.id === selectedMemberId && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white pb-24">
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 px-5 pt-8 pb-16 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-display text-white text-lg font-bold">{selectedMember.name[0]}</span>
            </div>
            <div>
              <p className="text-white/70 text-xs">Hi~ 欢迎回来</p>
              <p className="font-display text-white text-lg font-bold">{selectedMember.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">今天是</p>
            <p className="font-semibold text-white">{todayWeekDay}</p>
          </div>
        </div>
        <div className="relative z-10 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-200 shrink-0 mt-0.5" />
            <p className="text-white/95 text-sm leading-relaxed">{encourage}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-lift p-5 mb-5 border border-ink-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink-500 font-medium">剩余课时</p>
            <span className="text-xs text-ink-400">共 {selectedMember.totalClasses} 课时</span>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="font-display text-5xl font-bold text-ink-900 leading-none">
              {selectedMember.remainingClasses}
            </span>
            <span className="text-ink-400 mb-1.5">/ {selectedMember.totalClasses}</span>
          </div>
          <div className="h-3 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-400 transition-all duration-700"
              style={{ width: `${classPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-500 text-right">已使用 {selectedMember.totalClasses - selectedMember.remainingClasses} 课时</p>
        </div>

        {activeTab === 'today' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-card border border-ink-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">今天的训练内容</h2>
                  <p className="text-xs text-ink-500 mt-0.5">{todayWeekDay}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-brand-500" />
                </div>
              </div>
              {todayExercises.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Moon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="font-semibold text-ink-900">今日休息</p>
                  <p className="text-sm text-ink-500 mt-1">好好恢复，明天继续！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayExercises.map((ex: PlanExercise, i: number) => (
                    <div key={ex.id} className="rounded-2xl bg-ink-50 border border-ink-100 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-gradient text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="font-semibold text-ink-900">{ex.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-11">
                        <span className="chip bg-brand-100 text-brand-700">
                          <Layers className="w-3 h-3 mr-1" />
                          {ex.sets} × {ex.reps}
                        </span>
                        <span className="chip bg-accent-100 text-accent-700">
                          <Weight className="w-3 h-3 mr-1" />
                          {ex.weightKg ?? 0} kg
                        </span>
                        <span className="chip bg-ink-200 text-ink-700">休息 {ex.restSec}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-card border border-ink-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">体重趋势</h2>
                  <p className="text-xs text-ink-500 mt-0.5">近期变化记录</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <div className="h-56">
                {chartData.length < 2 ? (
                  <div className="h-full flex items-center justify-center text-ink-500 text-sm">暂无足够测量数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wtG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} dataKey="date" />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip formatter={(v: number) => [`${v}kg`, '体重']} />
                      <Area type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2.5} fill="url(#wtG)" dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {first && last && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">初测体重</p>
                  <p className="font-display text-2xl font-bold text-ink-900">{fmtWeight(first.weight)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">最新体重</p>
                  <p className="font-display text-2xl font-bold text-ink-900">{fmtWeight(last.weight)}</p>
                  <p className={cn('text-xs font-semibold mt-1', weightDelta < 0 ? 'text-success' : weightDelta > 0 ? 'text-danger' : 'text-ink-500')}>
                    {weightDelta > 0 ? '+' : ''}{fmtWeight(weightDelta)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">初测体脂</p>
                  <p className="font-display text-2xl font-bold text-ink-900">{fmtBodyFat(first.bodyFat)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-card border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">最新体脂</p>
                  <p className="font-display text-2xl font-bold text-ink-900">{fmtBodyFat(last.bodyFat)}</p>
                  <p className={cn('text-xs font-semibold mt-1', fatDelta < 0 ? 'text-success' : fatDelta > 0 ? 'text-danger' : 'text-ink-500')}>
                    {fatDelta > 0 ? '+' : ''}{fmtBodyFat(fatDelta)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mine' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-card border border-ink-100 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-brand-gradient flex items-center justify-center">
                <span className="font-display text-white text-2xl font-bold">{selectedMember.name[0]}</span>
              </div>
              <h2 className="font-display text-lg font-bold text-ink-900">{selectedMember.name}</h2>
              <p className="text-sm text-ink-500">{selectedMember.phone}</p>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3 rounded-2xl bg-brand-50">
                  <p className="text-[10px] text-brand-600 font-medium mb-1">总课时</p>
                  <p className="font-display font-bold text-xl text-brand-700">{selectedMember.totalClasses}</p>
                </div>
                <div className="p-3 rounded-2xl bg-accent-50">
                  <p className="text-[10px] text-accent-600 font-medium mb-1">剩余</p>
                  <p className="font-display font-bold text-xl text-accent-600">{selectedMember.remainingClasses}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50">
                  <p className="text-[10px] text-emerald-600 font-medium mb-1">已上</p>
                  <p className="font-display font-bold text-xl text-emerald-600">{memberSessions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card border border-ink-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-brand-500" />课程记录
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">已完成 {memberSessions.length} 节私教课</p>
                </div>
              </div>
              {memberSessions.length === 0 ? (
                <div className="py-8 text-center text-ink-400 text-sm">
                  <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  暂无课程记录
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
                  {memberSessions.slice(0, 20).map((s) => {
                    const coach = getCoachById(s.coachId);
                    return (
                      <div key={s.id} className="p-3.5 rounded-2xl bg-ink-50/70 border border-ink-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] text-brand-600 leading-none font-medium">{formatDate(s.startTime, 'MM/DD')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-ink-900">{coach?.name || '--'} 教练</p>
                            <p className="text-xs text-ink-500 tabular-nums mt-0.5">
                              {formatDateTime(s.startTime).slice(-5)} · {s.durationMin} 分 · {s.classesConsumed} 课时
                            </p>
                          </div>
                        </div>
                        {s.note && (
                          <div className="mt-3 p-3 rounded-xl bg-white border border-brand-100/60">
                            <p className="text-[10px] text-brand-700 font-semibold mb-1.5 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />课堂小结
                            </p>
                            <p className="text-xs text-ink-700 whitespace-pre-wrap leading-relaxed">{s.note}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-ink-100 shadow-2xl">
          <div className="grid grid-cols-3 px-2 py-2">
            {([
              { k: 'today', l: '今日训练', i: HomeIcon },
              { k: 'trend', l: '体测趋势', i: LineChartIcon },
              { k: 'mine', l: '我的', i: UserIcon },
            ] as const).map((t) => {
              const Icon = t.i;
              const isActive = activeTab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setActiveTab(t.k)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 rounded-xl transition-all',
                    isActive ? 'text-brand-500' : 'text-ink-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{t.l}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
