import { useState, useEffect } from 'react';
import type { Member } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/utils/date';

interface MemberFormProps {
  initialData?: Member;
  onSubmit: (data: MemberFormInput) => void;
  onCancel?: () => void;
}

export interface MemberFormInput {
  name: string;
  phone: string;
  gender: '男' | '女';
  height: number;
  birthday?: string;
  joinDate: string;
  coachId: string;
  totalClasses: number;
  initialWeight?: number;
  initialBodyFat?: number;
  note?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  height?: string;
  totalClasses?: string;
}

export default function MemberForm({ initialData, onSubmit, onCancel }: MemberFormProps) {
  const coaches = useAppStore((s) => s.coaches);

  const [form, setForm] = useState<MemberFormInput>({
    name: '',
    phone: '',
    gender: '男',
    height: 170,
    birthday: '',
    joinDate: todayISO(),
    coachId: coaches[0]?.id || '',
    totalClasses: 0,
    initialWeight: undefined,
    initialBodyFat: undefined,
    note: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        phone: initialData.phone,
        gender: initialData.gender,
        height: initialData.height,
        birthday: initialData.birthday || '',
        joinDate: initialData.joinDate,
        coachId: initialData.coachId,
        totalClasses: initialData.totalClasses,
        note: initialData.note || '',
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!/^\d{11}$/.test(form.phone)) {
      newErrors.phone = '请输入11位手机号';
    }
    if (form.height <= 0) {
      newErrors.height = '身高必须大于0';
    }
    if (form.totalClasses < 0) {
      newErrors.totalClasses = '课时数不能为负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const handleChange = <K extends keyof MemberFormInput>(key: K, value: MemberFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="input-label">姓名</label>
          <input
            type="text"
            className="input-base"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入姓名"
          />
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="input-label">手机号</label>
          <input
            type="tel"
            className="input-base"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="请输入11位手机号"
            maxLength={11}
          />
          {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="input-label">性别</label>
          <div className="flex gap-6 pt-2">
            {(['男', '女'] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => handleChange('gender', g)}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-300"
                />
                <span className="text-sm text-ink-700">{g}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">身高 (cm)</label>
          <input
            type="number"
            className="input-base"
            value={form.height}
            onChange={(e) => handleChange('height', Number(e.target.value))}
            min={1}
          />
          {errors.height && <p className="text-danger text-xs mt-1">{errors.height}</p>}
        </div>

        <div>
          <label className="input-label">生日</label>
          <input
            type="date"
            className="input-base"
            value={form.birthday || ''}
            onChange={(e) => handleChange('birthday', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="input-label">入会日期</label>
          <input
            type="date"
            className="input-base"
            value={form.joinDate}
            onChange={(e) => handleChange('joinDate', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label">所属教练</label>
          <select
            className="input-base"
            value={form.coachId}
            onChange={(e) => handleChange('coachId', e.target.value)}
          >
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">购买课时数</label>
          <input
            type="number"
            className="input-base"
            value={form.totalClasses}
            onChange={(e) => handleChange('totalClasses', Number(e.target.value))}
            min={0}
          />
          {errors.totalClasses && <p className="text-danger text-xs mt-1">{errors.totalClasses}</p>}
        </div>

        {!initialData && (
          <>
            <div>
              <label className="input-label">初始体重 (kg)</label>
              <input
                type="number"
                className="input-base"
                value={form.initialWeight ?? ''}
                onChange={(e) =>
                  handleChange(
                    'initialWeight',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                step="0.1"
                min={0}
                placeholder="可选"
              />
            </div>

            <div>
              <label className="input-label">初始体脂率 (%)</label>
              <input
                type="number"
                className="input-base"
                value={form.initialBodyFat ?? ''}
                onChange={(e) =>
                  handleChange(
                    'initialBodyFat',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                step="0.1"
                min={0}
                max={100}
                placeholder="可选"
              />
            </div>
          </>
        )}
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
          {initialData ? '保存修改' : '确认新增'}
        </button>
      </div>
    </form>
  );
}
