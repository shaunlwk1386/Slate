'use client';

import { useSlateStore } from '@/store/useSlateStore';
import styles from './FAB.module.css';

export default function FAB() {
  const openAddModal = useSlateStore(s => s.openAddModal);

  return (
    <button className={styles.fab} onClick={openAddModal} aria-label="Add task">
      +
    </button>
  );
}
