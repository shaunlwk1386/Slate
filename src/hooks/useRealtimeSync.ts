'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSlateStore } from '@/store/useSlateStore';

export function useRealtimeSync() {
  const loadAll = useSlateStore(s => s.loadAll);

  useEffect(() => {
    const channel = supabase
      .channel('slate-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slate_tasks' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slate_subtasks' }, loadAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
