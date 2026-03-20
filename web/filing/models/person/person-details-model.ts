/**
 * Person Model
 * Mirrors: person in FilingModel
 */

export interface PersonDetailsModel {
  personId?: number | null
  userId?: number | null
  firstName: string
  middleName?: string | null
  lastName?: string | null
  fatherName?: string | null
  panNumber?: string | null
  aadhaarNumber?: string | null
  dateOfBirth?: Date | null
  residentialStatus?: string | null
  email?: string | null
  mobileNumber?: string | null
  countryCode?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

// ==================== Widget Types ====================

/**
 * Person Create Request
 */
export interface PersonRequest {
  firstName: string
  middleName?: string | null
  lastName: string
  fathersName?: string | null
  panNumber?: string | null
  aadhaarNumber?: string | null
  dateOfBirth: Date | null
  residentialStatus?: string | null
  emailAddress?: string | null
  mobileNumber?: string | null
}



/**
 * Person Form Data Interface
 * Used for form state management in widgets
 * Field names match API response exactly
 */

/**
 * Master data for person dropdowns
 */
export interface PersonMasterData {
  residentialStatus: Array<{ value: string; label: string }>
  states?: Array<{ value: string; label: string }>
  countries?: Array<{ value: string; label: string }>
  accountTypes?: Array<{ value: string; label: string }>
}

/**
 * Personal Details API Response
 */
export interface PersonalDetailsResponse {
  person: any
  message?: string
}

/**
 * Person Widget API Response (with master data)
 */
export interface PersonWidgetResponse {
  data: any[]
  masterData: {
    residentialStatus: Array<{ value: string; label: string }>
    states?: Array<{ value: string; label: string }>
    countries?: Array<{ value: string; label: string }>
    accountTypes?: Array<{ value: string; label: string }>
  }
}
