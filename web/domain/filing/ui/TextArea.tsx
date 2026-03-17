import React, { forwardRef } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ 
  label, 
  hint, 
  error, 
  className = '', 
  id,
  ...props 
}, ref) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <textarea 
        ref={ref}
        id={id}
        className={`form-input form-textarea ${error ? 'form-input--error' : ''}`}
        {...props} 
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
})

TextArea.displayName = 'TextArea'

export default TextArea
