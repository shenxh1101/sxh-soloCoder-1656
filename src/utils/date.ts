export const formatDate = (date: string | Date | null, fmt = 'YYYY-MM-DD'): string => {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return fmt
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDateTime = (date: string | Date | null): string =>
  formatDate(date, 'YYYY-MM-DD HH:mm');

export const todayISO = (): string => {
  const d = new Date();
  return formatDate(d, 'YYYY-MM-DD');
};

export const nowISO = (): string => new Date().toISOString();

export const daysBetween = (a: string | Date, b: string | Date): number => {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  const diff = Math.abs(da.getTime() - db.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const daysSince = (dateStr: string | Date | null): number => {
  if (!dateStr) return 9999;
  return daysBetween(dateStr, new Date());
};

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d, 'YYYY-MM-DD');
};

export const subtractMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return formatDate(d, 'YYYY-MM-DD');
};

export const getWeekDay = (dateStr?: string): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[d.getDay()];
};

export const getWeekDayIndex = (weekDay: string): number => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days.indexOf(weekDay);
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

export const isSameDay = (a: string | Date, b: string | Date): boolean => {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};
