import { useState, useEffect, useMemo } from 'react';
import type { BodyMeasurement } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { calcBMI } from '@/utils/calculations';
import { todayISO } from '@/utils/date';
import { Activity, Scale, Percent, Info } from 'lucide-react';

export interface MeasurementInputData {
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

interface MeasurementFormProps {
  memberId: string;
  onSubmit: (data: MeasurementInputData) => void;
  onCancel?: () => void;
  initial?: BodyMeasurement;
}

interface FormData {
  measureDate: string;
  weight: number;
  bodyFat: number;
  chest?: number;
  waist?: number;
  hip?: number;
  thigh?: number;
  arm?: number;
  note?: string;
}

const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi <= 0) return { label: '--', color: 'text-ink-500' };
  if (bmi < 18.5) return { label: '偏瘦', color: 'text-blue-500' };
  if (bmi < 24) return { label: '正常', color: 'text-success' };
  if (bmi < 28) return { label: '偏胖', color: 'text-warning' };
  return { label: '肥胖', color: 'text-danger' };
};

export function MeasurementForm({ memberId, onSubmit, onCancel, initial }: MeasurementFormProps) {
  const member = useAppStore((s) => s.getMemberById(memberId));

  const [form, setForm] = useState<FormData>({
    measureDate: todayISO(),
    weight: 0,
    bodyFat: 0,
    chest: undefined,
    waist: undefined,
    hip: undefined,
    thigh: undefined,
    arm: undefined,
    note: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        measureDate: initial.measureDate,
        weight: initial.weight,
        bodyFat: initial.bodyFat,
        chest: initial.chest,
        waist: initial.waist,
        hip: initial.hip,
        thigh: initial.thigh,
        arm: initial.arm,
        note: initial.note || '',
      });
    }
  }, [initial]);

  const height = member?.height || 0;

  const bmi = useMemo(() => {
    if (!form.weight || !height) return 0;
    return calcBMI(form.weight, height);
  }, [form.weight, height]);

  const bmiCategory = getBMICategory(bmi);

  const handleChange = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumChange = (key: keyof FormData, raw: string) => {
    const num = raw === '' ? undefined : Number(raw);
    if (key === 'weight' || key === 'bodyFat') {
      handleChange(key, (num ?? 0) as never);
    } else {
      handleChange(key, num as never);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weight || !form.bodyFat) return;

    onSubmit({
      weight: form.weight,
      bodyFat: form.bodyFat,
      chest: form.chest,
      waist: form.waist,
      hip: form.hip,
      thigh: form.thigh,
      arm: form.arm,
      note: form.note,
      measureDate: form.measureDate,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="input-label">测量日期</label>
            <input
              type="date"
              className="input-base"
              value={form.measureDate}
              onChange={(e) => handleChange('measureDate', e.target.value)}
            />
          </div>
          <div />

          <div>
            <label className="input-label">
              <Scale className="inline w-4 h-4 mr-1 -mt-0.5" />
              体重 (kg) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="input-base"
              value={form.weight || ''}
              onChange={(e) => handleNumChange('weight', e.target.value)}
              step="0.1"
              min={0}
              placeholder="请输入体重"
              required
            />
          </div>

          <div>
            <label className="input-label">
              <Percent className="inline w-4 h-4 mr-1 -mt-0.5" />
              体脂率 (%) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="input-base"
              value={form.bodyFat || ''}
              onChange={(e) => handleNumChange('bodyFat', e.target.value)}
              step="0.1"
              min={0}
              max={100}
              placeholder="请输入体脂率"
              required
            />
          </div>

          <div>
            <label className="input-label">胸围 (cm)</label>
            <input
              type="number"
              className="input-base"
              value={form.chest ?? ''}
              onChange={(e) => handleNumChange('chest', e.target.value)}
              step="0.1"
              min={0}
              placeholder="可选"
            />
          </div>

          <div>
            <label className="input-label">腰围 (cm)</label>
            <input
              type="number"
              className="input-base"
              value={form.waist ?? ''}
              onChange={(e) => handleNumChange('waist', e.target.value)}
              step="0.1"
              min={0}
              placeholder="可选"
            />
          </div>

          <div>
            <label className="input-label">臀围 (cm)</label>
            <input
              type="number"
              className="input-base"
              value={form.hip ?? ''}
              onChange={(e) => handleNumChange('hip', e.target.value)}
              step="0.1"
              min={0}
              placeholder="可选"
            />
          </div>

          <div>
            <label className="input-label">大腿围 (cm)</label>
            <input
              type="number"
              className="input-base"
              value={form.thigh ?? ''}
              onChange={(e) => handleNumChange('thigh', e.target.value)}
              step="0.1"
              min={0}
              placeholder="可选"
            />
          </div>

          <div>
            <label className="input-label">手臂围 (cm)</label>
            <input
              type="number"
              className="input-base"
              value={form.arm ?? ''}
              onChange={(e) => handleNumChange('arm', e.target.value)}
              step="0.1"
              min={0}
              placeholder="可选"
            />
          </div>
        </div>

        <div>
          <label className="input-label">备注</label>
          <textarea
            className="input-base resize-none"
            rows={3}
            value={form.note || ''}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="备注信息..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button type="button" className="btn-outline" onClick={onCancel}>
              取消
            </button>
          )}
          <button type="submit" className="btn-primary">
            保存体测
          </button>
        </div>
      </form>

      <div className="lg:col-span-1">
        <div className="card p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-brand-500" />
            <h3 className="section-title">实时 BMI 计算</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-ink-100">
              <span className="text-sm text-ink-500">身高</span>
              <span className="font-medium text-ink-900">{height ? `${height} cm` : '--'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ink-100">
              <span className="text-sm text-ink-500">体重</span>
              <span className="font-medium text-ink-900">{form.weight ? `${form.weight} kg` : '--'}</span>
            </div>
          </div>

          <div className="mt-6 p-5 rounded-xl bg-ink-50 text-center">
            <div className="text-xs text-ink-500 mb-2">当前 BMI</div>
            <div className="text-5xl font-display font-bold text-ink-900 mb-2">
              {bmi || '--'}
            </div>
            <div className={`text-sm font-semibold ${bmiCategory.color}`}>
              {bmiCategory.label}
            </div>
          </div>

          <div className="mt-5 p-4 rounded-lg bg-brand-50 border border-brand-100">
            <div className="flex gap-2 start">
              <Info className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-ink-600 leading-relaxed">
                <p className="font-medium text-brand-600 mb-1">BMI 参考范围</p>
                <p>偏瘦：{'<'}18.5</p>
                <p>正常：18.5 ~ 24</p>
                <p>偏胖：24 ~ 28</p>
                <p>肥胖：{'>'}28</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
