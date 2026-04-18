import type { SlateTask } from './types';
import { offsetDate } from './dateUtils';

// Module-level token cache — session only, never persisted
let gcalToken: string | null = null;
let gcalTokenExpiry = 0;

const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOAuth2(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).google?.accounts?.oauth2;
}

function requestToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const oauth2 = getOAuth2();
    if (!oauth2) { reject(new Error('Google Identity Services not loaded')); return; }
    const clientId = process.env.NEXT_PUBLIC_GCAL_CLIENT_ID!;
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: GCAL_SCOPE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (resp: any) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        gcalToken = resp.access_token as string;
        gcalTokenExpiry = Date.now() + 55 * 60 * 1000;
        resolve(gcalToken!);
      },
    });
    client.requestAccessToken();
  });
}

async function getToken(): Promise<string> {
  if (gcalToken && Date.now() < gcalTokenExpiry) return gcalToken;
  gcalToken = null;
  return requestToken();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export async function addToCalendar(task: SlateTask): Promise<string | null> {
  const token = await getToken();
  const calPrefix: Record<string, string> = {
    physical: 'Training', mental: 'Study', social: 'Meet',
    work: 'Meeting', errands: 'Errands', admin: 'Admin',
  };
  const prefix = task.context_type ? calPrefix[task.context_type] : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: Record<string, any> = {
    summary: prefix ? `${prefix} - ${task.title}` : task.title,
  };
  if (task.notes) event.description = task.notes;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (task.due_date) {
    if (task.due_time) {
      const [hh, mm] = task.due_time.split(':');
      const start = `${task.due_date}T${pad(parseInt(hh))}:${pad(parseInt(mm))}:00`;
      const endD = new Date(start);
      endD.setMinutes(endD.getMinutes() + (task.estimated_minutes || 30));
      const endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}:00`;
      event.start = { dateTime: start, timeZone: tz };
      event.end = { dateTime: endStr, timeZone: tz };
    } else {
      const endD = new Date(task.due_date + 'T00:00:00');
      endD.setDate(endD.getDate() + 1);
      event.start = { date: task.due_date };
      event.end = { date: endD.toISOString().split('T')[0] };
    }
  } else {
    event.start = { date: offsetDate(0) };
    event.end = { date: offsetDate(1) };
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (res.status === 401) {
    gcalToken = null;
    gcalTokenExpiry = 0;
    throw new Error('token_expired');
  }

  const data = await res.json();
  if (data.id) return data.id as string;
  throw new Error(data.error?.message || 'Calendar API error');
}

export async function removeFromCalendar(calendarEventId: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 401) {
    gcalToken = null;
    gcalTokenExpiry = 0;
    throw new Error('token_expired');
  }
  // 204 = deleted, 404 = already gone — both are fine
}

export function deleteCalendarEvents(tasks: SlateTask[]): void {
  if (!gcalToken || Date.now() >= gcalTokenExpiry) return;
  tasks.forEach(t => {
    if (t.in_calendar && t.calendar_event_id) {
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${t.calendar_event_id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${gcalToken!}` } }
      ).catch(() => {});
    }
  });
}
