/**
 * Salary Summary Interface
 * Based on models/summary/salary_summary.py
 */
export interface SalarySummary {
  employerId: number
  employerName: string
  tanNumber: string | null
  panNumber: string | null
  grossSalary: number
}

