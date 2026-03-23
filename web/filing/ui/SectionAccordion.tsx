'use client'

import { ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { ReactNode, useState } from 'react'

type SectionVariant = 'purple' | 'orange' | 'teal' | 'blue' | 'indigo'

interface SectionAccordionProps {
  /** Section title */
  title: string
  /** Icon element (emoji or React component) */
  icon?: ReactNode
  /** Color variant */
  variant?: SectionVariant
  /** Amount to display (optional, for sections with totals) */
  amount?: number | string
  /** Controlled open state (optional) */
  isOpen?: boolean
  /** Callback when toggle is clicked */
  onToggle?: () => void
  /** Default open state for uncontrolled mode */
  defaultOpen?: boolean
  /** Children content */
  children: ReactNode
  /** Additional className for the container */
  className?: string
  /** Number of validation errors in this section */
  errorCount?: number
}

const variantStyles: Record<SectionVariant, { bg: string; border: string; iconBg: string }> = {
  purple: {
    bg: 'bg-gradient-to-r from-purple-50 to-fuchsia-50',
    border: 'border-l-4 border-purple-500',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  orange: {
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
    border: 'border-l-4 border-orange-500',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  teal: {
    bg: 'bg-gradient-to-r from-teal-50 to-cyan-50',
    border: 'border-l-4 border-teal-500',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    border: 'border-l-4 border-blue-500',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  indigo: {
    bg: 'bg-gradient-to-r from-indigo-50 to-violet-50',
    border: 'border-l-4 border-indigo-500',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
}

export function SectionAccordion({
  title,
  icon,
  variant = 'purple',
  amount,
  isOpen: controlledOpen,
  onToggle,
  defaultOpen = false,
  children,
  className = '',
  errorCount = 0,
}: SectionAccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  
  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalOpen(!internalOpen)
    }
  }

  const styles = variantStyles[variant]
  const hasErrors = errorCount > 0

  // Format amount with Indian Rupee formatting
  const formatAmount = (value: number | string) => {
    if (typeof value === 'string') return value
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className={className}>
      {/* Header Button */}
      <div className={`${styles.bg} ${styles.border} rounded-lg shadow-sm overflow-hidden`}>
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between p-3 hover:bg-white/40 transition-colors duration-200"
        >
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center text-lg`}>
                {icon}
              </div>
            )}
            <h3 className={`font-semibold text-sm ${hasErrors ? 'text-red-600' : 'text-gray-800'}`}>
              {title}
            </h3>
            {hasErrors && (
              <span className="flex items-center gap-1 text-red-500">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                  {errorCount}
                </span>
              </span>
            )}
          </div>

          {/* Right: Amount + Chevron */}
          <div className="flex items-center gap-3">
            {amount !== undefined && (
              <span className="text-sm font-bold text-gray-700">
                {formatAmount(amount)}
              </span>
            )}
            <ChevronRightIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
          </div>
        </button>
      </div>

      {/* Collapsible Content */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 pl-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SectionAccordion


