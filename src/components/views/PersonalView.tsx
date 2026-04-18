'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import { isTodayDate } from '@/lib/slate/dateUtils';
import styles from './views.module.css';

export default function PersonalView() {
  const { tasks, subtasks, todayFilter, toggleTodayFilter, clearTab } = useSlateStore();

  const active = tasks.filter(t => !t.completed && t.category === 'personal');
  const visible = todayFilter.personal
    ? active.filter(t => isTodayDate(t.due_date))
    : active;

  return (
    <div className={styles.page}>
      <div className={styles.todayBar}>
        <button
          className={`${styles.toggle} ${todayFilter.personal ? styles.on : ''}`}
          onClick={() => toggleTodayFilter('personal')}
        >
          <span className={styles.toggleDot} />Due Today
        </button>
      </div>
      <TaskList
        tasks={visible}
        subtasks={subtasks}
        emptyMsg={todayFilter.personal ? 'Nothing due today' : 'No personal tasks'}
      />
      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('personal')}>Clean Slate</button>
      </div>
    </div>
  );
}
