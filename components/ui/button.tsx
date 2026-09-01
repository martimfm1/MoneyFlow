import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'default' | 'sm' | 'icon'
  asChild?: boolean
  children?: ReactNode
}

const variants = {
  primary:
    'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
  secondary:
    'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]',
  outline:
    'border bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]',
  ghost:
    'bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]',
  danger: 'bg-[hsl(var(--danger))] text-white hover:opacity-90',
}

const sizes = {
  default: 'min-h-11 px-4',
  sm: 'min-h-9 px-3 text-xs',
  icon: 'size-11 px-0',
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>

    return cloneElement(child, {
      className: cn(classes, child.props.className),
    })
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
