'use client';

import { useEffect } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { SECTIONS } from '@/lib/slate/onboardingChecklist';
import OnboardingCard from '@/components/onboarding/OnboardingCard';
import NewOnboardingModal from '@/components/onboarding/NewOnboardingModal';
import fabStyles from '@/components/ui/FAB.module.css';
import styles from './views.module.css';

export default function OnboardingView() {
  const onboardings = useOnboardingStore(s => s.onboardings);
  const showArchived = useOnboardingStore(s => s.showArchived);
  const newModal = useOnboardingStore(s => s.newModal);
  const loadOnboardings = useOnboardingStore(s => s.loadOnboardings);
  const openNewModal = useOnboardingStore(s => s.openNewModal);
  const toggleShowArchived = useOnboardingStore(s => s.toggleShowArchived);

  useEffect(() => { loadOnboardings(); }, [loadOnboardings]);

  const archivedCount = onboardings.filter(o => o.archived).length;
  const visible = showArchived
    ? onboardings
    : onboardings.filter(o => !o.archived);

  const unsorted = visible.filter(o => !o.checks?._stage);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Account Onboarding</span>
        {archivedCount > 0 && (
          <button className={styles.toggle} onClick={toggleShowArchived}>
            <span className={styles.toggleDot} />
            {showArchived ? 'Hide archived' : `Archived (${archivedCount})`}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
          No onboardings yet
        </div>
      ) : (
        <>
          {SECTIONS.map(stage => {
            const group = visible.filter(o => o.checks?._stage === stage);
            if (group.length === 0) return null;
            return (
              <div key={stage} className={styles.onboardingGroup}>
                <div className={styles.onboardingGroupHeader}>{stage}</div>
                {group.map(o => <OnboardingCard key={o.id} onboarding={o} />)}
              </div>
            );
          })}

          {unsorted.length > 0 && (
            <div className={styles.onboardingGroup}>
              <div className={styles.onboardingGroupHeader}>Unsorted</div>
              {unsorted.map(o => <OnboardingCard key={o.id} onboarding={o} />)}
            </div>
          )}
        </>
      )}

      {newModal && <NewOnboardingModal />}

      <button className={fabStyles.fab} onClick={openNewModal} aria-label="New onboarding">
        +
      </button>
    </div>
  );
}
