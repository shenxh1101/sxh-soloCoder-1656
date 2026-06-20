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
import { getCoachStats } from '@/utils/calculations';
import { formatDate, todayISO, addDays, daysSince } from '@/utils/date';
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
  const getCoachById = useAppStore((s) => s.getCoachById);
  const renewClasses = useAppStore((s) => s.renewClasses);

  const [rangeKey, setRangeKey] = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [churnFilter, setChurnFilter] = useState<ChurnFilter>('all');

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
      let expired = 0;
      let renewed = 0;
      members.forEach((m) => {
        const jt = new Date(m.joinDate).getTime();
        const s = new Date(monthStart).getTime();
        const e = new Date(monthEnd + ' 23:59:59').getTime();
        if (jt >= s && jt <= e) {
          expired++;
          if (m.totalClasses > 0 && m.remainingClasses < m.totalClasses) renewed++;
        }
      });
      months.push({
        name: formatDate(monthStart, 'MM月'),
        rate: expired > 0 ? Math.round((renewed / expired) * 100) : 0,
        renewed,
        expired,
      });
    }
    return months;
  }, [members]);

  const renewalSummary = useMemo(() => {
    const totalRenewed = renewalData.reduce((s, m) => s + m.renewed, 0);
    const totalExpired = renewalData.reduce((s, m) => s + m.expired, 0);
    const rate = totalExpired > 0 ? Math.round((totalRenewed / totalExpired) * 100) : 0;
    return { rate, renewed: totalRenewed, expired: totalExpired };
  }, [renewalData]);

  const toRenew = useMemo(
    () =>
      members
        .filter((m) => m.remainingClasses > 0 && m.remainingClasses <= 5)
        .sort((a, b) => a.remainingClasses - b.remainingClasses),
    [members]
  );

  const churnList: (Member & { daysSinceLast: number; risk: 'high' | 'dormant' | 'normal' })[] =
    useMemo(() => {
      const all = members.map((m) => {
        const days = m.lastCheckIn ? daysSince(m.lastCheckIn) : 9999;
        let level: 'high' | 'dormant' | 'normal' = 'normal';
        if (days >= 30) level = 'high';
        else if (days >= 15) level = 'dormant';
        return { ...m, daysSinceLast: days, risk: level };
      });
      if (churnFilter !== 'all') return all.filter((x) => x.risk === churnFilter);
      return all.sort((a, b) => b.daysSinceLast - a.daysSinceLast);
    }, [members, churnFilter]);

  const churnPie = useMemo(() => {
    let high = 0;
    let dormant = 0;
    let normal = 0;
    members.forEach((m) => {
      const d = m.lastCheckIn ? daysSince(m.lastCheckIn) : 9999;
      if (d >= 30) high++;
      else if (d >= 15) dormant++;
      else normal++;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard
          title="续费率"
          value={`${renewalSummary.rate}%`}
          icon={TrendingUp}
          color="success"
        />
        <DataCard
          title="续费人数"
          value={renewalSummary.renewed}
          icon={RefreshCcw}
          color="brand"
        />
        <DataCard
          title="到期人数"
          value={renewalSummary.expired}
          icon={Users}
          color="warning"
        />
      </div>
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="section-title">续费率趋势</h3>
          <p className="text-sm text-ink-500 mt-0.5">近 6 个月变化，参考线 {RENEWAL_TARGET}%</p>
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
              <Tooltip formatter={(v: number) => [`${v}%`, '续费率']} />
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
        <div className="p-5 border-b border-ink-100">
          <h3 className="section-title">待续费会员</h3>
          <p className="text-sm text-ink-500 mt-0.5">剩余课时 ≤ 5</p>
        </div>
        {toRenew.length === 0 ? (
          <div className="p-10 text-center text-ink-500">暂无待续费会员</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {toRenew.map((m) => {
              const coach = getCoachById(m.coachId);
              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-ink-50/50"
                >
                  <div className="flex items-center gap-3">
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
                            : m.remainingClasses <= 3
                            ? 'text-warning'
                            : 'text-ink-900'
                        )}
                      >
                        {m.remainingClasses}
                      </span>
                      <span className="text-sm text-ink-500 ml-1">剩余</span>
                    </div>
                    <button
                      onClick={() => renewClasses(m.id, 24)}
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
                流失筛选
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
    { k: 'churn', label: '流失预警', icon: AlertTriangle },
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
