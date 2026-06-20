import { useMemo, useState, useEffect } from 'react';
import {
  Search, Users, Play, UserRound, CalendarDays,
  CheckCircle, Clock, Dumbbell, ChevronDown, AlertCircle, Sparkles, CalendarPlus, X, CalendarClock, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ClassTimer } from '@/components/ui/ClassTimer';
import { todayISO, formatDateTime, formatDate, addDays, daysSince, isThisWeek, isSameDay, getWeekDay } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { ClassSessionStatus, Member } from '@/shared/types';

const SBM: Record<ClassSessionStatus, { bg: string; text: string; label: string; dot: string }> = {
  scheduled: { bg: 'bg-brand-50', text: 'text-brand-500', label: '待开始', dot: 'bg-brand-400' },
  ongoing: { bg: 'bg-emerald-50', text: 'text-success', label: '进行中', dot: 'bg-success animate-pulse' },
  completed: { bg: 'bg-ink-100', text: 'text-ink-500', label: '已完成', dot: 'bg-ink-300' },
  cancelled: { bg: 'bg-red-50', text: 'text-danger', label: '已取消', dot: 'bg-danger' },
};
const avC = (g: '男' | '女') => g === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';

type CPTab = 'now' | 'schedule';

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
  const scSs = useAppStore((s) => s.scheduleSession);
  const clSs = useAppStore((s) => s.cancelSession);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<CPTab>('now');
  const [showSch, setShowSch] = useState(false);
  const [schDate, setSchDate] = useState<string>(addDays(todayISO(), 1));
  const [schTime, setSchTime] = useState<string>('19:00');

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
  const futureScheduled = useMemo(
    () => sessions
      .filter((s) => s.status === 'scheduled' && new Date(s.startTime).getTime() >= tStart - 86400000)
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
    [sessions, tStart]
  );
  const todayScheduled = useMemo(
    () => futureScheduled.filter((s) => isSameDay(s.startTime, today)),
    [futureScheduled, today]
  );
  const weekScheduled = useMemo(
    () => futureScheduled.filter((s) => isThisWeek(s.startTime) && !isSameDay(s.startTime, today)),
    [futureScheduled, today]
  );
  const futureAfterWeek = useMemo(
    () => futureScheduled.filter((s) => !isThisWeek(s.startTime)),
    [futureScheduled]
  );
  const cDone = tSess.filter((s) => s.status === 'completed').length;
  const cGoing = tSess.filter((s) => s.status === 'ongoing').length;
  const cScheduled = futureScheduled.length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
  const handleStart = (sessionId?: string) => {
    if (!sel || sel.remainingClasses <= 0) return;
    if (sessionId) {
      const s = sessions.find((x) => x.id === sessionId);
      if (s) {
        stSs(s.memberId, s.coachId, sessionId);
        showToast(`${sel.name} 的预约课程已开始`);
        return;
      }
    }
    stSs(sel.id, curCid);
    showToast(`${sel.name} 的课程已开始`);
  };
  const handleEnd = () => {
    if (!og) return;
    enSs(og.id);
    const mb = members.find((m) => m.id === og.memberId);
    showToast(`课程已结束 · 已为 ${mb?.name || '会员'} 扣减 1 课时`);
  };
  const handleSchedule = () => {
    if (!sel || sel.remainingClasses <= 0) return;
    const dateTime = `${schDate} ${schTime}:00`;
    const result = scSs(sel.id, dateTime, curCid);
    if (result) {
      showToast(`已预约 ${sel.name} · ${schDate} ${schTime}`);
      setShowSch(false);
    } else {
      showToast('该会员课时不足，无法预约');
    }
  };
  const handleCancelScheduled = (id: string) => {
    if (!confirm('确定取消该预约课程?')) return;
    clSs(id);
    showToast('预约已取消');
  };
  const startFromScheduled = (sId: string) => {
    const s = sessions.find((x) => x.id === sId);
    if (!s) return;
    const mb = members.find((m) => m.id === s.memberId);
    if (!mb || mb.remainingClasses <= 0) {
      showToast('课时不足，无法开始');
      return;
    }
    const existing = sessions.find((x) => x.status === 'ongoing' && x.coachId === (s.coachId || curCid));
    if (existing) {
      showToast('已有进行中的课程，请先结束');
      return;
    }
    setSelId(mb.id);
    handleStart(sId);
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-56 self-start sm:self-auto">
            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select value={curCid} onChange={(e) => setCurCid(e.target.value)} className="input-base pl-10 pr-8 appearance-none cursor-pointer">
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button onClick={() => setTab('now')} className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition',
          tab === 'now' ? 'bg-brand-gradient text-white shadow-soft' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
        )}>
          <Play className="w-4 h-4" />立即上课
        </button>
        <button onClick={() => setTab('schedule')} className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition',
          tab === 'schedule' ? 'bg-brand-gradient text-white shadow-soft' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
        )}>
          <CalendarPlus className="w-4 h-4" />预约课程
          {futureScheduled.length > 0 && <span className="bg-white/25 rounded-full px-2 py-0.5 text-[10px]">{futureScheduled.length}</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-brand-500" />
              <h2 className="section-title mb-0 text-base">选择会员</h2>
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

          {tab === 'now' ? (
            <>
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
                      onClick={() => handleStart()} disabled={sel.remainingClasses <= 0}
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
            </>
          ) : (
            <div className="card">
              <div className="flex items-center gap-2 p-5 border-b border-ink-100">
                <CalendarDays className="w-5 h-5 text-brand-500" />
                <h2 className="section-title mb-0 text-base">预约日程</h2>
                <button
                  onClick={() => setShowSch(true)} disabled={!sel || sel.remainingClasses <= 0}
                  className={cn(
                    'ml-auto btn',
                    sel && sel.remainingClasses > 0 ? 'btn-accent' : 'bg-ink-200 text-ink-500 cursor-not-allowed'
                  )}
                >
                  <CalendarPlus className="w-4 h-4" />新建预约
                </button>
              </div>

              <div className="p-5 space-y-6 max-h-[620px] overflow-y-auto scrollbar-thin">
                {futureScheduled.length === 0 ? (
                  <div className="py-16 text-center">
                    <CalendarClock className="w-14 h-14 text-ink-200 mx-auto mb-4" />
                    <p className="text-ink-500 text-sm">暂无预约课程</p>
                    <p className="text-xs text-ink-400 mt-1">选择会员后点击右上角「新建预约」</p>
                  </div>
                ) : (
                  <>
                    {todayScheduled.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <h3 className="font-semibold text-sm text-ink-900">今天</h3>
                          <span className="badge bg-emerald-50 text-success text-[10px]">{todayScheduled.length} 节</span>
                          <span className="ml-auto text-[11px] text-ink-400">{formatDate(today, 'MM月DD日')} {getWeekDay(today)}</span>
                        </div>
                        <div className="space-y-2">
                          {todayScheduled.map((s) => {
                            const mb = members.find((x) => x.id === s.memberId);
                            const cb = gCb(s.coachId);
                            const canStart = !og && mb && mb.remainingClasses > 0;
                            return (
                              <div key={s.id} className="p-4 rounded-xl border border-success/30 bg-emerald-50/50 hover:bg-emerald-50 transition">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-white border border-success/30 flex items-center justify-center font-bold text-brand-600 shrink-0">
                                    {formatDateTime(s.startTime).slice(-5)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">
                                      {mb?.name || '--'}
                                      <span className="badge bg-success/15 text-success ml-2 text-[10px]">今日可上课</span>
                                    </p>
                                    <p className="text-xs text-ink-500 mt-0.5">{cb?.name || '--'} · 私教课</p>
                                    {mb && (
                                      <p className="text-[11px] text-ink-400 mt-0.5">
                                        剩余 <span className={mb.remainingClasses <= 3 ? 'text-danger font-medium' : 'text-ink-600'}>{mb.remainingClasses}</span> 课时
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {canStart ? (
                                      <button
                                        onClick={() => startFromScheduled(s.id)}
                                        className="btn-success !px-3 !py-2 text-sm"
                                      >
                                        <Play className="w-4 h-4" />开始
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-ink-400">
                                        {og ? '上课中' : '课时不足'}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleCancelScheduled(s.id)}
                                      className="btn-outline-danger btn-sm !px-2"
                                      title="取消预约"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {weekScheduled.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-brand-400" />
                          <h3 className="font-semibold text-sm text-ink-900">本周</h3>
                          <span className="badge bg-brand-50 text-brand-500 text-[10px]">{weekScheduled.length} 节</span>
                          <span className="ml-auto text-[11px] text-ink-400">近期安排</span>
                        </div>
                        <div className="space-y-1.5">
                          {weekScheduled.map((s) => {
                            const mb = members.find((x) => x.id === s.memberId);
                            const cb = gCb(s.coachId);
                            return (
                              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50/70 transition group">
                                <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[10px] text-brand-500 leading-none">{getWeekDay(s.startTime).slice(1)}</span>
                                  <span className="text-xs font-semibold text-brand-700 mt-0.5">{formatDateTime(s.startTime).slice(-5)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{mb?.name || '--'}</p>
                                  <p className="text-[11px] text-ink-500 truncate">{cb?.name || '--'}</p>
                                </div>
                                <button
                                  onClick={() => handleCancelScheduled(s.id)}
                                  className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-danger transition btn-sm btn-outline !px-2"
                                  title="取消预约"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {futureAfterWeek.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-ink-300" />
                          <h3 className="font-semibold text-sm text-ink-700">未来</h3>
                          <span className="badge bg-ink-100 text-ink-500 text-[10px]">{futureAfterWeek.length} 节</span>
                          <span className="ml-auto text-[11px] text-ink-400">下周及以后</span>
                        </div>
                        <div className="space-y-1.5">
                          {futureAfterWeek.slice(0, 10).map((s) => {
                            const mb = members.find((x) => x.id === s.memberId);
                            const cb = gCb(s.coachId);
                            return (
                              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50/70 transition group opacity-80">
                                <div className="w-10 h-10 rounded-lg bg-ink-50 border border-ink-100 flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[10px] text-ink-500 leading-none">{formatDate(s.startTime, 'MM/DD')}</span>
                                  <span className="text-xs font-medium text-ink-600 mt-0.5">{formatDateTime(s.startTime).slice(-5)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate text-ink-700">{mb?.name || '--'}</p>
                                  <p className="text-[11px] text-ink-500 truncate">{cb?.name || '--'}</p>
                                </div>
                                <button
                                  onClick={() => handleCancelScheduled(s.id)}
                                  className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-danger transition btn-sm btn-outline !px-2"
                                  title="取消预约"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          {futureAfterWeek.length > 10 && (
                            <p className="text-center text-xs text-ink-400 pt-1">还有 {futureAfterWeek.length - 10} 节预约...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
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
              <SC label="待开始" value={cScheduled} icon={Clock} c="bg-amber-50 text-warning" />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-500" />
              <h2 className="section-title mb-0 text-base">课程列表</h2>
            </div>
            {tSess.length === 0 && futureScheduled.length === 0 ? (
              <div className="py-10 text-center text-ink-400 text-sm">暂无课程</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-ink-100" />
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
                  {[...tSess, ...futureScheduled.filter((s) => !tSess.find((t) => t.id === s.id))]
                    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
                    .slice(0, 15)
                    .map((s) => {
                    const mb = members.find((x) => x.id === s.memberId);
                    const cb = gCb(s.coachId);
                    const sb = SBM[s.status];
                    const isToday = new Date(s.startTime).getTime() >= tStart && new Date(s.startTime).getTime() < tStart + 86400000;
                    return (
                      <div key={s.id} className="relative pl-10">
                        <div
                          className={cn(
                            'absolute left-2.5 top-3.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10',
                            sb.dot
                          )}
                        />
                        <div
                          onClick={() => mb && s.status !== 'ongoing' && setSelId(mb.id)}
                          className={cn('p-3 rounded-xl border border-ink-100 hover:bg-ink-50/60 transition', mb && s.status !== 'ongoing' && 'cursor-pointer')}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-mono text-ink-500 w-24 shrink-0">{formatDateTime(s.startTime).slice(-5)}</span>
                            {!isToday && <span className="text-[10px] text-ink-400 font-mono">{formatDate(s.startTime, 'MM/DD')}</span>}
                            <span className={cn('badge', sb.bg, sb.text)}>{sb.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {mb && <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', avC(mb.gender))}>{mb.name[0]}</div>}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{mb?.name || '--'}</p>
                              <p className="text-[11px] text-ink-500 truncate">{cb?.name || '--'} · {s.status === 'completed' ? `${s.durationMin || '--'}分钟` : '私教课'}</p>
                            </div>
                            {s.status === 'scheduled' && isToday && !og && (
                              <button onClick={(e) => { e.stopPropagation(); startFromScheduled(s.id); }} className="btn-sm btn-success !px-2">
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            {s.status === 'scheduled' && (
                              <button onClick={(e) => { e.stopPropagation(); handleCancelScheduled(s.id); }} className="btn-sm btn-outline !px-2 text-ink-400" title="取消">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
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

      {showSch && sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowSch(false)}>
          <div className="card p-5 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <CalendarPlus className="w-4.5 h-4.5 text-brand-500" />预约课程
              </h3>
              <button onClick={() => setShowSch(false)} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-3 p-3 rounded-lg bg-brand-50/60 border border-brand-100 flex items-center gap-2.5">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0', avC(sel.gender))}>{sel.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{sel.name}</p>
                <p className="text-xs text-ink-500">剩余 <b className="text-brand-600">{sel.remainingClasses}</b> 课时</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="input-label">预约日期</label>
                <input type="date" value={schDate} min={todayISO()} max={addDays(todayISO(), 60)} onChange={(e) => setSchDate(e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="input-label">预约时间</label>
                <input type="time" value={schTime} onChange={(e) => setSchTime(e.target.value)} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((d) => {
                const t = `${9 + d * 2}:00`;
                return (
                  <button key={t} onClick={() => setSchTime(t)} className={cn(
                    'py-2 rounded-lg text-xs font-medium transition',
                    schTime === t ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                  )}>{t}</button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSch(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleSchedule} className="btn-accent flex-1">
                <CalendarClock className="w-4 h-4" />确认预约
              </button>
            </div>
          </div>
        </div>
      )}

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
