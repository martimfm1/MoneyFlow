import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

const principles = [
  {
    icon: Smartphone,
    title: "Mobile first",
    description: "Designed for quick money decisions on iPhone, then enhanced for larger screens.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description: "Financial data stays protected by server-side authorization and Supabase RLS.",
  },
];

export default function HomePage() {
  return (
    <main className="moneyflow-shell flex min-h-screen flex-col justify-center py-12 sm:py-20">
      <section className="max-w-2xl">
        <p className="mb-4 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          MoneyFlow
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Know what you have. Decide what comes next.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
          A personal finance and wishlist app built around one simple flow: track, understand,
          prioritize and decide.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--primary))] px-5 text-sm font-medium text-[hsl(var(--primary-foreground))]">
            Foundation in progress
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </div>
      </section>

      <section className="mt-14 grid gap-3 sm:grid-cols-2" aria-label="Product principles">
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
  );
}
