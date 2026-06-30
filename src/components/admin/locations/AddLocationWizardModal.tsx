import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { LgaBoostTierConfigCards } from '@/components/admin/locations/LgaBoostTierConfigCards'
import { AdminLgaMapPicker } from '@/components/maps/AdminLgaMapPicker'
import {
  aggregateDurationsFromTiers,
  defaultLgaBoostFormState,
  type LgaBoostFormState,
  type LgaBoostTierForm,
} from '@/features/maps/lgaBoostTypes'
import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

const STEPS = [
  { id: 1, title: 'Map & coordinates', short: 'Map' },
  { id: 2, title: 'Location details', short: 'Details' },
  { id: 3, title: 'Boost configuration', short: 'Boost' },
] as const

export type AddLocationWizardSubmit = {
  countryName: string
  stateName: string
  cityName: string
  lgaName: string
  fullAddress: string
  mapPick: LgaMapPickResult
  boostConfig: LgaBoostFormState
}

type Props = {
  open: boolean
  onClose: () => void
  googleMapsApiKey: string | undefined
  onSubmit: (input: AddLocationWizardSubmit) => Promise<void>
  saving: boolean
  saveError: string | null
}

function buildDetailedAddressFromPick(pick: LgaMapPickResult): string {
  return pick.formattedAddress?.trim() || ''
}

export function AddLocationWizardModal({
  open,
  onClose,
  googleMapsApiKey,
  onSubmit,
  saving,
  saveError,
}: Props) {
  const [step, setStep] = useState(1)
  const [mapPick, setMapPick] = useState<LgaMapPickResult | null>(null)
  const [countryName, setCountryName] = useState('Nigeria')
  const [stateName, setStateName] = useState('')
  const [cityName, setCityName] = useState('')
  const [lgaName, setLgaName] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [boostConfig, setBoostConfig] = useState<LgaBoostFormState>(() => defaultLgaBoostFormState())

  useEffect(() => {
    if (!open) return
    setStep(1)
    setMapPick(null)
    setCountryName('Nigeria')
    setStateName('')
    setCityName('')
    setLgaName('')
    setFullAddress('')
    setBoostConfig(defaultLgaBoostFormState())
  }, [open])

  const handleMapPick = (pick: LgaMapPickResult) => {
    setMapPick(pick)
    setCountryName(pick.country || 'Nigeria')
    setStateName(pick.administrativeAreaLevel1 || '')
    setCityName(pick.locality || '')
    setLgaName(pick.administrativeAreaLevel2 || pick.locality || pick.displayName || '')
    setFullAddress(buildDetailedAddressFromPick(pick))
  }

  const canGoStep2 = Boolean(mapPick)
  const canGoStep3 = stateName.trim().length > 0 && lgaName.trim().length > 0

  const goNext = () => {
    if (step === 1 && !canGoStep2) return
    if (step === 2 && !canGoStep3) return
    setStep((s) => Math.min(3, s + 1))
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const updateTiers = (tiers: LgaBoostTierForm[]) => {
    setBoostConfig((prev) => ({
      ...prev,
      tiers,
      durations: aggregateDurationsFromTiers(tiers),
    }))
  }

  const handleSubmit = async () => {
    if (!mapPick) return
    await onSubmit({
      countryName,
      stateName,
      cityName,
      lgaName,
      fullAddress,
      mapPick,
      boostConfig,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[98vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add location</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Pick on the map, confirm names and address, then configure boost for this LGA.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step strip */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-5 py-3">
          {STEPS.map((s, i) => {
            const active = step === s.id
            const done = step > s.id
            return (
              <div key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active
                    ? 'bg-blue-600 text-white'
                    : done
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {done ? '✓' : s.id}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s.title}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden h-px min-w-[12px] flex-1 bg-gray-200 sm:block" aria-hidden />
                )}
              </div>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-700">Search or click the map</p>
              <p className="text-[11px] text-gray-500">
                Coordinates and Google Place data from Geocoding / Places are stored with the LGA for validation,
                previews, and future regions.
              </p>
              <AdminLgaMapPicker apiKey={googleMapsApiKey} onPick={handleMapPick} />
              {mapPick && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-900">
                  <p>
                    <span className="font-semibold">Place ID:</span> {mapPick.googlePlaceId}
                  </p>
                  <p>
                    <span className="font-semibold">Coordinates:</span> {mapPick.lat.toFixed(6)}, {mapPick.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="wiz-country">
                  Country
                </label>
                <input
                  id="wiz-country"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="wiz-state">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="wiz-state"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="wiz-city">
                  City
                </label>
                <input
                  id="wiz-city"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="wiz-lga">
                  LGA name <span className="text-red-500">*</span>
                </label>
                <input
                  id="wiz-lga"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={lgaName}
                  onChange={(e) => setLgaName(e.target.value)}
                  placeholder="Local government area"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="wiz-address">
                  Full address
                </label>
                <textarea
                  id="wiz-address"
                  rows={3}
                  dir="ltr"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Full formatted address"
                />
              </div>
              {!canGoStep3 && (
                <p className="text-xs text-blue-700">State and LGA are required to continue.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={boostConfig.enabled}
                  onChange={(e) => setBoostConfig((p) => ({ ...p, enabled: e.target.checked }))}
                />
                <span className="text-sm font-medium text-gray-900">Boost enabled for this LGA</span>
              </label>
              <p className="text-[11px] text-gray-500">
                When disabled, vendors cannot purchase boosts here until you turn this on.
              </p>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Boost plans for this LGA
                </p>
                <LgaBoostTierConfigCards
                  tiers={boostConfig.tiers}
                  onChange={updateTiers}
                  disabled={!boostConfig.enabled}
                />
                <p className="mt-2 text-[11px] text-gray-500">
                  Top 10 (10 slots), Top 5 (5 slots), and Top 1 (1 slot). Set 7 / 14 / 30 day prices per plan.
                  Slot availability is tracked automatically once boosts go live.
                </p>
              </div>
            </div>
          )}

          {saveError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {saveError}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3">
          <div className="text-[11px] text-gray-500">
            {step < 3 ? 'Complete each step to save.' : 'Submit sends data to the admin locations API.'}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3) || saving}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving || !mapPick}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save location'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
