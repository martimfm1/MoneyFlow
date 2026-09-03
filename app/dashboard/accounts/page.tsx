import Link from 'next/link'
import { Archive, ArchiveRestore, Pencil, Plus, Wallet } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toggleAccountStatus } from './actions'
import { DeleteAccountButton } from './delete-button'

export const dynamic = 'force-dynamic'
const labels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; toast?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, account_type, balance, currency_code, is_active')
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('created_at'),
  ])
  const currency = profile?.currency_code ?? 'EUR'
  const rows = accounts ?? []
  const active = rows.filter((item) => item.is_active)
  const total = active.reduce((sum, item) => sum + Number(item.balance), 0)

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Financeiro</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Contas
          </h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounts/new">
            <Plus className="size-4" /> Nova
          </Link>
        </Button>
      </header>
      {params.error ? (
        <Card className="mt-4 border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive" role="alert">
            {params.error}
          </CardContent>
        </Card>
      ) : null}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Saldo total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(total, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Contas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {active.length}
            </p>
          </CardContent>
        </Card>
      </section>
      {rows.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">As tuas contas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[200px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          className="font-medium hover:underline"
                        >
                          {account.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {labels[account.account_type] ?? account.account_type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={account.is_active ? 'secondary' : 'outline'}
                        >
                          {account.is_active ? 'Ativa' : 'Arquivada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(
                          Number(account.balance),
                          account.currency_code || currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/dashboard/accounts/${account.id}/edit`}
                            >
                              <Pencil className="size-4" /> Editar
                            </Link>
                          </Button>
                          <form action={toggleAccountStatus}>
                            <input type="hidden" name="id" value={account.id} />
                            <input
                              type="hidden"
                              name="isActive"
                              value={account.is_active ? 'false' : 'true'}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="ghost"
                              aria-label={
                                account.is_active ? 'Arquivar' : 'Reativar'
                              }
                            >
                              {account.is_active ? (
                                <Archive className="size-4" />
                              ) : (
                                <ArchiveRestore className="size-4" />
                              )}
                            </Button>
                          </form>
                          <DeleteAccountButton
                            id={account.id}
                            name={account.name}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Empty className="mt-6 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Sem contas</EmptyTitle>
            <EmptyDescription>Adiciona a primeira conta.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/dashboard/accounts/new">Criar conta</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </main>
  )
}
