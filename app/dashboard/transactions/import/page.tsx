import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContext } from '@/lib/financial-context'
import { Button } from '@/components/ui/button'
import { CsvImportForm } from './csv-import-form'

export const dynamic = 'force-dynamic'

export default async function ImportTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const financialContext = await getFinancialContext(supabase, user.id)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, currency_code')
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="size-4" /> Movimentos
          </Link>
        </Button>
      </div>

      <header className="mt-4 max-w-2xl">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Importação de movimentos · {financialContext.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Importar ficheiro CSV
        </h1>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Importa movimentos exportados da Revolut ou de outro banco compatível.
          Não precisas de ligar a conta bancária nem de partilhar credenciais.
        </p>
      </header>

      <CsvImportForm
        accounts={accounts ?? []}
        contextName={financialContext.name}
        error={params.error}
      />
    </main>
  )
}
