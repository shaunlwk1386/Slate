'use client';

import { create } from 'zustand';
import type { Onboarding, OnboardingItem } from '@/lib/slate/onboardingChecklist';
import { createDefaultItems } from '@/lib/slate/onboardingChecklist';
import {
  fetchOnboardings,
  insertOnboarding,
  patchOnboardingChecks,
  patchOnboardingItems,
  patchOnboardingBrandName,
  patchOnboardingArchived,
  removeOnboarding,
} from '@/lib/slate/onboardings';

interface OnboardingState {
  onboardings: Onboarding[];
  showArchived: boolean;
  newModal: boolean;

  loadOnboardings: () => Promise<void>;
  addOnboarding: (brandName: string, verbalDate: string | null) => Promise<void>;

  updateBrandName: (id: string, name: string) => Promise<void>;
  setStage: (id: string, stage: string | null) => Promise<void>;
  toggleCheck: (id: string, itemId: string) => Promise<void>;
  updateItemLabel: (id: string, itemId: string, label: string) => Promise<void>;
  deleteItem: (id: string, itemId: string) => Promise<void>;
  addItem: (id: string, stage: string, bucket: string, label: string) => Promise<void>;

  archiveOnboarding: (id: string) => Promise<void>;
  unarchiveOnboarding: (id: string) => Promise<void>;
  deleteOnboarding: (id: string) => Promise<void>;
  toggleShowArchived: () => void;
  openNewModal: () => void;
  closeNewModal: () => void;
}

function getItems(o: Onboarding): OnboardingItem[] {
  return o.items && o.items.length > 0 ? o.items : createDefaultItems();
}

function patchItems(
  state: { onboardings: Onboarding[] },
  id: string,
  updater: (items: OnboardingItem[]) => OnboardingItem[]
): { onboardings: Onboarding[] } {
  return {
    onboardings: state.onboardings.map(o =>
      o.id === id ? { ...o, items: updater(getItems(o)) } : o
    ),
  };
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  onboardings: [],
  showArchived: false,
  newModal: false,

  loadOnboardings: async () => {
    try {
      const onboardings = await fetchOnboardings();
      set({ onboardings });
    } catch {
      // silently fail — user will see empty state
    }
  },

  addOnboarding: async (brandName, verbalDate) => {
    try {
      const items = createDefaultItems();
      const row = await insertOnboarding(brandName, verbalDate, items);
      set(s => ({ onboardings: [row, ...s.onboardings] }));
    } catch {
      // no-op
    }
  },

  updateBrandName: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(s => ({ onboardings: s.onboardings.map(o => o.id === id ? { ...o, brand_name: trimmed } : o) }));
    try {
      await patchOnboardingBrandName(id, trimmed);
    } catch {
      // no-op — optimistic update stays
    }
  },

  setStage: async (id, stage) => {
    const o = get().onboardings.find(ob => ob.id === id);
    if (!o) return;
    const newChecks = { ...(o.checks || {}) };
    if (stage) newChecks._stage = stage;
    else delete newChecks._stage;
    set(s => ({ onboardings: s.onboardings.map(ob => ob.id === id ? { ...ob, checks: newChecks } : ob) }));
    try {
      await patchOnboardingChecks(id, newChecks);
    } catch {
      set(s => ({ onboardings: s.onboardings.map(ob => ob.id === id ? { ...ob, checks: o.checks } : ob) }));
    }
  },

  toggleCheck: async (id, itemId) => {
    const onboarding = get().onboardings.find(o => o.id === id);
    if (!onboarding) return;
    const items = getItems(onboarding);
    const newItems = items.map(item => {
      if (item.id !== itemId) return item;
      const next = !item.state ? 'done' : item.state === 'done' ? 'na' : null;
      return { ...item, state: next } as OnboardingItem;
    });
    set(s => patchItems(s, id, () => newItems));
    try {
      await patchOnboardingItems(id, newItems);
    } catch {
      set(s => patchItems(s, id, () => items));
    }
  },

  updateItemLabel: async (id, itemId, label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const onboarding = get().onboardings.find(o => o.id === id);
    if (!onboarding) return;
    const newItems = getItems(onboarding).map(item =>
      item.id === itemId ? { ...item, label: trimmed } : item
    );
    set(s => patchItems(s, id, () => newItems));
    try {
      await patchOnboardingItems(id, newItems);
    } catch {
      // revert would go here — skip for simplicity
    }
  },

  deleteItem: async (id, itemId) => {
    const onboarding = get().onboardings.find(o => o.id === id);
    if (!onboarding) return;
    const newItems = getItems(onboarding).filter(item => item.id !== itemId);
    set(s => patchItems(s, id, () => newItems));
    try {
      await patchOnboardingItems(id, newItems);
    } catch {
      // no-op
    }
  },

  addItem: async (id, stage, bucket, label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const onboarding = get().onboardings.find(o => o.id === id);
    if (!onboarding) return;
    const newItem: OnboardingItem = {
      id: crypto.randomUUID(),
      stage,
      bucket,
      label: trimmed,
      state: null,
    };
    const newItems = [...getItems(onboarding), newItem];
    set(s => patchItems(s, id, () => newItems));
    try {
      await patchOnboardingItems(id, newItems);
    } catch {
      // no-op
    }
  },

  archiveOnboarding: async (id) => {
    set(s => ({
      onboardings: s.onboardings.map(o => o.id === id ? { ...o, archived: true } : o),
    }));
    await patchOnboardingArchived(id, true);
  },

  unarchiveOnboarding: async (id) => {
    set(s => ({
      onboardings: s.onboardings.map(o => o.id === id ? { ...o, archived: false } : o),
    }));
    await patchOnboardingArchived(id, false);
  },

  deleteOnboarding: async (id) => {
    if (!confirm('Delete this onboarding? This cannot be undone.')) return;
    set(s => ({ onboardings: s.onboardings.filter(o => o.id !== id) }));
    await removeOnboarding(id);
  },

  toggleShowArchived: () => set(s => ({ showArchived: !s.showArchived })),
  openNewModal: () => set({ newModal: true }),
  closeNewModal: () => set({ newModal: false }),
}));
