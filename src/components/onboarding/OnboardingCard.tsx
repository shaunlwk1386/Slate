'use client';

import { useState } from 'react';
import type { Onboarding, OnboardingItem } from '@/lib/slate/onboardingChecklist';
import { SECTIONS, isOnboardingComplete, countChecked, createDefaultItems } from '@/lib/slate/onboardingChecklist';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import styles from './OnboardingCard.module.css';

const STAGE_COLORS: Record<string, { bg: string; text: string; sectionBg: string; border: string }> = {
  'Engagement':       { bg: '#eff6ff', text: '#3b82f6', sectionBg: '#eff6ff', border: '#bfdbfe' },
  'Negotiation':      { bg: '#f0f9ff', text: '#0ea5e9', sectionBg: '#f0f9ff', border: '#bae6fd' },
  'Onboarding':       { bg: '#f5f3ff', text: '#8b5cf6', sectionBg: '#f5f3ff', border: '#ddd6fe' },
  'Marketing Launch': { bg: '#fff7ed', text: '#f59e0b', sectionBg: '#fff7ed', border: '#fed7aa' },
  'Training':         { bg: '#f0fdfa', text: '#0d9488', sectionBg: '#f0fdfa', border: '#99f6e4' },
  'Deployment':       { bg: '#eef2ff', text: '#6366f1', sectionBg: '#eef2ff', border: '#c7d2fe' },
  'Monitor':          { bg: '#f0fdf4', text: '#22c55e', sectionBg: '#f0fdf4', border: '#bbf7d0' },
};

interface Props {
  onboarding: Onboarding;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OnboardingCard({ onboarding }: Props) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(onboarding.brand_name);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const updateBrandName = useOnboardingStore(s => s.updateBrandName);
  const setStage = useOnboardingStore(s => s.setStage);
  const toggleCheck = useOnboardingStore(s => s.toggleCheck);
  const updateItemLabel = useOnboardingStore(s => s.updateItemLabel);
  const deleteItem = useOnboardingStore(s => s.deleteItem);
  const addItem = useOnboardingStore(s => s.addItem);
  const archiveOnboarding = useOnboardingStore(s => s.archiveOnboarding);
  const unarchiveOnboarding = useOnboardingStore(s => s.unarchiveOnboarding);
  const deleteOnboarding = useOnboardingStore(s => s.deleteOnboarding);

  const currentStage = onboarding.checks?._stage || null;

  const items = onboarding.items && onboarding.items.length > 0
    ? onboarding.items
    : createDefaultItems();

  const done = countChecked(items);
  const total = items.length;
  const complete = isOnboardingComplete(items);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function startEdit(item: OnboardingItem) {
    setEditItemId(item.id);
    setEditValue(item.label);
  }

  async function commitEdit() {
    if (!editItemId) return;
    await updateItemLabel(onboarding.id, editItemId, editValue);
    setEditItemId(null);
  }

  function cancelEdit() {
    setEditItemId(null);
    setEditValue('');
  }

  function handleTickStage(stage: string) {
    setStage(onboarding.id, currentStage === stage ? null : stage);
  }

  return (
    <div className={`${styles.card} ${onboarding.archived ? styles.archived : ''}`}>
      {/* ── Main row ── */}
      <div className={styles.main} onClick={() => setOpen(o => !o)}>
        <div className={styles.body}>
          {editingName ? (
            <input
              className={styles.titleInput}
              value={nameValue}
              autoFocus
              onClick={e => e.stopPropagation()}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); updateBrandName(onboarding.id, nameValue); setEditingName(false); }
                if (e.key === 'Escape') { setNameValue(onboarding.brand_name); setEditingName(false); }
              }}
              onBlur={() => { updateBrandName(onboarding.id, nameValue); setEditingName(false); }}
            />
          ) : (
            <div
              className={styles.title}
              onClick={e => { e.stopPropagation(); setEditingName(true); }}
              title="Click to rename"
            >
              {onboarding.brand_name}
            </div>
          )}
          <div className={styles.meta}>
            {onboarding.verbal_date && (
              <span className={styles.verbalDate}>
                Created {formatDate(onboarding.verbal_date)}
              </span>
            )}
            {currentStage && (() => {
              const c = STAGE_COLORS[currentStage];
              return (
                <span className={styles.stageBadge} style={c ? { background: c.bg, color: c.text } : undefined}>
                  {currentStage}
                </span>
              );
            })()}
            {complete ? (
              <span className={styles.completeBadge}>Complete ✓</span>
            ) : total > 0 ? (
              <span className={styles.progress}>{done}/{total}</span>
            ) : null}
            {onboarding.archived && <span className={styles.archivedBadge}>Archived</span>}
          </div>
        </div>
        <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▾</span>
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressBarFill} ${complete ? styles.progressComplete : pct > 0 ? styles.progressActive : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* ── Detail ── */}
      {open && (
        <div className={styles.detail}>
          {SECTIONS.map(section => (
            <SectionBlock
              key={section}
              section={section}
              isCurrentStage={currentStage === section}
              stageColor={STAGE_COLORS[section]}
              items={items.filter(i => i.stage === section)}
              editItemId={editItemId}
              editValue={editValue}
              onTickStage={() => handleTickStage(section)}
              onToggle={(itemId) => toggleCheck(onboarding.id, itemId)}
              onStartEdit={startEdit}
              onEditChange={setEditValue}
              onCommitEdit={commitEdit}
              onCancelEdit={cancelEdit}
              onDelete={(itemId) => deleteItem(onboarding.id, itemId)}
              onAdd={(label) => addItem(onboarding.id, section, section, label)}
            />
          ))}

          {/* ── Actions ── */}
          <div className={styles.actions}>
            {onboarding.archived ? (
              <button
                className={`${styles.btn} ${styles.btnUnarchive}`}
                onClick={() => unarchiveOnboarding(onboarding.id)}
              >
                Unarchive
              </button>
            ) : (
              <button
                className={`${styles.btn} ${styles.btnArchive}`}
                onClick={() => archiveOnboarding(onboarding.id)}
              >
                Archive
              </button>
            )}
            <button
              className={`${styles.btn} ${styles.btnDelete}`}
              onClick={() => deleteOnboarding(onboarding.id)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  section: string;
  isCurrentStage: boolean;
  stageColor: { bg: string; text: string; sectionBg: string; border: string } | undefined;
  items: OnboardingItem[];
  editItemId: string | null;
  editValue: string;
  onTickStage: () => void;
  onToggle: (itemId: string) => void;
  onStartEdit: (item: OnboardingItem) => void;
  onEditChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (itemId: string) => void;
  onAdd: (label: string) => void;
}

function SectionBlock({
  section, isCurrentStage, stageColor, items, editItemId, editValue,
  onTickStage, onToggle, onStartEdit, onEditChange, onCommitEdit, onCancelEdit, onDelete, onAdd,
}: SectionProps) {
  const [addValue, setAddValue] = useState('');

  function handleAdd() {
    if (!addValue.trim()) return;
    onAdd(addValue.trim());
    setAddValue('');
  }

  const activeStyle = isCurrentStage && stageColor
    ? { background: stageColor.sectionBg } : undefined;
  const headerBorderStyle = isCurrentStage && stageColor
    ? { borderBottomColor: stageColor.border } : undefined;
  const tickActiveStyle = isCurrentStage && stageColor
    ? { background: stageColor.text, borderColor: stageColor.text } : undefined;
  const tickHoverColor = stageColor?.text;

  return (
    <div className={`${styles.stage} ${isCurrentStage ? styles.stageActive : ''}`} style={activeStyle}>
      <div className={styles.stageHeader} style={headerBorderStyle}>
        <span>{section}</span>
        <button
          className={`${styles.stageTick} ${isCurrentStage ? styles.stageTickActive : ''}`}
          style={tickActiveStyle ?? (tickHoverColor ? { '--tick-hover': tickHoverColor } as React.CSSProperties : undefined)}
          onClick={e => { e.stopPropagation(); onTickStage(); }}
          title={isCurrentStage ? 'Unmark current stage' : 'Mark as current stage'}
        >
          ✓
        </button>
      </div>
      <div className={styles.items}>
        {items.map(item => (
          <div key={item.id} className={styles.checkItem}>
            <div
              className={`${styles.checkBox} ${item.state ? styles[item.state] : ''}`}
              onClick={() => onToggle(item.id)}
            >
              {item.state === 'done' && <span className={styles.checkMark} />}
              {item.state === 'na' && <span className={styles.dashMark} />}
            </div>

            {editItemId === item.id ? (
              <input
                className={styles.editInput}
                value={editValue}
                autoFocus
                onChange={e => onEditChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onCommitEdit(); }
                  if (e.key === 'Escape') onCancelEdit();
                }}
                onBlur={onCommitEdit}
              />
            ) : (
              <span
                className={`${styles.itemLabel} ${item.state === 'done' ? styles.itemDone : ''} ${item.state === 'na' ? styles.itemNa : ''}`}
                onClick={() => onStartEdit(item)}
              >
                {item.label}
              </span>
            )}

            <button
              className={styles.btnDeleteItem}
              onClick={() => onDelete(item.id)}
              aria-label="Delete item"
            >
              ×
            </button>
          </div>
        ))}

        <div className={styles.addItemRow}>
          <input
            className={styles.addItemInput}
            placeholder="Add task…"
            value={addValue}
            onChange={e => setAddValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className={styles.btnAddItem} onClick={handleAdd}>+</button>
        </div>
      </div>
    </div>
  );
}
