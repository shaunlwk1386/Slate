export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isTodayDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') < todayStart();
}

export function overdueDays(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr + 'T00:00:00');
  return Math.max(0, Math.round((todayStart().getTime() - d.getTime()) / 86400000));
}

export type OverdueState = 'overdue' | 'aging' | 'stale';

export function getOverdueState(dateStr: string | null): OverdueState {
  const days = overdueDays(dateStr);
  if (days >= 6) return 'stale';
  if (days >= 3) return 'aging';
  return 'overdue';
}

export function formatDue(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStart();
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

export function formatTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export type TimePressureState = 'soon' | 'urgent' | 'missed';

export function formatTimePressure(
  dateStr: string | null,
  timeStr: string | null
): { text: string; state: TimePressureState } | null {
  if (!dateStr || !timeStr || !isTodayDate(dateStr)) return null;
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const due = new Date();
  due.setHours(h, m, 0, 0);
  const diffMin = Math.round((due.getTime() - now.getTime()) / 60000);
  if (diffMin < -120) return { text: `Missed by ${Math.round(Math.abs(diffMin) / 60)}h`, state: 'missed' };
  if (diffMin < 0) return { text: `Missed by ${Math.abs(diffMin)}m`, state: 'missed' };
  if (diffMin <= 60) return { text: `Due in ${diffMin}m`, state: 'urgent' };
  if (diffMin <= 240) return { text: `Due in ${Math.round(diffMin / 60)}h`, state: 'soon' };
  return null;
}

export function formatDateLabel(dateKey: string): { label: string; isPast: boolean } {
  const d = new Date(dateKey + 'T00:00:00');
  const today = todayStart();
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const isPast = diff < 0;
  let label: string;
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff === -1) label = 'Yesterday';
  else label = d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
  return { label, isPast };
}
