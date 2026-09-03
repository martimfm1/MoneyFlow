import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingRecurring() {
  return <main className="moneyflow-shell py-6 sm:py-10"><div className="flex justify-between"><Skeleton className="h-9 w-48"/><Skeleton className="h-8 w-28"/></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardHeader><Skeleton className="h-4 w-20"/></CardHeader><CardContent><Skeleton className="h-8 w-28"/></CardContent></Card>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index}><CardHeader><Skeleton className="h-5 w-32"/></CardHeader><CardContent><Skeleton className="h-8 w-24"/><Skeleton className="mt-4 h-4 w-full"/><Skeleton className="mt-2 h-4 w-2/3"/></CardContent></Card>)}</div></main>
}
