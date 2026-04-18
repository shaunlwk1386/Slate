'use client';

import { useSlateStore } from '@/store/useSlateStore';
import styles from './Toast.module.css';

export default function Toast() {
  const { toast, undoToast, undoClear } = useSlateStore();

  return (
    <>
      <div className={`${styles.toast} ${toast.visible ? styles.show : ''}`}>
        {toast.msg}
      </div>
      <div className={`${styles.undoToast} ${undoToast.visible ? styles.show : ''}`}>
        <span>{undoToast.msg}</span>
        <button className={styles.undoBtn} onClick={undoClear}>Undo</button>
      </div>
    </>
  );
}
