'use client'

import { PlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import Button from '@/domain/filing/ui/Button'

interface AddButtonProps {
  label: string
  onClick: () => void
  variant?: 'default' | 'dashed'
  colorScheme?: 'purple' | 'orange' | 'teal' | 'blue'
  className?: string
  disableEdit?: boolean
  hasError?: boolean
}

export default function AddButton({
  label,
  onClick,
  variant = 'dashed',
  colorScheme = 'purple',
  className,
  disableEdit = false,
  hasError = false,
}: AddButtonProps) {
  const colors = {
    purple: 'border-gray-300 hover:border-purple-400',
    orange: 'border-gray-300 hover:border-orange-400',
    teal: 'border-gray-300 hover:border-teal-400',
    blue: 'border-gray-300 hover:border-blue-400',
  }
  
  const errorColors = 'border-red-300 hover:border-red-400 bg-red-50'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`w-full min-h-[44px] border-2 border-dashed ${hasError ? errorColors : colors[colorScheme]} text-xs touch-manipulation ${className || ''} ${disableEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={disableEdit}
    >
      {hasError && <ExclamationCircleIcon className="w-4 h-4 mr-1 text-red-500" />}
      <PlusIcon className="w-4 h-4 mr-1.5" />
      {label}
    </Button>
  )
}

