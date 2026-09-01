import Link from 'next/link'
import { ArrowRight, ShieldCheck, Smartphone } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

const principles = [
  {
    icon: Smartphone,
    title: 'Mobile first',
    description:
      'Decide rapidamente no iPhone, com uma experiência que também cresce para desktop.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy first',
    description:
      'Os teus dados financeiros ficam isolados por utilizador com autorização server-side e RLS.',
  },
]

export default function HomePage() {
  return (
    <main className="moneyflow-shell flex min-h-screen flex-col justify-center py-12 sm:py-20">
      <section className="max-w-2xl">
        <Link href="/" className="text-sm font-medium">
          MoneyFlow
        </Link>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Percebe o teu dinheiro. Decide o próximo passo.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
          Uma app pessoal de finanças e wishlist construída em torno de um fluxo
          simples: acompanhar, perceber, priorizar e decidir.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkButton href="/signup">
            Criar conta
            <ArrowRight aria-hidden="true" className="size-4" />
          </LinkButton>
          <LinkButton href="/login" variant="outline">
            Entrar
          </LinkButton>
        </div>
      </section>

      <section
        className="mt-14 grid gap-3 sm:grid-cols-2"
        aria-label="Princípios do produto"
      >
        {principles.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5"
          >
            <Icon aria-hidden="true" className="mb-8 size-5" />
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {description}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
