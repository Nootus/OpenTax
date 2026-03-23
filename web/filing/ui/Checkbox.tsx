import { CheckIcon } from '@heroicons/react/24/outline'
import React, { forwardRef } from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ 
  label, 
  description,
  className = '', 
  id, 
  ...props 
}, ref) => {
  return (
    <label htmlFor={id} className={`form-checkbox ${className}`}>
      <input 
        ref={ref}
        type="checkbox" 
        id={id}
        className="form-checkbox__input" 
        {...props} 
      />
      <span className="form-checkbox__box">
        <CheckIcon className="w-4 h-4 text-white" />
      </span>
      {(label || description) && (
        <span className="form-checkbox__content">
          {label && <span className="form-checkbox__label">{label}</span>}
          {description && <span className="form-checkbox__description">{description}</span>}
        </span>
      )}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
