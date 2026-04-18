'use client';

import { useSlateStore } from '@/store/useSlateStore';
import TaskCard from '@/components/tasks/TaskCard';
import type { DoneFilter } from '@/lib/slate/types';
import styles from './views.module.css';
import taskListStyles from '@/components/tasks/TaskList.module.css';

function formatCompletionDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
}

const DONE_FILTERS: { value: DoneFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
];

export default function DoneView() {
  const { tasks, subtasks, doneFilter, setDoneFilter, clearDone } = useSlateStore();
  const now = new Date();

  const allDone = tasks.filter(t => t.completed);

  // Stats (always all categories)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const todayCount = allDone.filter(t => t.completed_at && new Date(t.completed_at) >= todayStart).length;
  const weekCount  = allDone.filter(t => t.completed_at && new Date(t.completed_at) >= weekStart).length;
  const monthCount = allDone.filter(t => {
    if (!t.completed_at) return false;
    const d = new Date(t.completed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const monthName = now.toLocaleDateString('en-SG', { month: 'short' });

  // Filter by category
  const filtered = doneFilter === 'all' ? allDone : allDone.filter(t => t.category === doneFilter);
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
  );

  // Group by completion date
  const groups: Record<string, typeof sorted> = {};
  sorted.forEach(t => {
    const d = t.completed_at ? new Date(t.completed_at) : new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return (
    <div className={styles.page}>
      {/* Stats */}
      <div className={styles.doneStatsRow}>
        <div className={styles.doneStatBlock}>
          <span className={styles.doneStatNum}>{todayCount}</span>
          <span className={styles.doneStatLbl}>Today</span>
        </div>
        <div className={styles.doneStatBlock}>
          <span className={styles.doneStatNum}>{weekCount}</span>
          <span className={styles.doneStatLbl}>Week</span>
        </div>
        <div className={styles.doneStatBlock}>
          <span className={styles.doneStatNum}>{monthCount}</span>
          <span className={styles.doneStatLbl}>{monthName}</span>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.doneFilterBar}>
        <div className={styles.segGroup}>
          {DONE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.seg} ${doneFilter === f.value ? styles.active : ''}`}
              onClick={() => setDoneFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className={taskListStyles.empty}>
          <div className={taskListStyles.emptyIcon}>✓</div>
          <p>Nothing completed yet</p>
        </div>
      ) : (
        Object.keys(groups)
          .sort((a, b) => b.localeCompare(a))
          .map(dateKey => {
            const count = groups[dateKey].length;
            return (
              <div key={dateKey}>
                <div className={taskListStyles.sectionLabel}>
                  {formatCompletionDateLabel(dateKey)} · {count} task{count !== 1 ? 's' : ''}
                </div>
                <div className={taskListStyles.list}>
                  {groups[dateKey].map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      subtasks={subtasks.filter(s => s.task_id === t.id)}
                      showBadge={doneFilter === 'all'}
                    />
                  ))}
                </div>
              </div>
            );
          })
      )}

      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={clearDone}>Clean Slate</button>
      </div>
    </div>
  );
}
