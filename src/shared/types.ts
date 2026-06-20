export type UUID = string;

export type MemberStatus = 'active' | 'warning' | 'inactive' | 'churned';

export type ClassSessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type WeekDay = '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';

export interface Coach {
  id: UUID;
  name: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
  specialty?: string;
}

export interface Member {
  id: UUID;
  name: string;
  phone: string;
  gender: '男' | '女';
  height: number;
  joinDate: string;
  coachId: UUID;
  totalClasses: number;
  remainingClasses: number;
  status: MemberStatus;
  lastCheckIn: string | null;
  avatarUrl?: string;
  birthday?: string;
  note?: string;
}

export interface BodyMeasurement {
  id: UUID;
  memberId: UUID;
  measureDate: string;
  weight: number;
  bodyFat: number;
  bmi: number;
  chest?: number;
  waist?: number;
  hip?: number;
  thigh?: number;
  arm?: number;
  note?: string;
}

export interface ClassSession {
  id: UUID;
  memberId: UUID;
  coachId: UUID;
  startTime: string;
  endTime?: string;
  durationMin: number;
  classesConsumed: number;
  status: ClassSessionStatus;
  note?: string;
}

export interface TrainingPlan {
  id: UUID;
  memberId: UUID;
  coachId: UUID;
  weekDay: WeekDay;
  createdAt: string;
  active: boolean;
}

export interface PlanExercise {
  id: UUID;
  planId: UUID;
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  restSec: number;
  note?: string;
  sortOrder: number;
}

export interface RenewalRecord {
  id: UUID;
  memberId: UUID;
  purchaseDate: string;
  classesPurchased: number;
  amount?: number;
  source?: 'dashboard' | 'member_detail' | 'reports' | 'batch';
  followUpNote?: string;
}

export interface AlertItem {
  id: UUID;
  type: 'low_classes' | 'churn_risk';
  memberId: UUID;
  memberName: string;
  message: string;
  createdAt: string;
  acknowledged?: boolean;
}

export interface CoachStat {
  coachId: UUID;
  coachName: string;
  totalClasses: number;
  activeMembers: number;
  avgClassesPerMember: number;
}

export type ChartRange = '1M' | '3M' | '6M' | 'ALL';
