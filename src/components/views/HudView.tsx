'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import { isTodayDate } from '@/lib/slate/dateUtils';
import { PRIORITY_WEIGHT } from '@/lib/slate/scoring';
import styles from './HudView.module.css';

export default function HudView() {
  const { tasks, subtasks, todayFilter, toggleTodayFilter } = useSlateStore();

  const active = tasks.filter(t => !t.completed);
  const todayTasks = active.filter(t => isTodayDate(t.due_date));
  const loadScore = todayTasks.reduce((sum, t) => sum + (PRIORITY_WEIGHT[t.priority] || 0), 0);
  const mustCount = todayTasks.filter(t => t.priority === 'must').length;
  const loadState = loadScore >= 7 ? 'heavy' : loadScore >= 3 ? 'busy' : null;

  const base = todayFilter.combined ? active.filter(t => isTodayDate(t.due_date)) : active;

  return (
    <div className={styles.page}>
      <div className={styles.controls}>
        <button
          className={`${styles.toggle} ${todayFilter.combined ? styles.on : ''}`}
          onClick={() => toggleTodayFilter('combined')}
        >
          <span className={styles.dot} />Today
        </button>
      </div>

      {loadState && (
        <div className={`${styles.loadBanner} ${styles[loadState]}`}>
          {loadState === 'heavy'
            ? `Heavy day${mustCount ? ` — ${mustCount} must` : ''}`
            : 'Busy day'}
        </div>
      )}

      <TaskList
        tasks={base}
        subtasks={subtasks}
        showBadge
        emptyMsg={todayFilter.combined ? 'Nothing due today' : 'All clear'}
      />
    </div>
  );
}
