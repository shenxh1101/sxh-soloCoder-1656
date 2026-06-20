import { useMemo } from 'react';
import { Users, Calendar, Clock, AlertTriangle, Play, Square, UserCheck, Trophy } from 'lucide-react';
import { DataCard } from '../components/ui/DataCard';
import { StatBarChart } from '../components/ui/StatBarChart';
import { AlertBadge } from '../components/ui/AlertBadge';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { isLowClasses, isChurnRisk, getCoachStats } from '../utils/calculations';
import { todayISO, isSameDay, formatDateTime, daysSince } from '../utils/date';
import { fmtBigNumber } from '../utils/formatters';
import type { ClassSessionStatus } from '../shared/types';

export default function Dashboard() {
  const {
    coaches,
    members,
    sessions,
    getCoachById,
    getMemberById,
    getOngoingSession,
    startSession,
    endSession,
    renewClasses,
  } = useAppStore();

  const today = todayISO();
  const ongoingSession = getOngoingSession();
  const thisMonthPrefix = today.slice(0, 7);

  const stats = useMemo(() => {
    const todaySessions = sessions.filter((s) => isSameDay(s.startTime, today));
    const monthCompleted = sessions.filter(
      (s) => s.startTime.slice(0, 7) === thisMonthPrefix && s.status === 'completed'
    );
    return {
      totalMembers: members.length,
      todaySessionsCount: todaySessions.length,
      monthTotalClasses: monthCompleted.reduce((sum, s) => sum + s.classesConsumed, 0),
      lowClassesCount: members.filter(isLowClasses).length,
    };
  }, [members, sessions, today, thisMonthPrefix]);

  const trendData = useMemo(() => {
    const data: { name: string; 课时数: number; 活跃会员: number }[] = [];
    const now = new Date(today);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const ms = sessions.filter(
        (s) => s.startTime.slice(0, 7) === prefix && s.status === 'completed'
      );
      data.push({
        name: `${d.getMonth() + 1}月`,
        课时数: ms.reduce((sum, s) => sum + s.classesConsumed, 0),
        活跃会员: new Set(ms.map((s) => s.memberId)).size,
      });
    }
    return data;
  }, [sessions, today]);

  const coachTop3 = useMemo(
    () => getCoachStats(coaches, members, sessions).sort((a, b) => b.totalClasses - a.totalClasses).slice(0, 3),
    [coaches, members, sessions]
  );

  const lowMembers = useMemo(() => members.filter(isLowClasses), [members]);
  const churnMembers = useMemo(() => members.filter(isChurnRisk), [members]);
  const churnMemberList = churnMembers.slice(0, 5);
  const lowMemberList = lowMembers.slice(0, 5);

  const todayTimeline = useMemo(() => {
    let list = sessions.filter((s) => isSameDay(s.startTime, today) || s.status === 'ongoing');
    if (ongoingSession && !list.find((s) => s.id === ongoingSession.id)) {
      list = [...list, ongoingSession];
    }
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [sessions, today, ongoingSession]);

  const statusMap: Record<ClassSessionStatus, { bg: string; text: string; label: string }> = {
    scheduled: { bg: 'bg-brand-50', text: 'text-brand-600', label: '待开始' },
    ongoing: { bg: 'bg-emerald-50', text: 'text-success', label: '进行中' },
    completed: { bg: 'bg-ink-100', text: 'text-ink-500', label: '已完成' },
    cancelled: { bg: 'bg-red-50', text: 'text-danger', label: '已取消' },
  };

  const handleStart = (sid: string) => {
    const s = sessions.find((x) => x.id === sid);
    const mb = s ? getMemberById(s.memberId) : undefined;
    if (s?.status === 'scheduled' && mb && mb.remainingClasses > 0) startSession(s.memberId, s.coachId, s.id);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard title="会员总数" value={fmtBigNumber(stats.totalMembers)} icon={Users} color="brand" />
        <DataCard title="今日课程数" value={stats.todaySessionsCount} icon={Calendar} color="accent" />
        <DataCard title="本月总课时" value={stats.monthTotalClasses} icon={Clock} color="success" />
        <DataCard title="续费预警数" value={stats.lowClassesCount} icon={AlertTriangle} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-warning flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 text-sm">课时不足会员</h3>
              <p className="text-xs text-ink-500">共 {lowMembers.length} 人</p>
            </div>
          </div>
          {lowMemberList.length === 0 ? (
            <div className="py-8 text-center text-ink-500 text-sm">暂无提醒</div>
          ) : (
            <div className="space-y-1.5">
              {lowMemberList.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-ink-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {m.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{m.name}</p>
                      <div className="mt-1"><AlertBadge type="low" remainingClasses={m.remainingClasses} /></div>
                    </div>
                  </div>
                  <button
                    onClick={() => renewClasses(m.id, 24, 'dashboard')}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all"
                  >
                    +24 课时
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-danger flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 text-sm">流失风险会员</h3>
              <p className="text-xs text-ink-500">共 {churnMembers.length} 人</p>
            </div>
          </div>
          {churnMemberList.length === 0 ? (
            <div className="py-8 text-center text-ink-500 text-sm">暂无流失风险会员</div>
          ) : (
            <div className="space-y-1.5">
              {churnMemberList.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-ink-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {m.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{m.name}</p>
                      <div className="mt-1"><AlertBadge type="churn" daysSinceCheckIn={daysSince(m.lastCheckIn)} /></div>
                    </div>
                  </div>
                  <div className="text-xs text-ink-500 shrink-0 tabular-nums">剩余 {m.remainingClasses} 课</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-brand" />
          今日课程时间轴
          <span className="text-xs font-normal text-ink-500 ml-auto">{todayTimeline.length} 节</span>
        </h3>
        {todayTimeline.length === 0 ? (
          <div className="py-8 text-center text-ink-500 text-sm">今日无课程安排</div>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-ink-100" />
            {todayTimeline.map((s) => {
              const coach = getCoachById(s.coachId);
              const member = getMemberById(s.memberId);
              const sc = statusMap[s.status];
              const isOg = s.status === 'ongoing';
              return (
                <div
                  key={s.id}
                  className={cn(
                    'relative mb-4 last:mb-0 p-3 rounded-xl border transition-all',
                    isOg ? 'border-success/40 bg-emerald-50/50' : 'border-transparent hover:bg-ink-50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute -left-[22px] top-5 w-3 h-3 rounded-full border-2 border-white',
                      isOg ? 'bg-success ring-4 ring-emerald-100' : s.status === 'completed' ? 'bg-ink-400' : 'bg-brand-400'
                    )}
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xs text-ink-500 w-12 shrink-0 tabular-nums">{formatDateTime(s.startTime).slice(-5)}</div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {member?.name?.slice(0, 1) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">
                            {member?.name || '未知会员'}
                            <span className="font-normal text-ink-400 mx-1">·</span>
                            <span className="text-ink-600">{coach?.name || '未指派'}</span>
                          </p>
                          <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5', sc.bg, sc.text)}>{sc.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.status === 'scheduled' && !ongoingSession && (
                        <button onClick={() => handleStart(s.id)} className="btn btn-sm btn-outline flex items-center gap-1">
                          <Play className="w-3.5 h-3.5" />开始
                        </button>
                      )}
                      {s.status === 'completed' && <span className="text-xs text-ink-400 tabular-nums">{s.durationMin} 分钟</span>}
                      {isOg && (
                        <button onClick={() => endSession(s.id)} className="btn btn-sm btn-outline-danger flex items-center gap-1">
                          <Square className="w-3.5 h-3.5" />结束
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatBarChart data={trendData} height={260} title="近6个月课时趋势" />
        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-accent" />教练课时排行 Top3
          </h3>
          {coachTop3.length === 0 || coachTop3.every((c) => c.totalClasses === 0) ? (
            <div className="py-8 text-center text-ink-500 text-sm">暂无数据</div>
          ) : (
            <div className="space-y-3.5">
              {coachTop3.map((r, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const max = Math.max(1, coachTop3[0]?.totalClasses || 1);
                return (
                  <div key={r.coachId} className="flex items-center gap-3">
                    <div className="text-2xl w-8 text-center">{medals[i]}</div>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white font-semibold shrink-0">
                      {r.coachName?.slice(0, 1) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-ink-900 truncate">{r.coachName}</p>
                        <p className="text-sm font-semibold text-brand tabular-nums">{r.totalClasses} 课时</p>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-400 to-accent-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (r.totalClasses / max) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">{r.activeMembers} 位活跃会员 · 人均 {r.avgClassesPerMember} 课</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
