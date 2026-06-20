import { cn } from '@/lib/utils';

type AlertBadgeType = 'low' | 'churn';

interface AlertBadgeProps {
  type: AlertBadgeType;
  message?: string;
  remainingClasses?: number;
  daysSinceCheckIn?: number;
}

const typeConfig: Record<AlertBadgeType, {
  label: string;
  dotCls: string;
  bgCls: string;
  textCls: string;
  ringCls: string;
}> = {
  low: {
    label: '课时预警',
    dotCls: 'bg-warning',
    bgCls: 'bg-amber-50 border-amber-200',
    textCls: 'text-amber-700',
    ringCls: 'animate-pulse-ring-warning',
  },
  churn: {
    label: '流失预警',
    dotCls: 'bg-danger',
    bgCls: 'bg-red-50 border-red-200',
    textCls: 'text-red-700',
    ringCls: 'animate-pulse-ring-danger',
  },
};

export function AlertBadge({
  type,
  message,
  remainingClasses,
  daysSinceCheckIn,
}: AlertBadgeProps) {
  const config = typeConfig[type];

  let displayMessage = message;
  if (!displayMessage) {
    if (type === 'low' && remainingClasses !== undefined) {
      displayMessage = `剩余 ${remainingClasses} 课时，建议续费`;
    } else if (type === 'churn' && daysSinceCheckIn !== undefined) {
      displayMessage = `已 ${daysSinceCheckIn} 天未到课`;
    } else {
      displayMessage = type === 'low' ? '剩余课时不足' : '存在流失风险';
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
        config.bgCls,
        config.textCls
      )}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            'absolute w-2.5 h-2.5 rounded-full opacity-40',
            config.dotCls,
            'animate-ping'
          )}
        />
        <span
          className={cn(
            'relative w-2 h-2 rounded-full',
            config.dotCls
          )}
        />
      </span>
      <span className="font-semibold">{config.label}</span>
      <span className="opacity-80">·</span>
      <span className="opacity-90">{displayMessage}</span>
    </div>
  );
}
