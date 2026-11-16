import { redirect } from 'next/navigation'

export default function LegacyOverviewPage(): never {
  redirect('/dashboard')
}
