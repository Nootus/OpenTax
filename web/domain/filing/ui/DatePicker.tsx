"use client"
import React, { useMemo, useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { parseApiDate } from '@/domain/utils/format/date'

interface DatePickerProps {
  label?: string
  hint?: string
  error?: string
  value?: Date | null
  onChange?: (date: Date | null) => void
  className?: string
  disabled?: boolean
  /** Maximum selectable date (dates after this will be disabled) */
  maxDate?: Date
  /** Minimum selectable date (dates before this will be disabled) */
  minDate?: Date
  skeleton?: boolean
  required?: boolean
}

type ViewMode = 'days' | 'months' | 'years'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatInputValue(d?: Date | string | null): string {
  if (!d) return ''

  const date =
    d instanceof Date
      ? d
      : typeof d === 'string'
        ? parseApiDate(d)
        : null

  if (!date || isNaN(date.getTime())) return ''

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}
function parseInputValue(str: string): Date | null {
  // Parse DD-MM-YYYY format
  const match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const year = parseInt(match[3], 10)
  if (month < 0 || month > 11 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month, day))
  // Validate the date is correct (e.g., not Feb 30)
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month || date.getUTCFullYear() !== year) return null
  return date
}

export default function DatePicker({ label, hint, error, value = null, onChange, className = '', disabled = false, maxDate, minDate, skeleton = false, required = false }: DatePickerProps) {
  const normalizedValue = useMemo(() => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'string') return parseApiDate(value)
    return null
  }, [value])

  // Determine initial cursor position
  const getInitialDate = (): Date => {
    if (normalizedValue) {
      return normalizedValue
    } else if (minDate && maxDate) {
      // If min/max are provided, use the last month of the range (maxDate)
      return maxDate
    } else if (maxDate) {
      return maxDate
    } else if (minDate) {
      return minDate
    } else {
      return new Date()
    }
  }

  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [cursor, setCursor] = useState<Date>(getInitialDate())
  const [openAbove, setOpenAbove] = useState(false)
  const [inputValue, setInputValue] = useState(formatInputValue(normalizedValue))
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(getInitialDate().getFullYear() / 12) * 12)
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync input value when value prop changes
  useEffect(() => {
    setInputValue(formatInputValue(normalizedValue))
  }, [value])

  // Reset to days view when opening
  useEffect(() => {
    if (open) {
      setViewMode('days')
      const initialDate = getInitialDate()
      setCursor(initialDate)
      setYearRangeStart(Math.floor(initialDate.getFullYear() / 12) * 12)
    }
  }, [open, value, minDate, maxDate])

  // Determine if calendar should open above or below
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const calendarHeight = 360
      setOpenAbove(spaceBelow < calendarHeight && rect.top > calendarHeight)
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startDay = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, i - startDay + 1)
      cells.push({ date: d, inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true })
    }
    const trailing = 42 - cells.length
    for (let i = 1; i <= trailing; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false })
    }
    return cells
  }, [cursor])

  // Skeleton loading state - MUST be after all hooks
  if (skeleton) {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-[52px] bg-gray-200 rounded-lg w-full" />
          {label && (
            <div className="absolute top-2 left-3 h-3 w-24 bg-gray-300 rounded" />
          )}
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    // Auto-insert dashes
    const digits = val.replace(/\D/g, '')
    if (digits.length <= 2) {
      val = digits
    } else if (digits.length <= 4) {
      val = `${digits.slice(0, 2)}-${digits.slice(2)}`
    } else {
      val = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`
    }
    setInputValue(val)

    // Try to parse and update if valid
    const parsed = parseInputValue(val)
    if (parsed) {
      const isWithinRange = (!maxDate || parsed <= maxDate) && (!minDate || parsed >= minDate)
      if (isWithinRange) {
        onChange?.(new Date(parsed.toISOString().split('T')[0]))
        setCursor(parsed)
      }
    }
  }

  const handleInputBlur = () => {
    // Reset to current value if invalid
    if (inputValue && !parseInputValue(inputValue)) {
      setInputValue(formatInputValue(value))
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  }
  const isSameDay = (a: Date, b?: Date | null) => !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const hasValue = !!value

  const selectMonth = (monthIndex: number) => {
    setCursor(new Date(cursor.getFullYear(), monthIndex, 1))
    setViewMode('days')
  }

  const selectYear = (year: number) => {
    setCursor(new Date(year, cursor.getMonth(), 1))
    setViewMode('months')
  }
  const prevMonth = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
  const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)

  const renderHeader = () => {
    if (viewMode === 'days') {
      return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label="Previous month"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
            onClick={() => setViewMode('months')}
          >
            {MONTHS_FULL[cursor.getMonth()]} {cursor.getFullYear()}
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }

    if (viewMode === 'months') {
      return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label="Previous year"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            onClick={() => setCursor(c => new Date(c.getFullYear() - 1, c.getMonth(), 1))}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
            onClick={() => setViewMode('years')}
          >
            {cursor.getFullYear()}
          </button>
          <button
            type="button"
            aria-label="Next year"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            onClick={() => setCursor(c => new Date(c.getFullYear() + 1, c.getMonth(), 1))}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }

    // Years view
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          aria-label="Previous years"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          onClick={() => setYearRangeStart(y => y - 12)}
        >
          <ChevronUpIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {yearRangeStart} - {yearRangeStart + 11}
        </span>
        <button
          type="button"
          aria-label="Next years"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          onClick={() => setYearRangeStart(y => y + 12)}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const renderBody = () => {
    if (viewMode === 'days') {
      return (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 px-3 pt-3 pb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 px-3 pb-3">
            {grid.map(({ date, inMonth }, i) => {
              const isSelected = isSameDay(date, normalizedValue)
              const isTodayDate = isToday(date)
              const isDisabled = (maxDate && date > maxDate) || (minDate && date < minDate)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onChange?.(
                        new Date(Date.UTC(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        ))
                      )
                      setOpen(false)
                    }
                  }}
                  disabled={isDisabled}
                  className={[
                    'relative h-8 w-8 mx-auto rounded-lg text-sm font-medium transition-all',
                    isDisabled && 'text-gray-300 cursor-not-allowed',
                    !inMonth && !isDisabled && 'text-gray-300',
                    inMonth && !isSelected && !isDisabled && 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                    isSelected && !isDisabled && 'bg-blue-600 text-white hover:bg-blue-700',
                    isTodayDate && !isSelected && !isDisabled && 'ring-1 ring-blue-400 ring-inset',
                  ].filter(Boolean).join(' ')}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </>
      )
    }

    if (viewMode === 'months') {
      const currentMonth = normalizedValue?.getMonth()
      const currentYear = normalizedValue?.getFullYear()
      const cursorYear = cursor.getFullYear()
      return (
        <div className="grid grid-cols-3 gap-2 p-3">
          {MONTHS.map((month, i) => {
            const firstDay = new Date(cursorYear, i, 1)
            const lastDay = new Date(cursorYear, i + 1, 0)
            const isMonthDisabled =
              (minDate != null && lastDay < minDate) ||
              (maxDate != null && firstDay > maxDate)
            const isSelected = currentMonth === i && currentYear === cursorYear
            return (
              <button
                key={month}
                type="button"
                onClick={() => !isMonthDisabled && selectMonth(i)}
                disabled={isMonthDisabled}
                className={[
                  'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  isMonthDisabled && 'text-gray-300 cursor-not-allowed',
                  isSelected && !isMonthDisabled ? 'bg-blue-600 text-white hover:bg-blue-700' : !isMonthDisabled && 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                ].filter(Boolean).join(' ')}
              >
                {month}
              </button>
            )
          })}
        </div>
      )
    }

    // Years view
    const currentYear = normalizedValue?.getFullYear()
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i)
    const minYear = minDate?.getFullYear()
    const maxYear = maxDate?.getFullYear()
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {years.map((year) => {
          const isYearDisabled =
            (minYear != null && year < minYear) ||
            (maxYear != null && year > maxYear)
          const isSelected = currentYear === year
          return (
            <button
              key={year}
              type="button"
              onClick={() => !isYearDisabled && selectYear(year)}
              disabled={isYearDisabled}
              className={[
                'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                isYearDisabled && 'text-gray-300 cursor-not-allowed',
                isSelected && !isYearDisabled ? 'bg-blue-600 text-white hover:bg-blue-700' : !isYearDisabled && 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
              ].filter(Boolean).join(' ')}
            >
              {year}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full ${error ? 'mb-5' : ''} ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="dd-mm-yyyy"
          disabled={disabled}
          style={{ outline: 'none' }}
          className={`block w-full rounded-lg border bg-white px-2.5 pb-2.5 pt-4 text-sm text-text-primary outline-none focus:outline-none focus-visible:outline-none focus:ring-0 disabled:bg-secondary-100 disabled:cursor-not-allowed transition-colors peer ${error
              ? 'border-error-500 focus:border-error-500'
              : 'border-secondary-300 focus:border-primary-500'
            }`}
        />
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>
      {label && (
        <label
          className={`
            inline-flex items-center absolute text-sm duration-300 transform
            -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2
            start-1
            ${error
              ? 'text-error-500'
              : hasValue || inputValue ? 'text-text-tertiary' : 'text-text-tertiary peer-focus:text-primary-600'
            }
          `}
        >
          <CalendarIcon className="w-4 h-4 me-1.5" />
          {label} {required && <span className="text-error-500">&nbsp;*</span>}
        </label>
      )}
      {hint && !error && <p className="mt-1 text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}

      {open && (
        <div
          ref={calendarRef}
          className={`absolute z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg ${openAbove ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          role="dialog"
          aria-modal="true"
        >
          {renderHeader()}
          {renderBody()}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => { onChange?.(null); setInputValue(''); setOpen(false) }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => {
                const today = new Date()
                const isValid = (!maxDate || today <= maxDate) && (!minDate || today >= minDate)
                if (isValid) {
                  const today = new Date()
                  onChange?.(
                    new Date(Date.UTC(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    ))
                  )
                  setOpen(false)
                }
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

