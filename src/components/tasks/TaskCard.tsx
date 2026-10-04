'use client';

import { useRef, useState } from 'react';
import type { SlateTask, SlateSubtask } from '@/lib/slate/types';
import { useSlateStore } from '@/store/useSlateStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getDefaultSegments, segmentStyle } from '@/lib/slate/segments';
import styles from './TaskCard.module.css';

interface Props {
  task: SlateTask;
  subtasks: SlateSubtask[];
  inGroup?: boolean;
  wrapTitle?: boolean;
}

export default function TaskCard({ task, subtasks, inGroup = false, wrapTitle = false }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const open = useSlateStore(s => !!s.openCardIds[task.id]);
  const toggleCardOpen = useSlateStore(s => s.toggleCardOpen);
  const addSubtaskRef = useRef<HTMLInputElement>(null);

  const toggleTask = useSlateStore(s => s.toggleTask);
  const toggleSubtask = useSlateStore(s => s.toggleSubtask);
  const addSubtask = useSlateStore(s => s.addSubtask);
  const deleteTask = useSlateStore(s => s.deleteTask);
  const openEditModal = useSlateStore(s => s.openEditModal);
  const addToCal = useSlateStore(s => s.addToCalendar);
  const removeFromCal = useSlateStore(s => s.removeFromCalendar);
  const updateTask = useSlateStore(s => s.updateTask);
  const renameSubtask = useSlateStore(s => s.renameSubtask);
  const customSegments = useSlateStore(s => s.customSegments);
  const addCustomSegment = useSlateStore(s => s.addCustomSegment);

  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubValue, setEditSubValue] = useState('');
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [newSegment, setNewSegment] = useState('');

  const isDone = task.completed;
  const cat = task.category;
  const allSegments = [...getDefaultSegments(cat), ...(customSegments[cat] ?? [])];
  const segment = task.context_type || null;

  const subTotal = subtasks.length;
  const subDone = subtasks.filter(s => s.completed).length;
  const allSubDone = subTotal > 0 && subDone === subTotal;
  const pct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;

  const cardClass = [
    styles.card,
    inGroup ? styles.grouped : styles[task.priority],
    isDragging ? styles.dragging : '',
  ].filter(Boolean).join(' ');

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleSubtaskSubmit(input: HTMLInputElement) {
    const title = input.value.trim();
    if (!title) return;
    input.value = '';
    await addSubtask(task.id, title);
  }

  function handleConfirmDelete() {
    if (confirm('Delete this task?')) deleteTask(task.id);
  }

  function startEditSub(id: string, title: string) {
    setEditSubId(id);
    setEditSubValue(title);
  }

  async function commitEditSub() {
    if (!editSubId) return;
    await renameSubtask(editSubId, editSubValue);
    setEditSubId(null);
  }

  function cancelEditSub() {
    setEditSubId(null);
    setEditSubValue('');
  }

  function handleSelectSegment(name: string) {
    updateTask(task.id, { context_type: segment === name ? null : name });
    setSegmentOpen(false);
  }

  function handleAddSegment() {
    const name = newSegment.trim();
    if (!name) return;
    if (!allSegments.includes(name)) addCustomSegment(name, cat);
    updateTask(task.id, { context_type: name });
    setNewSegment('');
    setSegmentOpen(false);
  }

  const completedDate = task.completed_at
    ? new Date(task.completed_at).toLocaleDateString('en-SG', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <div ref={setNodeRef} style={dragStyle} className={cardClass} data-id={task.id}>
      {/* ── Main row ── */}
      <div
        className={styles.main}
        onClick={() => { toggleCardOpen(task.id); setSegmentOpen(false); }}
        {...(!isDone ? listeners : {})}
        {...(!isDone ? attributes : {})}
      >
        <div
          className={`${styles.checkbox} ${isDone ? styles.checked : ''}`}
          onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
        />
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <span className={`${styles.title} ${isDone ? styles.done : ''} ${wrapTitle ? styles.wrap : ''}`}>{task.title}</span>
            {subTotal > 0 && (
              <>
                <svg className={styles.subtaskCircle} width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r={11} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  <circle
                    cx="16" cy="16" r={11} fill="none"
                    stroke={allSubDone ? '#22c55e' : subDone > 0 ? '#3b82f6' : '#94a3b8'}
                    strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 11}
                    strokeDashoffset={2 * Math.PI * 11 * (1 - pct / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 16 16)"
                  />
                  <text
                    x="16" y="16"
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="6" fontWeight="700"
                    fill={allSubDone ? '#22c55e' : subDone > 0 ? '#3b82f6' : '#94a3b8'}
                    fontFamily="inherit"
                  >
                    {pct}%
                  </text>
                </svg>
                <span className={`${styles.subtaskCount} ${allSubDone ? styles.countDone : ''}`}>{subDone}/{subTotal}</span>
              </>
            )}
          </div>
          <div className={styles.meta}>
            {task.in_calendar && <span className={styles.calBadge}>In Cal</span>}
            {!isDone && (
              <button
                className={styles.segmentChip}
                style={segment ? { background: segmentStyle(segment).bg, color: segmentStyle(segment).text } : undefined}
                onClick={e => { e.stopPropagation(); setSegmentOpen(v => !v); }}
              >
                {segment ?? '+ Tag'}
              </button>
            )}
          </div>
        </div>
        <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▾</span>
      </div>

      {/* ── Segment picker ── */}
      {segmentOpen && !isDone && (
        <div className={styles.segmentPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.segmentOptions}>
            {allSegments.map(seg => {
              const active = segment === seg;
              const c = segmentStyle(seg);
              return (
                <button
                  key={seg}
                  className={`${styles.segmentOption} ${active ? styles.segmentOptionActive : ''}`}
                  style={active ? { background: c.bg, color: c.text, borderColor: c.text } : undefined}
                  onClick={() => handleSelectSegment(seg)}
                >
                  {seg}
                </button>
              );
            })}
          </div>
          <div className={styles.segmentAddRow}>
            <input
              className={styles.segmentAddInput}
              placeholder="New segment…"
              value={newSegment}
              onChange={e => setNewSegment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSegment();
                if (e.key === 'Escape') { setNewSegment(''); setSegmentOpen(false); }
              }}
            />
            <button className={styles.segmentAddBtn} onClick={handleAddSegment}>+</button>
          </div>
        </div>
      )}

      {/* ── Detail ── */}
      <div className={`${styles.detail} ${open ? styles.open : ''}`}>
        {isDone && (
          <div className={styles.doneRow}>
            <span className={`${styles.priorityLabel} ${styles[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {completedDate && (
              <span className={styles.completedAt}>Completed {completedDate}</span>
            )}
          </div>
        )}

        {task.notes && <div className={styles.notes}>{task.notes}</div>}

        {subTotal > 0 && (
          <div className={styles.subtaskList}>
            {subtasks.map(sub => (
              <div key={sub.id} className={styles.subtaskItem}>
                <div
                  className={`${styles.subtaskCheck} ${sub.completed ? styles.checked : ''}`}
                  onClick={() => toggleSubtask(sub.id)}
                />
                {!isDone && editSubId === sub.id ? (
                  <input
                    className={styles.subtaskEditInput}
                    value={editSubValue}
                    autoFocus
                    onChange={e => setEditSubValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEditSub(); }
                      if (e.key === 'Escape') cancelEditSub();
                    }}
                    onBlur={commitEditSub}
                  />
                ) : (
                  <span
                    className={`${styles.subtaskTitle} ${sub.completed ? styles.done : ''}`}
                    onClick={!isDone ? () => startEditSub(sub.id, sub.title) : undefined}
                    style={!isDone ? { cursor: 'text' } : undefined}
                  >
                    {sub.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!isDone && (
          <div className={styles.addSubtaskRow}>
            <input
              ref={addSubtaskRef}
              className={styles.addSubtaskInput}
              placeholder="Add subtask…"
              onKeyDown={e => { if (e.key === 'Enter') handleSubtaskSubmit(e.currentTarget); }}
            />
            <button
              className={styles.btnAddSub}
              onClick={() => addSubtaskRef.current && handleSubtaskSubmit(addSubtaskRef.current)}
            >
              Add
            </button>
          </div>
        )}

        <div className={styles.actions}>
          {isDone ? (
            <>
              <button className={`${styles.btn} ${styles.btnRestore}`} onClick={() => toggleTask(task.id)}>Restore</button>
              <button className={`${styles.btn} ${styles.btnDelete}`} onClick={handleConfirmDelete}>Delete</button>
            </>
          ) : (
            <>
              <button className={`${styles.btn} ${styles.btnDone}`} onClick={() => toggleTask(task.id)}>Done</button>
              <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => openEditModal(task.id)}>Edit</button>
              {task.in_calendar ? (
                <button className={`${styles.btn} ${styles.btnCalDel}`} onClick={() => removeFromCal(task.id)}>In Cal ✕</button>
              ) : (
                <button className={`${styles.btn} ${styles.btnCal}`} onClick={() => addToCal(task.id)}>+ Cal</button>
              )}
              <button className={`${styles.btn} ${styles.btnDelete}`} onClick={handleConfirmDelete}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
