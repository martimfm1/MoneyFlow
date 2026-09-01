import { DashboardNavigation } from './navigation'

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl md:flex md:gap-6 md:px-6">
        <aside className="hidden w-60 shrink-0 py-6 md:block">
          <div className="sticky top-6 space-y-4">
            <div className="px-3">
              <p className="text-sm font-semibold tracking-tight">MoneyFlow</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Track → Understand → Decide</p>
            </div>
            <DashboardNavigation />
          </div>
        </aside>
        <div className="min-w-0 flex-1 pb-16 md:pb-8">{children}</div>
      </div>
      <div className="md:hidden">
        <DashboardNavigation />
      </div>
    </div>
  )
}
