'use client';

import type { SlateTask, SlateSubtask } from '@/lib/slate/types';
import { PRIORITY_ORDER } from '@/lib/slate/scoring';
import { formatDateLabel, isOverdue } from '@/lib/slate/dateUtils';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';

interface Props {
  tasks: SlateTask[];
  subtasks: SlateSubtask[];
  showBadge?: boolean;
  emptyMsg?: string;
}

export default function TaskList({ tasks, subtasks, showBadge = false, emptyMsg = 'All clear' }: Props) {
  if (!tasks.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✓</div>
        <p>{emptyMsg}</p>
      </div>
    );
  }

  // Group by due_date
  const dateMap: Record<string, SlateTask[]> = {};
  const noDate: SlateTask[] = [];
  tasks.forEach(t => {
    if (!t.due_date) { noDate.push(t); return; }
    if (!dateMap[t.due_date]) dateMap[t.due_date] = [];
    dateMap[t.due_date].push(t);
  });

  const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

  return (
    <div className={styles.root}>
      {sortedDates.map(dateKey => {
        const { label, isPast } = formatDateLabel(dateKey);
        const sorted = [...dateMap[dateKey]].sort((a, b) => {
          const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (pDiff !== 0) return pDiff;
          if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
          if (a.due_time) return -1;
          if (b.due_time) return 1;
          return 0;
        });
        return (
          <div key={dateKey}>
            <div className={`${styles.sectionLabel} ${isPast ? styles.past : ''}`}>{label}</div>
            <div className={styles.list}>
              {sorted.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  subtasks={subtasks.filter(s => s.task_id === t.id)}
                  showBadge={showBadge}
                  isOverdueCard={isPast && isOverdue(t.due_date)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {noDate.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>No Date</div>
          <div className={styles.list}>
            {[...noDate]
              .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
              .map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  subtasks={subtasks.filter(s => s.task_id === t.id)}
                  showBadge={showBadge}
                  isOverdueCard={false}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
