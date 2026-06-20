import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, CreditCard, Activity,
  Scale, Flame, Target, Trash2, Plus, History, Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BodyChart } from '@/components/ui/BodyChart';
import { PlanDayEditor } from '@/components/ui/PlanDayEditor';
import { MeasurementForm } from '@/components/forms/MeasurementForm';
import { useAppStore } from '@/store/useAppStore';
import { calcBMI, getWeightChange, getBodyFatChange, getMemberStatus } from '@/utils/calculations';
import { fmtWeight, fmtBodyFat, fmtBMI } from '@/utils/formatters';
import { formatDate, formatDateTime, getWeekDay } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { WeekDay, ClassSessionStatus, BodyMeasurement } from '@/shared/types';

type FSD = Omit<BodyMeasurement, 'id' | 'memberId' | 'bmi'>;

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'measurements', label: '体测记录', icon: Activity },
  { id: 'sessions', label: '课程历史', icon: Target },
  { id: 'plan', label: '训练计划', icon: Flame },
  { id: 'renewals', label: '续费记录', icon: Receipt },
];

const WDS: { id: WeekDay; label: string }[] = [
  { id: '周一', label: '周一' }, { id: '周二', label: '周二' }, { id: '周三', label: '周三' },
  { id: '周四', label: '周四' }, { id: '周五', label: '周五' }, { id: '周六', label: '周六' },
  { id: '周日', label: '周日' },
];

const SSM: Record<ClassSessionStatus, { c: string; l: string }> = {
  completed: { c: 'bg-green-50 text-success', l: '已完成' },
  ongoing: { c: 'bg-brand-50 text-brand-500', l: '进行中' },
  cancelled: { c: 'bg-red-50 text-danger', l: '已取消' },
  scheduled: { c: 'bg-ink-100 text-ink-500', l: '待开始' },
};

const MSM: Record<string, { c: string; l: string }> = {
  active: { c: 'bg-green-50 text-success', l: '活跃' },
  warning: { c: 'bg-amber-50 text-warning', l: '课时紧张' },
  churned: { c: 'bg-red-50 text-danger', l: '流失风险' },
  inactive: { c: 'bg-ink-100 text-ink-500', l: '未激活' },
};

const bmiLabel = (b: number | null) =>
  b === null ? '缺少数据' : b < 18.5 ? '偏瘦' : b < 24 ? '正常' : b < 28 ? '超重' : '肥胖';

export default function MemberDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const m = useAppStore((s) => s.getMemberById(id));
  const gC = useAppStore((s) => s.getCoachById);
  const gMM = useAppStore((s) => s.getMemberMeasurements);
  const gSM = useAppStore((s) => s.getSessionsByMember);
  const rC = useAppStore((s) => s.renewClasses);
  const sS = useAppStore((s) => s.startSession);
  const aM = useAppStore((s) => s.addMeasurement);
  const sessions = useAppStore((s) => s.sessions);
  const gRM = useAppStore((s) => s.getRenewalRecordsByMember);
  const renewalRecords = useMemo(() => gRM(id), [id, gRM]);
  const totalRenewedClasses = renewalRecords.reduce((s, r) => s + r.classesPurchased, 0);

  const [tab, setTab] = useState('measurements');
  const [dTab, setDTab] = useState<WeekDay>(getWeekDay() as WeekDay);
  const [showM, setShowM] = useState(false);
  const [showR, setShowR] = useState(false);
  const [amt, setAmt] = useState(20);

  const mss = useMemo(() => gMM(id), [id, gMM]);
  const ss = useMemo(() => gSM(id), [id, gSM]);
  const sMs = useMemo(
    () => [...mss].sort((a, b) => +new Date(b.measureDate) - +new Date(a.measureDate)),
    [mss]
  );
  const fm = mss[mss.length - 1], lm = mss[0];
  const wd = getWeightChange(mss), bfd = getBodyFatChange(mss);
  const bmi = lm && m ? calcBMI(lm.weight, m.height) : null;

  if (!m) return (
    <div className="card p-12 text-center animate-fade-up">
      <Target className="w-16 h-16 text-ink-300 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-ink-900 mb-2">会员不存在</h2>
      <button onClick={() => nav('/members')} className="btn-primary inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>
    </div>
  );

  const coach = gC(m.coachId);
  const cs = ss.filter((s) => s.status === 'completed');
  const tMin = cs.reduce((a, s) => a + s.durationMin, 0);
  const hasOg = sessions.some((s) => s.status === 'ongoing');
  const ms = MSM[getMemberStatus(m)] || MSM.inactive;
  const delM = (mid: string) => { if (confirm('确定删除?')) useAppStore.setState((s) => ({ measurements: s.measurements.filter((x) => x.id !== mid) })); };
  const onMS = (data: FSD) => { aM({ memberId: m.id, ...data }); setShowM(false); };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/members')} className="w-9 h-9 rounded-xl border border-ink-200 bg-white flex items-center justify-center hover:bg-ink-50 text-ink-600 shrink-0">
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <div className="text-xs text-ink-400">会员详情</div>
          <h1 className="text-lg font-bold text-ink-900">{m.name}</h1>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-lg font-bold">{m.name.slice(0, 1)}</div>
            <span className={cn('absolute -bottom-1 -right-1 badge text-[10px] px-1.5 py-0.5', ms.c)}>{ms.l}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-ink-900">{m.name}</h2>
              <span className="badge bg-brand-50 text-brand-500 text-xs">{m.gender}</span>
              <span className="badge bg-accent-50 text-accent-600 text-xs">{coach?.name || '未指派'}</span>
            </div>
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-ink-500">
              <span>{formatDate(m.joinDate)} · 📱 {m.phone}</span>
              {m.birthday && <span>🎂 {formatDate(m.birthday)}</span>}
            </div>
            {m.note && <p className="mt-2 text-sm text-ink-600 bg-ink-50 rounded-lg px-3 py-2">📝 {m.note}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowR(true)} className="btn-outline flex items-center gap-1.5 text-sm py-1"><CreditCard className="w-3.5 h-3.5" />续费</button>
            <button onClick={() => !hasOg && m.remainingClasses > 0 && sS(m.id)} disabled={hasOg || m.remainingClasses <= 0} className={cn('flex items-center gap-1.5 text-sm py-1', hasOg || m.remainingClasses <= 0 ? 'opacity-50 cursor-not-allowed bg-ink-200 text-ink-500' : 'btn-success')}><Play className="w-3.5 h-3.5" />{m.remainingClasses <= 0 ? '课时不足' : '上课'}</button>
            <button onClick={() => setShowM(true)} className="btn-primary flex items-center gap-1.5 text-sm py-1"><Plus className="w-3.5 h-3.5" />体测</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-ink-100">
          <div className="text-center"><p className="text-xs text-ink-500">剩余课时</p><p className="text-xl font-bold text-ink-900 tabular-nums mt-0.5">{m.remainingClasses}</p><p className="text-[11px] text-ink-400">已用 {m.totalClasses - m.remainingClasses}</p></div>
          <div className="text-center"><p className="text-xs text-ink-500">当前 BMI</p><p className="text-xl font-bold text-ink-900 tabular-nums mt-0.5">{bmi ? fmtBMI(bmi) : '--'}</p><p className="text-[11px] text-ink-400">{bmiLabel(bmi)}</p></div>
          <div className="text-center"><p className="text-xs text-ink-500">体重变化</p><p className="text-xl font-bold text-ink-900 tabular-nums mt-0.5">{fm ? fmtWeight(wd) : '--'}</p><p className="text-[11px] text-ink-400">{fm ? `${fmtWeight(fm.weight)}→${fmtWeight(lm?.weight)}` : '-'}</p></div>
          <div className="text-center"><p className="text-xs text-ink-500">体脂变化</p><p className="text-xl font-bold text-ink-900 tabular-nums mt-0.5">{fm ? fmtBodyFat(bfd) : '--'}</p><p className="text-[11px] text-ink-400">{fm ? `${fmtBodyFat(fm.bodyFat)}→${fmtBodyFat(lm?.bodyFat)}` : '-'}</p></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-3 border-b border-ink-100 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-px', tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-700')}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === 'measurements' && (
            <div className="space-y-4">
              <BodyChart measurements={mss} range="3M" />
              {sMs.length === 0 ? <div className="py-8 text-center text-ink-500 text-sm">暂无体测记录</div> : (
                <div className="overflow-x-auto rounded-xl border border-ink-100">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50"><tr className="text-xs text-ink-500">
                      <th className="text-left px-3 py-2 font-medium">日期</th><th className="text-right px-3 py-2 font-medium">体重</th><th className="text-right px-3 py-2 font-medium">体脂</th><th className="text-right px-3 py-2 font-medium">BMI</th><th className="text-right px-3 py-2 font-medium hidden md:table-cell">围度</th><th className="w-8"></th>
                    </tr></thead>
                    <tbody>{sMs.map((x) => (
                      <tr key={x.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                        <td className="px-3 py-2 font-medium">{formatDate(x.measureDate)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtWeight(x.weight)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtBodyFat(x.bodyFat)}</td>
                        <td className="px-3 py-2 text-right tabular-nums"><span className="badge bg-brand-50 text-brand-500">{fmtBMI(x.bmi)}</span></td>
                        <td className="px-3 py-2 text-right text-xs text-ink-500 tabular-nums hidden md:table-cell">{x.chest || '-'}/{x.waist || '-'}/{x.hip || '-'}</td>
                        <td className="px-2 py-2 text-center"><button onClick={() => delM(x.id)} className="w-7 h-7 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'sessions' && (
            <div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[{ l: '次数', v: cs.length, c: 'bg-brand-50 text-brand-700' }, { l: '分', v: tMin, c: 'bg-accent-50 text-accent-700' }, { l: '完成', v: cs.length, c: 'bg-green-50 text-success' }, { l: '总', v: ss.length, c: 'bg-ink-100 text-ink-700' }].map((x) => (
                  <div key={x.l} className={`${x.c} rounded-lg p-2 text-center`}><p className="text-[10px] opacity-70">{x.l}</p><p className="text-base font-bold tabular-nums">{x.v}</p></div>
                ))}
              </div>
              {ss.length === 0 ? <div className="py-8 text-center text-ink-500 text-sm">暂无课程记录</div> : (
                <div className="overflow-x-auto rounded-xl border border-ink-100">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50"><tr className="text-xs text-ink-500">
                      <th className="text-left px-3 py-2 font-medium">日期</th><th className="text-left px-3 py-2 font-medium">教练</th><th className="text-right px-3 py-2 font-medium">时长</th><th className="text-right px-3 py-2 font-medium">课时</th><th className="text-center px-3 py-2 font-medium">状态</th>
                    </tr></thead>
                    <tbody>{ss.slice(0, 30).map((s) => { const st = SSM[s.status] || SSM.scheduled; return (
                      <tr key={s.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                        <td className="px-3 py-2">{formatDateTime(s.startTime)}</td>
                        <td className="px-3 py-2">{gC(s.coachId)?.name || '--'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{s.durationMin}分</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-brand-600">{s.classesConsumed}</td>
                        <td className="px-3 py-2 text-center"><span className={cn('badge text-[10px]', st.c)}>{st.l}</span></td>
                      </tr>
                    ); })}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'plan' && (
            <div>
              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                {WDS.map((d) => (
                  <button key={d.id} onClick={() => setDTab(d.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0', dTab === d.id ? 'bg-brand-500 text-white shadow-sm' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}>{d.label}</button>
                ))}
              </div>
              <PlanDayEditor memberId={m.id} weekDay={dTab} />
            </div>
          )}
          {tab === 'renewals' && (
            <div>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-center">
                  <p className="text-[10px] text-brand-600 font-medium mb-1">续费次数</p>
                  <p className="font-display font-bold text-2xl text-brand-700">{renewalRecords.length}</p>
                </div>
                <div className="rounded-lg bg-accent-50 border border-accent-100 p-3 text-center">
                  <p className="text-[10px] text-accent-600 font-medium mb-1">累计续费课时</p>
                  <p className="font-display font-bold text-2xl text-accent-600">+{totalRenewedClasses}</p>
                </div>
                <div className="rounded-lg bg-ink-50 border border-ink-100 p-3 text-center">
                  <p className="text-[10px] text-ink-500 font-medium mb-1">历史总课时</p>
                  <p className="font-display font-bold text-2xl text-ink-900">{m.totalClasses}</p>
                </div>
              </div>
              {renewalRecords.length === 0 ? (
                <div className="py-12 text-center text-ink-500 text-sm">
                  <History className="w-10 h-10 text-ink-300 mx-auto mb-3" />
                  暂无续费记录
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-ink-100">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50"><tr className="text-xs text-ink-500">
                      <th className="text-left px-3 py-2 font-medium">续费时间</th>
                      <th className="text-right px-3 py-2 font-medium">续费课时</th>
                      <th className="text-left px-3 py-2 font-medium">操作入口</th>
                    </tr></thead>
                    <tbody>{renewalRecords.map((r) => (
                      <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                        <td className="px-3 py-2.5 text-ink-700 tabular-nums">{formatDateTime(r.purchaseDate)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="badge bg-emerald-50 text-success font-semibold">+{r.classesPurchased}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="badge bg-ink-100 text-ink-600">{
                            r.source === 'dashboard' ? '仪表盘快捷续费' :
                            r.source === 'member_detail' ? '会员详情页' :
                            r.source === 'reports' ? '统计报表' :
                            r.source === 'batch' ? '批量续费' : '手动续费'
                          }</span>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="card p-5 w-full max-w-5xl max-h-[90vh] overflow-auto animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <MeasurementForm memberId={m.id} onSubmit={onMS} onCancel={() => setShowM(false)} />
          </div>
        </div>
      )}
      {showR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowR(false)}>
          <div className="card p-5 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-ink-900 mb-3 flex items-center gap-2"><CreditCard className="w-4.5 h-4.5 text-brand-500" />续费课时</h3>
            <p className="text-sm text-ink-600 mb-4">当前剩余 <span className="font-bold text-brand-600">{m.remainingClasses}</span> 课时</p>
            <div className="mb-4">
              <label className="text-xs font-medium text-ink-600 mb-1 block">续费数量</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setAmt((a) => Math.max(1, a - 5))} className="btn-outline w-9">-5</button>
                <input type="number" value={amt} onChange={(e) => setAmt(Math.max(0, parseInt(e.target.value) || 0))} className="input-base text-center flex-1 font-bold text-lg" />
                <button onClick={() => setAmt((a) => a + 5)} className="btn-outline w-9">+5</button>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 20, 30, 50].map((n) => (
                  <button key={n} onClick={() => setAmt(n)} className={cn('flex-1 py-1 rounded-lg text-xs font-medium', amt === n ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}>{n}节</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowR(false)} className="btn-outline flex-1">取消</button>
              <button onClick={() => { if (amt > 0) { rC(m.id, amt, 'member_detail'); setShowR(false); } }} className="btn-primary flex-1">确认 +{amt}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
