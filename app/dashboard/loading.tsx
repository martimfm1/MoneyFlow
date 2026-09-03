export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="A carregar a dashboard"
      className="min-h-screen px-5 py-6 md:px-0 md:py-8"
    >
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]" />
          <div className="h-4 w-64 rounded-[var(--radius-sm)] bg-[hsl(var(--surface-muted))]" />
        </div>

        <section aria-label="Resumo financeiro" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-[var(--radius-lg)] border border-[hsl(var(--border)/0.9)] bg-[hsl(var(--surface))]"
            />
          ))}
        </section>

        <section aria-label="Atividade financeira recente" className="space-y-3">
          <div className="h-6 w-40 rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]" />
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border)/0.9)] bg-[hsl(var(--surface))]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 border-b border-[hsl(var(--border)/0.7)] px-4 py-4 last:border-b-0"
              >
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded bg-[hsl(var(--surface-muted))]" />
                  <div className="h-3 w-24 rounded bg-[hsl(var(--surface-muted))]" />
                </div>
                <div className="h-4 w-20 rounded bg-[hsl(var(--surface-muted))]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
