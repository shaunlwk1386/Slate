'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import styles from './views.module.css';

export default function AllView() {
  const { tasks, subtasks, clearTab } = useSlateStore();

  const active = tasks.filter(t => !t.completed);

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>Slate</span>
        <span className={styles.brandTag}>by egg</span>
      </div>

      <TaskList
        tasks={active}
        subtasks={subtasks}
        showBadge
        emptyMsg="All clear"
      />

      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('all')}>Clean Slate</button>
      </div>
    </div>
  );
}
