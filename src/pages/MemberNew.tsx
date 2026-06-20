import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Activity, Scale, Percent, Info, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calcBMI } from '@/utils/calculations';
import { fmtBMI, fmtWeight, fmtBodyFat } from '@/utils/formatters';
import { todayISO } from '@/utils/date';
import { cn } from '@/lib/utils';

interface FS {
  name: string; phone: string; gender: '男' | '女'; height: number;
  birthday: string; joinDate: string; coachId: string; totalClasses: number;
  initialWeight?: number; initialBodyFat?: number; note: string;
}

const bmiCat = (b: number) =>
  b <= 0 ? { l: '--', c: 'text-ink-400', bg: 'bg-ink-100' } :
  b < 18.5 ? { l: '偏瘦', c: 'text-blue-600', bg: 'bg-blue-50' } :
  b < 24 ? { l: '正常', c: 'text-success', bg: 'bg-emerald-50' } :
  b < 28 ? { l: '偏胖', c: 'text-warning', bg: 'bg-amber-50' } :
  { l: '肥胖', c: 'text-danger', bg: 'bg-red-50' };

const pkg = (n: number) =>
  n === 0 ? { l: '体验', c: 'bg-ink-100 text-ink-600' } :
  n < 12 ? { l: '基础', c: 'bg-brand-50 text-brand-600' } :
  n < 36 ? { l: '进阶', c: 'bg-accent-50 text-accent-600' } :
  { l: '尊享', c: 'bg-amber-50 text-amber-600' };

export default function MemberNew() {
  const nav = useNavigate();
  const addMember = useAppStore((s) => s.addMember);
  const coaches = useAppStore((s) => s.coaches);

  const [form, setForm] = useState<FS>({
    name: '', phone: '', gender: '男', height: 170,
    birthday: '', joinDate: todayISO(),
    coachId: coaches[0]?.id || '', totalClasses: 0, note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sf = <K extends keyof FS>(k: K, v: FS[K]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const sn = (k: keyof FS, raw: string) => {
    const n = raw === '' ? undefined : Number(raw);
    sf(k, (k === 'height' || k === 'totalClasses' ? n ?? 0 : n) as never);
  };

  const bmi = useMemo(() => calcBMI(form.initialWeight ?? 0, form.height),
    [form.initialWeight, form.height]);
  const bc = bmiCat(bmi);
  const cnCoach = coaches.find((c) => c.id === form.coachId)?.name || '--';
  const pkgL = pkg(form.totalClasses);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '请输入姓名';
    if (!/^\d{11}$/.test(form.phone)) e.phone = '请输入11位手机号';
    if (form.height <= 0) e.height = '身高>0';
    if (form.totalClasses < 0) e.totalClasses = '课时≥0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const m = addMember({
      name: form.name, phone: form.phone, gender: form.gender,
      height: form.height, coachId: form.coachId, totalClasses: form.totalClasses,
      joinDate: form.joinDate, birthday: form.birthday || undefined,
      note: form.note || undefined,
      initialWeight: form.initialWeight, initialBodyFat: form.initialBodyFat,
    });
    nav(`/members/${m.id}`);
  };

  return (
    <div className="space-y-5 p-6 animate-fade-up">
      <button onClick={() => nav('/members')} className="btn-outline">
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white shadow-lg">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">新增会员</h1>
          <p className="text-ink-500 text-sm">填写信息并保存</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h2 className="text-base font-semibold">基本信息</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">姓名</label>
                <input type="text" className="input-base" value={form.name}
                  onChange={(e) => sf('name', e.target.value)} placeholder="姓名" />
                {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="input-label">手机号</label>
                <input type="tel" className="input-base" value={form.phone}
                  onChange={(e) => sf('phone', e.target.value)} maxLength={11} placeholder="11位手机号" />
                {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="input-label">性别</label>
                <div className="flex gap-5 pt-1.5">
                  {(['男', '女'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gd" value={g} checked={form.gender === g}
                        onChange={() => sf('gender', g)} className="w-4 h-4 text-brand-500" />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">身高(cm)</label>
                <input type="number" className="input-base" value={form.height}
                  onChange={(e) => sn('height', e.target.value)} min={1} />
                {errors.height && <p className="text-danger text-xs mt-1">{errors.height}</p>}
              </div>
              <div>
                <label className="input-label">生日</label>
                <input type="date" className="input-base" value={form.birthday}
                  onChange={(e) => sf('birthday', e.target.value)} />
              </div>
              <div>
                <label className="input-label">入会日期</label>
                <input type="date" className="input-base" value={form.joinDate}
                  onChange={(e) => sf('joinDate', e.target.value)} />
              </div>
              <div>
                <label className="input-label">所属教练</label>
                <select className="input-base" value={form.coachId}
                  onChange={(e) => sf('coachId', e.target.value)}>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">购买课时</label>
                <input type="number" className="input-base" value={form.totalClasses}
                  onChange={(e) => sn('totalClasses', e.target.value)} min={0} />
                {errors.totalClasses && <p className="text-danger text-xs mt-1">{errors.totalClasses}</p>}
              </div>
              <div>
                <label className="input-label">初始体重(kg)</label>
                <input type="number" className="input-base" value={form.initialWeight ?? ''}
                  onChange={(e) => sn('initialWeight', e.target.value)} step="0.1" min={0} placeholder="可选" />
              </div>
              <div>
                <label className="input-label">初始体脂(%)</label>
                <input type="number" className="input-base" value={form.initialBodyFat ?? ''}
                  onChange={(e) => sn('initialBodyFat', e.target.value)} step="0.1" min={0} max={100} placeholder="可选" />
              </div>
            </div>
            <div>
              <label className="input-label">备注</label>
              <textarea className="input-base resize-none" rows={2} value={form.note}
                onChange={(e) => sf('note', e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-outline" onClick={() => nav('/members')}>取消</button>
              <button type="submit" className="btn-primary">确认新增</button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-success" />
              <h2 className="text-sm font-semibold">BMI 参考</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="p-2 rounded-lg bg-ink-50 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-ink-400" />
                <span className="text-sm font-semibold">{fmtWeight(form.initialWeight)}</span>
              </div>
              <div className="p-2 rounded-lg bg-ink-50 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-ink-400" />
                <span className="text-sm font-semibold">{fmtBodyFat(form.initialBodyFat)}</span>
              </div>
            </div>
            <div className={cn('p-3 rounded-xl text-center', bc.bg)}>
              <p className="font-bold text-3xl leading-none">{fmtBMI(bmi)}</p>
              <span className={cn('inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full', bc.c)}>
                {bc.l}
              </span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-accent-600" />
              <h2 className="text-sm font-semibold">套餐提示</h2>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0',
                  form.gender === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600')}>
                  {form.name ? form.name.charAt(0) : '新'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{form.name || '新会员'}</p>
                  <p className="text-xs text-ink-500 truncate">{form.phone || '待填写手机号'}</p>
                </div>
                <span className={cn('badge border shrink-0 text-xs', pkgL.c)}>{pkgL.l}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-ink-50 border border-ink-100">
                  <p className="text-xs text-ink-500">身高</p>
                  <p className="font-semibold text-sm">{form.height}cm</p>
                </div>
                <div className="p-2 rounded-lg bg-ink-50 border border-ink-100">
                  <p className="text-xs text-ink-500">教练</p>
                  <p className="font-semibold text-sm truncate">{cnCoach}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-ink-500 font-medium">课时</p>
                  <p className="text-xs font-bold text-brand-600">{form.totalClasses}节</p>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-accent-500 rounded-full"
                    style={{ width: `${Math.min(100, form.totalClasses * 2)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold">填写建议</h2>
            </div>
            <div className="space-y-2 text-xs text-ink-600 leading-relaxed">
              <p>• 首次测量体重体脂建立基线</p>
              <p>• 24节约3个月，48节适合长期</p>
              <p>• 可随时在详情页变更教练</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
