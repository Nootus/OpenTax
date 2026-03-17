import React from 'react'

interface TipProps {
  icon: React.ReactNode
  heading: string
  description: string
}

export default function Tip({ icon, heading, description }: TipProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
      <span className="text-xl mt-1">{icon}</span>
      <div>
        <div className="text-sm font-semibold text-primary">{heading}</div>
        <div className="text-xs text-muted mt-1">{description}</div>
      </div>
    </div>
  )
}
