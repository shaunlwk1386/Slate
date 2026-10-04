export const WORK_SEGMENTS     = ['Onboarding', 'Chasing', 'Admin', 'Misc'] as const;
export const PERSONAL_SEGMENTS = ['Chores', 'Health', 'Finances', 'TCG']   as const;

export const SEGMENT_COLORS: Record<string, { bg: string; text: string }> = {
  // Work
  'Admin':      { bg: '#f1f5f9', text: '#475569' },
  'Onboarding': { bg: '#eff6ff', text: '#3b82f6' },
  'Chasing':    { bg: '#fff7ed', text: '#ea580c' },
  'Misc':       { bg: '#f5f3ff', text: '#7c3aed' },
  // Personal
  'Chores':     { bg: '#fef9c3', text: '#ca8a04' },
  'Health':     { bg: '#f0fdf4', text: '#16a34a' },
  'Finances':   { bg: '#f0fdfa', text: '#0d9488' },
  'TCG':        { bg: '#fdf4ff', text: '#a21caf' },
};

export function getDefaultSegments(category: 'personal' | 'work'): string[] {
  return category === 'personal' ? [...PERSONAL_SEGMENTS] : [...WORK_SEGMENTS];
}

export function segmentStyle(name: string): { bg: string; text: string } {
  return SEGMENT_COLORS[name] ?? { bg: '#f0fdf4', text: '#16a34a' };
}
