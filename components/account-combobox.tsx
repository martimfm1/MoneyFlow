'use client'

import { useState } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'

export type AccountOption = {
  id: string
  name: string
  currencyCode?: string | null
  balance?: number | string | null
}

type Props = {
  name: string
  accounts: AccountOption[]
  defaultValue?: string
  required?: boolean
}

export function AccountCombobox({
  name,
  accounts,
  defaultValue,
  required = true,
}: Props) {
  const initialAccount =
    accounts.find((account) => account.id === defaultValue) ??
    accounts[0] ??
    null
  const [value, setValue] = useState<AccountOption | null>(initialAccount)

  return (
    <div className="grid gap-2 text-sm font-medium">
      <span>Conta</span>
      <input
        type="hidden"
        name={name}
        value={value?.id ?? ''}
        required={required}
      />
      <Combobox
        items={accounts}
        value={value}
        onValueChange={(nextValue) => setValue(nextValue)}
        itemToStringLabel={(account: AccountOption) => account.name}
      >
        <ComboboxInput
          placeholder="Escolher conta"
          aria-label="Conta"
          showClear={false}
        />
        <ComboboxContent>
          <ComboboxEmpty>Nenhuma conta encontrada.</ComboboxEmpty>
          <ComboboxList>
            {accounts.map((account) => (
              <ComboboxItem key={account.id} value={account}>
                <Item size="sm" className="w-full border-0 p-0 shadow-none">
                  <ItemContent>
                    <ItemTitle>{account.name}</ItemTitle>
                    <ItemDescription>
                      {account.currencyCode ?? ''}
                      {account.balance != null
                        ? ` · ${Number(account.balance).toFixed(2)}`
                        : ''}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
        <ComboboxValue />
      </Combobox>
    </div>
  )
}
