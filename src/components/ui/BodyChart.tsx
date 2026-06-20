import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BodyMeasurement, ChartRange } from '@/shared/types';
import { useChartData } from '@/hooks/useChartData';
import { fmtWeight, fmtBodyFat } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface BodyChartProps {
  measurements: BodyMeasurement[];
  range?: ChartRange;
}

const ranges: { key: ChartRange; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'ALL', label: 'ALL' },
];

export function BodyChart({ measurements, range: initialRange = '3M' }: BodyChartProps) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const data = useChartData(measurements, range);

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-lift border border-ink-100 px-4 py-3 text-sm">
        <p className="font-semibold text-ink-900 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-ink-500">{p.name}:</span>
            <span className="font-medium text-ink-900">{p.value}{p.name === '体重' ? 'kg' : '%'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="section-title">身体数据趋势</h3>
          <p className="text-sm text-ink-500 mt-0.5">体重与体脂率变化曲线</p>
        </div>
        <div className="inline-flex bg-ink-50 rounded-lg p-1 border border-ink-100">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                range === r.key
                  ? 'bg-white text-brand-500 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-500 text-sm">
            暂无测量数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="weightLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="bodyFatLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#059669' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}kg`}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#F59E0B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip content={renderTooltip} cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                formatter={(value: string) => (
                  <span className="text-ink-700">{value}</span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                name="体重"
                stroke="url(#weightLine)"
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bodyFat"
                name="体脂率"
                stroke="url(#bodyFatLine)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                fill="none"
                dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.length >= 2 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700/70 font-medium">体重变化</p>
            <p className="mt-1 font-display text-lg font-bold text-emerald-700">
              {fmtWeight((data[data.length - 1] as any).weight - (data[0] as any).weight).startsWith('-')
                ? fmtWeight((data[data.length - 1] as any).weight - (data[0] as any).weight)
                : `+${fmtWeight((data[data.length - 1] as any).weight - (data[0] as any).weight)}`}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700/70 font-medium">体脂变化</p>
            <p className="mt-1 font-display text-lg font-bold text-amber-700">
              {((data[data.length - 1] as any).bodyFat - (data[0] as any).bodyFat) < 0
                ? fmtBodyFat((data[data.length - 1] as any).bodyFat - (data[0] as any).bodyFat)
                : `+${fmtBodyFat((data[data.length - 1] as any).bodyFat - (data[0] as any).bodyFat)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
