import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: React.ReactNode
  skeleton?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  icon,
  skeleton = false,
  className = '',
  id,
  placeholder = ' ',
  value,
  required = false,
  type,
  onChange,
  onFocus,
  min,
  ...props
}, ref) => {
  // Only use explicitly-provided id. Auto-generating with useId() causes
  // server/client hydration mismatches when the fiber tree differs.
  const inputId = id

  // Format number with Indian comma notation using native Intl API
  const formatIndianNumber = (num: string | number): string => {
    const numStr = String(num).replace(/[^\d]/g, '')
    if (!numStr) return ''
    return new Intl.NumberFormat('en-IN').format(Number(numStr))
  }

  // For number type, display formatted value
  const displayValue = type === 'number' && value !== undefined && value !== null && value !== ''
    ? formatIndianNumber(value as string | number)
    : value ?? ""

  // Check if field has a meaningful value
  const hasValue = value !== undefined &&
    value !== null &&
    value !== '' &&
    !(typeof value === 'string' && value.trim() === '')
  
  const displayPlaceholder = hasValue ? undefined : (placeholder || ' ')

  // Handle onChange to prevent negative values for number inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const inputValue = e.target.value
      // Remove minus sign and other non-digit characters and also remove preceding zeros
      const cleanValue = inputValue.replace(/[^\d]/g, '').replace(/^0+/, '').slice(0, 10)
      // Create a new event with cleaned value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanValue === '' ? '0' : cleanValue
        }
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(syntheticEvent)
    } else {
      onChange?.(e)
    }
  }

  // Select all on focus for number inputs so typing immediately replaces the zero
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number') {
      e.target.select()
    }
    onFocus?.(e)
  }

  // Use text input for numbers to avoid spin buttons
  const inputType = type === 'number' ? 'text' : type

  // Skeleton loading state
  if (skeleton) {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-[52px] bg-gray-200 rounded-lg w-full" />
          {label && (
            <div className="absolute top-2 left-3 h-3 w-20 bg-gray-300 rounded" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${error ? 'mb-5' : ''} ${className}`}>
      <div className="relative w-full">
        <input
          ref={ref}
          id={inputId}
          placeholder={displayPlaceholder}
          value={displayValue}
          type={inputType}
          inputMode={type === 'number' ? 'numeric' : undefined}
          style={{ outline: 'none' }}
          className={`
            block px-2.5 pb-2.5 pt-4 w-full text-sm text-text-primary
            rounded-lg border appearance-none
            outline-none focus:outline-none focus-visible:outline-none focus:ring-0 shadow-none focus:shadow-none
            peer
            ${props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}
            ${hasValue ? '[&::placeholder]:opacity-0 [&::placeholder]:invisible' : '[&::placeholder]:opacity-0 focus:[&::placeholder]:opacity-100'}
            ${error ? 'border-error-500 focus:border-error-500' : 'border-secondary-300 focus:border-primary-500'}
          `}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`
              inline-flex items-center absolute text-sm duration-300 transform
              z-10 origin-[0] bg-white px-2 start-1 pointer-events-none
              ${hasValue
                ? '-translate-y-4 scale-75 top-2'
                : 'peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 -translate-y-4 scale-75 top-2'
              }
              peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:px-2
              ${error
                ? 'text-error-500 peer-focus:text-error-500'
                : 'text-text-tertiary peer-focus:text-primary-600'
              }
            `}
          >
            {icon && <span className="w-4 h-4 me-1.5">{icon}</span>}
            {label} {required && <span className="text-error-500">&nbsp;*</span>}
          </label>
        )}
      </div>
      {(hint || error) && (
        <div className="mt-1 min-h-[20px]">
          {hint && !error && (
            <p className="text-xs text-text-tertiary">{hint}</p>
          )}
          {error && (
            <p className="text-xs text-error-600">{error}</p>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input