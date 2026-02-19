'use client'

import { ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string | ReactNode
  children: ReactNode
  footer?: ReactNode
  hideCloseButton?: boolean
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  hideCloseButton = false,
  className
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
  
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      window.addEventListener('keydown', handleKeyDown)
      document.body.classList.add('modal-open')
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [isOpen, onClose])

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl transition-all duration-200',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
          className
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:text-black cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {title && <div className="mb-5 text-2xl font-semibold text-center text-[#244B77] ">{title}</div>}

        <div className="space-y-4">{children}</div>

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  )
}
