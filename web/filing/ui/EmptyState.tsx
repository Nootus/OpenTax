'use client'

interface EmptyStateProps {
  message?: string
}

export default function EmptyState({ 
  message = 'No data available' 
}: EmptyStateProps) {
  return (
    <div className="text-center py-2 text-gray-500 text-xs">
      {message}
    </div>
  )
}

