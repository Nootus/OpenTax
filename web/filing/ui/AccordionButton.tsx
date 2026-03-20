import { ChevronDownIcon } from '@heroicons/react/24/outline'
import React, { forwardRef } from 'react'

type Variant = 'default' | 'primary' | 'purple' | 'blue' | 'green' | 'orange'

interface AccordionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  isOpen: boolean
  icon?: React.ReactNode
  badge?: string | number
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-50 hover:bg-gray-100',
  primary: 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-600',
  purple: 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-l-4 border-purple-600',
  blue: 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-l-4 border-blue-600',
  green: 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-l-4 border-green-600',
  orange: 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-l-4 border-orange-600',
}

const AccordionButton = forwardRef<HTMLButtonElement, AccordionButtonProps>(({ 
  variant = 'default', 
  isOpen,
  icon,
  badge,
  className = '', 
  children, 
  ...props 
}, ref) => {
  const baseStyles = 'w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 text-left'
  
  return (
    <button 
      ref={ref}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      aria-expanded={isOpen}
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-sm font-medium text-gray-800 truncate">{children}</span>
        {badge !== undefined && (
          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-white rounded-full text-gray-600 shadow-sm">
            {badge}
          </span>
        )}
      </div>
   <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
})

AccordionButton.displayName = 'AccordionButton'

export default AccordionButton

