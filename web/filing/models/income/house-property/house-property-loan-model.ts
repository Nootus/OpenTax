export interface HousePropertyLoanModel {
    loanId?: number | null
    filingId?: number | null
    propertyId?: number | null
    vendorType?: string | null
    lenderName?: string | null
    loanAccountNumber?: string | null
    loanSanctionDate?: Date | null
    totalLoanAmount?: number | null
    loanOutstanding?: number | null
    interestPaid?: number | null
    principalRepaid?: number | null
  }