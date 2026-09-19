'use client'

import { ExternalLink } from 'lucide-react'

export function SilentraCredit({ className = '' }: { className?: string }) {
  return (
    <p
      className={[
        'text-xs text-[hsl(var(--muted-foreground))]',
        className,
      ].join(' ')}
    >
      Made by{' '}
      <a
        href="https://silentra.me"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1 font-medium text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--brand-green))] hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
      >
        Silentra
        <ExternalLink
          aria-hidden="true"
          className="size-3 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </p>
  )
}
