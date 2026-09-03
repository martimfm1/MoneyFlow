'use client'

import {
  createContext,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: MutableRefObject<HTMLButtonElement | null>
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) throw new Error('Popover components must be used inside Popover')
  return context
}

export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const open = controlledOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { open, setOpen, triggerRef } = usePopoverContext()
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      className={className}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  )
}

export function PopoverContent({
  className,
  children,
  align = 'end',
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }) {
  const { open, setOpen, triggerRef } = usePopoverContext()
  const ref = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = ref.current?.offsetWidth ?? 220
      const left =
        align === 'start'
          ? rect.left
          : align === 'center'
            ? rect.left + rect.width / 2 - width / 2
            : rect.right - width
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [align, open, setOpen, triggerRef])

  if (!open) return null
  return createPortal(
    <div
      ref={ref}
      className={cn(
        'fixed z-[100] min-w-44 overflow-hidden rounded-xl border bg-[hsl(var(--surface))] p-1 shadow-xl animate-in fade-in-0 zoom-in-95',
        className,
      )}
      style={{ top: position.top, left: position.left }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  )
}
