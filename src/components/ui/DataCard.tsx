import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { deltaTag, fmtBigNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

type DataCardColor = 'brand' | 'accent' | 'success' | 'warning';

interface DataCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  delta?: number;
  deltaReverse?: boolean;
  trend?: 'up' | 'down' | 'flat';
  color?: DataCardColor;
}

const gradientMap: Record<DataCardColor, string> = {
  brand: 'from-brand-500 via-brand-400 to-brand-300',
  accent: 'from-accent-600 via-accent-500 to-accent-400',
  success: 'from-emerald-600 via-emerald-500 to-emerald-400',
  warning: 'from-amber-600 via-amber-500 to-amber-400',
};

const iconBgMap: Record<DataCardColor, string> = {
  brand: 'bg-white/15',
  accent: 'bg-white/15',
  success: 'bg-white/15',
  warning: 'bg-white/15',
};

export function DataCard({
  title,
  value,
  icon: Icon,
  delta,
  deltaReverse = false,
  trend,
  color = 'brand',
}: DataCardProps) {
  const displayValue = typeof value === 'number' ? fmtBigNumber(value) : value;

  let trendIcon = Minus;
  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (trend) {
    trendDirection = trend;
  } else if (delta !== undefined && delta !== 0) {
    const isPositive = deltaReverse ? delta < 0 : delta > 0;
    trendDirection = isPositive ? 'up' : 'down';
  }
  trendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const deltaResult = delta !== undefined ? deltaTag(delta, deltaReverse) : null;
  const trendColor =
    trendDirection === 'up'
      ? 'text-white'
      : trendDirection === 'down'
      ? 'text-white/90'
      : 'text-white/70';

  return (
    <div
      className={cn(
        'relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br shadow-card',
        gradientMap[color],
        'text-white'
      )}
    >
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium">{title}</p>
            <p className="mt-3 font-display text-4xl font-bold tracking-tight">
              {displayValue}
            </p>
          </div>
          {Icon && (
            <div className={cn('p-2.5 rounded-xl', iconBgMap[color])}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="w-4 h-4" />
            {deltaResult && (
              <span className={cn('text-sm font-semibold', deltaResult.cls)}>
                {deltaResult.text}
              </span>
            )}
          </div>
          {deltaResult && (
            <span className="text-xs text-white/60">较上期</span>
          )}
        </div>
      </div>
    </div>
  );
}
