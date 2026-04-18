'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SlateTask, SlateSubtask, Category, Priority, DoneFilter } from '@/lib/slate/types';
import {
  fetchAll,
  insertTask,
  patchTask,
  removeTask,
  removeTasks,
  insertSubtask,
  patchSubtask,
  restoreTasks,
  restoreSubtasks,
} from '@/lib/slate/tasks';
import { addToCalendar, removeFromCalendar, deleteCalendarEvents } from '@/lib/slate/gcal';

// ── Modal state types ─────────────────────────────────────────────────────────

export interface RadarModalPayload {
  dayName: string;
  dateFmt: string;
  dateStr: string;
  isToday: boolean;
}

// ── Store interface ───────────────────────────────────────────────────────────

interface SlateState {
  // Data
  tasks: SlateTask[];
  subtasks: SlateSubtask[];

  // Filters / UI toggles (persisted)
  todayFilter: Record<'personal' | 'work' | 'combined', boolean>;
  focusModeOn: boolean;
  doneFilter: DoneFilter;
  lastCat: Category;
  lastPriority: Priority;

  // Modal state (not persisted)
  taskModal: { open: boolean; editingId: string | null };
  extendModal: { open: boolean; taskId: string | null };
  radarModal: RadarModalPayload | null;

  // Toast (not persisted)
  toast: { msg: string; visible: boolean };
  undoToast: { msg: string; visible: boolean };
  undoTimer: ReturnType<typeof setTimeout> | null;

  // Undo buffer (not persisted)
  clearedTasks: SlateTask[];
  clearedSubtasks: SlateSubtask[];

  // ── Data actions ──────────────────────────────────────────────────────────
  loadAll: () => Promise<void>;
  setTasks: (tasks: SlateTask[]) => void;
  setSubtasks: (subtasks: SlateSubtask[]) => void;

  addTask: (data: Omit<SlateTask, 'id' | 'created_at'>) => Promise<SlateTask | null>;
  updateTask: (id: string, data: Partial<SlateTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (id: string) => Promise<void>;

  clearTab: (scope: 'personal' | 'work' | 'all') => Promise<void>;
  clearDone: () => Promise<void>;
  undoClear: () => Promise<void>;

  addToCalendar: (id: string) => Promise<void>;
  removeFromCalendar: (id: string) => Promise<void>;

  // ── Modal actions ─────────────────────────────────────────────────────────
  openAddModal: () => void;
  openEditModal: (id: string) => void;
  closeTaskModal: () => void;
  openExtendModal: (id: string) => void;
  closeExtendModal: () => void;
  extendTask: (days: number) => Promise<void>;
  extendTaskCustom: (date: string) => Promise<void>;
  openRadarModal: (payload: RadarModalPayload) => void;
  closeRadarModal: () => void;

  // ── Filter actions ────────────────────────────────────────────────────────
  toggleTodayFilter: (tab: 'personal' | 'work' | 'combined') => void;
  toggleFocusMode: () => void;
  setDoneFilter: (val: DoneFilter) => void;
  setLastCat: (cat: Category) => void;
  setLastPriority: (priority: Priority) => void;

  // ── Toast actions ─────────────────────────────────────────────────────────
  showToast: (msg: string) => void;
  showUndoToast: (msg: string) => void;
  hideUndoToast: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSlateStore = create<SlateState>()(
  persist(
    (set, get) => ({
      tasks: [],
      subtasks: [],
      todayFilter: { personal: false, work: false, combined: false },
      focusModeOn: false,
      doneFilter: 'all',
      lastCat: 'personal',
      lastPriority: 'must',
      taskModal: { open: false, editingId: null },
      extendModal: { open: false, taskId: null },
      radarModal: null,
      toast: { msg: '', visible: false },
      undoToast: { msg: '', visible: false },
      undoTimer: null,
      clearedTasks: [],
      clearedSubtasks: [],

      // ── Data ───────────────────────────────────────────────────────────────

      loadAll: async () => {
        try {
          const { tasks, subtasks } = await fetchAll();
          set({ tasks, subtasks });
        } catch {
          get().showToast('Connection error');
        }
      },

      setTasks: (tasks) => set({ tasks }),
      setSubtasks: (subtasks) => set({ subtasks }),

      addTask: async (data) => {
        try {
          const row = await insertTask(data);
          set(s => ({ tasks: [...s.tasks, row] }));
          get().showToast('Task added');
          return row;
        } catch {
          get().showToast('Error saving task');
          return null;
        }
      },

      updateTask: async (id, data) => {
        try {
          await patchTask(id, data);
          set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }));
        } catch {
          get().showToast('Error updating task');
        }
      },

      deleteTask: async (id) => {
        await removeTask(id);
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== id),
          subtasks: s.subtasks.filter(s => s.task_id !== id),
        }));
        get().showToast('Deleted');
      },

      toggleTask: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        const completing = !task.completed;
        if (completing) {
          const subs = get().subtasks.filter(s => s.task_id === id);
          const pending = subs.filter(s => !s.completed).length;
          if (pending > 0 && !confirm(`${pending} subtask${pending > 1 ? 's' : ''} still open. Mark as done anyway?`)) return;
        }
        const completed_at = completing ? new Date().toISOString() : null;
        await get().updateTask(id, { completed: completing, completed_at });
        get().showToast(completing ? 'Done ✓' : 'Restored');
      },

      addSubtask: async (taskId, title) => {
        const order = get().subtasks.filter(s => s.task_id === taskId).length;
        try {
          const row = await insertSubtask(taskId, title, order);
          set(s => ({ subtasks: [...s.subtasks, row] }));
        } catch {
          get().showToast('Error adding subtask');
        }
      },

      toggleSubtask: async (id) => {
        const sub = get().subtasks.find(s => s.id === id);
        if (!sub) return;
        const completed = !sub.completed;
        await patchSubtask(id, completed);
        set(s => ({ subtasks: s.subtasks.map(sub => sub.id === id ? { ...sub, completed } : sub) }));
      },

      clearTab: async (scope) => {
        const active = get().tasks.filter(t => !t.completed);
        const toDelete = scope === 'all' ? active : active.filter(t => t.category === scope);
        if (!toDelete.length) { get().showToast('Nothing to clear'); return; }
        const ids = toDelete.map(t => t.id);
        const cleared = toDelete;
        const clearedSubs = get().subtasks.filter(s => ids.includes(s.task_id));
        deleteCalendarEvents(toDelete);
        await removeTasks(ids);
        set(s => ({
          tasks: s.tasks.filter(t => !ids.includes(t.id)),
          subtasks: s.subtasks.filter(sub => !ids.includes(sub.task_id)),
          clearedTasks: cleared,
          clearedSubtasks: clearedSubs,
        }));
        const label = scope === 'all' ? 'All tasks' : scope === 'personal' ? 'Personal tasks' : 'Work tasks';
        get().showUndoToast(`${label} cleared`);
      },

      clearDone: async () => {
        const done = get().tasks.filter(t => t.completed);
        if (!done.length) { get().showToast('Nothing to clear'); return; }
        const ids = done.map(t => t.id);
        const clearedSubs = get().subtasks.filter(s => ids.includes(s.task_id));
        deleteCalendarEvents(done);
        await removeTasks(ids);
        set(s => ({
          tasks: s.tasks.filter(t => !ids.includes(t.id)),
          subtasks: s.subtasks.filter(sub => !ids.includes(sub.task_id)),
          clearedTasks: done,
          clearedSubtasks: clearedSubs,
        }));
        get().showUndoToast('Completed tasks cleared');
      },

      undoClear: async () => {
        const { clearedTasks, clearedSubtasks } = get();
        if (!clearedTasks.length) return;
        get().hideUndoToast();
        try {
          // Strip id/created_at so Supabase generates new ones
          const taskPayload = clearedTasks.map(({ id: _id, created_at: _ca, ...rest }) => rest);
          const restored = await restoreTasks(taskPayload);
          // Remap old id → new id for subtasks
          if (restored.length && clearedSubtasks.length) {
            const idMap: Record<string, string> = {};
            clearedTasks.forEach((t, i) => { if (restored[i]) idMap[t.id] = restored[i].id; });
            const subPayload = clearedSubtasks.map(({ id: _id, created_at: _ca, task_id, ...rest }) => ({
              ...rest,
              task_id: idMap[task_id] || task_id,
            }));
            await restoreSubtasks(subPayload);
          }
          set({ clearedTasks: [], clearedSubtasks: [] });
          await get().loadAll();
          get().showToast('Restored');
        } catch {
          get().showToast('Restore failed');
        }
      },

      addToCalendar: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        try {
          const eventId = await addToCalendar(task);
          if (eventId) {
            await get().updateTask(id, { in_calendar: true, calendar_event_id: eventId });
            get().showToast('Added to Google Calendar');
          }
        } catch (err) {
          if (err instanceof Error && err.message === 'token_expired') {
            // Token expired mid-request — retry once after re-auth (re-auth happens in gcal.ts)
            get().showToast('Calendar auth expired — try again');
          } else {
            get().showToast('Calendar error');
          }
        }
      },

      removeFromCalendar: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        if (task.calendar_event_id) {
          try {
            await removeFromCalendar(task.calendar_event_id);
          } catch {
            // Ignore errors — still clear the flag
          }
        }
        await get().updateTask(id, { in_calendar: false, calendar_event_id: null });
        get().showToast('Removed from Google Calendar');
      },

      // ── Modals ─────────────────────────────────────────────────────────────

      openAddModal: () => set({ taskModal: { open: true, editingId: null } }),
      openEditModal: (id) => set({ taskModal: { open: true, editingId: id } }),
      closeTaskModal: () => set({ taskModal: { open: false, editingId: null } }),

      openExtendModal: (id) => set({ extendModal: { open: true, taskId: id } }),
      closeExtendModal: () => set({ extendModal: { open: false, taskId: null } }),

      extendTask: async (days) => {
        const { extendModal, tasks } = get();
        if (!extendModal.taskId) return;
        const id = extendModal.taskId;
        const d = new Date();
        d.setDate(d.getDate() + days);
        const date = d.toISOString().split('T')[0];
        const count = (tasks.find(t => t.id === id)?.deferral_count || 0) + 1;
        get().closeExtendModal();
        await get().updateTask(id, { due_date: date, deferral_count: count });
        get().showToast('Due date extended');
      },

      extendTaskCustom: async (date) => {
        const { extendModal, tasks } = get();
        if (!date || !extendModal.taskId) return;
        const id = extendModal.taskId;
        const count = (tasks.find(t => t.id === id)?.deferral_count || 0) + 1;
        get().closeExtendModal();
        await get().updateTask(id, { due_date: date, deferral_count: count });
        get().showToast('Due date extended');
      },

      openRadarModal: (payload) => set({ radarModal: payload }),
      closeRadarModal: () => set({ radarModal: null }),

      // ── Filters ────────────────────────────────────────────────────────────

      toggleTodayFilter: (tab) =>
        set(s => ({ todayFilter: { ...s.todayFilter, [tab]: !s.todayFilter[tab] } })),

      toggleFocusMode: () => set(s => ({ focusModeOn: !s.focusModeOn })),

      setDoneFilter: (val) => set({ doneFilter: val }),

      setLastCat: (cat) => set({ lastCat: cat }),
      setLastPriority: (priority) => set({ lastPriority: priority }),

      // ── Toasts ────────────────────────────────────────────────────────────

      showToast: (msg) => {
        set({ toast: { msg, visible: true } });
        setTimeout(() => set({ toast: { msg: '', visible: false } }), 2200);
      },

      showUndoToast: (msg) => {
        const prev = get().undoTimer;
        if (prev) clearTimeout(prev);
        set({ undoToast: { msg, visible: true } });
        const timer = setTimeout(() => {
          set({ undoToast: { msg: '', visible: false }, clearedTasks: [], clearedSubtasks: [], undoTimer: null });
        }, 5000);
        set({ undoTimer: timer });
      },

      hideUndoToast: () => {
        const prev = get().undoTimer;
        if (prev) clearTimeout(prev);
        set({ undoToast: { msg: '', visible: false }, undoTimer: null });
      },
    }),
    {
      name: 'slate-v2-state',
      partialize: (s) => ({
        todayFilter: s.todayFilter,
        focusModeOn: s.focusModeOn,
        doneFilter: s.doneFilter,
        lastCat: s.lastCat,
        lastPriority: s.lastPriority,
      }),
    }
  )
);
