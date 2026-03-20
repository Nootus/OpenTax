/**
 * Cost Improvement model for Capital Gains Real Estate
 * Nested within CgRealEstateProperty.improvementsList
 * Maps to backend property_cost_improvement table
 */
export interface CgRealEstateImprovement {
  filingId?: number | null
  improvementId?: number | null
  improvementDescription?: string | null
  improvementAmount: number
  improvementDate?: string | null
}
