export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading MoneyFlow"
      className="min-h-screen bg-[hsl(var(--background))] px-5 py-8 text-[hsl(var(--foreground))]"
    >
      <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))]" />
          <div className="h-40 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))]" />
        </div>
        <div className="h-56 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))]" />
      </div>
    </main>
  )
}
