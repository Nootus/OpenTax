import React from 'react'

interface SwitchProps {
  checked?: boolean
  label?: string
  description?: string
  disabled?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  id?: string
  size?: 'sm' | 'md'
}

export default function Switch({ 
  checked = false, 
  label, 
  description,
  disabled = false,
  onChange,
  className = '', 
  id,
  size = 'md',
}: SwitchProps) {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  const sizeClass = size === 'sm' ? 'form-switch--sm' : ''

  return (
    <label 
      htmlFor={id} 
      className={`form-switch ${sizeClass} ${disabled ? 'form-switch--disabled' : ''} ${className}`}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={`form-switch__track ${checked ? 'form-switch__track--checked' : ''}`}
      >
        <span className={`form-switch__thumb ${checked ? 'form-switch__thumb--checked' : ''}`} />
      </button>
      {(label || description) && (
        <span className="form-switch__content">
          {label && <span className="form-switch__label">{label}</span>}
          {description && <span className="form-switch__description">{description}</span>}
        </span>
      )}
    </label>
  )
}
