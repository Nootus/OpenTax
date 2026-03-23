'use client'

import { ReactNode } from 'react'

export interface Tab {
  id: string
  label?: string
  icon?: ReactNode
}

interface TabsProps {
  /** Array of tabs */
  tabs: Tab[]
  /** Currently active tab id */
  activeTab: string
  /** Tab change handler */
  onChange: (tabId: string) => void
  /** Show labels (default: false, icon only) */
  showLabels?: boolean
  /** Tab size */
  size?: 'sm' | 'md' | 'lg'
  /** Variant style */
  variant?: 'underline' | 'pills' | 'enclosed'
  /** Additional className */
  className?: string
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  showLabels = false,
  size = 'md',
  variant = 'underline',
  className = '',
}: TabsProps) {
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const getVariantStyles = (isActive: boolean) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-blue-100 text-blue-700 rounded-lg'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg'
      case 'enclosed':
        return isActive
          ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 rounded-t-lg -mb-px'
          : 'text-gray-500 hover:text-gray-700 bg-gray-50 border-b border-gray-200'
      case 'underline':
      default:
        return isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
    }
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center justify-center gap-2 font-medium transition-all
              ${sizeStyles[size]}
              ${getVariantStyles(isActive)}
            `}
            title={tab.label}
          >
            {tab.icon && (
              <span className={iconSizes[size]}>
                {tab.icon}
              </span>
            )}
            {showLabels && tab.label && (
              <span>{tab.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}


