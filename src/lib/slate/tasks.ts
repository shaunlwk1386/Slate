import { supabase } from '@/lib/supabase/client';
import type { SlateTask, SlateSubtask } from './types';

export async function fetchAll(): Promise<{ tasks: SlateTask[]; subtasks: SlateSubtask[] }> {
  const [{ data: tasks, error: e1 }, { data: subtasks, error: e2 }] = await Promise.all([
    supabase.from('slate_tasks').select('*').order('created_at', { ascending: true }),
    supabase.from('slate_subtasks').select('*').order('order_index', { ascending: true }),
  ]);
  if (e1 || e2) throw new Error('Failed to load tasks');
  return { tasks: (tasks as SlateTask[]) || [], subtasks: (subtasks as SlateSubtask[]) || [] };
}

export async function insertTask(
  data: Omit<SlateTask, 'id' | 'created_at'>
): Promise<SlateTask> {
  const { data: row, error } = await supabase.from('slate_tasks').insert([data]).select().single();
  if (error) throw error;
  return row as SlateTask;
}

export async function patchTask(id: string, data: Partial<SlateTask>): Promise<void> {
  const { error } = await supabase.from('slate_tasks').update(data).eq('id', id);
  if (error) throw error;
}

export async function removeTask(id: string): Promise<void> {
  await supabase.from('slate_tasks').delete().eq('id', id);
}

export async function removeTasks(ids: string[]): Promise<void> {
  await supabase.from('slate_tasks').delete().in('id', ids);
}

export async function insertSubtask(
  taskId: string,
  title: string,
  orderIndex: number
): Promise<SlateSubtask> {
  const { data: row, error } = await supabase
    .from('slate_subtasks')
    .insert([{ task_id: taskId, title, completed: false, order_index: orderIndex }])
    .select()
    .single();
  if (error) throw error;
  return row as SlateSubtask;
}

export async function patchSubtask(id: string, completed: boolean): Promise<void> {
  await supabase.from('slate_subtasks').update({ completed }).eq('id', id);
}

export async function restoreTasks(
  tasks: Array<Omit<SlateTask, 'id' | 'created_at'>>
): Promise<SlateTask[]> {
  const { data, error } = await supabase.from('slate_tasks').insert(tasks).select();
  if (error) throw error;
  return (data as SlateTask[]) || [];
}

export async function restoreSubtasks(
  subs: Array<Omit<SlateSubtask, 'id' | 'created_at'>>
): Promise<void> {
  if (!subs.length) return;
  await supabase.from('slate_subtasks').insert(subs);
}
