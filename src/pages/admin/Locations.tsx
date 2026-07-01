import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Globe,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  AddLocationWizardModal,
  type AddLocationWizardSubmit,
} from '@/components/admin/locations/AddLocationWizardModal'
import { env } from '@/config/env'
import { alert, showError } from '@/lib/sweetAlert'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import {
  adminStoreLocation,
  adminListLocations,
  adminUpdateLocation,
  adminUpdateLocationStatus,
  adminDeleteLocation,
  type AdminSavedLocation,
} from '@/features/maps/adminLocationsApi'
import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

type LGA = AdminSavedLocation['lga']
type StateEntry = { id: string; name: string; lgas: LGA[] }

const COUNTRY_ID = 'country-ng'
const COUNTRY_NAME = 'Nigeria'

function toStateId(saved: AdminSavedLocation) {
  return saved.state.id !== null ? `state-${saved.state.id}` : `state-${saved.state.slug ?? saved.state.name}`
}

function toLgaId(saved: AdminSavedLocation) {
  if (saved.lga.id !== null) return `lga-${saved.lga.id}`
  const seed = saved.lga.slug ?? `${saved.state.name}-${saved.lga.name}`
  return `lga-${seed}`
}

function upsertStateLocation(prev: StateEntry[], saved: AdminSavedLocation): StateEntry[] {
  const stateId = toStateId(saved)
  const lgaId = toLgaId(saved)
  const nextLga = saved.lga

  const stateIndex = prev.findIndex((s) => s.id === stateId || s.name.toLowerCase() === saved.state.name.toLowerCase())
  if (stateIndex < 0) {
    return [
      {
        id: stateId,
        name: saved.state.name,
        lgas: [nextLga],
      },
      ...prev,
    ]
  }

  const current = prev[stateIndex]
  const lgaIndex = current.lgas.findIndex(
    (l) => toLgaEntryId(l, saved.state.name) === lgaId || l.name.toLowerCase() === saved.lga.name.toLowerCase(),
  )
  const updatedLgas =
    lgaIndex < 0
      ? [...current.lgas, nextLga]
      : current.lgas.map((l, idx) => {
        if (idx !== lgaIndex) return l
        return nextLga
      })

  return prev.map((state, idx) => {
    if (idx !== stateIndex) return state
    return {
      ...state,
      name: saved.state.name,
      lgas: updatedLgas,
    }
  })
}

function toLgaEntryId(lga: LGA, stateName: string): string {
  if (lga.id !== null) return `lga-${lga.id}`
  return `lga-${lga.slug ?? `${stateName}-${lga.name}`}`
}

function detailKey(stateId: string, lgaRowId: string) {
  return `${stateId}::${lgaRowId}`
}

type AddressComponentLike = {
  longText?: string
  shortText?: string
  types?: string[]
}

function parseAddressComponentsFromPick(pick: LgaMapPickResult): AddressComponentLike[] {
  try {
    const parsed = JSON.parse(pick.addressComponentsJson) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item === 'object') as AddressComponentLike[]
  } catch {
    return []
  }
}

function findComponent(components: AddressComponentLike[], type: string): string | null {
  const found = components.find((c) => Array.isArray(c.types) && c.types.includes(type))
  const value = found?.longText?.trim() || found?.shortText?.trim() || ''
  return value || null
}

function buildDetailedAddressFromPick(pick: LgaMapPickResult): string {
  const components = parseAddressComponentsFromPick(pick)

  const streetNumber = findComponent(components, 'street_number')
  const route = findComponent(components, 'route')
  const area =
    findComponent(components, 'sublocality_level_1') ||
    findComponent(components, 'sublocality') ||
    findComponent(components, 'neighborhood')
  const city = findComponent(components, 'locality') || pick.locality
  const lga = findComponent(components, 'administrative_area_level_2') || pick.administrativeAreaLevel2
  const state = findComponent(components, 'administrative_area_level_1') || pick.administrativeAreaLevel1
  const postal = findComponent(components, 'postal_code')
  const country = findComponent(components, 'country') || pick.country

  const roadPart = [streetNumber, route].filter(Boolean).join(' ')
  const ordered = [roadPart, area, city, lga, state, postal, country].filter(Boolean)
  const composed = ordered.join(', ').replace(/\s+,/g, ',').trim()

  return composed || pick.formattedAddress || ''
}

function mapsPreviewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
}

export default function LocationHierarchy() {
  const [locations, setLocations] = useState<StateEntry[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null)
  const [openCountry, setOpenCountry] = useState(true)
  const [openStates, setOpenStates] = useState<Set<string>>(new Set())
  const [detailLgaKey, setDetailLgaKey] = useState<string | null>(null)
  const [detailSaving, setDetailSaving] = useState(false)

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true)
      setSaveError(null)
      try {
        const fetchedLocations = await adminListLocations()
        let stateEntries: StateEntry[] = []

        fetchedLocations.forEach((location) => {
          stateEntries = upsertStateLocation(stateEntries, location)
        })

        setLocations(stateEntries)
      } catch (error) {
        console.error('Failed to load locations:', error)
        setSaveError(getLaravelErrorMessage(error, 'Failed to load locations.'))
      } finally {
        setLoadingLocations(false)
      }
    }

    loadLocations()
  }, [])

  const [filterCountry, setFilterCountry] = useState('all')
  const [filterState, setFilterState] = useState('all')
  const [filterBoost, setFilterBoost] = useState<'all' | 'enabled' | 'disabled'>('all')

  const toggleStateOpen = (id: string) => {
    setOpenStates((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyLgaPatch = useCallback(
    (stateId: string, lgaRowId: string, updater: (current: LGA) => LGA) => {
      setLocations((prev) =>
        prev.map((s) => {
          if (s.id !== stateId) return s
          return {
            ...s,
            lgas: s.lgas.map((l) => {
              const id = toLgaEntryId(l, s.name)
              if (id !== lgaRowId) return l
              return updater(l)
            }),
          }
        }),
      )
    },
    [],
  )

  const persistLgaUpdate = useCallback(
    async (
      stateId: string,
      lgaRowId: string,
      updatedLga: LGA,
      options?: { message?: string; silentToast?: boolean },
    ) => {
      const currentState = locations.find((s) => s.id === stateId)
      if (!currentState) return

      const currentLga = currentState.lgas.find((l) => toLgaEntryId(l, currentState.name) === lgaRowId)
      if (!currentLga?.id) {
        const msg = 'Cannot update: location ID missing. Refresh the page and try again.'
        setSaveError(msg)
        showError(msg)
        return
      }

      setDetailSaving(true)
      setSaveError(null)

      try {
        const saved = await adminUpdateLocation({
          locationId: currentLga.id,
          countryName: COUNTRY_NAME,
          stateName: currentState.name,
          lgaName: updatedLga.name,
          fullAddress: updatedLga.formattedAddress ?? undefined,
          latitude: updatedLga.latitude,
          longitude: updatedLga.longitude,
          googlePlaceId: updatedLga.googlePlaceId,
        })
        setLocations((prev) => upsertStateLocation(prev, saved))
        setLastSavedMessage(options?.message ?? `Updated ${saved.lga.name}`)
        if (!options?.silentToast) {
          alert.crud.updated('Location')
        }
      } catch (error) {
        applyLgaPatch(stateId, lgaRowId, () => currentLga)
        const message = getLaravelErrorMessage(error, 'Failed to update location.')
        setSaveError(message)
        showError(message)
        throw error
      } finally {
        setDetailSaving(false)
      }
    },
    [locations, applyLgaPatch],
  )

  const patchLga = useCallback(
    async (
      stateId: string,
      lgaRowId: string,
      updater: (current: LGA) => LGA,
    ) => {
      const currentState = locations.find((s) => s.id === stateId)
      if (!currentState) return

      const currentLga = currentState.lgas.find((l) => toLgaEntryId(l, currentState.name) === lgaRowId)
      if (!currentLga?.id) {
        const msg = 'Cannot update: location ID missing. Refresh the page and try again.'
        setSaveError(msg)
        showError(msg)
        return
      }

      const updatedLga = updater(currentLga)
      const boostToggled = currentLga.boost.enabled !== updatedLga.boost.enabled
      if (!boostToggled) {
        applyLgaPatch(stateId, lgaRowId, () => updatedLga)
        return
      }

      applyLgaPatch(stateId, lgaRowId, () => updatedLga)
      setDetailSaving(true)
      setSaveError(null)
      try {
        await adminUpdateLocationStatus({
          lgaId: currentLga.id,
          boostEnabled: updatedLga.boost.enabled,
        })
        setLastSavedMessage(
          `Boost ${updatedLga.boost.enabled ? 'enabled' : 'disabled'} for ${updatedLga.name}`,
        )
        alert.crud.updated('Location boost status')
      } catch (error) {
        applyLgaPatch(stateId, lgaRowId, () => currentLga)
        const message = getLaravelErrorMessage(
          error,
          updatedLga.boost.enabled
            ? 'Could not enable boost for this LGA.'
            : 'Could not disable boost for this LGA.',
        )
        setSaveError(message)
        showError(message)
      } finally {
        setDetailSaving(false)
      }
    },
    [locations, applyLgaPatch],
  )

  const saveLocationDetails = useCallback(
    async (
      stateId: string,
      lgaRowId: string,
      patch: { lgaName: string; formattedAddress: string },
    ) => {
      const currentState = locations.find((s) => s.id === stateId)
      if (!currentState) return

      const currentLga = currentState.lgas.find((l) => toLgaEntryId(l, currentState.name) === lgaRowId)
      if (!currentLga?.id) {
        const msg = 'Cannot update: location ID missing. Refresh the page and try again.'
        setSaveError(msg)
        showError(msg)
        return
      }

      const updatedLga: LGA = {
        ...currentLga,
        name: patch.lgaName.trim() || currentLga.name,
        formattedAddress: patch.formattedAddress.trim() || null,
      }

      applyLgaPatch(stateId, lgaRowId, () => updatedLga)
      await persistLgaUpdate(stateId, lgaRowId, updatedLga, {
        message: `Updated location details for ${updatedLga.name}`,
      })
    },
    [locations, applyLgaPatch, persistLgaUpdate],
  )

  const stats = useMemo(() => {
    const totalStates = locations.length
    const totalLgas = locations.reduce((sum, s) => sum + s.lgas.length, 0)
    const totalVendors = locations.reduce(
      (sum, s) => sum + s.lgas.reduce((v, l) => v + l.vendorCount, 0),
      0,
    )
    return {
      countries: totalStates > 0 || totalLgas > 0 ? 1 : 0,
      states: totalStates,
      lgas: totalLgas,
      vendors: totalVendors,
    }
  }, [locations])

  const filteredStates = useMemo(() => {
    return locations.filter((s) => {
      if (filterState !== 'all' && s.name !== filterState) return false
      if (filterBoost === 'all') return true
      return s.lgas.some((lga) => lgaPassesBoostFilter(lga))
    })
  }, [locations, filterState, filterBoost])

  function lgaPassesBoostFilter(lga: LGA): boolean {
    if (filterBoost === 'all') return true
    if (filterBoost === 'enabled') return lga.boost.enabled
    return !lga.boost.enabled
  }

  const stateOptions = useMemo(() => locations.map((s) => s.name).sort(), [locations])

  const handleWizardSubmit = async (input: AddLocationWizardSubmit) => {
    const address = input.fullAddress.trim() || buildDetailedAddressFromPick(input.mapPick)
    if (!input.stateName.trim() || !input.lgaName.trim()) {
      setSaveError('State and LGA are required.')
      return
    }

    setSaving(true)
    setSaveError(null)
    setLastSavedMessage(null)

    try {
      const saved = await adminStoreLocation({
        countryName: input.countryName,
        stateName: input.stateName,
        cityName: input.cityName,
        lgaName: input.lgaName,
        fullAddress: address,
        mapPick: input.mapPick,
        boostEnabled: input.boostEnabled,
      })

      const stateId = toStateId(saved)
      setLocations((prev) => upsertStateLocation(prev, saved))
      setOpenCountry(true)
      setOpenStates((prev) => new Set([...prev, stateId]))
      setShowAddModal(false)
      setLastSavedMessage(`Saved: ${saved.state.name} → ${saved.lga.name}`)
      alert.crud.created('Location')
    } catch (error) {
      const message = getLaravelErrorMessage(error, 'Failed to save location.')
      setSaveError(message)
      showError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLocation = async (stateId: string, lgaRowId: string, lgaName: string) => {
    const confirmed = await alert.confirmDelete(lgaName)
    if (!confirmed) {
      return
    }

    const currentState = locations.find(s => s.id === stateId)
    const currentLga = currentState?.lgas.find(l => toLgaEntryId(l, currentState.name) === lgaRowId)

    if (!currentLga || !currentLga.id) {
      setSaveError('Cannot delete location: missing ID')
      return
    }

    try {
      await adminDeleteLocation(currentLga.id)

      // Remove from local state
      setLocations((prev) =>
        prev.map((s) => {
          if (s.id !== stateId) return s
          return {
            ...s,
            lgas: s.lgas.filter((l) => toLgaEntryId(l, s.name) !== lgaRowId),
          }
        }).filter((s) => s.lgas.length > 0) // Remove state if no LGAs left
      )

      setLastSavedMessage(`Deleted: ${lgaName}`)
      alert.crud.deleted('Location')
    } catch (error) {
      const message = getLaravelErrorMessage(error, 'Failed to delete location.')
      setSaveError(message)
      showError(message)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans text-sm text-slate-800">
      <div className="mx-auto container  py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">Locations</h1>
            <p className="mt-1 text-sm text-slate-500">
              Add LGAs and control which areas vendors can boost in.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <MapIcon className="size-4 text-slate-600" />
              Google Maps
            </button>
            <button
              type="button"
              onClick={() => {
                setSaveError(null)
                setShowAddModal(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Add Location
            </button>
          </div>
        </div>

        {lastSavedMessage && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {lastSavedMessage}
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Countries</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{stats.countries || 0}</p>
                <p className="mt-1 text-xs text-slate-500">{stats.countries ? `${COUNTRY_NAME} active` : 'No regions yet'}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Globe className="size-5" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total States</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{stats.states}</p>
                <p className="mt-1 text-xs text-slate-500">{stats.lgas} LGAs</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <MapPin className="size-5" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Vendors</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {stats.vendors.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">Across all locations</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Building2 className="size-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Main hierarchy card */}
        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-slate-800">Location hierarchy</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Countries</option>
                <option value={COUNTRY_ID}>{COUNTRY_NAME}</option>
              </select>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All States</option>
                {stateOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={filterBoost}
                onChange={(e) => setFilterBoost(e.target.value as 'all' | 'enabled' | 'disabled')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All boost statuses</option>
                <option value="enabled">Boost enabled only</option>
                <option value="disabled">Boost disabled only</option>
              </select>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {loadingLocations ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-600">Loading all states and LGAs…</p>
                <p className="mt-1 text-xs text-slate-500">This may take a moment for the full Nigeria catalog.</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                <Globe className="mx-auto size-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No locations yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Add an LGA from the map to make it available for vendor boosts.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white">
                {/* Country row */}
                <div className="border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOpenCountry((o) => !o)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50/90 sm:gap-4 sm:px-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Globe className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-slate-900">{COUNTRY_NAME}</span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-800">
                          Active
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          <span className="font-medium text-slate-700">{stats.states}</span> States
                        </span>
                        <span>
                          <span className="font-medium text-slate-700">{stats.lgas}</span> LGAs
                        </span>
                        <span>
                          <span className="font-medium text-slate-700">{stats.vendors.toLocaleString()}</span> Vendors
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                      <ChevronDown
                        className={`size-5 text-slate-400 transition-transform ${openCountry ? '' : '-rotate-90'}`}
                      />
                    </div>
                  </button>
                </div>

                {openCountry && (
                  <div className="bg-slate-50/50">
                    {filteredStates.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-slate-500">
                        No states match the current filters. Try &quot;All boost statuses&quot; or another state.
                      </p>
                    ) : (
                    filteredStates.map((state) => {
                      const stateOpen = openStates.has(state.id)
                      const stateLgas = state.lgas.filter(lgaPassesBoostFilter)
                      const stateVendorSum = state.lgas.reduce((sum, l) => sum + l.vendorCount, 0)
                      const stateBoostEnabled = state.lgas.some((l) => l.boost.enabled)

                      return (
                        <div key={state.id} className="border-b border-slate-100 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleStateOpen(state.id)}
                            className="flex w-full items-start gap-3 pl-4 pr-4 pt-4 pb-3 text-left sm:gap-4 sm:pl-8 sm:pr-5"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                              <MapPin className="size-[18px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[15px] font-semibold text-slate-900">{state.name}</span>
                                {stateBoostEnabled ? (
                                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
                                    Boost Enabled
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                    Boost off
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>
                                  <span className="font-medium text-slate-700">
                                    {filterBoost === 'all' ? state.lgas.length : stateLgas.length}
                                  </span>{' '}
                                  {filterBoost === 'all' ? 'LGAs' : 'matching LGAs'}
                                </span>
                                <span>
                                  <span className="font-medium text-slate-700">{stateVendorSum.toLocaleString()}</span>{' '}
                                  Vendors
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleStateOpen(state.id)
                                }}
                                className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"
                                title={stateOpen ? 'Collapse state' : 'Expand state'}
                                aria-label={stateOpen ? 'Collapse state' : 'Expand state LGAs'}
                              >
                                <Pencil className="size-4" />
                              </button>
                              <ChevronDown
                                className={`size-5 text-slate-400 transition-transform ${stateOpen ? '' : '-rotate-90'}`}
                              />
                            </div>
                          </button>

                          {stateOpen && (
                            <div className="overflow-x-auto px-2 pb-4 sm:px-4 sm:pl-10 sm:pr-5">
                              {stateLgas.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-500">No LGAs match the current filters.</p>
                              ) : (
                                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                      <th className="whitespace-nowrap py-3 pr-3">LGA name</th>
                                      <th className="whitespace-nowrap py-3 pr-3">Vendor count</th>
                                      <th className="whitespace-nowrap py-3 pr-3">Boost count</th>
                                      <th className="whitespace-nowrap py-3 pr-3">Status</th>
                                      <th className="whitespace-nowrap py-3 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stateLgas.map((lga) => {
                                      const lgaRowId = toLgaEntryId(lga, state.name)
                                      const dk = detailKey(state.id, lgaRowId)
                                      const open = detailLgaKey === dk
                                      const boostCount = lga.boost.stats.activeBoosts

                                      return (
                                        <Fragment key={lgaRowId}>
                                          <tr className="border-b border-slate-100 last:border-0 hover:bg-white">
                                            <td className="py-3.5 pr-3 font-medium text-slate-900">{lga.name}</td>
                                            <td className="py-3.5 pr-3 tabular-nums text-slate-700">
                                              {lga.vendorCount.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 pr-3 tabular-nums text-slate-700">{boostCount}</td>
                                            <td className="py-3.5 pr-3">
                                              <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${lga.boost.enabled
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : 'bg-slate-200 text-slate-600'
                                                  }`}
                                              >
                                                {lga.boost.enabled ? 'Active' : 'Inactive'}
                                              </span>
                                            </td>
                                            <td className="py-3.5 text-right">
                                              <div className="flex justify-end gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => setDetailLgaKey((k) => (k === dk ? null : dk))}
                                                  className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"
                                                  title="Edit details"
                                                  aria-label="Edit LGA details"
                                                >
                                                  <Pencil className="size-4" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteLocation(state.id, lgaRowId, lga.name)}
                                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                  title="Delete location"
                                                  aria-label="Delete LGA"
                                                >
                                                  <Trash2 className="size-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                          {open && (
                                            <tr className="bg-slate-50/90">
                                              <td colSpan={5} className="px-3 py-4 sm:px-4">
                                                <LgaDetailPanel
                                                  lga={lga}
                                                  stateName={state.name}
                                                  stateId={state.id}
                                                  lgaRowId={lgaRowId}
                                                  patchLga={patchLga}
                                                  onSaveDetails={saveLocationDetails}
                                                  saving={detailSaving}
                                                  mapsPreviewUrl={mapsPreviewUrl}
                                                />
                                              </td>
                                            </tr>
                                          )}
                                        </Fragment>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                  </div>
                )}  
              </div>
            )}
          </div>
        </div>
      </div>

      <AddLocationWizardModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSaveError(null)
        }}
        googleMapsApiKey={env.googleMapsApiKey}
        onSubmit={handleWizardSubmit}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}

type DetailProps = {
  lga: LGA
  stateName: string
  stateId: string
  lgaRowId: string
  patchLga: (stateId: string, lgaRowId: string, u: (c: LGA) => LGA) => void | Promise<void>
  onSaveDetails: (
    stateId: string,
    lgaRowId: string,
    patch: { lgaName: string; formattedAddress: string },
  ) => Promise<void>
  saving: boolean
  mapsPreviewUrl: (lat: number, lng: number) => string
}

function LgaDetailPanel({
  lga,
  stateName,
  stateId,
  lgaRowId,
  patchLga,
  onSaveDetails,
  saving,
  mapsPreviewUrl,
}: DetailProps) {
  const [lgaNameDraft, setLgaNameDraft] = useState(lga.name)
  const [addressDraft, setAddressDraft] = useState(lga.formattedAddress ?? '')

  useEffect(() => {
    setLgaNameDraft(lga.name)
    setAddressDraft(lga.formattedAddress ?? '')
  }, [lga.name, lga.formattedAddress])

  const detailsDirty =
    lgaNameDraft.trim() !== lga.name.trim() ||
    addressDraft.trim() !== (lga.formattedAddress ?? '').trim()

  return (
    <div className="space-y-4 text-slate-800">
      {saving && (
        <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">Saving changes…</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-500">State</p>
          <p className="text-sm font-medium">{stateName}</p>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500" htmlFor={`lga-name-${lgaRowId}`}>
            LGA name
          </label>
          <input
            id={`lga-name-${lgaRowId}`}
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm"
            value={lgaNameDraft}
            disabled={saving || !lga.id}
            onChange={(e) => setLgaNameDraft(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">Coordinates & Google data</p>
        <p className="font-mono text-xs">
          {lga.latitude.toFixed(6)}, {lga.longitude.toFixed(6)}
        </p>
        {lga.googlePlaceId && (
          <p className="mt-1 break-all text-xs text-slate-600">
            <span className="font-medium text-slate-700">Place ID:</span> {lga.googlePlaceId}
          </p>
        )}
        <label className="mb-1 mt-3 block text-[11px] font-semibold uppercase text-slate-500" htmlFor={`lga-address-${lgaRowId}`}>
          Formatted address
        </label>
        <textarea
          id={`lga-address-${lgaRowId}`}
          rows={2}
          className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
          value={addressDraft}
          disabled={saving || !lga.id}
          onChange={(e) => setAddressDraft(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!detailsDirty || saving || !lga.id}
            onClick={() =>
              void onSaveDetails(stateId, lgaRowId, {
                lgaName: lgaNameDraft,
                formattedAddress: addressDraft,
              })
            }
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save location details
          </button>
        </div>
        <a
          href={mapsPreviewUrl(lga.latitude, lga.longitude)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
        >
          Open in Google Maps
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase text-slate-500">Boost availability</p>
          <p className="text-xs text-slate-500">
            When active, vendors can target this LGA in their boost campaigns.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs text-slate-600">{lga.boost.enabled ? 'Active' : 'Inactive'}</span>
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={lga.boost.enabled}
            disabled={saving}
            onChange={(e) =>
              void patchLga(stateId, lgaRowId, (cur) => ({
                ...cur,
                boost: { ...cur.boost, enabled: e.target.checked },
              }))
            }
          />
        </label>
      </div>

      <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase text-violet-900">Boost activity</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] text-violet-800">Active boosts</p>
            <p className="text-lg font-semibold text-violet-950">{lga.boost.stats.activeBoosts}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-800">Expired</p>
            <p className="text-lg font-semibold text-violet-950">{lga.boost.stats.expiredBoosts}</p>
          </div>
        </div>
      </div>

      <Link
        to={`/admin/businesses?lga=${encodeURIComponent(lga.name)}&state=${encodeURIComponent(stateName)}`}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
      >
        View vendors in this LGA
        <ExternalLink className="size-3" />
      </Link>
    </div>
  )
}
