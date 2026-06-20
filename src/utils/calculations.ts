import { daysSince } from './date';
import type {
  Member,
  BodyMeasurement,
  ClassSession,
  Coach,
  CoachStat,
  MemberStatus,
  RenewalRecord,
} from '../shared/types';

const CHURN_DAYS = 30;

export const isChurnRisk = (member: Member): boolean => {
  if (member.lastCheckIn) {
    return daysSince(member.lastCheckIn) >= CHURN_DAYS;
  }
  return daysSince(member.joinDate) >= CHURN_DAYS;
};

export const calcBMI = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

export const getMemberStatus = (member: Member): MemberStatus => {
  if (isChurnRisk(member)) return 'churned';
  if (member.remainingClasses <= 0) return 'inactive';
  if (member.remainingClasses <= 3) return 'warning';
  return 'active';
};

export const isLowClasses = (member: Member): boolean =>
  member.remainingClasses > 0 && member.remainingClasses <= 3;

export const getCoachStats = (
  coaches: Coach[],
  members: Member[],
  sessions: ClassSession[],
  startDate?: string,
  endDate?: string
): CoachStat[] => {
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate + ' 23:59:59').getTime() : Infinity;

  return coaches.map((coach) => {
    const coachMembers = members.filter((m) => m.coachId === coach.id);
    const filteredSessions = sessions.filter(
      (s) =>
        s.coachId === coach.id &&
        s.status === 'completed' &&
        new Date(s.startTime).getTime() >= start &&
        new Date(s.startTime).getTime() <= end
    );
    const totalClasses = filteredSessions.reduce((sum, s) => sum + s.classesConsumed, 0);
    const activeMembers = coachMembers.filter((m) => m.status !== 'inactive').length;
    const avgClassesPerMember =
      coachMembers.length > 0 ? Number((totalClasses / coachMembers.length).toFixed(1)) : 0;
    return {
      coachId: coach.id,
      coachName: coach.name,
      totalClasses,
      activeMembers,
      avgClassesPerMember,
    };
  });
};

export const calcRenewalRate = (
  members: Member[],
  startDate: string,
  endDate: string,
  renewalRecords: RenewalRecord[] = []
): { rate: number; renewed: number; expired: number } => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + ' 23:59:59').getTime();

  let expiredCount = 0;

  members.forEach((m) => {
    const joinT = new Date(m.joinDate).getTime();
    if (joinT >= start && joinT <= end) {
      expiredCount += 1;
    }
  });

  const renewedSet = new Set(
    renewalRecords
      .filter((r) => {
        const rt = new Date(r.purchaseDate).getTime();
        return rt >= start && rt <= end;
      })
      .map((r) => r.memberId)
  );
  const renewedCount = renewedSet.size;

  const rate = expiredCount > 0 ? Number(((renewedCount / expiredCount) * 100).toFixed(1)) : 0;
  return { rate, renewed: renewedCount, expired: expiredCount };
};

export const getWeightChange = (measurements: BodyMeasurement[]): number => {
  if (measurements.length < 2) return 0;
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return Number((last.weight - first.weight).toFixed(1));
};

export const getBodyFatChange = (measurements: BodyMeasurement[]): number => {
  if (measurements.length < 2) return 0;
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return Number((last.bodyFat - first.bodyFat).toFixed(1));
};

export const genUUID = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
