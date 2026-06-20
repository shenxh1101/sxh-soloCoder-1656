import { useState } from 'react';
import { Plus, Trash2, Dumbbell, ListPlus } from 'lucide-react';
import type { UUID, WeekDay, PlanExercise } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface PlanDayEditorProps {
  memberId: UUID;
  weekDay: WeekDay;
}

interface EditingState {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSec: number;
}

const defaultExercise: EditingState = {
  name: '',
  sets: 4,
  reps: 12,
  weight: 0,
  restSec: 60,
};

const presetExercises = [
  '平板卧推', '硬拉', '深蹲', '高位下拉', '坐姿划船',
  '肩推', '二头弯举', '三头下压', '腿举', '罗马尼亚硬拉',
];

export function PlanDayEditor({ memberId, weekDay }: PlanDayEditorProps) {
  const exercises = useAppStore((s) => s.getMemberPlanExercisesByDay(memberId, weekDay));
  const getOrCreatePlan = useAppStore((s) => s.getOrCreatePlan);
  const addExerciseToPlan = useAppStore((s) => s.addExerciseToPlan);
  const updateExercise = useAppStore((s) => s.updateExercise);
  const removeExercise = useAppStore((s) => s.removeExercise);

  const [showAdd, setShowAdd] = useState(false);
  const [newEx, setNewEx] = useState<EditingState>(defaultExercise);

  const handleAdd = () => {
    if (!newEx.name.trim()) return;
    const plan = getOrCreatePlan(memberId, weekDay);
    addExerciseToPlan({
      planId: plan.id,
      name: newEx.name.trim(),
      sets: newEx.sets,
      reps: newEx.reps,
      weight: newEx.weight,
      restSec: newEx.restSec,
    });
    setNewEx(defaultExercise);
    setShowAdd(false);
  };

  const handleUpdate = (id: UUID, patch: Partial<PlanExercise>) => {
    updateExercise(id, patch);
  };

  const handleRemove = (id: UUID) => {
    removeExercise(id);
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h3 className="section-title">{weekDay}训练计划</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              共 {exercises.length} 个动作
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className={cn(
            'btn-primary',
            showAdd && 'hidden'
          )}
        >
          <Plus className="w-4 h-4" />
          新增动作
        </button>
      </div>

      {showAdd && (
        <div className="mb-5 p-4 rounded-xl bg-brand-50/60 border border-brand-100 animate-fade-in">
          <p className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
            <ListPlus className="w-4 h-4" />
            添加新动作
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="input-label">动作名称</label>
              <input
                type="text"
                list="exercise-suggestions"
                value={newEx.name}
                onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
                placeholder="如：平板卧推"
                className="input-base"
              />
              <datalist id="exercise-suggestions">
                {presetExercises.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">组数</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newEx.sets}
                onChange={(e) => setNewEx({ ...newEx, sets: Math.max(1, Number(e.target.value) || 0) })}
                className="input-base"
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">次数</label>
              <input
                type="number"
                min={1}
                max={100}
                value={newEx.reps}
                onChange={(e) => setNewEx({ ...newEx, reps: Math.max(1, Number(e.target.value) || 0) })}
                className="input-base"
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">重量 kg</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={newEx.weight}
                onChange={(e) => setNewEx({ ...newEx, weight: Math.max(0, Number(e.target.value) || 0) })}
                className="input-base"
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">休息秒</label>
              <input
                type="number"
                min={0}
                step={10}
                value={newEx.restSec}
                onChange={(e) => setNewEx({ ...newEx, restSec: Math.max(0, Number(e.target.value) || 0) })}
                className="input-base"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setShowAdd(false);
                setNewEx(defaultExercise);
              }}
              className="btn-outline"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!newEx.name.trim()}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              确认添加
            </button>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-ink-300" />
          </div>
          <p className="text-ink-700 font-medium">该日暂无训练安排</p>
          <p className="text-sm text-ink-500 mt-1">点击上方添加动作</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold text-ink-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">动作名称</div>
            <div className="col-span-2">组 × 次</div>
            <div className="col-span-2">重量</div>
            <div className="col-span-2">休息</div>
            <div className="col-span-1" />
          </div>

          {exercises.map((ex, idx) => (
            <div
              key={ex.id}
              className="grid grid-cols-6 md:grid-cols-12 gap-2 md:gap-3 items-center p-3 md:p-4 rounded-xl bg-ink-50/60 border border-ink-100 hover:bg-ink-50 hover:border-ink-200 transition-colors"
            >
              <div className="col-span-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500 text-white text-xs font-bold">
                  {idx + 1}
                </span>
              </div>

              <div className="col-span-5 md:col-span-4">
                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => handleUpdate(ex.id, { name: e.target.value })}
                  className="w-full bg-transparent border-none outline-none font-semibold text-ink-900 text-sm focus:bg-white focus:rounded-md focus:px-2 focus:py-1 focus:ring-2 focus:ring-brand-200 transition-all"
                />
              </div>

              <div className="col-span-6 md:col-span-2 flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => handleUpdate(ex.id, { sets: Math.max(1, Number(e.target.value) || 0) })}
                  className="w-12 md:w-14 text-center px-1 py-1.5 rounded-md bg-white border border-ink-200 text-sm font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <span className="text-ink-500 font-bold">×</span>
                <input
                  type="number"
                  min={1}
                  value={ex.reps}
                  onChange={(e) => handleUpdate(ex.id, { reps: Math.max(1, Number(e.target.value) || 0) })}
                  className="w-12 md:w-14 text-center px-1 py-1.5 rounded-md bg-white border border-ink-200 text-sm font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div className="col-span-3 md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={ex.weight}
                    onChange={(e) => handleUpdate(ex.id, { weight: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 rounded-md bg-white border border-ink-200 text-sm font-semibold text-ink-900 text-right focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <span className="ml-1.5 text-xs text-ink-500 font-medium">kg</span>
                </div>
              </div>

              <div className="col-span-2 md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={ex.restSec}
                    onChange={(e) => handleUpdate(ex.id, { restSec: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 rounded-md bg-white border border-ink-200 text-sm font-semibold text-ink-900 text-right focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <span className="ml-1.5 text-xs text-ink-500 font-medium">s</span>
                </div>
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => handleRemove(ex.id)}
                  className="p-2 rounded-lg text-ink-500 hover:text-danger hover:bg-red-50 transition-colors"
                  title="删除动作"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
