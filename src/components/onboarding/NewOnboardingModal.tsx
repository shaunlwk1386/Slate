'use client';

import { useState, useRef } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import modalStyles from '@/components/tasks/Modal.module.css';

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function displayToIso(val: string): string {
  const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return '';
  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export default function NewOnboardingModal() {
  const closeNewModal = useOnboardingStore(s => s.closeNewModal);
  const addOnboarding = useOnboardingStore(s => s.addOnboarding);

  const today = todayIso();
  const [brandName, setBrandName] = useState('');
  const [verbalDate, setVerbalDate] = useState(today);
  const [dateDisplay, setDateDisplay] = useState(isoToDisplay(today));
  const [submitting, setSubmitting] = useState(false);

  const datePickerRef = useRef<HTMLInputElement>(null);

  function handleDateDisplayChange(val: string) {
    setDateDisplay(val);
    const iso = displayToIso(val);
    if (iso) setVerbalDate(iso);
  }

  function handlePickerChange(val: string) {
    setVerbalDate(val);
    setDateDisplay(isoToDisplay(val));
  }

  async function handleSubmit() {
    if (!brandName.trim()) return;
    setSubmitting(true);
    await addOnboarding(brandName.trim(), verbalDate || null);
    setSubmitting(false);
    closeNewModal();
  }

  return (
    <div className={modalStyles.overlayCenter} onClick={closeNewModal}>
      <div className={modalStyles.card} onClick={e => e.stopPropagation()}>
        <div className={modalStyles.header}>
          <span className={modalStyles.title}>New Onboarding</span>
          <button className={modalStyles.close} onClick={closeNewModal}>✕</button>
        </div>

        <div className={modalStyles.group}>
          <label className={modalStyles.label}>Brand Name</label>
          <input
            className={modalStyles.input}
            placeholder="e.g. Shake Shack"
            value={brandName}
            autoFocus
            onChange={e => setBrandName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        <div className={modalStyles.group}>
          <label className={modalStyles.label}>Creation Date</label>
          <div className={modalStyles.inputRow}>
            <input
              className={modalStyles.inputFlex}
              style={{ maxWidth: 110 }}
              placeholder="dd/mm/yy"
              value={dateDisplay}
              onChange={e => handleDateDisplayChange(e.target.value)}
            />
            <input
              ref={datePickerRef}
              type="date"
              className={modalStyles.inputPicker}
              value={verbalDate}
              onChange={e => handlePickerChange(e.target.value)}
            />
          </div>
        </div>

        <button
          className={modalStyles.submit}
          onClick={handleSubmit}
          disabled={!brandName.trim() || submitting}
        >
          {submitting ? 'Adding…' : 'Start Onboarding'}
        </button>
      </div>
    </div>
  );
}
