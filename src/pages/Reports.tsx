import { useState, useMemo } from 'react';
import {
  CalendarDays,
  TrendingUp,
  Users,
  AlertTriangle,
  Phone,
  UserCheck,
  RefreshCcw,
  PieChart as PieChartIcon,
  Filter,
  Receipt,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { StatBarChart } from '@/components/ui/StatBarChart';
import { DataCard } from '@/components/ui/DataCard';
import { getCoachStats, isChurnRisk } from '@/utils/calculations';
import { formatDate, formatDateTime, todayISO, addDays, daysSince } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Member } from '@/shared/types';

type ReportTab = 'coach' | 'renewal' | 'churn';
type RangeKey = 'month' | 'quarter' | 'year' | 'custom';
type ChurnFilter = 'all' | 'high' | 'dormant' | 'normal';

const RENEWAL_TARGET = 75;

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('coach');
  const coaches = useAppStore((s) => s.coaches);
  const members = useAppStore((s) => s.members);
  const sessions = useAppStore((s) => s.sessions);
  const renewalRecords = useAppStore((s) => s.renewalRecords);
  const getCoachById = useAppStore((s) => s.getCoachById);
  const renewClasses = useAppStore((s) => s.renewClasses);
  const batchRenewClasses = useAppStore((s) => s.batchRenewClasses);

  const [rangeKey, setRangeKey] = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [churnFilter, setChurnFilter] = useState<ChurnFilter>('all');
  const [selectedRenewIds, setSelectedRenewIds] = useState<Set<string>>(new Set());
  const [batchAmt, setBatchAmt] = useState(20);
  const [batchNote, setBatchNote] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);

  const range = useMemo(() => {
    const today = todayISO();
    const t = new Date();
    if (rangeKey === 'month') {
      return {
        start: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`,
        end: today,
      };
    }
    if (rangeKey === 'quarter') {
      const qm = Math.floor(t.getMonth() / 3) * 3;
      return {
        start: `${t.getFullYear()}-${String(qm + 1).padStart(2, '0')}-01`,
        end: today,
      };
    }
    if (rangeKey === 'year') {
      return { start: `${t.getFullYear()}-01-01`, end: today };
    }
    return { start: customStart || today, end: customEnd || today };
  }, [rangeKey, customStart, customEnd]);

  const coachStats = useMemo(
    () => getCoachStats(coaches, members, sessions, range.start, range.end),
    [coaches, members, sessions, range]
  );

  const prevRange = useMemo(() => {
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000
      )
    );
    return { start: addDays(range.start, -days), end: addDays(range.start, -1) };
  }, [range]);

  const prevStats = useMemo(
    () => getCoachStats(coaches, members, sessions, prevRange.start, prevRange.end),
    [coaches, members, sessions, prevRange]
  );

  const barData = coachStats.map((s) => ({
    name: s.coachName,
    课时数: s.totalClasses,
    活跃会员: s.activeMembers,
  }));

  const renewalData = useMemo(() => {
    const months: { name: string; rate: number; renewed: number; expired: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const monthStart = formatDate(d, 'YYYY-MM-DD');
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthEnd = formatDate(next, 'YYYY-MM-DD');
      const s = new Date(monthStart).getTime();
      const e = new Date(monthEnd + ' 23:59:59').getTime();

      const renewedMemberIds = new Set(
        renewalRecords
          .filter((r) => {
            const rt = new Date(r.purchaseDate).getTime();
            return rt >= s && rt <= e;
          })
          .map((r) => r.memberId)
      );
      const renewed = renewedMemberIds.size;

      const stillLowEndOfMonth = members.filter(
        (m) =>
          !renewedMemberIds.has(m.id) &&
          m.remainingClasses > 0 &&
          m.remainingClasses <= 3
      ).length;

      const expiringTotal = renewed + Math.max(0, stillLowEndOfMonth);

      months.push({
        name: formatDate(monthStart, 'MM月'),
        rate: expiringTotal > 0 ? Math.round((renewed / expiringTotal) * 100) : 0,
        renewed,
        expired: expiringTotal,
      });
    }
    return months;
  }, [members, renewalRecords]);

  const periodRenewals = useMemo(() => {
    const s = new Date(range.start + ' 00:00:00').getTime();
    const e = new Date(range.end + ' 23:59:59').getTime();
    return renewalRecords.filter((r) => {
      const rt = new Date(r.purchaseDate).getTime();
      return rt >= s && rt <= e;
    });
  }, [renewalRecords, range]);

  const periodRenewalSummary = useMemo(() => {
    const s = new Date(range.start + ' 00:00:00').getTime();
    const e = new Date(range.end + ' 23:59:59').getTime();
    const renewedMemberIds = new Set(
      renewalRecords
        .filter((r) => {
          const rt = new Date(r.purchaseDate).getTime();
          return rt >= s && rt <= e;
        })
        .map((r) => r.memberId)
    );
    const renewed = renewedMemberIds.size;
    const stillLow = members.filter(
      (m) =>
        !renewedMemberIds.has(m.id) &&
        m.remainingClasses > 0 &&
        m.remainingClasses <= 3
    ).length;
    const expiringTotal = renewed + stillLow;
    const rate = expiringTotal > 0 ? Math.round((renewed / expiringTotal) * 100) : 0;
    const totalClasses = periodRenewals.reduce((sum, r) => sum + r.classesPurchased, 0);
    return { rate, renewed, expired: expiringTotal, count: periodRenewals.length, totalClasses };
  }, [renewalRecords, members, range, periodRenewals]);

  const totalRenewalCount = renewalRecords.length;
  const totalRenewalClasses = renewalRecords.reduce((s, r) => s + r.classesPurchased, 0);

  const renewalSummary = useMemo(() => {
    const totalRenewed = renewalData.reduce((s, m) => s + m.renewed, 0);
    const totalExpired = renewalData.reduce((s, m) => s + m.expired, 0);
    const rate = totalExpired > 0 ? Math.round((totalRenewed / totalExpired) * 100) : 0;
    return { rate, renewed: totalRenewed, expired: totalExpired };
  }, [renewalData]);

  const toRenew = useMemo(
    () =>
      members
        .filter((m) => m.remainingClasses > 0 && m.remainingClasses <= 3)
        .sort((a, b) => a.remainingClasses - b.remainingClasses),
    [members]
  );

  const churnList: (Member & { daysSinceLast: number; risk: 'high' | 'dormant' | 'normal' })[] =
    useMemo(() => {
      const all = members.map((m) => {
        const days = m.lastCheckIn ? daysSince(m.lastCheckIn) : daysSince(m.joinDate);
        const neverChecked = !m.lastCheckIn;
        let level: 'high' | 'dormant' | 'normal' = 'normal';
        if (isChurnRisk(m)) level = 'high';
        else if (days >= 15) level = 'dormant';
        return { ...m, daysSinceLast: days, neverChecked, risk: level };
      });
      if (churnFilter !== 'all') return all.filter((x) => x.risk === churnFilter);
      return all.sort((a, b) => b.daysSinceLast - a.daysSinceLast);
    }, [members, churnFilter]);

  const churnPie = useMemo(() => {
    let high = 0;
    let dormant = 0;
    let normal = 0;
    members.forEach((m) => {
      if (isChurnRisk(m)) high++;
      else {
        const d = m.lastCheckIn ? daysSince(m.lastCheckIn) : daysSince(m.joinDate);
        if (d >= 15) dormant++;
        else normal++;
      }
    });
    return [
      { name: '流失风险', value: high, color: '#EF4444' },
      { name: '休眠预警', value: dormant, color: '#F59E0B' },
      { name: '活跃', value: normal, color: '#10B981' },
    ];
  }, [members]);

  const renderCoachTab = () => (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="section-title">数据范围</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              {range.start} 至 {range.end}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['month', 'quarter', 'year', 'custom'] as RangeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setRangeKey(k)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  rangeKey === k
                    ? 'bg-brand-gradient text-white shadow-soft'
                    : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                )}
              >
                {k === 'month' ? '本月' : k === 'quarter' ? '本季' : k === 'year' ? '本年' : '自定义'}
              </button>
            ))}
          </div>
        </div>
        {rangeKey === 'custom' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">开始日期</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="input-label">结束日期</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
        )}
      </div>
      <StatBarChart data={barData} title="教练课时统计" height={300} />
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100">
          <h3 className="section-title">教练详情</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-ink-50">
              <tr>
                {['教练', '总课时', '活跃会员', '人均课时', '环比'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {coachStats.map((s, i) => {
                const ps = prevStats[i];
                const delta =
                  ps?.totalClasses
                    ? Math.round(((s.totalClasses - ps.totalClasses) / ps.totalClasses) * 100)
                    : 0;
                return (
                  <tr key={s.coachId} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-600 text-sm font-semibold">
                          {s.coachName[0]}
                        </div>
                        <span className="font-medium text-ink-900">{s.coachName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{s.totalClasses}</td>
                    <td className="px-5 py-3 text-ink-700">{s.activeMembers}</td>
                    <td className="px-5 py-3 text-ink-700">{s.avgClassesPerMember}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'font-semibold text-sm',
                          delta > 0
                            ? 'text-success'
                            : delta < 0
                            ? 'text-danger'
                            : 'text-ink-500'
                        )}
                      >
                        {delta > 0 ? '+' : ''}
                        {delta}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRenewalTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataCard
          title="续费率"
          value={`${periodRenewalSummary.rate}%`}
          icon={TrendingUp}
          color="success"
        />
        <DataCard
          title="续费人数"
          value={periodRenewalSummary.renewed}
          icon={RefreshCcw}
          color="brand"
        />
        <DataCard
          title="续费次数"
          value={periodRenewalSummary.count}
          icon={Receipt as typeof TrendingUp}
          color="accent"
        />
        <DataCard
          title="累计续费课时"
          value={periodRenewalSummary.totalClasses}
          icon={Users}
          color="warning"
        />
      </div>
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="section-title">续费率趋势</h3>
          <p className="text-sm text-ink-500 mt-0.5">近 6 个月变化，参考线 {RENEWAL_TARGET}% · 口径：当月续费人数 /（续费人数 + 月底仍待续费人数）</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={renewalData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="renewLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                dataKey="name"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine
                y={RENEWAL_TARGET}
                stroke="#EF4444"
                strokeDasharray="6 4"
                label={{
                  value: '目标 75%',
                  fill: '#EF4444',
                  fontSize: 11,
                  position: 'right',
                }}
              />
              <Tooltip
                formatter={(v: number, name) => {
                  if (name === '续费率') return [`${v}%`, name];
                  return [v, name];
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="续费率"
                stroke="url(#renewLine)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#10B981',
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="section-title flex items-center gap-2">
              待续费会员
              <span className="badge bg-warning/15 text-warning text-[10px] font-medium">剩余课时 ≤ 3</span>
            </h3>
            <p className="text-sm text-ink-500 mt-0.5">
              {toRenew.length} 人待跟进 · 已选 {selectedRenewIds.size} 人
            </p>
          </div>
          {selectedRenewIds.size > 0 && (
            <button onClick={() => setShowBatchModal(true)} className="btn-accent">
              <RefreshCcw className="w-4 h-4" />
              <span>批量续费 {selectedRenewIds.size} 人</span>
            </button>
          )}
        </div>
        {toRenew.length === 0 ? (
          <div className="p-10 text-center text-ink-500">暂无待续费会员 🎉</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {toRenew.map((m) => {
              const coach = getCoachById(m.coachId);
              const checked = selectedRenewIds.has(m.id);
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-ink-50/50',
                    checked && 'bg-amber-50/40'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <label className="shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const n = new Set(selectedRenewIds);
                          e.target.checked ? n.add(m.id) : n.delete(m.id);
                          setSelectedRenewIds(n);
                        }}
                        className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
                      />
                    </label>
                    <div className="w-10 h-10 rounded-xl bg-brand-200 flex items-center justify-center text-brand-600 font-semibold">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">{m.name}</p>
                      <p className="text-sm text-ink-500">
                        {coach?.name || '—'} · 总{m.totalClasses}课时
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={cn(
                          'font-display font-bold text-lg',
                          m.remainingClasses <= 2
                            ? 'text-danger'
                            : 'text-warning'
                        )}
                      >
                        {m.remainingClasses}
                      </span>
                      <span className="text-sm text-ink-500 ml-1">剩余</span>
                    </div>
                    <button
                      onClick={() => renewClasses(m.id, 24, 'reports')}
                      className="btn-primary !py-2 !px-3"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span className="text-xs">续费</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100">
          <h3 className="section-title flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-500" />
            续费记录明细
            <span className="ml-auto text-xs font-normal text-ink-500">当前周期共 {periodRenewals.length} 条 · {periodRenewalSummary.totalClasses} 课时</span>
          </h3>
        </div>
        {periodRenewals.length === 0 ? (
          <div className="p-10 text-center text-ink-500">
          周期内暂无续费记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-ink-50">
                <tr>
                  {['会员', '续费时间', '课时数', '入口', '教练'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {[...periodRenewals]
                  .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                  .slice(0, 50)
                  .map((r) => {
                    const mb = members.find((x) => x.id === r.memberId);
                    const cb = mb ? getCoachById(mb.coachId) : undefined;
                    return (
                      <tr key={r.id} className="hover:bg-ink-50/50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-semibold text-xs">
                              {mb?.name?.[0] || '?'}
                            </div>
                            <span className="font-medium text-ink-900 text-sm">{mb?.name || '已删除会员'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-ink-700 tabular-nums">{formatDateTime(r.purchaseDate)}</td>
                        <td className="px-5 py-3">
                          <span className="badge bg-emerald-50 text-success font-semibold">+{r.classesPurchased}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="badge bg-ink-100 text-ink-600 text-[10px]">
                            {r.source === 'dashboard' ? '仪表盘' :
                             r.source === 'member_detail' ? '会员详情' :
                             r.source === 'reports' ? '统计报表' :
                             r.source === 'batch' ? '批量续费' : '手动'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-ink-600">{cb?.name || '—'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowBatchModal(false)}>
          <div className="card p-5 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
              <RefreshCcw className="w-4.5 h-4.5 text-brand-500" />
              批量续费 {selectedRenewIds.size} 人
            </h3>
            <p className="text-sm text-ink-600 mb-4">
              共 <span className="font-bold text-brand-600">{selectedRenewIds.size}</span> 位会员，每人续费 <span className="font-bold text-brand-600">{batchAmt}</span> 课时
            </p>
            <div className="mb-4">
              <label className="input-label">每人续费数量</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setBatchAmt((a) => Math.max(1, a - 5))} className="btn-outline w-9">-5</button>
                <input type="number" value={batchAmt} onChange={(e) => setBatchAmt(Math.max(0, parseInt(e.target.value) || 0))} className="input-base text-center flex-1 font-bold text-lg" />
                <button onClick={() => setBatchAmt((a) => a + 5)} className="btn-outline w-9">+5</button>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 20, 30, 50].map((n) => (
                  <button key={n} onClick={() => setBatchAmt(n)} className={cn('flex-1 py-1 rounded-lg text-xs font-medium', batchAmt === n ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}>{n}节</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="input-label">跟进备注 <span className="text-ink-400 font-normal text-[11px]">可选 · 同步到会员续费记录</span></label>
              <textarea
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                placeholder="例：618活动续20节赠2节 / 老客户续费率..."
                rows={3}
                className="input-base resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowBatchModal(false); setBatchNote(''); }} className="btn-outline flex-1">取消</button>
              <button
                onClick={() => {
                  if (batchAmt > 0 && selectedRenewIds.size > 0) {
                    batchRenewClasses(Array.from(selectedRenewIds), batchAmt, 'batch', batchNote || undefined);
                    setSelectedRenewIds(new Set());
                    setBatchNote('');
                    setShowBatchModal(false);
                  }
                }}
                className="btn-primary flex-1"
              >
                确认 +{batchAmt}×{selectedRenewIds.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderChurnTab = () => (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="section-title flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-500" />
                流失风险筛选
              </h3>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { k: 'all', l: '全部' },
                    { k: 'high', l: '流失风险(≥30天)' },
                    { k: 'dormant', l: '休眠(≥15天)' },
                    { k: 'normal', l: '正常' },
                  ] as { k: ChurnFilter; l: string }[]
                ).map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setChurnFilter(f.k)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      churnFilter === f.k
                        ? 'bg-brand-gradient text-white shadow-soft'
                        : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                    )}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-ink-100 max-h-[480px] overflow-y-auto scrollbar-thin">
              {churnList.length === 0 ? (
                <div className="py-10 text-center text-ink-500">无匹配会员</div>
              ) : (
                churnList.map((m) => {
                  const coach = getCoachById(m.coachId);
                  const riskLabel = m.risk === 'high' ? '高' : m.risk === 'dormant' ? '中' : '低';
                  const riskCls =
                    m.risk === 'high'
                      ? 'bg-red-100 text-red-600'
                      : m.risk === 'dormant'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700';
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-ink-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-brand-200 flex items-center justify-center text-brand-600 font-semibold">
                          {m.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">{m.name}</p>
                          <p className="text-sm text-ink-500 truncate">
                            {coach?.name || '—'} · 最后打卡: {m.lastCheckIn || '从未'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={cn('badge', riskCls)}>{riskLabel}风险</span>
                        <button className="btn-ghost !py-2 !px-2">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="btn-outline !py-2 !px-2">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="md:w-80 shrink-0">
          <div className="card p-5 h-full">
            <h3 className="section-title flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-brand-500" />
              会员状态分布
            </h3>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={churnPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {churnPie.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {churnPie.map((e) => (
                <div key={e.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: e.color }}
                    />
                    <span className="text-ink-700">{e.name}</span>
                  </div>
                  <span className="font-semibold text-ink-900">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs: { k: ReportTab; label: string; icon: typeof CalendarDays }[] = [
    { k: 'coach', label: '教练课时', icon: CalendarDays },
    { k: 'renewal', label: '续费率', icon: RefreshCcw },
    { k: 'churn', label: '流失风险', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="flex border-b border-ink-100 overflow-x-auto scrollbar-thin p-1 md:p-2 gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-gradient text-white shadow-soft'
                    : 'text-ink-700 hover:bg-ink-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {activeTab === 'coach' && renderCoachTab()}
      {activeTab === 'renewal' && renderRenewalTab()}
      {activeTab === 'churn' && renderChurnTab()}
    </div>
  );
}
