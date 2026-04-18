'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import { isTodayDate } from '@/lib/slate/dateUtils';
import styles from './views.module.css';

export default function WorkView() {
  const { tasks, subtasks, todayFilter, toggleTodayFilter, clearTab } = useSlateStore();

  const active = tasks.filter(t => !t.completed && t.category === 'work');
  const visible = todayFilter.work
    ? active.filter(t => isTodayDate(t.due_date))
    : active;

  return (
    <div className={styles.page}>
      <div className={styles.todayBar}>
        <button
          className={`${styles.toggle} ${todayFilter.work ? styles.on : ''}`}
          onClick={() => toggleTodayFilter('work')}
        >
          <span className={styles.toggleDot} />Due Today
        </button>
      </div>
      <TaskList
        tasks={visible}
        subtasks={subtasks}
        emptyMsg={todayFilter.work ? 'Nothing due today' : 'No work tasks'}
      />
      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('work')}>Clean Slate</button>
      </div>
    </div>
  );
}
