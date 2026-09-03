'use client'

import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('Dialog components must be used inside Dialog')
  return context
}

export function Dialog({
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
  const open = controlledOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext()
  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

export function DialogContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialogContext()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[1.5rem] border bg-[hsl(var(--surface))] p-5 shadow-2xl outline-none animate-in slide-in-from-bottom-3 sm:animate-in sm:fade-in-0 sm:zoom-in-95',
          className,
        )}
        {...props}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pr-8', className)} {...props} />
}

export function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'mt-1 text-sm text-[hsl(var(--muted-foreground))]',
        className,
      )}
      {...props}
    />
  )
}

export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-5 flex items-center justify-end gap-2', className)}
      {...props}
    />
  )
}
