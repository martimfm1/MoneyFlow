import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type LinkButtonProps = LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    children: ReactNode
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
}

export function LinkButton({
  className,
  variant = 'primary',
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium transition-opacity',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
