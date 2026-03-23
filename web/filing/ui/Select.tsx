import { ChevronDownIcon } from '@heroicons/react/24/outline'
import React, { forwardRef, useMemo } from 'react'

interface Option { 
  label: string
  value: string 
}

interface GroupedOption {
  group: string
  options: Option[]
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options?: Option[]
  groupedOptions?: GroupedOption[]
  placeholder?: string
  icon?: React.ReactNode
  skeleton?: boolean
}
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ 
  label, 
  hint, 
  error, 
  options = [], 
  groupedOptions,
  placeholder,
  icon,
  skeleton = false,
  className = '', 
  id,
  children,
  value,
  defaultValue,
  required = false,
  disabled = false,
  ...props 
}, ref) => {
  // Flatten grouped options for value resolution
  const allOptions = useMemo(() => {
    if (groupedOptions) {
      return groupedOptions.flatMap(group => group.options)
    }
    return options
  }, [options, groupedOptions])

  // Convert label to value if needed (for API responses that return labels instead of values)
  const resolvedValue = useMemo(() => {
    if (!value || !allOptions.length) return value
    
    // Check if value already matches an option value
    const valueMatch = allOptions.find(opt => opt.value === value)
    if (valueMatch) return value
    
    // Check if value matches an option label (API might return label instead of value)
    const labelMatch = allOptions.find(opt => opt.label === value)
    if (labelMatch) return labelMatch.value
    
    // Return original value if no match found
    return value
  }, [value, allOptions])

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
    <div className={`w-full ${className}`}>
      <div className="relative w-full">
        <select 
          ref={ref}
          id={id}
          value={resolvedValue}
          defaultValue={defaultValue}
          disabled={disabled}
          className={`
            block px-2.5 pb-2.5 pt-4 w-full text-sm rounded-lg border appearance-none
            outline-none focus:outline-none focus-visible:outline-none focus:ring-0
            peer
            ${disabled 
              ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' 
              : 'text-text-primary bg-white border-secondary-300 focus:border-primary-500'
            }
            ${error ? 'border-error-500 focus:border-error-500' : ''}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {groupedOptions && groupedOptions.length > 0
            ? groupedOptions.map((group, groupIdx) => (
                <optgroup key={groupIdx} label={group.group}>
                  {group.options.map((o,idx) => (
                    <option key={o.value+idx} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))
            : options.length > 0
            ? options.map((o, index) => (
                <option key={o.value+index} value={o.value}>{o.label}</option>
              ))
            : children}
        </select>
        {!disabled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </span>
        )}
        {label && (
          <label
            htmlFor={id}
            className={`
              inline-flex items-center absolute text-sm duration-300 transform
              -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2
              start-1
              ${error 
                ? 'text-error-500' 
                : disabled
                ? 'text-gray-600'
                : 'text-text-tertiary'
              }
            `}
          >
            {icon && <span className="w-4 h-4 me-1.5">{icon}</span>}
            {label} {required && <span className="text-error-500">&nbsp;*</span>}
          </label>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  )
})
export default Select
