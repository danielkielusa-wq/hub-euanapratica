/**
 * Single source of truth for all V2 report scoring logic.
 * Used by V2ScoreBreakdown AND V2DetailedAnalysis to ensure consistent
 * colors, labels, and clamp behavior.
 */

import type { V2ScoreBreakdown, V2DetailedAnalysis } from '@/types/leads';

// ── Max scores per dimension (from edge function prompt criteria) ─────────────

export const SCORE_MAX: Record<keyof V2ScoreBreakdown, number> = {
  score_english: 25,
  score_experience: 20,
  score_international_work: 10,
  score_timeline: 10,
  score_objective: 10,
  score_visa: 10,
  score_readiness: 10,
  score_area_bonus: 5,
};

// ── Dimension display config ─────────────────────────────────────────────────

export interface DimensionConfig {
  breakdownKey: keyof V2ScoreBreakdown;
  analysisKey?: keyof V2DetailedAnalysis;
  label: string;
  maxScore: number;
}

/** Ordered list used by V2ScoreBreakdown */
export const BREAKDOWN_DIMENSIONS: DimensionConfig[] = [
  { breakdownKey: 'score_english', analysisKey: 'english', label: 'Inglês', maxScore: SCORE_MAX.score_english },
  { breakdownKey: 'score_experience', analysisKey: 'experience', label: 'Experiência', maxScore: SCORE_MAX.score_experience },
  { breakdownKey: 'score_international_work', label: 'Trabalho Internacional', maxScore: SCORE_MAX.score_international_work },
  { breakdownKey: 'score_timeline', analysisKey: 'timeline', label: 'Timeline', maxScore: SCORE_MAX.score_timeline },
  { breakdownKey: 'score_objective', analysisKey: 'objective', label: 'Objetivo', maxScore: SCORE_MAX.score_objective },
  { breakdownKey: 'score_visa', analysisKey: 'visa_immigration', label: 'Visto', maxScore: SCORE_MAX.score_visa },
  { breakdownKey: 'score_readiness', analysisKey: 'mental_readiness', label: 'Prontidão Mental', maxScore: SCORE_MAX.score_readiness },
  { breakdownKey: 'score_area_bonus', label: 'Bônus Área', maxScore: SCORE_MAX.score_area_bonus },
];

/** Ordered list used by V2DetailedAnalysis (subset with analysisKey, sorted barriers-first at render time) */
export const ANALYSIS_DIMENSIONS: DimensionConfig[] = [
  { breakdownKey: 'score_english', analysisKey: 'english', label: 'Inglês', maxScore: SCORE_MAX.score_english },
  { breakdownKey: 'score_visa', analysisKey: 'visa_immigration', label: 'Visto', maxScore: SCORE_MAX.score_visa },
  { breakdownKey: 'score_readiness', analysisKey: 'mental_readiness', label: 'Prontidão Mental', maxScore: SCORE_MAX.score_readiness },
  { breakdownKey: 'score_experience', analysisKey: 'experience', label: 'Experiência', maxScore: SCORE_MAX.score_experience },
  { breakdownKey: 'score_objective', analysisKey: 'objective', label: 'Objetivo', maxScore: SCORE_MAX.score_objective },
  { breakdownKey: 'score_timeline', analysisKey: 'timeline', label: 'Timeline', maxScore: SCORE_MAX.score_timeline },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip diacritics so "CRÍTICA" → "critica", "MÉDIA" → "media", etc. */
function normalizePriority(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ── Score utilities ──────────────────────────────────────────────────────────

/** Clamp a raw score to [0, maxScore] */
export function clampScore(value: number, maxScore: number): number {
  return Math.max(0, Math.min(value, maxScore));
}

/** Get clamped percentage [0, 100] */
export function getScorePercent(value: number, maxScore: number): number {
  return (clampScore(value, maxScore) / maxScore) * 100;
}

// ── Color mapping (percentage-driven, single source) ─────────────────────────

/** Bar fill color. Score is the primary driver. */
export function getBarColor(pct: number): string {
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-blue-500';
  return 'bg-amber-400';
}

// ── Label / badge mapping ────────────────────────────────────────────────────

export interface ScoreLabel {
  label: string;
  className: string;
}

const LABEL_BOM: ScoreLabel = {
  label: 'Bom',
  className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};
const LABEL_ATENCAO: ScoreLabel = {
  label: 'Atenção',
  className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
};
const LABEL_BLOQUEADOR: ScoreLabel = {
  label: 'Bloqueador',
  className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

/**
 * Determine badge label + color for a dimension score.
 *
 * Rules (score percentage is always primary):
 *  - pct >= 70  → "Bom" (green)  — high score always wins, barrier flag ignored
 *  - pct < 70, barrier + critica/alta priority → "Bloqueador" (red)
 *  - pct < 70, barrier → "Atenção" (amber)
 *  - pct < 40, no barrier → "Atenção" (amber) — low score is concerning even without barrier flag
 *  - otherwise → null (no badge)
 */
export function getScoreLabel(
  pct: number,
  dim?: { is_barrier: boolean; priority?: string },
): ScoreLabel | null {
  // High score always wins — ignore barrier flags
  if (pct >= 70) return LABEL_BOM;

  if (dim?.is_barrier) {
    const priority = dim.priority ? normalizePriority(dim.priority) : '';
    if (priority === 'critica' || priority === 'alta') return LABEL_BLOQUEADOR;
    return LABEL_ATENCAO;
  }

  // Low score without barrier flag is still concerning
  if (pct < 40) return LABEL_ATENCAO;

  return null;
}
