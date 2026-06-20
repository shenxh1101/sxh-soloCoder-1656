import { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  RotateCcw,
  Download,
  Dumbbell,
  Layers,
  ChevronDown,
  User,
  Check,
} from 'lucide-react';
import type { WeekDay } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { PlanDayEditor } from '@/components/ui/PlanDayEditor';
import { cn } from '@/lib/utils';

const WEEK_DAYS: { key: WeekDay; label: string; num: number }[] = [
  { key: '周一', label: '周一', num: 1 },
  { key: '周二', label: '周二', num: 2 },
  { key: '周三', label: '周三', num: 3 },
  { key: '周四', label: '周四', num: 4 },
  { key: '周五', label: '周五', num: 5 },
  { key: '周六', label: '周六', num: 6 },
  { key: '周日', label: '周日', num: 7 },
];

export default function PlanEditor() {
  const members = useAppStore((s) => s.members);
  const plans = useAppStore((s) => s.plans);
  const planExercises = useAppStore((s) => s.planExercises);
  const getCoachById = useAppStore((s) => s.getCoachById);
  const addExerciseToPlan = useAppStore((s) => s.addExerciseToPlan);
  const getOrCreatePlan = useAppStore((s) => s.getOrCreatePlan);
  const removeExercise = useAppStore((s) => s.removeExercise);
  const getPlanExercises = useAppStore((s) => s.getPlanExercises);

  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [activeDay, setActiveDay] = useState<WeekDay>('周一');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.phone.includes(q)
    );
  }, [members, searchQuery]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedCoach = selectedMember ? getCoachById(selectedMember.coachId) : undefined;

  const weekStats = useMemo(() => {
    let totalExercises = 0;
    let totalSets = 0;
    const memberPlans = plans.filter((p) => p.memberId === selectedMemberId && p.active);
    memberPlans.forEach((plan) => {
      const exercises = getPlanExercises(plan.id);
      totalExercises += exercises.length;
      totalSets += exercises.reduce((sum, ex) => sum + ex.sets, 0);
    });
    return { totalExercises, totalSets };
  }, [plans, planExercises, selectedMemberId, getPlanExercises]);

  const handleCopyMonToWed = () => {
    const monPlan = getOrCreatePlan(selectedMemberId, '周一');
    const monExercises = getPlanExercises(monPlan.id);
    if (monExercises.length === 0) return;

    const tgtDays: WeekDay[] = ['周二', '周三'];
    tgtDays.forEach((day) => {
      const tgtPlan = getOrCreatePlan(selectedMemberId, day);
      const oldEx = getPlanExercises(tgtPlan.id);
      oldEx.forEach((ex) => removeExercise(ex.id));
      monExercises.forEach((ex) => {
        addExerciseToPlan({
          planId: tgtPlan.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restSec: ex.restSec,
        });
      });
    });
  };

  const handleResetWeek = () => {
    const memberPlans = plans.filter((p) => p.memberId === selectedMemberId);
    memberPlans.forEach((plan) => {
      const exercises = getPlanExercises(plan.id);
      exercises.forEach((ex) => removeExercise(ex.id));
    });
  };

  const handleExport = () => {
    if (!selectedMember) return;
    const lines: string[] = [`训练计划 - ${selectedMember.name}`, ''];
    WEEK_DAYS.forEach((d) => {
      const plan = plans.find((p) => p.memberId === selectedMemberId && p.weekDay === d.key && p.active);
      lines.push(`【${d.label}】`);
      if (!plan) {
        lines.push('  休息日');
      } else {
        const exercises = getPlanExercises(plan.id);
        if (exercises.length === 0) {
          lines.push('  暂无动作');
        } else {
          exercises.forEach((ex, i) => {
            lines.push(`  ${i + 1}. ${ex.name} | ${ex.sets}组×${ex.reps}次 | ${ex.weight}kg | 休息${ex.restSec}s`);
          });
        }
      }
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMember.name}-训练计划.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-10rem)]">
      <div className="flex-1 min-w-0">
        <div className="card p-5 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative">
              <button
                onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 hover:border-ink-300 transition-colors min-w-[260px]"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-ink-900">{selectedMember?.name || '请选择会员'}</p>
                  <p className="text-xs text-ink-500">{selectedCoach?.name || ''} · 剩余{selectedMember?.remainingClasses || 0}课时</p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-ink-500 transition-transform', memberDropdownOpen && 'rotate-180')} />
              </button>

              {memberDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lift border border-ink-100 z-50 overflow-hidden animate-fade-in">
                  <div className="p-2 border-b border-ink-100">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-ink-50">
                      <Search className="w-4 h-4 text-ink-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="搜索会员姓名/电话..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredMembers.length === 0 ? (
                      <p className="p-4 text-sm text-ink-500 text-center">未找到匹配会员</p>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setMemberDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 transition-colors text-left',
                            m.id === selectedMemberId && 'bg-brand-50'
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-600 text-sm font-semibold shrink-0">
                            {m.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-900 truncate">{m.name}</p>
                            <p className="text-xs text-ink-500 truncate">{m.phone}</p>
                          </div>
                          {m.id === selectedMemberId && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleCopyMonToWed} className="btn-outline">
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">复制周一到周三</span>
                <span className="sm:hidden">一→三</span>
              </button>
              <button onClick={handleResetWeek} className="btn-outline">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">重置本周</span>
                <span className="sm:hidden">重置</span>
              </button>
              <button onClick={handleExport} className="btn-primary">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">导出计划</span>
                <span className="sm:hidden">导出</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 mb-5 rounded-xl bg-white border border-ink-100 overflow-x-auto scrollbar-thin md:overflow-visible">
          {WEEK_DAYS.map((d) => {
            const isActive = activeDay === d.key;
            const plan = plans.find((p) => p.memberId === selectedMemberId && p.weekDay === d.key && p.active);
            const exCount = plan ? getPlanExercises(plan.id).length : 0;
            return (
              <button
                key={d.key}
                onClick={() => setActiveDay(d.key)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all',
                  isActive
                    ? 'bg-brand-gradient text-white shadow-soft'
                    : 'hover:bg-ink-50 text-ink-700'
                )}
              >
                <span className={cn('text-[10px] font-bold opacity-70', isActive ? 'text-white' : 'text-ink-500')}>
                  DAY {d.num}
                </span>
                <span className="text-sm font-semibold">{d.label}</span>
                {exCount > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-600'
                  )}>
                    {exCount}动
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <PlanDayEditor memberId={selectedMemberId} weekDay={activeDay} />
      </div>

      <aside className="lg:w-80 flex-shrink-0">
        <div className="lg:sticky lg:top-20 space-y-5">
          <div className="card p-5">
            <h3 className="section-title mb-4">会员信息</h3>
            {selectedMember ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-display text-xl font-bold shrink-0">
                  {selectedMember.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 truncate">{selectedMember.name}</p>
                  <p className="text-sm text-ink-500 truncate">{selectedCoach?.name || '未分配教练'}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{selectedMember.gender} · {selectedMember.height}cm</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-500">请选择会员</p>
            )}

            <div className="divider mb-4" />

            <h3 className="section-title mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              本周统计
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-50 p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-brand-gradient flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-900">{weekStats.totalExercises}</p>
                <p className="text-xs text-ink-500 mt-0.5">总动作数</p>
              </div>
              <div className="rounded-xl bg-accent-50 p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-accent-gradient flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <p className="font-display text-2xl font-bold text-ink-900">{weekStats.totalSets}</p>
                <p className="text-xs text-ink-500 mt-0.5">总组数</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {WEEK_DAYS.map((d) => {
                const plan = plans.find((p) => p.memberId === selectedMemberId && p.weekDay === d.key && p.active);
                const count = plan ? getPlanExercises(plan.id).length : 0;
                const pct = weekStats.totalExercises > 0 ? (count / weekStats.totalExercises) * 100 : 0;
                return (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-ink-500 shrink-0">{d.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-gradient rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-ink-700 shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
