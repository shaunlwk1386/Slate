'use client';

import { useState, useEffect, useRef } from 'react';
import { useSlateStore } from '@/store/useSlateStore';
import type { Category, Priority, ContextType } from '@/lib/slate/types';
import styles from './Modal.module.css';

const CATEGORIES: Category[] = ['personal', 'work'];
const PRIORITIES: Priority[] = ['must', 'should', 'could'];
const CONTEXTS: { value: ContextType; label: string }[] = [
  { value: '', label: 'Any' },
  { value: 'physical', label: 'Physical' },
  { value: 'mental', label: 'Mental' },
  { value: 'social', label: 'Social' },
  { value: 'work', label: 'Work' },
  { value: 'errands', label: 'Errands' },
  { value: 'admin', label: 'Admin' },
];

function formatDateForText(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function parseTextDate(val: string): string | null {
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const day = parts[0].padStart(2, '0');
  const mon = parts[1].padStart(2, '0');
  const yr = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  const iso = `${yr}-${mon}-${day}`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

export default function TaskModal() {
  const { taskModal, tasks, lastCat, lastPriority, closeTaskModal, addTask, updateTask, addToCalendar, setLastCat, setLastPriority } = useSlateStore();
  const { open, editingId } = taskModal;
  const isEdit = !!editingId;
  const task = editingId ? tasks.find(t => t.id === editingId) : null;

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<Category>(lastCat);
  const [priority, setPriority] = useState<Priority>(lastPriority);
  const [duePicker, setDuePicker] = useState('');
  const [dueText, setDueText] = useState('');
  const [timePicker, setTimePicker] = useState('');
  const [timeText, setTimeText] = useState('');
  const [estimate, setEstimate] = useState('');
  const [context, setContext] = useState<ContextType>('');
  const [notes, setNotes] = useState('');
  const [addToCal, setAddToCal] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Populate form when modal opens
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setCat(task.category);
      setPriority(task.priority);
      setDuePicker(task.due_date || '');
      setDueText(task.due_date ? formatDateForText(task.due_date) : '');
      setTimePicker(task.due_time || '');
      setTimeText(task.due_time || '');
      setEstimate(task.estimated_minutes ? String(task.estimated_minutes) : '');
      setContext((task.context_type as ContextType) || '');
      setNotes(task.notes || '');
      setAddToCal(false);
    } else {
      setTitle('');
      setCat(lastCat);
      setPriority(lastPriority);
      setDuePicker('');
      setDueText('');
      setTimePicker('');
      setTimeText('');
      setEstimate('');
      setContext('');
      setNotes('');
      setAddToCal(false);
    }
    setTimeout(() => titleRef.current?.focus(), 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDueTextBlur() {
    const iso = parseTextDate(dueText);
    if (iso) { setDuePicker(iso); }
  }

  function handleDuePicker(val: string) {
    setDuePicker(val);
    setDueText(val ? formatDateForText(val) : '');
  }

  function handleTimeTextBlur() {
    const parts = timeText.split(':');
    if (parts.length === 2) {
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      if (!isNaN(parseInt(hh)) && !isNaN(parseInt(mm))) {
        setTimePicker(`${hh}:${mm}`);
      }
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { titleRef.current?.focus(); return; }
    const estVal = parseInt(estimate);
    const data = {
      title: title.trim(),
      category: cat,
      priority,
      due_date: duePicker || null,
      due_time: timePicker || null,
      estimated_minutes: isNaN(estVal) ? null : estVal,
      context_type: context || null,
      notes: notes.trim() || null,
      completed: false,
      completed_at: null,
      in_calendar: isEdit ? (task?.in_calendar ?? false) : false,
      calendar_event_id: isEdit ? (task?.calendar_event_id ?? null) : null,
      deferral_count: isEdit ? (task?.deferral_count ?? 0) : 0,
    };
    setLastCat(cat);
    setLastPriority(priority);
    closeTaskModal();
    if (isEdit && editingId) {
      await updateTask(editingId, data);
    } else {
      const newTask = await addTask(data);
      if (addToCal && newTask) addToCalendar(newTask.id);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeTaskModal(); }}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>{isEdit ? 'Edit Task' : 'New Task'}</span>
          <button className={styles.close} onClick={closeTaskModal}>✕</button>
        </div>

        {/* Title */}
        <div className={styles.group}>
          <label className={styles.label}>Title</label>
          <input
            ref={titleRef}
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
          />
        </div>

        {/* Category + Priority */}
        <div className={styles.row}>
          <div className={styles.groupFlex1}>
            <label className={styles.label}>Category</label>
            <div className={styles.segGroup}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`${styles.seg} ${cat === c ? styles.segActive : ''}`}
                  onClick={() => setCat(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.groupFlex15}>
            <label className={styles.label}>Priority</label>
            <div className={styles.segGroup}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  className={`${styles.seg} ${priority === p ? styles.segActive : ''} ${styles['seg_' + p]}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Due Date + Time */}
        <div className={styles.row}>
          <div className={styles.groupFlex1}>
            <label className={styles.label}>Due Date</label>
            <div className={styles.inputRow}>
              <input
                className={styles.inputFlex}
                value={dueText}
                onChange={e => setDueText(e.target.value)}
                onBlur={handleDueTextBlur}
                placeholder="dd/mm/yy"
              />
              <input
                className={styles.inputPicker}
                type="date"
                value={duePicker}
                onChange={e => handleDuePicker(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.groupFlex1}>
            <label className={styles.label}>Time</label>
            <div className={styles.inputRow}>
              <input
                className={styles.inputFlex}
                value={timeText}
                onChange={e => setTimeText(e.target.value)}
                onBlur={handleTimeTextBlur}
                placeholder="hh:mm"
              />
              <input
                className={styles.inputPicker}
                type="time"
                value={timePicker}
                onChange={e => { setTimePicker(e.target.value); setTimeText(e.target.value); }}
              />
            </div>
          </div>
        </div>

        {/* Estimate */}
        <div className={styles.group}>
          <label className={styles.label}>Est. Minutes</label>
          <input
            className={styles.input}
            type="number"
            value={estimate}
            onChange={e => setEstimate(e.target.value)}
            placeholder="e.g. 30"
            min="1"
            max="480"
          />
        </div>

        {/* Context */}
        <div className={styles.group}>
          <label className={styles.label}>Context</label>
          <select
            className={styles.input}
            value={context}
            onChange={e => setContext(e.target.value as ContextType)}
          >
            {CONTEXTS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className={styles.group}>
          <label className={styles.label}>Notes</label>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any context…"
          />
        </div>

        {/* Add to calendar toggle (add mode only) */}
        {!isEdit && (
          <div className={styles.calToggleRow}>
            <label className={styles.label} style={{ margin: 0 }}>Add to Google Calendar</label>
            <div
              className={`${styles.toggle} ${addToCal ? styles.toggleOn : ''}`}
              onClick={() => setAddToCal(v => !v)}
            >
              <div className={`${styles.toggleThumb} ${addToCal ? styles.toggleThumbOn : ''}`} />
            </div>
          </div>
        )}

        <button className={styles.submit} onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </div>
  );
}
