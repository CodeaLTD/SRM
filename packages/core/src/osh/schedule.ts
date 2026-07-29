import type { InstructionType } from "@codea-srm/db";

/**
 * Interval, in months, before a periodic re-instruction is next due.
 * Only PERIODIC-type instructions repeat — Начален/На работното
 * място/Извънреден are one-off events with no next-due date.
 *
 * These values are a placeholder default, NOT yet confirmed against
 * Наредба № РД-07-2 (epic doc §14 Q2 — exact interval per instruction
 * type/role is an open question pending legal sign-off). Kept isolated in
 * this one function so the real rule table can drop in later without
 * touching the schema or any caller.
 */
const PERIODIC_INTERVAL_MONTHS = 12;

/**
 * Computes the next periodic-instruction due date from when an instruction
 * was conducted (OSH-2). Returns null for instruction types that don't
 * repeat.
 */
export function calculateNextPeriodicDueAt(type: InstructionType, conductedAt: Date): Date | null {
  if (type !== "PERIODIC") return null;

  const next = new Date(conductedAt);
  next.setUTCMonth(next.getUTCMonth() + PERIODIC_INTERVAL_MONTHS);
  return next;
}
