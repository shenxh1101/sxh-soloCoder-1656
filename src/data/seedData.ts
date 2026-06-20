import type {
  Coach,
  Member,
  BodyMeasurement,
  ClassSession,
  TrainingPlan,
  PlanExercise,
} from '../shared/types';
import { genUUID, calcBMI } from '../utils/calculations';
import { todayISO, addDays, subtractMonths, formatDate } from '../utils/date';

const coachId1 = genUUID();
const coachId2 = genUUID();
const coachId3 = genUUID();

export const seedCoaches: Coach[] = [
  {
    id: coachId1,
    name: '李晨',
    phone: '13800138001',
    avatarUrl: '',
    createdAt: '2025-03-15',
    specialty: '增肌训练 / 体态矫正',
  },
  {
    id: coachId2,
    name: '王雅婷',
    phone: '13800138002',
    avatarUrl: '',
    createdAt: '2025-04-08',
    specialty: '产后恢复 / 减脂塑形',
  },
  {
    id: coachId3,
    name: '张大力',
    phone: '13800138003',
    avatarUrl: '',
    createdAt: '2025-05-20',
    specialty: '力量举 / 功能性训练',
  },
];

const mkMember = (
  name: string,
  phone: string,
  gender: '男' | '女',
  height: number,
  coachId: string,
  totalClasses: number,
  remainingClasses: number,
  joinOffset: number,
  lastCheckOffset: number | null,
  status: 'active' | 'warning' | 'inactive' | 'churned' = 'active'
): Member => ({
  id: genUUID(),
  name,
  phone,
  gender,
  height,
  joinDate: addDays(todayISO(), -joinOffset),
  coachId,
  totalClasses,
  remainingClasses,
  status,
  lastCheckIn: lastCheckOffset === null ? null : addDays(todayISO(), -lastCheckOffset),
  note: '',
});

export const seedMembers: Member[] = [
  mkMember('陈小明', '13900000001', '男', 178, coachId1, 48, 32, 90, 2, 'active'),
  mkMember('刘芳芳', '13900000002', '女', 165, coachId2, 36, 24, 120, 5, 'active'),
  mkMember('赵大伟', '13900000003', '男', 182, coachId3, 60, 2, 75, 3, 'warning'),
  mkMember('孙美琪', '13900000004', '女', 170, coachId2, 24, 1, 60, 1, 'warning'),
  mkMember('周建国', '13900000005', '男', 175, coachId1, 36, 0, 180, 15, 'inactive'),
  mkMember('吴晓燕', '13900000006', '女', 162, coachId1, 48, 18, 100, 32, 'active'),
  mkMember('郑浩然', '13900000007', '男', 180, coachId3, 72, 55, 45, 4, 'active'),
  mkMember('林诗涵', '13900000008', '女', 168, coachId2, 30, 12, 80, 8, 'active'),
  mkMember('黄子轩', '13900000009', '男', 172, coachId1, 24, 10, 30, 35, 'active'),
  mkMember('杨雪梅', '13900000010', '女', 158, coachId2, 12, 0, 200, 60, 'inactive'),
  mkMember('马俊豪', '13900000011', '男', 185, coachId3, 60, 40, 150, 10, 'active'),
  mkMember('徐丽娟', '13900000012', '女', 163, coachId1, 48, 3, 110, 2, 'warning'),
];

const mIds = seedMembers.map((m) => m.id);

const mkMeasure = (
  memberId: string,
  offsetDays: number,
  weight: number,
  height: number,
  bodyFat: number,
  extra?: Partial<BodyMeasurement>
): BodyMeasurement => ({
  id: genUUID(),
  memberId,
  measureDate: addDays(todayISO(), -offsetDays),
  weight,
  bodyFat,
  bmi: calcBMI(weight, height),
  chest: 95 + Math.random() * 8,
  waist: 82 + Math.random() * 10,
  hip: 96 + Math.random() * 6,
  thigh: 58 + Math.random() * 6,
  arm: 34 + Math.random() * 4,
  note: '',
  ...extra,
});

export const seedMeasurements: BodyMeasurement[] = [
  // 陈小明 - 6个月减重记录
  mkMeasure(mIds[0], 180, 85.0, 178, 26.0),
  mkMeasure(mIds[0], 150, 83.5, 178, 25.2),
  mkMeasure(mIds[0], 120, 82.0, 178, 24.5),
  mkMeasure(mIds[0], 90, 80.5, 178, 23.6),
  mkMeasure(mIds[0], 60, 79.0, 178, 22.8),
  mkMeasure(mIds[0], 30, 77.5, 178, 21.9),
  mkMeasure(mIds[0], 10, 76.3, 178, 21.0),

  // 刘芳芳
  mkMeasure(mIds[1], 120, 65.0, 165, 30.0),
  mkMeasure(mIds[1], 90, 63.8, 165, 29.0),
  mkMeasure(mIds[1], 60, 62.5, 165, 28.0),
  mkMeasure(mIds[1], 30, 61.2, 165, 27.0),
  mkMeasure(mIds[1], 7, 60.0, 165, 26.0),

  // 赵大伟
  mkMeasure(mIds[2], 90, 92.0, 182, 25.5),
  mkMeasure(mIds[2], 60, 90.5, 182, 24.8),
  mkMeasure(mIds[2], 30, 89.0, 182, 24.0),
  mkMeasure(mIds[2], 5, 88.0, 182, 23.2),

  // 孙美琪
  mkMeasure(mIds[3], 60, 58.0, 170, 25.0),
  mkMeasure(mIds[3], 30, 56.5, 170, 24.0),
  mkMeasure(mIds[3], 3, 55.0, 170, 23.0),

  // 郑浩然
  mkMeasure(mIds[6], 45, 80.0, 180, 16.0),
  mkMeasure(mIds[6], 30, 81.5, 180, 15.5),
  mkMeasure(mIds[6], 10, 83.0, 180, 15.0),

  // 吴晓燕
  mkMeasure(mIds[5], 100, 70.0, 162, 32.0),
  mkMeasure(mIds[5], 70, 69.0, 162, 31.0),
  mkMeasure(mIds[5], 40, 68.0, 162, 30.0),
  mkMeasure(mIds[5], 15, 67.0, 162, 29.0),
];

const mkSession = (
  memberId: string,
  coachId: string,
  dateOffset: number,
  startHour: number,
  durationMin: number
): ClassSession => {
  const date = addDays(todayISO(), -dateOffset);
  const start = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return {
    id: genUUID(),
    memberId,
    coachId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMin,
    classesConsumed: 1,
    status: 'completed',
  };
};

const sessions: ClassSession[] = [];
for (let i = 0; i < 60; i++) {
  const mi = i % seedMembers.length;
  const m = seedMembers[mi];
  sessions.push(
    mkSession(m.id, m.coachId, i + 1, 9 + (i % 6), 55 + ((i * 7) % 20))
  );
}

const todayClassOngoing: ClassSession = {
  id: genUUID(),
  memberId: mIds[0],
  coachId: coachId1,
  startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  durationMin: 0,
  classesConsumed: 0,
  status: 'ongoing',
};

export const seedSessions: ClassSession[] = [todayClassOngoing, ...sessions];

const weekDays: ('周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日')[] = [
  '周一', '周二', '周三', '周四', '周五', '周六', '周日',
];

const exercises = [
  { name: '深蹲', sets: 4, reps: 12, weight: 60, restSec: 90 },
  { name: '硬拉', sets: 4, reps: 10, weight: 80, restSec: 120 },
  { name: '卧推', sets: 4, reps: 10, weight: 50, restSec: 90 },
  { name: '引体向上', sets: 3, reps: 8, weight: 0, restSec: 90 },
  { name: '坐姿划船', sets: 3, reps: 12, weight: 40, restSec: 60 },
  { name: '杠铃推举', sets: 3, reps: 10, weight: 30, restSec: 75 },
  { name: '保加利亚分腿蹲', sets: 3, reps: 12, weight: 20, restSec: 60 },
  { name: '平板支撑', sets: 3, reps: 1, weight: 0, restSec: 45 },
  { name: '卷腹', sets: 3, reps: 20, weight: 0, restSec: 30 },
  { name: '高位下拉', sets: 3, reps: 12, weight: 35, restSec: 60 },
];

export const seedPlans: TrainingPlan[] = [];
export const seedPlanExercises: PlanExercise[] = [];

const mkPlanFor = (memberId: string, dayIdx: number, exRange: [number, number]) => {
  const plan: TrainingPlan = {
    id: genUUID(),
    memberId,
    weekDay: weekDays[dayIdx],
    active: true,
  };
  seedPlans.push(plan);
  for (let i = exRange[0]; i < exRange[1]; i++) {
    const ex = exercises[i % exercises.length];
    seedPlanExercises.push({
      id: genUUID(),
      planId: plan.id,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      restSec: ex.restSec,
      sortOrder: i - exRange[0],
    });
  }
};

mkPlanFor(mIds[0], 1, [0, 4]);
mkPlanFor(mIds[0], 3, [4, 8]);
mkPlanFor(mIds[0], 5, [2, 6]);

mkPlanFor(mIds[1], 1, [5, 9]);
mkPlanFor(mIds[1], 4, [0, 4]);
mkPlanFor(mIds[1], 6, [6, 10]);

mkPlanFor(mIds[2], 1, [0, 5]);
mkPlanFor(mIds[2], 3, [5, 10]);
mkPlanFor(mIds[2], 5, [0, 4]);

mkPlanFor(mIds[6], 2, [0, 4]);
mkPlanFor(mIds[6], 4, [4, 8]);
mkPlanFor(mIds[6], 6, [2, 7]);
