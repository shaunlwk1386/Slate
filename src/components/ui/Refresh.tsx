'use client';

import { useState } from 'react';
import { useSlateStore } from '@/store/useSlateStore';
import styles from './Refresh.module.css';

export default function Refresh() {
  const loadAll = useSlateStore(s => s.loadAll);
  const showToast = useSlateStore(s => s.showToast);
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await loadAll();
      showToast('Refreshed');
    } catch {
      showToast('Refresh failed');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <button
      className={`${styles.egg} ${spinning ? styles.spinning : ''}`}
      onClick={handleClick}
      aria-label="Refresh"
    />
  );
}
