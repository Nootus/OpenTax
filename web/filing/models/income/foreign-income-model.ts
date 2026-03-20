/**
 * Foreign Income Models
 */

export interface ForeignDividendModel {
  foreignDividendId?: number | null
  filingId?: number | null
  countryCode?: string | null
  countryName?: string | null
  description?: string | null
  period1: number
  period2: number
  period3: number
  period4: number
  period5: number
  totalAmount?: number | null
  currencyType: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ForeignInterestModel {
  foreignInterestId?: number | null
  filingId?: number | null
  countryCode?: string | null
  countryName?: string | null
  description?: string | null
  amount: number
  currencyType: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Section89AModel {
  section89aId?: number | null
  filingId?: number | null
  period1: number
  period2: number
  period3: number
  period4: number
  period5: number
  usaAmount: number
  ukAmount: number
  canadaAmount: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ForeignIncomeModel {
  filingId?: number | null
  foreignDividend: ForeignDividendModel[]
  foreignInterest: ForeignInterestModel[]
  section89a?: Section89AModel | null
}
