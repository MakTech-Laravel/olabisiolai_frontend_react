import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
  )
}

type LocationCascadeSelectsProps = {
  state: string
  city: string
  locationId: string
  states: string[]
  cities: string[]
  lgaOptions: Array<{ id: string; lga: string }>
  onStateChange: (state: string) => void
  onCityChange: (city: string) => void
  onLocationChange: (locationId: string) => void
  disabled?: boolean
  stateLoading?: boolean
  savedLocationOption?: { id: string; state: string; city: string; lga: string } | null
}

function SelectShell({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: ReactNode
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'relative z-[1] h-11 w-full cursor-pointer appearance-none rounded-md border border-border-light bg-background px-3 pr-12 text-sm text-foreground shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
            disabled && 'cursor-not-allowed opacity-80',
          )}
        >
          {children}
        </select>
        <ChevronRight
          className="pointer-events-none absolute right-3 top-1/2 z-0 size-4 -translate-y-1/2 rotate-90 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  )
}

export function LocationCascadeSelects({
  state,
  city,
  locationId,
  states,
  cities,
  lgaOptions,
  onStateChange,
  onCityChange,
  onLocationChange,
  disabled,
  stateLoading,
  savedLocationOption,
}: LocationCascadeSelectsProps) {
  return (
    <>
      <SelectShell
        label="State"
        value={state}
        disabled={disabled || stateLoading || states.length === 0}
        onChange={onStateChange}
      >
        <option value="">{stateLoading ? 'Loading states…' : 'Select state'}</option>
        {savedLocationOption && !states.includes(savedLocationOption.state) ? (
          <option value={savedLocationOption.state}>{savedLocationOption.state}</option>
        ) : null}
        {states.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectShell>

      <div className="grid gap-5 sm:grid-cols-2 mt-2">
        <SelectShell
          label="City"
          value={city}
          disabled={disabled || !state || cities.length === 0}
          onChange={onCityChange}
        >
          <option value="">Select city</option>
          {savedLocationOption &&
          savedLocationOption.state === state &&
          !cities.includes(savedLocationOption.city) ? (
            <option value={savedLocationOption.city}>{savedLocationOption.city}</option>
          ) : null}
          {cities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectShell>

        <SelectShell
          label="LGA (Local Government Area)"
          value={locationId}
          disabled={disabled || !city || lgaOptions.length === 0}
          onChange={onLocationChange}
        >
          <option value="">Select LGA</option>
          {savedLocationOption &&
          savedLocationOption.state === state &&
          savedLocationOption.city === city &&
          !lgaOptions.some((entry) => entry.id === savedLocationOption.id) ? (
            <option value={savedLocationOption.id}>{savedLocationOption.lga}</option>
          ) : null}
          {lgaOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.lga}
            </option>
          ))}
        </SelectShell>
      </div>
    </>
  )
}
