import { request } from '@/api/request'

import {
  aggregateDurationsFromTiers,
  defaultLgaBoostFormState,
  normalizeBoostTiers,
  parseTierDurationsFromRaw,
  type LgaBoostFormState,
  type LgaBoostStats,
  type LgaBoostTierForm,
} from '@/features/maps/lgaBoostTypes'
import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

type AnyRecord = Record<string, unknown>

export type AdminSavedLgaBoost = {
  enabled: boolean
  tiers: LgaBoostTierForm[]
  /** Duration pricing — amounts are major currency units (e.g. Naira). */
  durations: { days: number; enabled: boolean; priceAmount: number }[]
  stats: LgaBoostStats
}

export type AdminSavedLocation = {
  country: {
    id: number | null
    name: string
    isoCode: string
  }
  state: {
    id: number | null
    name: string
    slug: string | null
  }
  city: {
    id: number | null
    name: string
  } | null
  lga: {
    id: number | null
    name: string
    slug: string | null
    latitude: number
    longitude: number
    vendorCount: number
    googlePlaceId: string | null
    formattedAddress: string | null
    boost: AdminSavedLgaBoost
  }
}

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object') return null
  return value as AnyRecord
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asNullableId(value: unknown): number | null {
  const parsed = asNumber(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

const EMPTY_STATS: LgaBoostStats = {
  activeBoosts: 0,
  expiredBoosts: 0,
}

function parseBoostStats(raw: unknown): LgaBoostStats {
  const o = asRecord(raw)
  if (!o) return { ...EMPTY_STATS }
  return {
    activeBoosts: asNumber(o.active_boosts ?? o.activeBoosts, 0),
    expiredBoosts: asNumber(o.expired_boosts ?? o.expiredBoosts, 0),
  }
}

function parseBoostTiers(
  raw: unknown,
  globalDurations?: { days: number; enabled: boolean; priceAmount: number }[],
): LgaBoostTierForm[] {
  if (!Array.isArray(raw)) return []
  const out: LgaBoostTierForm[] = []
  for (const item of raw) {
    const o = asRecord(item)
    if (!o) continue
    const key = asString(o.key ?? o.slug, `tier-${out.length}`)
    out.push({
      key,
      label: asString(o.label ?? o.title ?? o.name, ''),
      totalSlots: 0,
      priceAmount: asNumber(o.price_amount ?? o.priceAmount ?? o.price, 0),
      durations: parseTierDurationsFromRaw(o.durations, key, globalDurations),
    })
  }
  return normalizeBoostTiers(out, globalDurations)
}

function parseBoostDurations(raw: unknown): { days: number; enabled: boolean; priceAmount: number }[] {
  if (!Array.isArray(raw)) return []
  const out: { days: number; enabled: boolean; priceAmount: number }[] = []
  for (const item of raw) {
    const o = asRecord(item)
    if (!o) continue
    const days = asNumber(o.days ?? o.duration_days, 0)
    if (!days) continue
    out.push({
      days,
      enabled: asBoolean(o.enabled ?? o.is_active, true),
      priceAmount: asNumber(o.price_amount ?? o.priceAmount ?? o.price, 0),
    })
  }
  return out
}

function mergeBoostFromForm(saved: AdminSavedLocation, form: LgaBoostFormState): AdminSavedLocation {
  const stats: LgaBoostStats = { ...EMPTY_STATS }
  return {
    ...saved,
    lga: {
      ...saved.lga,
      boost: {
        enabled: form.enabled,
        tiers: normalizeBoostTiers(form.tiers, form.durations).map((t) => ({ ...t })),
        durations: aggregateDurationsFromTiers(form.tiers).map((d) => ({
          days: d.days,
          enabled: d.enabled,
          priceAmount: d.priceAmount,
        })),
        stats,
      },
    },
  }
}

function asObjectArrayFromJsonString(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function boostAvailabilityPayload(enabled: boolean) {
  return {
    enabled,
    tiers: [] as const,
    durations: [] as const,
  }
}

function boostFormToApiPayload(form: LgaBoostFormState) {
  return boostAvailabilityPayload(form.enabled)
}

function toApiPayload(
  countryName: string,
  stateName: string,
  cityName: string,
  lgaName: string,
  fullAddress: string | undefined,
  mapPick: LgaMapPickResult,
  boostEnabled: boolean,
) {
  const city = cityName.trim()
  const country = countryName.trim()
  const address = fullAddress?.trim()
  const boostConfig = boostAvailabilityPayload(boostEnabled)

  const payload = {
    location: {
      country_name: country || mapPick.country || 'Nigeria',
      country_iso_code: 'NG',
      state_name: stateName.trim(),
      city_name: city || mapPick.locality || undefined,
      lga_name: lgaName.trim(),
      latitude: mapPick.lat,
      longitude: mapPick.lng,
      formatted_address: address || mapPick.formattedAddress || undefined,
      google_place_id: mapPick.googlePlaceId || undefined,
      google_resource_name: mapPick.resourceName || undefined,
      viewport: mapPick.viewport ?? undefined,
      address_components: asObjectArrayFromJsonString(mapPick.addressComponentsJson),
    },
    is_boost_active: boostEnabled,
    boost_enabled: boostEnabled,
    boost_config: boostConfig,
  }

  return payload
}

function parseSavedLocationResponse(body: unknown): AdminSavedLocation {
  const root = asRecord(body)
  const inner = asRecord(root?.data)

  if (!root || root.success !== true || !inner) {
    const message = asString(root?.message || (root as any)?.error, 'Location save failed.')
    const errors = (root as any)?.errors
      ? ': ' + Object.values((root as any).errors).flat().join(', ')
      : ''
    throw new Error(`${message}${errors}`)
  }

  const country = asRecord(inner.country)
  const state = asRecord(inner.state)
  const city = asRecord(inner.city)
  const lga = asRecord(inner.lga)
  const boostRoot = asRecord(inner.boost ?? lga?.boost)

  if (!country || !state || !lga) {
    throw new Error('Invalid location response from server.')
  }

  const defaults = defaultLgaBoostFormState()
  let durationsFromApi = parseBoostDurations(boostRoot?.durations ?? lga.boost_durations)
  if (!durationsFromApi.length) {
    durationsFromApi = defaults.durations.map((d) => ({
      days: d.days,
      enabled: d.enabled,
      priceAmount: d.priceAmount,
    }))
  }
  let tiersFromApi = parseBoostTiers(boostRoot?.tiers ?? lga.boost_tiers, durationsFromApi)
  if (!tiersFromApi.length) tiersFromApi = defaults.tiers
  tiersFromApi = normalizeBoostTiers(tiersFromApi, durationsFromApi)
  durationsFromApi = aggregateDurationsFromTiers(tiersFromApi).map((d) => ({
    days: d.days,
    enabled: d.enabled,
    priceAmount: d.priceAmount,
  }))
  const statsFromApi = parseBoostStats(boostRoot?.stats ?? lga.boost_stats)
  const enabledFromApi = asBoolean(
    boostRoot?.enabled ?? lga.boost_enabled ?? lga.is_boost_active,
    false,
  )

  const stats: LgaBoostStats = {
    activeBoosts: statsFromApi.activeBoosts,
    expiredBoosts: statsFromApi.expiredBoosts,
  }

  return {
    country: {
      id: asNullableId(country.id),
      name: asString(country.name, 'Nigeria'),
      isoCode: asString(country.iso_code, 'NG'),
    },
    state: {
      id: asNullableId(state.id),
      name: asString(state.name, ''),
      slug: asString(state.slug, '') || null,
    },
    city: city
      ? {
        id: asNullableId(city.id),
        name: asString(city.name, ''),
      }
      : null,
    lga: {
      id: asNullableId(lga.id ?? inner.id),
      name: asString(lga.name, ''),
      slug: asString(lga.slug, '') || null,
      latitude: asNumber(lga.latitude),
      longitude: asNumber(lga.longitude),
      vendorCount: asNumber(lga.vendor_count),
      googlePlaceId: asString(lga.google_place_id, '') || null,
      formattedAddress: asString(lga.formatted_address ?? lga.full_address, '') || null,
      boost: {
        enabled: enabledFromApi,
        tiers: tiersFromApi,
        durations: durationsFromApi.length
          ? (durationsFromApi as any)
          : [
            { days: 7, enabled: true, priceAmount: 0 },
            { days: 14, enabled: true, priceAmount: 0 },
            { days: 30, enabled: true, priceAmount: 0 },
          ],
        stats,
      },
    },
  }
}

function formatApiValidationError(error: unknown, fallback: string): never {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: unknown } }
    if (axiosError.response?.status === 422) {
      const data = asRecord(axiosError.response.data)
      const message = asString(data?.message, 'Validation failed.')
      const fieldErrors = asRecord(data?.errors)
      const details = fieldErrors
        ? ': ' + Object.values(fieldErrors).flat().map((v) => asString(v)).filter(Boolean).join(', ')
        : ''
      throw new Error(`${message}${details}`)
    }
  }
  throw error instanceof Error ? error : new Error(fallback)
}

export async function adminStoreLocation(params: {
  countryName: string
  stateName: string
  cityName: string
  lgaName: string
  fullAddress?: string
  mapPick: LgaMapPickResult
  boostEnabled?: boolean
  /** @deprecated use boostEnabled */
  boostConfig?: LgaBoostFormState
}): Promise<AdminSavedLocation> {
  const boostEnabled = params.boostEnabled ?? params.boostConfig?.enabled ?? true
  const payload = toApiPayload(
    params.countryName,
    params.stateName,
    params.cityName,
    params.lgaName,
    params.fullAddress,
    params.mapPick,
    boostEnabled,
  )

  try {
    const res = await request.post('/admin/locations/store', payload)
    let parsed = parseSavedLocationResponse(res.data)
    const fa = params.fullAddress?.trim() || params.mapPick.formattedAddress || null
    return {
      ...parsed,
      lga: {
        ...parsed.lga,
        googlePlaceId: parsed.lga.googlePlaceId ?? params.mapPick.googlePlaceId ?? null,
        formattedAddress: parsed.lga.formattedAddress ?? fa,
      },
    }
  } catch (error: unknown) {
    formatApiValidationError(error, 'Failed to save location.')
  }
}

function parseAdminLocationListPage(body: unknown): AdminSavedLocation[] {
  const root = asRecord(body)
  if (!root || root.success !== true) {
    throw new Error(asString(root?.message, 'Failed to load locations.'))
  }

  const data = asRecord(root.data)
  const locations = data?.locations ?? data?.data ?? []

  if (!Array.isArray(locations)) {
    return []
  }

  return locations
    .map((item) => {
      try {
        return parseSavedLocationResponse({ success: true, data: item })
      } catch {
        return null
      }
    })
    .filter((item): item is AdminSavedLocation => item !== null)
}

/** Loads the full Nigeria catalog (all LGAs) for the admin hierarchy screen. */
export async function adminListLocations(): Promise<AdminSavedLocation[]> {
  const res = await request.post('/admin/locations', { all: true })
  return parseAdminLocationListPage(res.data)
}

export async function adminUpdateLocationStatus(params: {
  lgaId: number
  boostEnabled: boolean
}): Promise<void> {
  const res = await request.post('/admin/locations/boost-active', {
    id: params.lgaId,
    boost_active: params.boostEnabled,
  })
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(asString(root?.message, 'Failed to update boost status.'))
  }
}

export async function adminUpdateLocation(params: {
  locationId: number
  countryName: string
  stateName: string
  cityName?: string
  lgaName: string
  fullAddress?: string
  latitude?: number
  longitude?: number
  googlePlaceId?: string | null
  boostConfig?: LgaBoostFormState
}): Promise<AdminSavedLocation> {
  try {
    const res = await request.post('/admin/locations/update', {
      id: params.locationId,
      location: {
        country_name: params.countryName.trim() || 'Nigeria',
        country_iso_code: 'NG',
        state_name: params.stateName.trim(),
        city_name: params.cityName?.trim() || undefined,
        lga_name: params.lgaName.trim(),
        latitude: params.latitude,
        longitude: params.longitude,
        formatted_address: params.fullAddress?.trim() || undefined,
        google_place_id: params.googlePlaceId ?? undefined,
      },
      boost_config: params.boostConfig ? boostFormToApiPayload(params.boostConfig) : undefined,
    })
    return parseSavedLocationResponse(res.data)
  } catch (error: unknown) {
    formatApiValidationError(error, 'Failed to update location.')
  }
}

/** @deprecated Use adminUpdateLocation with boostConfig */
export async function adminUpdateBoostConfig(params: {
  lgaId: number
  boostConfig: LgaBoostFormState
  countryName: string
  stateName: string
  lgaName: string
  fullAddress?: string
  latitude?: number
  longitude?: number
  googlePlaceId?: string | null
}): Promise<AdminSavedLocation> {
  return adminUpdateLocation({
    locationId: params.lgaId,
    countryName: params.countryName,
    stateName: params.stateName,
    lgaName: params.lgaName,
    fullAddress: params.fullAddress,
    latitude: params.latitude,
    longitude: params.longitude,
    googlePlaceId: params.googlePlaceId,
    boostConfig: params.boostConfig,
  })
}

export async function adminDeleteLocation(lgaId: number): Promise<void> {
  const res = await request.post('/admin/locations/delete', { id: lgaId })
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(asString(root?.message, 'Failed to delete location.'))
  }
}
