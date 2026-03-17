'use client'

import React from 'react'

interface LoadingDotsProps {
  className?: string
  dotSize?: 'sm' | 'md' | 'lg'
  gap?: 'sm' | 'md' | 'lg'
  statusMessage?: string
}

/**
 * LoadingDots - A reusable loading animation component with bouncing dots
 * 
 * @param className - Additional CSS classes to apply to the container
 * @param dotSize - Size of the dots ('sm', 'md', 'lg')
 * @param gap - Gap between dots ('sm', 'md', 'lg')
 */
export default function LoadingDots({
  className = '',
  dotSize = 'md',
  gap = 'sm',
  statusMessage = 'Thinking...'

}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  }

  return (
    <div className={`flex items-center justify-center ${gapClasses[gap]} ${className}`}>
      <span
        className={`${sizeClasses[dotSize]} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`${sizeClasses[dotSize]} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={`${sizeClasses[dotSize]} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
      <span className="text-sm text-gray-500">
        {statusMessage}
      </span>
    </div>
  )
}

