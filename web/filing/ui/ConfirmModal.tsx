"use client"
import React from 'react'
import Button from './Button'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  tone?: 'default' | 'danger' | 'success'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const toneStyles: Record<NonNullable<ConfirmModalProps['tone']>, { icon: string; header: string; confirm: string }>= {
  default: { icon: 'text-[#6B7280]', header: 'text-[#111827]', confirm: 'bg-[#5B47FB] text-white hover:bg-[#4f3cf4]' },
  danger: { icon: 'text-[#DC2626]', header: 'text-[#111827]', confirm: 'bg-[#DC2626] text-white hover:bg-[#b91c1c]' },
  success: { icon: 'text-[#059669]', header: 'text-[#111827]', confirm: 'bg-[#059669] text-white hover:bg-[#047857]' },
}

export default function ConfirmModal({ open, title = 'Confirm action', message, confirmText = 'Confirm', cancelText = 'Cancel', tone = 'default', isLoading = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null
  const t = toneStyles[tone]
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
          <div className="flex items-start gap-3 px-5 pt-5">
            <span className={`text-xl ${t.icon}`}>⚑</span>
            <div>
              <h3 className={`text-base font-semibold ${t.header}`}>{title}</h3>
              {message && <p className="mt-1 text-sm text-[#6B7280]">{message}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-5 py-4">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'}
              size="md"
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
