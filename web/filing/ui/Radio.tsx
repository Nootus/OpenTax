import React, { forwardRef } from 'react'

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({ 
  label, 
  description,
  className = '', 
  id, 
  ...props 
}, ref) => {
  return (
    <label htmlFor={id} className={`form-radio ${className}`}>
      <input 
        ref={ref}
        type="radio" 
        id={id}
        className="form-radio__input" 
        {...props} 
      />
      <span className="form-radio__circle">
        <span className="form-radio__dot" />
      </span>
      {(label || description) && (
        <span className="form-radio__content">
          {label && <span className="form-radio__label">{label}</span>}
          {description && <span className="form-radio__description">{description}</span>}
        </span>
      )}
    </label>
  )
})

Radio.displayName = 'Radio'

export default Radio
