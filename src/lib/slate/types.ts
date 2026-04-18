export interface SlateTask {
  id: string;
  title: string;
  category: 'personal' | 'work';
  priority: 'must' | 'should' | 'could';
  due_date: string | null;
  due_time: string | null;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  estimated_minutes: number | null;
  context_type: string | null;
  in_calendar: boolean;
  calendar_event_id: string | null;
  deferral_count: number;
}

export interface SlateSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
}

export type Priority = 'must' | 'should' | 'could';
export type Category = 'personal' | 'work';
export type DoneFilter = 'all' | 'personal' | 'work';
export type ContextType = 'physical' | 'mental' | 'social' | 'work' | 'errands' | 'admin' | '';
