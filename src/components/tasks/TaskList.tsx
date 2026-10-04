'use client';

import { useRef, useState } from 'react';
import type { SlateTask, SlateSubtask, Priority } from '@/lib/slate/types';
import { getDefaultSegments } from '@/lib/slate/segments';
import { useSlateStore } from '@/store/useSlateStore';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const PRIORITIES: Priority[] = ['must', 'should', 'could'];
const PRIORITY_LABELS: Record<Priority, string> = { must: 'Must', should: 'Should', could: 'Could' };
const UNTAGGED = '__untagged__';

// ── Segment group ─────────────────────────────────────────────────────────────

interface SegGroupProps {
  segKey: string;
  label: string;
  sortedTasks: SlateTask[];
  subtasks: SlateSubtask[];
  priority: Priority;
  wrapTitle: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isCustom: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function SegmentGroup({
  segKey, label, sortedTasks, subtasks, priority, wrapTitle,
  canMoveUp, canMoveDown, isCustom, onMoveUp, onMoveDown, onDelete,
}: SegGroupProps) {
  const reorderTask = useSlateStore(s => s.reorderTask);
  const [delPrompt, setDelPrompt] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderTask(String(active.id), String(over.id));
  }

  function startHold() {
    if (!isCustom) return;
    timerRef.current = setTimeout(() => setDelPrompt(true), 500);
  }
  function cancelHold() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  const ids = sortedTasks.map(t => t.id);

  return (
    <div>
      <div className={styles.segmentHeader}>
        <span
          className={`${styles.segmentLabel} ${isCustom ? styles.segmentLabelCustom : ''}`}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
        >
          {label}
          {isCustom && <span className={styles.segmentHoldHint}> ·</span>}
        </span>
        {segKey !== UNTAGGED && (
          <span className={styles.segmentMoveButtons}>
            <button
              className={styles.segmentMoveBtn}
              disabled={!canMoveUp}
              onClick={onMoveUp}
              aria-label="Move segment up"
            >▴</button>
            <button
              className={styles.segmentMoveBtn}
              disabled={!canMoveDown}
              onClick={onMoveDown}
              aria-label="Move segment down"
            >▾</button>
          </span>
        )}
      </div>

      {delPrompt && (
        <div className={styles.delPrompt}>
          <span>Delete &ldquo;{label}&rdquo;?</span>
          <button className={styles.delConfirm} onClick={() => { setDelPrompt(false); onDelete(); }}>Delete</button>
          <button className={styles.delCancel} onClick={() => setDelPrompt(false)}>Cancel</button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={`${styles.priorityGroup} ${styles[priority]}`}>
            {sortedTasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                subtasks={subtasks.filter(s => s.task_id === t.id)}
                inGroup
                wrapTitle={wrapTitle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tasks: SlateTask[];
  subtasks: SlateSubtask[];
  showBadge?: boolean;
  emptyMsg?: string;
  wrapTitle?: boolean;
  category?: 'personal' | 'work';
}

export default function TaskList({
  tasks, subtasks, showBadge = false, emptyMsg = 'All clear', wrapTitle = false, category,
}: Props) {
  const taskOrder           = useSlateStore(s => s.taskOrder);
  const customSegments      = useSlateStore(s => s.customSegments);
  const segmentOrder        = useSlateStore(s => s.segmentOrder);
  const setSegmentOrder     = useSlateStore(s => s.setSegmentOrder);
  const deleteCustomSegment = useSlateStore(s => s.deleteCustomSegment);

  function sortByOrder(list: SlateTask[]) {
    return [...list].sort((a, b) => {
      const ia = taskOrder.indexOf(a.id);
      const ib = taskOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  function sortSegmentKeys(keys: string[], savedOrder: string[]): string[] {
    return [...keys].sort((a, b) => {
      const ia = savedOrder.indexOf(a);
      const ib = savedOrder.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  function renderPriorityGroups(list: SlateTask[], cat: 'personal' | 'work') {
    const defaultSegs     = getDefaultSegments(cat);
    const allSegmentNames = [...defaultSegs, ...(customSegments[cat] ?? [])];
    const savedOrder      = segmentOrder[cat] ?? [];

    return PRIORITIES.flatMap(p => {
      const pTasks = list.filter(t => t.priority === p);
      if (!pTasks.length) return [];

      const buckets: Record<string, SlateTask[]> = {};
      for (const t of pTasks) {
        const key = t.context_type || UNTAGGED;
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(t);
      }

      const baseKeys    = allSegmentNames.filter(s => buckets[s]?.length);
      const namedSorted = sortSegmentKeys(baseKeys, savedOrder);
      const orderedKeys = buckets[UNTAGGED] ? [...namedSorted, UNTAGGED] : namedSorted;

      function moveSegment(segKey: string, dir: 'up' | 'down') {
        const idx    = namedSorted.indexOf(segKey);
        const newIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= namedSorted.length) return;
        const next = [...namedSorted];
        next.splice(idx, 1);
        next.splice(newIdx, 0, segKey);
        setSegmentOrder(cat, next);
      }

      return [
        <div key={p}>
          <div className={`${styles.priorityHeader} ${styles[p]}`}>{PRIORITY_LABELS[p]}</div>
          {orderedKeys.map((seg, i) => {
            const isUntagged  = seg === UNTAGGED;
            const isCustom    = !isUntagged && !defaultSegs.includes(seg);
            const namedIdx    = namedSorted.indexOf(seg);
            const canMoveUp   = !isUntagged && namedIdx > 0;
            const canMoveDown = !isUntagged && namedIdx < namedSorted.length - 1;

            return (
              <SegmentGroup
                key={seg}
                segKey={seg}
                label={isUntagged ? 'Untagged' : seg}
                sortedTasks={sortByOrder(buckets[seg] || [])}
                subtasks={subtasks}
                priority={p}
                wrapTitle={wrapTitle}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                isCustom={isCustom}
                onMoveUp={() => moveSegment(seg, 'up')}
                onMoveDown={() => moveSegment(seg, 'down')}
                onDelete={() => deleteCustomSegment(seg, cat)}
              />
            );
          })}
        </div>,
      ];
    });
  }

  if (!tasks.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✓</div>
        <p>{emptyMsg}</p>
      </div>
    );
  }

  if (!showBadge) {
    const cat = category ?? (tasks[0]?.category ?? 'work');
    return <div className={styles.root}>{renderPriorityGroups(tasks, cat)}</div>;
  }

  const work     = tasks.filter(t => t.category === 'work');
  const personal = tasks.filter(t => t.category === 'personal');

  return (
    <div className={styles.root}>
      {work.length > 0 && (
        <>
          <div className={styles.catLabel}>Work</div>
          {renderPriorityGroups(work, 'work')}
        </>
      )}
      {personal.length > 0 && (
        <>
          <div className={styles.catLabel}>Personal</div>
          {renderPriorityGroups(personal, 'personal')}
        </>
      )}
    </div>
  );
}
