'use client';

import { useState } from 'react';
import { useSlateStore } from '@/store/useSlateStore';
import TaskList from '@/components/tasks/TaskList';
import { isTodayDate, isOverdue } from '@/lib/slate/dateUtils';
import { PRIORITY_WEIGHT, buildRecommendations } from '@/lib/slate/scoring';
import styles from './views.module.css';

export default function AllView() {
  const { tasks, subtasks, todayFilter, focusModeOn, toggleTodayFilter, toggleFocusMode, clearTab } = useSlateStore();
  const [recOpen, setRecOpen] = useState(false);
  const [recTime, setRecTime] = useState(30);
  const [recContext, setRecContext] = useState('any');

  const active = tasks.filter(t => !t.completed);

  // Load indicator
  const todayTasks = active.filter(t => isTodayDate(t.due_date));
  const loadScore = todayTasks.reduce((sum, t) => sum + (PRIORITY_WEIGHT[t.priority] || 0), 0);
  const mustCount = todayTasks.filter(t => t.priority === 'must').length;
  const loadState = loadScore >= 7 ? 'heavy' : loadScore >= 3 ? 'busy' : null;

  // Filter
  let base = todayFilter.combined ? active.filter(t => isTodayDate(t.due_date)) : active;
  const allBase = base;
  if (focusModeOn) base = base.filter(t => t.priority === 'must');
  const hiddenCount = allBase.filter(t => t.priority !== 'must').length;

  // Recommendations
  const recs = recOpen ? buildRecommendations(tasks, recTime, recContext) : [];

  return (
    <div className={styles.page}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandTitle}>Slate</span>
        <span className={styles.brandTag}>by egg</span>
      </div>

      {/* Controls */}
      <div className={styles.combinedControls}>
        <div className={styles.controlGroup}>
          <button
            className={`${styles.toggle} ${focusModeOn ? styles.on : ''}`}
            onClick={toggleFocusMode}
          >
            <span className={styles.toggleDot} />Focus
          </button>
        </div>
        <button
          className={`${styles.toggle} ${todayFilter.combined ? styles.on : ''}`}
          onClick={() => toggleTodayFilter('combined')}
        >
          <span className={styles.toggleDot} />Due Today
        </button>
      </div>

      {/* Recommended Now */}
      <div className={styles.recSection}>
        <div className={styles.recHeader} onClick={() => setRecOpen(o => !o)}>
          <span className={styles.recHeaderTitle}>Recommended Now</span>
          <span className={`${styles.recChevron} ${recOpen ? styles.open : ''}`}>▾</span>
        </div>
        {recOpen && (
          <div className={`${styles.recBody} ${styles.open}`}>
            <div className={styles.recControls}>
              <div className={styles.recControl}>
                <div className={styles.recControlLabel}>Available Time</div>
                <select
                  className={styles.recSelect}
                  value={recTime}
                  onChange={e => setRecTime(Number(e.target.value))}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className={styles.recControl}>
                <div className={styles.recControlLabel}>Situation</div>
                <select
                  className={styles.recSelect}
                  value={recContext}
                  onChange={e => setRecContext(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="physical">Physical</option>
                  <option value="mental">Mental</option>
                  <option value="social">Social</option>
                  <option value="work">Work</option>
                  <option value="errands">Errands</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className={styles.recOutput}>
              {recs.length === 0 ? (
                <div className={styles.recEmpty}>No tasks to recommend</div>
              ) : (
                recs.map((r, i) => (
                  <div key={r.task.id} className={`${styles.recItem} ${i === 0 ? styles.primary : ''}`}>
                    <span className={styles.recRank}>{i === 0 ? '→' : i + 1}</span>
                    <div className={styles.recInfo}>
                      <div className={styles.recTitle}>{r.task.title}</div>
                      <div className={styles.recReason}>
                        {r.reasons.slice(0, 3).join(' · ') || 'General task'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Load indicator */}
      {loadState && (
        <div className={`${styles.loadIndicator} ${styles[loadState]}`}>
          {loadState === 'heavy'
            ? `Heavy day${mustCount ? ` — ${mustCount} must task${mustCount > 1 ? 's' : ''}` : ''}`
            : 'Busy day'}
        </div>
      )}

      {/* Task list */}
      <TaskList
        tasks={base}
        subtasks={subtasks}
        showBadge
        emptyMsg={todayFilter.combined ? 'Nothing due today' : focusModeOn ? 'No must tasks' : 'All clear'}
      />

      {focusModeOn && hiddenCount > 0 && (
        <div className={styles.focusHidden}>
          {hiddenCount} lower-priority task{hiddenCount > 1 ? 's' : ''} hidden in Focus mode
        </div>
      )}

      <div className={styles.clearBar}>
        <button className={styles.btnClear} onClick={() => clearTab('all')}>Clean Slate</button>
      </div>
    </div>
  );
}
