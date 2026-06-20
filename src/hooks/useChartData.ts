import { useMemo } from 'react';
import type { BodyMeasurement, ChartRange, ClassSession, CoachStat } from '../shared/types';
import { subtractMonths, todayISO, formatDate } from '../utils/date';

export const useChartData = (measurements: BodyMeasurement[], range: ChartRange) => {
  return useMemo(() => {
    const cutoff =
      range === 'ALL'
        ? '0000-01-01'
        : range === '1M'
        ? subtractMonths(todayISO(), 1)
        : range === '3M'
        ? subtractMonths(todayISO(), 3)
        : subtractMonths(todayISO(), 6);

    const filtered = measurements
      .filter((m) => m.measureDate >= cutoff)
      .sort((a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime());

    return filtered.map((m) => ({
      date: formatDate(m.measureDate, 'MM/DD'),
      fullDate: m.measureDate,
      weight: m.weight,
      bodyFat: m.bodyFat,
      bmi: m.bmi,
    }));
  }, [measurements, range]);
};

export const useMonthlyClasses = (sessions: ClassSession[], months = 6) => {
  return useMemo(() => {
    const result: { month: string; classes: number }[] = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const classes = sessions.filter(
        (s) =>
          s.status === 'completed' &&
          s.startTime.startsWith(ym)
      ).length;
      result.push({ month: `${d.getMonth() + 1}月`, classes });
    }
    return result;
  }, [sessions, months]);
};

export const useCoachBarData = (stats: CoachStat[]) => {
  return useMemo(() => {
    return [...stats]
      .sort((a, b) => b.totalClasses - a.totalClasses)
      .map((s) => ({
        name: s.coachName,
        课时数: s.totalClasses,
        活跃会员: s.activeMembers,
      }));
  }, [stats]);
};
