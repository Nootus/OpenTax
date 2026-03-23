import { ChevronDownIcon } from '@heroicons/react/24/outline'
import React, { forwardRef } from 'react'

interface CountryCode {
  value: string
  label: string
  flag?: string
}

// Default to India only - master data will override
const defaultCountryCodes: CountryCode[] = [
  { value: '+91', label: '+91' },
]

interface PhoneInputProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  phoneValue: string
  countryCode: string
  onPhoneChange: (value: string) => void
  onCountryCodeChange: (value: string) => void
  countryCodes?: CountryCode[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  icon?: React.ReactNode
  skeleton?: boolean
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  label,
  hint,
  error,
  required = false,
  phoneValue,
  countryCode,
  onPhoneChange,
  onCountryCodeChange,
  countryCodes = defaultCountryCodes,
  placeholder = ' ',
  disabled = false,
  className = '',
  id = 'phone',
  icon,
  skeleton = false,
}, ref) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    onPhoneChange(value)
  }

  // Skeleton loading state
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

  return (
    <div className={`relative w-full ${className}`}>
      <div className={`flex border rounded-lg overflow-hidden bg-white
        ${error ? 'border-error-500 focus-within:border-error-500' : 'border-secondary-300 focus-within:border-primary-500'}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-secondary-100' : ''}
      `}>
        {/* Country Code Select */}
        <div className="relative flex-shrink-0 w-auto min-w-[4rem] max-w-[12rem] bg-white border-r border-secondary-300">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            className="w-full h-full px-2 pb-2.5 pt-4 bg-transparent appearance-none cursor-pointer text-text-primary text-sm outline-none focus-visible:outline-none disabled:cursor-not-allowed truncate"
            aria-label="Country code"
            disabled={disabled}
          >
            {countryCodes.map(code => (
              <option key={code.value} value={code.value} className="truncate">
                {code.flag ? `${code.flag} ${code.label}` : code.label}
              </option>
            ))}
          </select>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </span>
        </div>
        {/* Phone Input */}
        <input
          ref={ref}
          id={id}
          type="tel"
          value={phoneValue}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="peer flex-1 px-2.5 pb-2.5 pt-4 text-sm text-text-primary bg-transparent outline-none focus-visible:outline-none disabled:cursor-not-allowed placeholder:text-transparent"
          maxLength={10}
          autoComplete="tel"
          disabled={disabled}
        />
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`
            inline-flex items-center absolute text-sm duration-300 transform
            -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2
            start-1
            ${error 
              ? 'text-error-500' 
              : 'text-text-tertiary'
            }
          `}
        >
          {icon && <span className="w-4 h-4 me-1.5">{icon}</span>}
          {label}{required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}
      {hint && !error && <p className="absolute -bottom-5 left-0 text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="absolute -bottom-5 left-0 text-xs text-error-600">{error}</p>}
    </div>
  )
})

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
