import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const variants = {
  primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
  secondary: 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]',
  ghost: 'bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]',
  danger: 'bg-[hsl(var(--danger))] text-white hover:opacity-90',
}

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
