'use client'

import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface SubsectionHeaderProps {
  title: string
  amount?: number
  isOpen: boolean
  onToggle: () => void
  formatCurrency?: (amount: number) => string
  errorCount?: number  // Number of validation errors in this section
}

export default function SubsectionHeader({
  title,
  amount,
  isOpen,
  onToggle,
  formatCurrency = (amt) => `₹${amt.toLocaleString('en-IN')}`,
  errorCount = 0,
}: SubsectionHeaderProps) {
  const hasError = errorCount > 0
  
  return (
    <button 
      onClick={onToggle} 
      className={`w-full text-left text-sm font-medium flex justify-between items-center min-h-[44px] py-1 transition-colors ${hasError ? 'text-red-600 hover:text-red-700' : 'text-gray-800 hover:text-blue-600'}`}
    >
      <span className="flex items-center gap-1.5">
        {hasError && <ExclamationCircleIcon className="w-4 h-4 text-red-500" />}
        {title}
        {hasError && (
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
            {errorCount}
          </span>
        )}
      </span>
      <div className="flex items-center gap-2">
        {amount !== undefined && (
          <span className={`font-semibold text-xs ${hasError ? 'text-red-600' : 'text-gray-700'}`}>
            {formatCurrency(amount)}
          </span>
        )}
        <ChevronDownIcon className={`w-4 h-4 ${hasError ? 'text-red-500' : 'text-gray-500'} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>
  )
}

