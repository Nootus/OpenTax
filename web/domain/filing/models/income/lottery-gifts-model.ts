/**
 * Transaction model for lottery gifts income.
 * Used by widgets/forms for editing and detail views.
 * Maps to backend transaction storage for edit operations.
 */
export interface LotteryGiftsIncome {
  lotteryGiftId?: number;
  tempId?: string;
  filingId?: number | null;
  source?: string | null;
  description?: string | null;
  amount?: number | null;
  receivedDate?: string | null;
}

/**
 * Default options for lottery gift sources
 * Used as fallback when masterData is not available
 */
export const LOTTERY_GIFTS_SOURCE_OPTIONS = [
  { value: 'lottery', label: 'Lottery' },
  { value: 'gambling', label: 'Gambling / Betting' },
  { value: 'horseRacing', label: 'Horse Racing' },
  { value: 'games', label: 'Games of Chance' },
  { value: 'gifts', label: 'Gifts (Taxable)' },
  { value: 'other', label: 'Other' },
]
