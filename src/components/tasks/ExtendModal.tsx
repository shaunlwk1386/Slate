'use client';

import { useState, useEffect } from 'react';
import { useSlateStore } from '@/store/useSlateStore';
import styles from './Modal.module.css';

export default function ExtendModal() {
  const { extendModal, closeExtendModal, extendTask, extendTaskCustom } = useSlateStore();
  const { open } = extendModal;
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    if (!open) return;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setCustomDate(d.toISOString().split('T')[0]);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlayCenter}
      onClick={e => { if (e.target === e.currentTarget) closeExtendModal(); }}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Extend Due Date</span>
          <button className={styles.close} onClick={closeExtendModal}>✕</button>
        </div>
        <div className={styles.quickRow}>
          <button className={styles.btnQuick} onClick={() => extendTask(1)}>Tomorrow</button>
          <button className={styles.btnQuick} onClick={() => extendTask(3)}>+3 Days</button>
          <button className={styles.btnQuick} onClick={() => extendTask(7)}>Next Week</button>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Custom Date</label>
          <input
            className={styles.input}
            type="date"
            value={customDate}
            onChange={e => setCustomDate(e.target.value)}
          />
        </div>
        <button className={styles.submit} onClick={() => extendTaskCustom(customDate)}>Save</button>
      </div>
    </div>
  );
}
