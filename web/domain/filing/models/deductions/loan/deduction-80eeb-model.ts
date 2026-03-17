/**
 * Deduction 80EEB Interface - Electric Vehicle Loan Interest
 * Mirrors: section_80eeb in FilingModel
 * Extends Deduction80EModel with vehicle details
 */

import { Deduction80EModel } from '../../deduction-80e/models/deduction-80e-model'

export interface Deduction80EEBModel extends Deduction80EModel {
  vehicleMakeModel: string
  vehicleRegistrationNumber: string
}

