'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid'
import { ReactNode } from 'react'

type InfoBoxVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral'

interface InfoBoxProps {
  /** Title of the info box */
  title?: string
  /** Content - can be string, array of strings, or ReactNode */
  children?: ReactNode
  /** List items (alternative to children for bullet lists) */
  items?: string[]
  /** Color variant */
  variant?: InfoBoxVariant
  /** Icon to show (optional) */
  icon?: ReactNode
  /** Additional className */
  className?: string
}

const variantStyles: Record<InfoBoxVariant, { bg: string; border: string; title: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-800',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'text-green-800',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-800',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-800',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    title: 'text-gray-800',
    text: 'text-gray-600',
    icon: 'text-gray-500',
  },
}

const defaultIcons: Record<InfoBoxVariant, ReactNode> = {
  info: (
    <InformationCircleIcon className="w-5 h-5 text-blue-500" />
  ),
  success: (
    <CheckCircleIcon className="w-5 h-5 text-green-500" />
  ),
  warning: (
    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
  ),
  error: (
    <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
  ),
  neutral: (
    <InformationCircleIcon className="w-5 h-5 text-gray-500" />
  ),
}

export default function InfoBox({
  title,
  children,
  items,
  variant = 'info',
  icon,
  className = '',
}: InfoBoxProps) {
  const styles = variantStyles[variant]
  const displayIcon = icon !== undefined ? icon : defaultIcons[variant]

  return (
    <div className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${className}`}>
      <div className="flex gap-3">
        {displayIcon && (
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {displayIcon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h4 className={`text-sm font-medium ${styles.title} ${items || children ? 'mb-2' : ''}`}>
              {title}
            </h4>
          )}
          {items && items.length > 0 && (
            <ul className={`text-xs ${styles.text} space-y-1`}>
              {items.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          )}
          {children && (
            <div className={`text-xs ${styles.text}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


