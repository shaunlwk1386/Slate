'use client';

import { useInitData } from '@/hooks/useInitData';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import TaskModal from '@/components/tasks/TaskModal';
import ExtendModal from '@/components/tasks/ExtendModal';
import RadarModal from '@/components/tasks/RadarModal';
import Toast from '@/components/ui/Toast';
import FAB from '@/components/ui/FAB';

export default function SlateProvider({ children }: { children: React.ReactNode }) {
  useInitData();
  useRealtimeSync();

  return (
    <>
      {children}
      <FAB />
      <TaskModal />
      <ExtendModal />
      <RadarModal />
      <Toast />
    </>
  );
}
