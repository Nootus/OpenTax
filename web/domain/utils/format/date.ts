/**
 * Date formatting utilities
 */

/**
 * Parse API date/datetime string to Date object
 * 
 * Handles ISO 8601 formats from Pydantic v2 (without json_encoders):
 * - Datetime: "2024-01-15T10:30:45.123456" or "2024-01-15T10:30:45" (naive, no timezone)
 * - Date: "2024-01-15" (YYYY-MM-DD)
 * 
 * IMPORTANT: If the date string doesn't have timezone info (no 'Z' or +/- offset),
 * it's assumed to be in UTC (common API practice). This prevents timezone conversion issues.
 * 
 * @param dateString - ISO 8601 date or datetime string from API
 * @returns Date object or null if invalid/empty
 * 
 * @example
 * parseApiDate("2024-01-15") // Date object for Jan 15, 2024
 * parseApiDate("2024-01-15T10:30:45.123456") // Date object with time (treated as UTC)
 * parseApiDate("2024-01-15T10:30:45Z") // Date object with UTC timezone
 * parseApiDate(null) // null
 * parseApiDate("") // null
 */
export function parseApiDate(dateString: string | null | undefined): Date | null {
  // Handle null, undefined, or empty strings
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    return null
  }

  const trimmed = dateString.trim()
  
  // Check if the string already has timezone info (Z or +/- offset)
  const hasTimezone = /[Z+-]\d{2}:?\d{2}$/.test(trimmed) || trimmed.endsWith('Z')
  
  // If no timezone info and it's a datetime string (contains 'T'), treat as UTC
  // This is the common API practice - naive datetimes from backend are usually UTC
  let date: Date
  if (!hasTimezone && trimmed.includes('T')) {
    // Append 'Z' to treat as UTC
    date = new Date(trimmed + 'Z')
  } else {
    // Has timezone info or is just a date (YYYY-MM-DD), parse as-is
    date = new Date(trimmed)
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null
  }

  return date
}


/**
 * Format date and time for chat display
 * 
 * Formats a date/datetime to a human-readable string with both date and time
 * Suitable for displaying in chat messages, notifications, etc.
 * 
 * @param date - Date object, ISO string, or null/undefined
 * @returns Formatted string (e.g., "Dec 24, 2024, 8:09 AM") or empty string if invalid
 * 
 * @example
 * formatDateTimeForChat(new Date()) // "Dec 24, 2024, 8:09 AM"
 * formatDateTimeForChat("2024-01-15T10:30:45") // "Jan 15, 2024, 10:30 AM"
 * formatDateTimeForChat(null) // ""
 */
export function formatDateTimeForChat(date: Date | string | null | undefined): string {
  let dateObj: Date | null = null

  // Handle different input types
  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === 'string') {
    dateObj = parseApiDate(date)
  } else {
    return ''
  }

  // Validate date
  if (!dateObj || isNaN(dateObj.getTime())) {
    return ''
  }

  // Format with date and time
  return dateObj.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a date string to readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "01 Jan 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

