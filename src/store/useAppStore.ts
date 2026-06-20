import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Coach,
  Member,
  BodyMeasurement,
  ClassSession,
  TrainingPlan,
  PlanExercise,
  MemberStatus,
  WeekDay,
  RenewalRecord,
} from '../shared/types';
import {
  seedCoaches,
  seedMembers,
  seedMeasurements,
  seedSessions,
  seedPlans,
  seedPlanExercises,
} from '../data/seedData';
import { calcBMI, genUUID, getMemberStatus } from '../utils/calculations';
import { nowISO, todayISO, formatDate } from '../utils/date';

interface NewMemberInput {
  name: string;
  phone: string;
  gender: '男' | '女';
  height: number;
  coachId: string;
  totalClasses: number;
  joinDate?: string;
  birthday?: string;
  note?: string;
  initialWeight?: number;
  initialBodyFat?: number;
}

interface NewMeasurementInput {
  memberId: string;
  weight: number;
  bodyFat: number;
  chest?: number;
  waist?: number;
  hip?: number;
  thigh?: number;
  arm?: number;
  note?: string;
  measureDate?: string;
}

interface NewExerciseInput {
  planId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSec: number;
  note?: string;
}

interface AppState {
  coaches: Coach[];
  members: Member[];
  measurements: BodyMeasurement[];
  sessions: ClassSession[];
  plans: TrainingPlan[];
  planExercises: PlanExercise[];
  renewalRecords: RenewalRecord[];
  activeSessionId: string | null;
  currentCoachId: string;
  searchKeyword: string;
  currentPage: string;

  addMember: (input: NewMemberInput) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  renewClasses: (memberId: string, extraClasses: number) => void;

  addMeasurement: (input: NewMeasurementInput) => BodyMeasurement;
  getMemberMeasurements: (memberId: string) => BodyMeasurement[];

  startSession: (memberId: string, coachId?: string) => ClassSession;
  endSession: (sessionId: string) => ClassSession | null;
  getOngoingSession: () => ClassSession | undefined;

  getOrCreatePlan: (memberId: string, weekDay: WeekDay) => TrainingPlan;
  addExerciseToPlan: (input: NewExerciseInput) => PlanExercise;
  updateExercise: (id: string, patch: Partial<PlanExercise>) => void;
  removeExercise: (id: string) => void;
  reorderExercises: (planId: string, orderedIds: string[]) => void;
  setPlanActive: (planId: string, active: boolean) => void;
  getPlanByDay: (memberId: string, weekDay: WeekDay) => TrainingPlan | undefined;
  getPlanExercises: (planId: string) => PlanExercise[];
  getMemberPlanExercisesByDay: (memberId: string, weekDay: WeekDay) => PlanExercise[];

  setSearchKeyword: (k: string) => void;
  setCurrentPage: (p: string) => void;
  setCurrentCoachId: (id: string) => void;

  getCoachById: (id: string) => Coach | undefined;
  getMemberById: (id: string) => Member | undefined;
  getMembersByCoach: (coachId: string) => Member[];
  getSessionsByMember: (memberId: string) => ClassSession[];
  getSessionsByCoach: (coachId: string) => ClassSession[];

  acknowledgeAllAlerts: () => void;

  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      coaches: seedCoaches,
      members: seedMembers,
      measurements: seedMeasurements,
      sessions: seedSessions,
      plans: seedPlans,
      planExercises: seedPlanExercises,
      renewalRecords: [],
      activeSessionId: seedSessions.find((s) => s.status === 'ongoing')?.id || null,
      currentCoachId: seedCoaches[0]?.id || '',
      searchKeyword: '',
      currentPage: '/',

      addMember: (input) => {
        const member: Member = {
          id: genUUID(),
          name: input.name,
          phone: input.phone,
          gender: input.gender,
          height: input.height,
          joinDate: input.joinDate || todayISO(),
          coachId: input.coachId,
          totalClasses: input.totalClasses,
          remainingClasses: input.totalClasses,
          status: input.totalClasses > 0 ? 'active' : 'inactive',
          lastCheckIn: null,
          birthday: input.birthday,
          note: input.note || '',
        };
        let measurements = get().measurements;
        if (input.initialWeight && input.initialBodyFat) {
          const m: BodyMeasurement = {
            id: genUUID(),
            memberId: member.id,
            measureDate: todayISO(),
            weight: input.initialWeight,
            bodyFat: input.initialBodyFat,
            bmi: calcBMI(input.initialWeight, input.height),
          };
          measurements = [...measurements, m];
        }
        set({ members: [...get().members, member], measurements });
        return member;
      },

      updateMember: (id, patch) => {
        const members = get().members.map((m) => {
          if (m.id !== id) return m;
          const updated = { ...m, ...patch };
          updated.status = getMemberStatus(updated);
          return updated;
        });
        set({ members });
      },

      removeMember: (id) => {
        set({
          members: get().members.filter((m) => m.id !== id),
          measurements: get().measurements.filter((m) => m.memberId !== id),
          sessions: get().sessions.filter((s) => s.memberId !== id),
          plans: get().plans.filter((p) => p.memberId !== id),
        });
      },

      renewClasses: (memberId, extraClasses) => {
        const members = get().members.map((m) => {
          if (m.id !== memberId) return m;
          const totalClasses = m.totalClasses + extraClasses;
          const remainingClasses = m.remainingClasses + extraClasses;
          return {
            ...m,
            totalClasses,
            remainingClasses,
            status: getMemberStatus({ ...m, totalClasses, remainingClasses }),
          };
        });
        const record: RenewalRecord = {
          id: genUUID(),
          memberId,
          purchaseDate: todayISO(),
          classesPurchased: extraClasses,
        };
        set({
          members,
          renewalRecords: [...get().renewalRecords, record],
        });
      },

      addMeasurement: (input) => {
        const member = get().getMemberById(input.memberId);
        const m: BodyMeasurement = {
          id: genUUID(),
          memberId: input.memberId,
          measureDate: input.measureDate || todayISO(),
          weight: input.weight,
          bodyFat: input.bodyFat,
          bmi: calcBMI(input.weight, member?.height || 170),
          chest: input.chest,
          waist: input.waist,
          hip: input.hip,
          thigh: input.thigh,
          arm: input.arm,
          note: input.note,
        };
        set({ measurements: [...get().measurements, m] });
        return m;
      },

      getMemberMeasurements: (memberId) =>
        get()
          .measurements.filter((m) => m.memberId === memberId)
          .sort((a, b) => new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()),

      startSession: (memberId, coachId) => {
        const member = get().getMemberById(memberId);
        if (!member || member.remainingClasses <= 0) return null as unknown as ClassSession;
        const cid = coachId || get().currentCoachId;
        const existingOngoing = get().sessions.find(
          (s) => s.status === 'ongoing' && s.coachId === cid
        );
        if (existingOngoing) {
          return existingOngoing;
        }
        const session: ClassSession = {
          id: genUUID(),
          memberId,
          coachId: cid,
          startTime: nowISO(),
          durationMin: 0,
          classesConsumed: 0,
          status: 'ongoing',
        };
        set({ sessions: [...get().sessions, session], activeSessionId: session.id });
        return session;
      },

      endSession: (sessionId) => {
        let ended: ClassSession | null = null;
        const sessions = get().sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const end = nowISO();
          const startT = new Date(s.startTime).getTime();
          const endT = new Date(end).getTime();
          const durationMin = Math.max(1, Math.round((endT - startT) / 60000));
          ended = {
            ...s,
            endTime: end,
            durationMin,
            classesConsumed: 1,
            status: 'completed',
          };
          return ended;
        });
        let members = get().members;
        if (ended) {
          members = members.map((m) => {
            if (m.id !== ended!.memberId) return m;
            const remaining = Math.max(0, m.remainingClasses - 1);
            const updated = {
              ...m,
              remainingClasses: remaining,
              lastCheckIn: todayISO(),
            };
            updated.status = getMemberStatus(updated);
            return updated;
          });
        }
        set({
          sessions,
          members,
          activeSessionId: get().activeSessionId === sessionId ? null : get().activeSessionId,
        });
        return ended;
      },

      getOngoingSession: () =>
        get().sessions.find((s) => s.status === 'ongoing'),

      getOrCreatePlan: (memberId, weekDay) => {
        let plan = get().plans.find((p) => p.memberId === memberId && p.weekDay === weekDay);
        if (plan) return plan;
        plan = {
          id: genUUID(),
          memberId,
          weekDay,
          active: true,
        };
        set({ plans: [...get().plans, plan] });
        return plan;
      },

      addExerciseToPlan: (input) => {
        const existing = get().planExercises.filter((e) => e.planId === input.planId);
        const ex: PlanExercise = {
          id: genUUID(),
          planId: input.planId,
          name: input.name,
          sets: input.sets,
          reps: input.reps,
          weight: input.weight,
          restSec: input.restSec,
          note: input.note,
          sortOrder: existing.length,
        };
        set({ planExercises: [...get().planExercises, ex] });
        return ex;
      },

      updateExercise: (id, patch) => {
        set({
          planExercises: get().planExercises.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        });
      },

      removeExercise: (id) => {
        const list = get().planExercises.filter((e) => e.id !== id);
        const target = get().planExercises.find((e) => e.id === id);
        if (target) {
          const siblings = list
            .filter((e) => e.planId === target.planId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          siblings.forEach((s, idx) => {
            const idx0 = list.findIndex((x) => x.id === s.id);
            if (idx0 >= 0) list[idx0] = { ...list[idx0], sortOrder: idx };
          });
        }
        set({ planExercises: list });
      },

      reorderExercises: (planId, orderedIds) => {
        set({
          planExercises: get().planExercises.map((e) => {
            if (e.planId !== planId) return e;
            const idx = orderedIds.indexOf(e.id);
            return idx >= 0 ? { ...e, sortOrder: idx } : e;
          }),
        });
      },

      setPlanActive: (planId, active) => {
        set({
          plans: get().plans.map((p) => (p.id === planId ? { ...p, active } : p)),
        });
      },

      getPlanByDay: (memberId, weekDay) =>
        get().plans.find((p) => p.memberId === memberId && p.weekDay === weekDay && p.active),

      getPlanExercises: (planId) =>
        get()
          .planExercises.filter((e) => e.planId === planId)
          .sort((a, b) => a.sortOrder - b.sortOrder),

      getMemberPlanExercisesByDay: (memberId, weekDay) => {
        const plan = get().getPlanByDay(memberId, weekDay);
        if (!plan) return [];
        return get().getPlanExercises(plan.id);
      },

      setSearchKeyword: (k) => set({ searchKeyword: k }),
      setCurrentPage: (p) => set({ currentPage: p }),
      setCurrentCoachId: (id) => set({ currentCoachId: id }),

      getCoachById: (id) => get().coaches.find((c) => c.id === id),
      getMemberById: (id) => get().members.find((m) => m.id === id),
      getMembersByCoach: (coachId) => get().members.filter((m) => m.coachId === coachId),
      getSessionsByMember: (memberId) =>
        get()
          .sessions.filter((s) => s.memberId === memberId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
      getSessionsByCoach: (coachId) =>
        get()
          .sessions.filter((s) => s.coachId === coachId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),

      acknowledgeAllAlerts: () => {},

      resetAll: () => {
        set({
          coaches: seedCoaches,
          members: seedMembers,
          measurements: seedMeasurements,
          sessions: seedSessions,
          plans: seedPlans,
          planExercises: seedPlanExercises,
          renewalRecords: [],
          activeSessionId: seedSessions.find((s) => s.status === 'ongoing')?.id || null,
          currentCoachId: seedCoaches[0]?.id || '',
          searchKeyword: '',
          currentPage: '/',
        });
      },
    }),
    {
      name: 'gym-app-state',
      partialize: (s) => ({
        coaches: s.coaches,
        members: s.members,
        measurements: s.measurements,
        sessions: s.sessions,
        plans: s.plans,
        planExercises: s.planExercises,
        renewalRecords: s.renewalRecords,
        activeSessionId: s.activeSessionId,
        currentCoachId: s.currentCoachId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.coaches.length === 0) {
          state.coaches = seedCoaches;
          state.members = seedMembers;
          state.measurements = seedMeasurements;
          state.sessions = seedSessions;
          state.plans = seedPlans;
          state.planExercises = seedPlanExercises;
          state.currentCoachId = seedCoaches[0]?.id || '';
        }
      },
    }
  )
);
