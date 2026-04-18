'use client';

import { useState } from 'react';
import { useSlateStore } from '@/store/useSlateStore';
import { isOverdue, overdueDays, formatTime } from '@/lib/slate/dateUtils';
import { PRIORITY_ORDER } from '@/lib/slate/scoring';
import type { SlateTask, SlateSubtask } from '@/lib/slate/types';
import styles from './Modal.module.css';

function RadarItem({
  task,
  subtasks,
  showOverdueBadge,
  onDone,
  onEdit,
  onExtend,
  onDelete,
}: {
  task: SlateTask;
  subtasks: SlateSubtask[];
  showOverdueBadge: boolean;
  onDone: () => void;
  onEdit: () => void;
  onExtend: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.due_date);
  const dueLabel = showOverdueBadge && overdue
    ? `${overdueDays(task.due_date)}d overdue`
    : (task.due_time ? formatTime(task.due_time) : '');
  const subTotal = subtasks.length;
  const subDone = subtasks.filter(s => s.completed).length;

  return (
    <div className={styles.radarItem} onClick={() => setExpanded(e => !e)}>
      <div className={styles.radarItemRow}>
        <span className={`${styles.priorityDot} ${styles[task.priority]}`} />
        <span className={styles.radarItemTitle}>{task.title}</span>
        <span className={styles.radarItemCat}>{task.category}</span>
        {dueLabel && (
          <span className={`${styles.radarItemDue} ${overdue ? styles.overdue : ''}`}>{dueLabel}</span>
        )}
        <span className={`${styles.radarChevron} ${expanded ? styles.open : ''}`}>▾</span>
      </div>
      <div className={`${styles.radarDetail} ${expanded ? styles.open : ''}`}>
        {task.notes && <div className={styles.radarDetailNotes}>{task.notes}</div>}
        {subTotal > 0 && (
          <div className={styles.radarDetailSubs}>{subDone}/{subTotal} subtask{subTotal !== 1 ? 's' : ''} done</div>
        )}
        {task.estimated_minutes && (
          <div className={styles.radarDetailEst}>Est. {task.estimated_minutes} min</div>
        )}
        <div className={styles.radarActions} onClick={e => e.stopPropagation()}>
          <button className={`${styles.radarBtn} ${styles.radarBtnDone}`} onClick={onDone}>Done</button>
          <button className={`${styles.radarBtn} ${styles.radarBtnEdit}`} onClick={onEdit}>Edit</button>
          <button className={`${styles.radarBtn} ${styles.radarBtnExtend}`} onClick={onExtend}>Extend</button>
          <button className={`${styles.radarBtn} ${styles.radarBtnDelete}`} onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function PriorityGroups({
  tasks,
  subtasks,
  showOverdueBadge,
  onAction,
}: {
  tasks: SlateTask[];
  subtasks: SlateSubtask[];
  showOverdueBadge: boolean;
  onAction: (type: 'done' | 'edit' | 'extend' | 'delete', id: string) => void;
}) {
  const groups: Record<string, SlateTask[]> = { must: [], should: [], could: [] };
  [...tasks]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .forEach(t => { if (groups[t.priority]) groups[t.priority].push(t); });

  return (
    <>
      {(['must', 'should', 'could'] as const).map(p => {
        if (!groups[p].length) return null;
        return (
          <div key={p} className={styles.radarGroup}>
            <div className={styles.radarGroupLabel}>{p.charAt(0).toUpperCase() + p.slice(1)}</div>
            {groups[p].map(t => (
              <RadarItem
                key={t.id}
                task={t}
                subtasks={subtasks.filter(s => s.task_id === t.id)}
                showOverdueBadge={showOverdueBadge}
                onDone={() => onAction('done', t.id)}
                onEdit={() => onAction('edit', t.id)}
                onExtend={() => onAction('extend', t.id)}
                onDelete={() => onAction('delete', t.id)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

export default function RadarModal() {
  const { radarModal, tasks, subtasks, closeRadarModal, toggleTask, deleteTask, openEditModal, openExtendModal } = useSlateStore();

  if (!radarModal) return null;
  const { dayName, dateFmt, dateStr, isToday } = radarModal;

  const active = tasks.filter(t => !t.completed);
  const overdueTasks = active.filter(t => isOverdue(t.due_date));
  const dayTasks = active.filter(t => t.due_date === dateStr && (!isToday || !isOverdue(t.due_date)));
  const hasContent = overdueTasks.length > 0 || dayTasks.length > 0;

  function handleAction(type: 'done' | 'edit' | 'extend' | 'delete', id: string) {
    closeRadarModal();
    if (type === 'done') toggleTask(id);
    else if (type === 'edit') openEditModal(id);
    else if (type === 'extend') openExtendModal(id);
    else if (type === 'delete') { if (confirm('Delete this task?')) deleteTask(id); }
  }

  return (
    <div
      className={styles.overlayCenter}
      onClick={e => { if (e.target === e.currentTarget) closeRadarModal(); }}
    >
      <div className={styles.cardWide}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{dayName}</div>
            <div className={styles.radarHeaderSub}>{dateFmt}</div>
          </div>
          <button className={styles.close} onClick={closeRadarModal}>✕</button>
        </div>

        {!hasContent && (
          <div className={styles.radarEmpty}>Nothing scheduled</div>
        )}

        {overdueTasks.length > 0 && (
          <div className={styles.radarGroup}>
            <div className={`${styles.radarGroupLabel} ${styles.overdue}`}>Overdue</div>
            <PriorityGroups
              tasks={overdueTasks}
              subtasks={subtasks}
              showOverdueBadge={true}
              onAction={handleAction}
            />
          </div>
        )}

        {dayTasks.length > 0 && (
          <div className={styles.radarGroup} style={{ marginTop: overdueTasks.length ? 14 : 0 }}>
            <div className={styles.radarGroupLabel}>{dayName}</div>
            <PriorityGroups
              tasks={dayTasks}
              subtasks={subtasks}
              showOverdueBadge={false}
              onAction={handleAction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
