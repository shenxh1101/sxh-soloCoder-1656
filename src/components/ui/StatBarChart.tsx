import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface StatBarChartProps {
  data: { name: string; 课时数: number; 活跃会员: number }[];
  height?: number;
  title?: string;
}

interface CustomLegendPayloadItem {
  value: string;
  color: string;
}

function CustomLegend() {
  const items: CustomLegendPayloadItem[] = [
    { value: '课时数', color: '#0F3D33' },
    { value: '活跃会员', color: '#6FB8A5' },
  ];
  return (
    <div className="flex items-center gap-4 justify-end">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-ink-700 font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StatBarChart({ data, height = 280, title }: StatBarChartProps) {
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-lift border border-ink-100 px-4 py-3 text-sm">
        <p className="font-semibold text-ink-900 mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6 py-0.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-ink-500">{p.name}</span>
            </div>
            <span className="font-semibold text-ink-900">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-5">
      <div className={cn('mb-4', title ? 'flex items-center justify-between' : '')}>
        {title && (
          <div>
            <h3 className="section-title">{title}</h3>
            <p className="text-sm text-ink-500 mt-0.5">课时与活跃会员对比</p>
          </div>
        )}
        <CustomLegend />
      </div>

      <div className="w-full" style={{ height }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-500 text-sm">
            暂无统计数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              barGap={6}
              barCategoryGap="28%"
            >
              <defs>
                <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F3D33" />
                  <stop offset="100%" stopColor="#3F9981" />
                </linearGradient>
                <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6FB8A5" />
                  <stop offset="100%" stopColor="#9FD2C1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={renderTooltip}
                cursor={{ fill: 'rgba(15, 61, 51, 0.04)' }}
              />
              <Bar dataKey="课时数" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {data.map((_, i) => (
                  <Cell key={`c1-${i}`} fill="url(#barGradient1)" />
                ))}
              </Bar>
              <Bar dataKey="活跃会员" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {data.map((_, i) => (
                  <Cell key={`c2-${i}`} fill="url(#barGradient2)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
