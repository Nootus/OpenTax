import React, { forwardRef } from 'react'

type Variant = 'default' | 'ghost' | 'outline' | 'primary'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  label: string // Required for accessibility
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900',
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
  outline: 'border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
}

const sizeStyles: Record<Size, string> = {
  xs: 'w-6 h-6 rounded',
  sm: 'w-8 h-8 rounded-md',
  md: 'w-10 h-10 rounded-lg',
  lg: 'w-12 h-12 rounded-lg',
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ 
  variant = 'ghost', 
  size = 'sm', 
  label,
  className = '', 
  children, 
  disabled, 
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
  
  return (
    <button 
      ref={ref}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()} 
      disabled={disabled} 
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  )
})

IconButton.displayName = 'IconButton'

export default IconButton

