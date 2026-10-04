'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import styles from './views.module.css';

export default function PersonalView() {
  const { tasks, subtasks, clearTab } = useSlateStore();

  const active = tasks.filter(t => !t.completed && t.category === 'personal');

  return (
    <div className={styles.page}>
      <TaskList
        tasks={active}
        subtasks={subtasks}
        category="personal"
        emptyMsg="No personal tasks"
      />
      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('personal')}>Clean Slate</button>
      </div>
    </div>
  );
}
