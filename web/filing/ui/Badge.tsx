import React from 'react'

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info'
type Size = 'sm' | 'md'

interface BadgeProps {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function Badge({ 
  variant = 'default', 
  size = 'md',
  icon,
  children,
  className = '' 
}: BadgeProps) {
  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`}>
      {icon && <span className="badge__icon">{icon}</span>}
      {children}
    </span>
  )
}
