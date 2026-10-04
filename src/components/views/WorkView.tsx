'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import styles from './views.module.css';

export default function WorkView() {
  const { tasks, subtasks, clearTab } = useSlateStore();

  const active = tasks.filter(t => !t.completed && t.category === 'work');

  return (
    <div className={styles.page}>
      <TaskList
        tasks={active}
        subtasks={subtasks}
        category="work"
        emptyMsg="No work tasks"
      />
      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('work')}>Clean Slate</button>
      </div>
    </div>
  );
}
