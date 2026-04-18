'use client';

import { useSlateStore } from '@/store/useSlateStore';
import { isOverdue, offsetDate } from '@/lib/slate/dateUtils';
import { PRIORITY_WEIGHT } from '@/lib/slate/scoring';
import styles from './views.module.css';

export default function RadarView() {
  const { tasks, openRadarModal } = useSlateStore();
  const active = tasks.filter(t => !t.completed);

  const dayData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = offsetDate(i);

    const taskList = i === 0
      ? active.filter(t => t.due_date === dateStr || isOverdue(t.due_date))
      : active.filter(t => t.due_date === dateStr);

    const must   = taskList.filter(t => t.priority === 'must').length;
    const should = taskList.filter(t => t.priority === 'should').length;
    const could  = taskList.filter(t => t.priority === 'could').length;
    const score  = must * PRIORITY_WEIGHT.must + should * PRIORITY_WEIGHT.should + could * PRIORITY_WEIGHT.could;

    let dayName: string;
    if (i === 0) dayName = 'Today';
    else if (i === 1) dayName = 'Tomorrow';
    else dayName = d.toLocaleDateString('en-SG', { weekday: 'long' });

    const dateFmt = d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
    const loadClass = score >= 7 ? styles.loadHeavy : score >= 3 ? styles.loadBusy : score > 0 ? styles.loadLight : '';

    return { i, d, dateStr, dayName, dateFmt, must, should, could, score, loadClass };
  });

  return (
    <div className={styles.page} style={{ paddingTop: 8 }}>
      <div className={styles.radarList}>
        {dayData.map(({ i, dateStr, dayName, dateFmt, must, should, could, loadClass }) => (
          <div
            key={dateStr}
            className={`${styles.radarDay} ${loadClass}`}
            onClick={() => openRadarModal({ dayName, dateFmt, dateStr, isToday: i === 0 })}
          >
            <div className={styles.radarDayLabel}>
              <div className={styles.radarDayName}>{dayName}</div>
              <div className={styles.radarDayDate}>{dateFmt}</div>
            </div>
            <div className={styles.radarCounts}>
              <div className={styles.radarCount}>
                <span className={`${styles.radarCountNum} ${must > 0 ? styles.must : ''}`}>{must}</span>
                <span className={styles.radarCountLbl}>Must</span>
              </div>
              <div className={styles.radarCount}>
                <span className={`${styles.radarCountNum} ${should > 0 ? styles.should : ''}`}>{should}</span>
                <span className={styles.radarCountLbl}>Should</span>
              </div>
              <div className={styles.radarCount}>
                <span className={`${styles.radarCountNum} ${could > 0 ? styles.could : ''}`}>{could}</span>
                <span className={styles.radarCountLbl}>Could</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
