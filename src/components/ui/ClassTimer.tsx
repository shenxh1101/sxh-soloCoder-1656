import { useEffect, useMemo, useState } from 'react';
import { Clock, User, UserRound, CheckCircle, Timer } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration, formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';

interface ClassTimerProps {
  memberName: string;
  coachName: string;
  startTime: string;
  endTime?: string;
  onEnd?: () => void;
}

export function ClassTimer({ memberName, coachName, startTime, endTime, onEnd }: ClassTimerProps) {
  const isOngoing = !endTime;

  const initialSeconds = useMemo(() => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.max(0, Math.floor((end - start) / 1000));
  }, [startTime, endTime]);

  const { seconds, formatted, start, running } = useTimer(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (isOngoing) {
      setInitialized(true);
      start();
    }
  }, [initialized, isOngoing, start]);

  const totalSeconds = initialSeconds + seconds;
  const displayFormatted = formatDuration(totalSeconds);
  const minutes = Math.floor(totalSeconds / 60);

  return (
    <div className="card p-6 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-brand-50 blur-3xl opacity-60" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-5">
              {isOngoing ? (
                <span className="badge bg-success/15 text-success">
                  <span className="relative flex items-center justify-center mr-0.5">
                    <span className="absolute w-2 h-2 rounded-full bg-success opacity-40 animate-ping" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
                  </span>
                  进行中
                </span>
              ) : (
                <span className="badge bg-brand-50 text-brand-500">
                  <CheckCircle className="w-3.5 h-3.5" />
                  已完成
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-ink-500 font-medium">会员</p>
                  <p className="font-display text-xl font-bold text-ink-900">{memberName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-accent-500" />
                </div>
                <div>
                  <p className="text-xs text-ink-500 font-medium">教练</p>
                  <p className="text-sm font-semibold text-ink-900">{coachName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center shrink-0">
            {isOngoing && (
              <div className="absolute inset-0 -m-3">
                <div className="w-full h-full rounded-3xl animate-pulse-ring" />
              </div>
            )}
            <div
              className={cn(
                'relative rounded-3xl p-6 md:p-8 min-w-[220px] text-center',
                isOngoing
                  ? 'bg-gradient-to-br from-emerald-500 via-success to-emerald-400 shadow-lift'
                  : 'bg-gradient-to-br from-brand-500 via-brand-400 to-brand-300 shadow-card'
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-2 text-white/80">
                {isOngoing ? (
                  <>
                    <Timer className="w-4 h-4 animate-pulse-slow" />
                    <span className="text-xs font-semibold uppercase tracking-wider">已用时长</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">总时长</span>
                  </>
                )}
              </div>
              <p className="font-mono text-5xl md:text-6xl font-bold text-white tracking-tight tabular-nums">
                {displayFormatted}
              </p>
              <p className="mt-2 text-xs text-white/70 font-medium">
                {minutes} 分钟
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink-500" />
              <span className="text-ink-500">开始:</span>
              <span className="font-medium text-ink-700">{formatDateTime(startTime)}</span>
            </div>
            {endTime && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-ink-500" />
                <span className="text-ink-500">结束:</span>
                <span className="font-medium text-ink-700">{formatDateTime(endTime)}</span>
              </div>
            )}
          </div>

          {!isOngoing ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              已消耗 1 课时
            </div>
          ) : onEnd ? (
            <button onClick={onEnd} className="btn-danger">
              结束课程
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
