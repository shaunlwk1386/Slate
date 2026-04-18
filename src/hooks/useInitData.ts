'use client';

import { useEffect } from 'react';
import { useSlateStore } from '@/store/useSlateStore';

export function useInitData() {
  const loadAll = useSlateStore(s => s.loadAll);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
