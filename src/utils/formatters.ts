export const withUnit = (val: number | null | undefined, unit: string, digits = 1): string => {
  if (val === null || val === undefined || isNaN(val as number)) return '--';
  return `${val.toFixed(digits)}${unit}`;
};

export const fmtWeight = (v: number | null | undefined): string => withUnit(v, 'kg', 1);
export const fmtBodyFat = (v: number | null | undefined): string => withUnit(v, '%', 1);
export const fmtBMI = (v: number | null | undefined): string => withUnit(v, '', 1);
export const fmtCm = (v: number | null | undefined): string => withUnit(v, 'cm', 1);
export const fmtKg = (v: number | null | undefined): string => withUnit(v, 'kg', 0);
export const fmtSec = (v: number | null | undefined): string =>
  v === null || v === undefined ? '--' : `${v}秒`;

export const fmtPercent = (val: number | null | undefined, digits = 1): string => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  return `${val.toFixed(digits)}%`;
};

export const fmtPhone = (phone: string): string => {
  if (!phone) return '--';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return phone;
};

export const deltaTag = (delta: number, reverse = false): { text: string; cls: string } => {
  if (delta === 0) return { text: '—', cls: 'text-ink-500' };
  const good = reverse ? delta < 0 : delta > 0;
  const sign = delta > 0 ? '+' : '';
  const cls = good ? 'text-success' : 'text-danger';
  return { text: `${sign}${delta}`, cls };
};

export const fmtBigNumber = (n: number): string => {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
};
