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

  function sortTasks(list: SlateTask[]) {
    return [...list].sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
      if (a.due_time) return -1;
      if (b.due_time) return 1;
      return 0;
    });
  }

  function renderCards(list: SlateTask[], isOverdueGroup: boolean) {
    const sorted = sortTasks(list);
    const groups: { priority: string; tasks: SlateTask[] }[] = [];
    for (const t of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.priority === t.priority) {
        last.tasks.push(t);
      } else {
        groups.push({ priority: t.priority, tasks: [t] });
      }
    }
    return groups.map(({ priority, tasks }) => (
      <div key={priority} className={`${styles.priorityGroup} ${styles[priority]}`}>
        {tasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            subtasks={subtasks.filter(s => s.task_id === t.id)}
            isOverdueCard={isOverdueGroup && isOverdue(t.due_date)}
            inGroup
          />
        ))}
      </div>
    ));
  }

  function renderGroup(list: SlateTask[], isOverdueGroup: boolean) {
    if (!showBadge) return <div className={styles.groups}>{renderCards(list, isOverdueGroup)}</div>;

    const personal = list.filter(t => t.category === 'personal');
    const work = list.filter(t => t.category === 'work');

    return (
      <>
        {personal.length > 0 && (
          <>
            <div className={styles.catLabel}>Personal</div>
            <div className={styles.groups}>{renderCards(personal, isOverdueGroup)}</div>
          </>
        )}
        {work.length > 0 && (
          <>
            <div className={styles.catLabel}>Work</div>
            <div className={styles.groups}>{renderCards(work, isOverdueGroup)}</div>
          </>
        )}
      </>
    );
  }

  return (
    <div className={styles.root}>
      {sortedDates.map(dateKey => {
        const { label, isPast } = formatDateLabel(dateKey);
        return (
          <div key={dateKey}>
            <div className={`${styles.sectionLabel} ${isPast ? styles.past : ''}`}>{label}</div>
            {renderGroup(dateMap[dateKey], isPast)}
          </div>
        );
      })}

      {noDate.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>No Date</div>
          {renderGroup(noDate, false)}
        </div>
      )}
    </div>
  );
}
