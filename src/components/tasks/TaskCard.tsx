'use client';

import { useState, useRef } from 'react';
import type { SlateTask, SlateSubtask } from '@/lib/slate/types';
import {
  formatDue, formatTime, isOverdue, overdueDays,
  getOverdueState, formatTimePressure, isTodayDate,
} from '@/lib/slate/dateUtils';
import { useSlateStore } from '@/store/useSlateStore';
import styles from './TaskCard.module.css';

interface Props {
  task: SlateTask;
  subtasks: SlateSubtask[];
  showBadge?: boolean;
  isOverdueCard?: boolean;
}

export default function TaskCard({ task, subtasks, showBadge = false, isOverdueCard = false }: Props) {
  const [open, setOpen] = useState(false);
  const addSubtaskRef = useRef<HTMLInputElement>(null);

  const toggleTask = useSlateStore(s => s.toggleTask);
  const toggleSubtask = useSlateStore(s => s.toggleSubtask);
  const addSubtask = useSlateStore(s => s.addSubtask);
  const deleteTask = useSlateStore(s => s.deleteTask);
  const openEditModal = useSlateStore(s => s.openEditModal);
  const openExtendModal = useSlateStore(s => s.openExtendModal);
  const addToCal = useSlateStore(s => s.addToCalendar);
  const removeFromCal = useSlateStore(s => s.removeFromCalendar);
  const updateTask = useSlateStore(s => s.updateTask);

  const isDone = task.completed;
  const overdue = !isDone && isOverdue(task.due_date);
  const state = isOverdueCard ? getOverdueState(task.due_date) : 'overdue';
  const isStale = state === 'stale';
  const days = isOverdueCard ? overdueDays(task.due_date) : 0;

  const dueLabel = formatDue(task.due_date);
  const timeLabel = formatTime(task.due_time);
  const tp = !isDone ? formatTimePressure(task.due_date, task.due_time) : null;

  const subTotal = subtasks.length;
  const subDone = subtasks.filter(s => s.completed).length;
  const allSubDone = subTotal > 0 && subDone === subTotal;

  const cardClass = [
    styles.card,
    isOverdueCard ? styles.overdueCard : '',
    isOverdueCard && state !== 'overdue' ? styles[state] : '',
  ].filter(Boolean).join(' ');

  async function handleSubtaskSubmit(input: HTMLInputElement) {
    const title = input.value.trim();
    if (!title) return;
    input.value = '';
    await addSubtask(task.id, title);
  }

  async function handleStaleKeep() {
    await updateTask(task.id, { notes: task.notes ?? null });
  }

  function handleConfirmDelete() {
    if (confirm('Delete this task?')) deleteTask(task.id);
  }


  const completedDate = task.completed_at
    ? new Date(task.completed_at).toLocaleDateString('en-SG', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <div className={cardClass} data-id={task.id}>
      {/* ── Main row ── */}
      <div className={styles.main} onClick={() => setOpen(o => !o)}>
        <div
          className={`${styles.checkbox} ${isDone ? styles.checked : ''}`}
          onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
        />
        <div className={styles.body}>
          <div className={`${styles.title} ${isDone ? styles.done : ''}`}>{task.title}</div>
          <div className={styles.meta}>
            <span className={`${styles.priorityDot} ${styles[task.priority]}`} />
            {showBadge && <span className={styles.catBadge}>{task.category}</span>}
            {dueLabel && (
              <span className={`${styles.due} ${overdue ? styles.overdue : ''}`}>{dueLabel}</span>
            )}
            {timeLabel && (
              <span className={styles.dueTime}>{timeLabel}</span>
            )}
            {isOverdueCard && (
              <span className={`${styles.overdueAge} ${styles[state]}`}>{days}d overdue</span>
            )}
            {subTotal > 0 && (
              <span className={`${styles.subtaskProgress} ${allSubDone ? styles.doneAll : ''}`}>
                {subDone}/{subTotal}
              </span>
            )}
            {tp && (
              <span className={`${styles.timePressure} ${styles[tp.state]}`}>{tp.text}</span>
            )}
            {task.deferral_count > 0 && (
              <span className={`${styles.deferBadge} ${task.deferral_count >= 3 ? styles.repeat : ''}`}>
                Deferred {task.deferral_count}×
              </span>
            )}
            {task.in_calendar && <span className={styles.calBadge}>In Cal</span>}
          </div>
        </div>
        <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▾</span>
      </div>

      {/* ── Detail ── */}
      <div className={`${styles.detail} ${open ? styles.open : ''}`}>
        {/* Stale prompt */}
        {isStale && (
          <div className={styles.stalePrompt}>
            <p className={styles.stalePromptMsg}>Still relevant?</p>
            <div className={styles.staleActions}>
              <button className={styles.btnStaleKeep} onClick={handleStaleKeep}>Keep</button>
              <button className={styles.btnStaleExtend} onClick={() => openExtendModal(task.id)}>Extend</button>
              <button className={styles.btnStaleRemove} onClick={handleConfirmDelete}>Remove</button>
            </div>
          </div>
        )}

        {/* Done meta */}
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

        {/* Notes */}
        {task.notes && <div className={styles.notes}>{task.notes}</div>}

        {/* Subtasks */}
        {subTotal > 0 && (
          <div className={styles.subtaskList}>
            {subtasks.map(sub => (
              <div key={sub.id} className={styles.subtaskItem}>
                <div
                  className={`${styles.subtaskCheck} ${sub.completed ? styles.checked : ''}`}
                  onClick={() => toggleSubtask(sub.id)}
                />
                <span className={`${styles.subtaskTitle} ${sub.completed ? styles.done : ''}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add subtask */}
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

        {/* Actions */}
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
              {isOverdueCard && (
                <button className={`${styles.btn} ${styles.btnExtend}`} onClick={() => openExtendModal(task.id)}>Extend</button>
              )}
              {task.in_calendar ? (
                <button className={`${styles.btn} ${styles.btnCalDel}`} onClick={() => removeFromCal(task.id)}>In Cal ✕</button>
              ) : (
                <button className={`${styles.btn} ${styles.btnCal}`} onClick={() => addToCal(task.id)}>+ Cal</button>
              )}
              <button className={`${styles.btn} ${styles.btnDelete}`} onClick={handleConfirmDelete}>
                {isOverdueCard ? 'Remove' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
