import type { SlateTask } from './types';
import { isOverdue, isTodayDate, overdueDays } from './dateUtils';

export const PRIORITY_ORDER: Record<string, number> = { must: 0, should: 1, could: 2 };
export const PRIORITY_WEIGHT: Record<string, number> = { must: 2, should: 1, could: 0.5 };

export function scoreTask(
  task: SlateTask,
  availMins: number,
  context: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (task.priority === 'must') { score += 6; reasons.push('must'); }
  else if (task.priority === 'should') { score += 3; reasons.push('should'); }
  else { score += 1; }

  if (isOverdue(task.due_date)) {
    score += Math.min(20, 10 + overdueDays(task.due_date) * 2);
    reasons.push('overdue');
  }
  if (isTodayDate(task.due_date)) { score += 10; reasons.push('due today'); }

  if (task.estimated_minutes) {
    if (task.estimated_minutes <= availMins) { score += 3; reasons.push(`fits ${availMins}m`); }
    else score -= 10;
  }

  if (context !== 'any' && task.context_type) {
    if (task.context_type === context) { score += 5; reasons.push(context); }
    else score -= 3;
  }

  if (task.deferral_count > 0) score -= Math.min(5, task.deferral_count);

  return { score, reasons };
}

export function buildRecommendations(
  tasks: SlateTask[],
  availMins: number,
  context: string
): Array<{ task: SlateTask; score: number; reasons: string[] }> {
  const active = tasks.filter(t => !t.completed);
  const hasUrgent = active.some(t => isOverdue(t.due_date) || isTodayDate(t.due_date));
  const scored = active.map(task => {
    const { score, reasons } = scoreTask(task, availMins, context);
    return { task, score: score + (!task.due_date && hasUrgent ? -3 : 0), reasons };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 3).filter(r => r.score > 0);
}
