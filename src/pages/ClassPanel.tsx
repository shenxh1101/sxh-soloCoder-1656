import { useMemo, useState, useEffect } from 'react';
import {
  Search, Users, Play, UserRound, CalendarDays,
  CheckCircle, Clock, Dumbbell, ChevronDown, AlertCircle, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ClassTimer } from '@/components/ui/ClassTimer';
import { todayISO, formatDateTime, formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { ClassSessionStatus, Member } from '@/shared/types';

const SBM: Record<ClassSessionStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-brand-50', text: 'text-brand-500', label: '待开始' },
  ongoing: { bg: 'bg-emerald-50', text: 'text-success', label: '进行中' },
  completed: { bg: 'bg-ink-100', text: 'text-ink-500', label: '已完成' },
  cancelled: { bg: 'bg-red-50', text: 'text-danger', label: '已取消' },
};
const avC = (g: '男' | '女') => g === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';

export default function ClassPanel() {
  const members = useAppStore((s) => s.members);
  const sessions = useAppStore((s) => s.sessions);
  const coaches = useAppStore((s) => s.coaches);
  const curCid = useAppStore((s) => s.currentCoachId);
  const setCurCid = useAppStore((s) => s.setCurrentCoachId);
  const gCb = useAppStore((s) => s.getCoachById);
  const gOg = useAppStore((s) => s.getOngoingSession);
  const stSs = useAppStore((s) => s.startSession);
  const enSs = useAppStore((s) => s.endSession);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const today = todayISO();
  const tStart = new Date(today).setHours(0, 0, 0, 0);
  const curCoach = gCb(curCid);
  const og = gOg();

  useEffect(() => { if (og) setSelId(og.memberId); }, [og]);

  const fMs = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return members
      .filter((m) => m.remainingClasses > 0 && (!ql || m.name.toLowerCase().includes(ql) || m.phone.includes(ql)))
      .slice(0, 10);
  }, [members, q]);

  const sel = members.find((m) => m.id === selId);
  const tSess = useMemo(
    () => sessions
      .filter((s) => (new Date(s.startTime).getTime() >= tStart || s.status === 'ongoing') && s.status !== 'cancelled')
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
    [sessions, tStart]
  );
  const cDone = tSess.filter((s) => s.status === 'completed').length;
  const cGoing = tSess.filter((s) => s.status === 'ongoing').length;
  const cWait = tSess.filter((s) => s.status === 'scheduled').length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
  const handleStart = () => {
    if (!sel || sel.remainingClasses <= 0) return;
    stSs(sel.id, curCid);
    showToast(`${sel.name} 的课程已开始`);
  };
  const handleEnd = () => {
    if (!og) return;
    enSs(og.id);
    const mb = members.find((m) => m.id === og.memberId);
    showToast(`课程已结束 · 已为 ${mb?.name || '会员'} 扣减 1 课时`);
  };

  const DI = ({ m }: { m: Member }) => (
    <button
      onClick={() => { setSelId(m.id); setQ(''); setOpen(false); }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50 transition-colors text-left',
        selId === m.id && 'bg-brand-50'
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0', avC(m.gender))}>{m.name[0]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{m.name}</p>
        <p className="text-xs text-ink-500 truncate">{m.phone}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-bold', m.remainingClasses <= 3 ? 'text-danger' : 'text-brand-600')}>{m.remainingClasses}</p>
        <p className="text-[10px] text-ink-400">剩余课时</p>
      </div>
    </button>
  );

  const SC = ({ label, value, icon: I, c }: { label: string; value: number; icon: LucideIcon; c: string }) => (
    <div className="p-3.5 rounded-xl border border-ink-100">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] text-ink-500 font-medium">{label}</p>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', c)}><I className="w-3.5 h-3.5" /></div>
      </div>
      <p className="font-display font-bold text-2xl leading-none">{value}</p>
    </div>
  );

  return (
    <div className="space-y-5 p-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">课程中心</h1>
          <p className="text-ink-500 mt-1">{formatDate(today, 'YYYY年MM月DD日')} · 今日课程</p>
        </div>
        <div className="relative w-full sm:w-56 self-start sm:self-auto">
          <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <select value={curCid} onChange={(e) => setCurCid(e.target.value)} className="input-base pl-10 pr-8 appearance-none cursor-pointer">
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-brand-500" />
              <h2 className="section-title mb-0 text-base">选择上课会员</h2>
              <span className="ml-auto text-xs text-ink-400">当前教练: {curCoach?.name || '--'}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text" value={q}
                onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder="搜索姓名或手机号..."
                className="input-base pl-10"
              />
              {open && (
                <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-xl border border-ink-100 shadow-lift overflow-hidden max-h-72 overflow-y-auto scrollbar-thin animate-fade-in">
                  {fMs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-ink-400 text-sm">{q ? '未找到匹配会员' : '暂无可用课时的会员'}</div>
                  ) : (
                    <div className="py-1">{fMs.map((m) => <DI key={m.id} m={m} />)}</div>
                  )}
                </div>
              )}
            </div>
            {sel && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-brand-50/60 border border-brand-100">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0', avC(sel.gender))}>{sel.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{sel.name}</p>
                  <p className="text-xs text-ink-500">{sel.phone} · {gCb(sel.coachId)?.name || '--'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('font-display font-bold text-xl', sel.remainingClasses <= 3 ? 'text-danger' : 'text-brand-600')}>{sel.remainingClasses}</p>
                  <p className="text-[10px] text-ink-400">剩余/总 {sel.totalClasses}</p>
                </div>
              </div>
            )}
          </div>

          {!sel ? (
            <div className="card p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-50/30" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-card border border-ink-100 flex items-center justify-center mb-5">
                  <Dumbbell className="w-10 h-10 text-ink-300" />
                </div>
                <h2 className="font-display text-xl font-bold mb-2">请选择要上课的会员</h2>
                <p className="text-ink-500 text-sm max-w-sm">在上方搜索框输入会员姓名或手机号，从下拉列表中选择后开始课程</p>
              </div>
            </div>
          ) : og && og.memberId === sel.id ? (
            <ClassTimer memberName={sel.name} coachName={curCoach?.name || '--'} startTime={og.startTime} onEnd={handleEnd} />
          ) : (
            <div className="card p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-success/10 blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-brand-100/60 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-4xl mb-5 shadow-lift', avC(sel.gender))}>{sel.name[0]}</div>
                <h2 className="font-display text-2xl font-bold mb-1">{sel.name}</h2>
                <p className="text-ink-500 mb-6">教练: {curCoach?.name || '--'} · 剩余课时 <b className={sel.remainingClasses <= 3 ? 'text-danger' : 'text-brand-600'}>{sel.remainingClasses}</b></p>
                {sel.remainingClasses <= 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-danger text-sm mb-6">
                    <AlertCircle className="w-4 h-4" />课时不足，请先续费
                  </div>
                )}
                <button
                  onClick={handleStart} disabled={sel.remainingClasses <= 0}
                  className={cn(
                    'group relative inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-white font-display text-xl font-bold shadow-lift transition-all duration-300',
                    sel.remainingClasses > 0
                      ? 'bg-gradient-to-br from-emerald-500 via-success to-emerald-400 hover:shadow-glow hover:-translate-y-1 active:translate-y-0'
                      : 'bg-ink-300 cursor-not-allowed'
                  )}
                >
                  <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-success" style={{ animationDuration: '2s' }} />
                  <span className="relative flex items-center gap-3"><Play className="w-7 h-7" />开始上课</span>
                </button>
                <p className="mt-4 text-xs text-ink-400">点击开始后自动计时，结束时扣除 1 课时</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-brand-500" />
              <h2 className="section-title mb-0 text-base">今日课程统计</h2>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <SC label="已完成" value={cDone} icon={CheckCircle} c="bg-emerald-50 text-success" />
              <SC label="进行中" value={cGoing} icon={Play} c="bg-brand-50 text-brand-500" />
              <SC label="待开始" value={cWait} icon={Clock} c="bg-amber-50 text-warning" />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-500" />
              <h2 className="section-title mb-0 text-base">今日课程列表</h2>
            </div>
            {tSess.length === 0 ? (
              <div className="py-10 text-center text-ink-400 text-sm">今日暂无课程</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-ink-100" />
                <div className="space-y-3">
                  {tSess.slice(0, 8).map((s) => {
                    const mb = members.find((x) => x.id === s.memberId);
                    const cb = gCb(s.coachId);
                    const sb = SBM[s.status];
                    return (
                      <div key={s.id} className="relative pl-10">
                        <div
                          className={cn(
                            'absolute left-2.5 top-3.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10',
                            s.status === 'ongoing' ? 'bg-success animate-pulse' :
                            s.status === 'completed' ? 'bg-ink-300' : 'bg-brand-400'
                          )}
                        />
                        <div
                          onClick={() => mb && s.status !== 'ongoing' && setSelId(mb.id)}
                          className={cn('p-3 rounded-xl border border-ink-100 hover:bg-ink-50/60 transition', mb && s.status !== 'ongoing' && 'cursor-pointer')}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-mono text-ink-500 w-24 shrink-0">{formatDateTime(s.startTime).slice(-5)}</span>
                            <span className={cn('badge', sb.bg, sb.text)}>{sb.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {mb && <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', avC(mb.gender))}>{mb.name[0]}</div>}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{mb?.name || '--'}</p>
                              <p className="text-[11px] text-ink-500 truncate">{cb?.name || '--'} · {s.durationMin || '--'}分钟</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white shadow-lift border border-ink-100">
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm font-medium text-ink-900">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
