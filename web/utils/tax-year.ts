/**
 * Tax year utilities.
 *
 * Indian tax calendar:
 *   Financial Year (FY): April 1 – March 31 of the following year (the year income is EARNED)
 *   Assessment Year (AY): The year AFTER the FY in which the return is filed and income is assessed.
 *
 * Example:
 *   Income earned between Apr 2024 – Mar 2025  →  FY 2024-25
 *   Tax return filed / assessed in 2025-26      →  AY 2025-26
 *
 * Therefore:  AY = FY + 1 year,  FY = AY − 1 year.
 *
 * Format convention: "YYYY-YY"  (e.g. "2025-26")
 */

/** Convert Assessment Year string (e.g. "2025-26") → Financial Year string (e.g. "2024-25"). */
export function ayToFy(assessmentYear: string | null | undefined): string {
  if (!assessmentYear) return '';
  const m = assessmentYear.match(/^(\d{4})-(\d{2})$/);
  if (!m) return assessmentYear; // unrecognised format — return as-is
  const fyStart = parseInt(m[1], 10) - 1; // 2025 → 2024
  const fyEnd = m[1].slice(2);            // "2025" → "25"
  return `${fyStart}-${fyEnd}`;           // "2024-25"
}

/** Convert Financial Year string (e.g. "2024-25") → Assessment Year string (e.g. "2025-26"). */
export function fyToAy(financialYear: string | null | undefined): string {
  if (!financialYear) return '';
  const m = financialYear.match(/^(\d{4})-(\d{2})$/);
  if (!m) return financialYear;
  const ayStart = parseInt(m[1], 10) + 1; // 2024 → 2025
  const ayEnd = String(parseInt(m[1], 10) + 1).slice(2); // 2025 → "25"... actually:
  // ayStart = 2025, ayEnd should be "26"
  const ayEndYear = ayStart + 1;
  return `${ayStart}-${String(ayEndYear).slice(2)}`; // "2025-26"
}

/**
 * Given an Assessment Year string, return the Financial Year date boundaries.
 * AY "2025-26" → FY Apr 1 2024 … Mar 31 2025
 */
export function fyDatesFromAy(assessmentYear: string | null | undefined): {
  fyMinDate: Date | undefined;
  fyMaxDate: Date | undefined;
} {
  if (!assessmentYear) return { fyMinDate: undefined, fyMaxDate: undefined };
  const m = assessmentYear.match(/^(\d{4})-(\d{2})$/);
  if (!m) return { fyMinDate: undefined, fyMaxDate: undefined };
  const fyStartYear = parseInt(m[1], 10) - 1; // e.g. 2025 → 2024
  return {
    fyMinDate: new Date(fyStartYear, 3, 1),       // April  1, fyStartYear
    fyMaxDate: new Date(fyStartYear + 1, 2, 31),  // March 31, fyStartYear + 1
  };
}
