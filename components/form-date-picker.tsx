'use client'

import { useId, useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function FormDatePicker({
  name,
  defaultValue,
  label,
}: {
  name: string
  defaultValue: string
  label: string
}) {
  const [date, setDate] = useState(parseDate(defaultValue))
  const [open, setOpen] = useState(false)
  const labelId = useId()
  const dateId = useId()
  const formattedDate = date.toLocaleDateString('pt-PT')

  return (
    <div className="grid gap-2 text-sm font-medium">
      <span id={labelId}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
              aria-labelledby={`${labelId} ${dateId}`}
              aria-haspopup="dialog"
            />
          }
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
          {formattedDate}
          <span id={dateId} className="sr-only">
            {formattedDate}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next) => {
              if (next) {
                setDate(next)
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        name={name}
        value={date.toISOString().slice(0, 10)}
      />
    </div>
  )
}
