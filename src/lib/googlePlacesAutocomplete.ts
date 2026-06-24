import { importLibrary } from '@googlemaps/js-api-loader'

export const NG_BIAS_CENTER: google.maps.LatLngLiteral = { lat: 9.082, lng: 8.6753 }
export const NG_BIAS_RADIUS_METERS = 900_000

export type PlaceSuggestionSource = 'new' | 'legacy'

export type PlaceSuggestion = {
  key: string
  placeId: string
  mainText: string
  secondaryText: string
  source: PlaceSuggestionSource
  prediction: google.maps.places.PlacePrediction | null
}

const NEW_API_DISABLED_KEY = 'gidira.places.newApiDisabled'

/** Opt in with VITE_GOOGLE_PLACES_USE_NEW_API=true after enabling Places API (New) in GCP. */
export function shouldUseGooglePlacesNewApi(): boolean {
  try {
    if (sessionStorage.getItem(NEW_API_DISABLED_KEY) === '1') {
      return false
    }
  } catch {
    // sessionStorage unavailable
  }

  const flag = (import.meta.env.VITE_GOOGLE_PLACES_USE_NEW_API as string | undefined)?.trim().toLowerCase()
  return flag === 'true' || flag === '1'
}

export function markGooglePlacesNewApiUnavailable(): void {
  try {
    sessionStorage.setItem(NEW_API_DISABLED_KEY, '1')
  } catch {
    // ignore
  }
}

function isLikelyPlacesPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('403') ||
    msg.includes('forbidden') ||
    msg.includes('permission') ||
    msg.includes('not enabled') ||
    msg.includes('referer')
  )
}

const legacyRequestBase = {
  componentRestrictions: { country: 'ng' as const },
  locationBias: { center: NG_BIAS_CENTER, radius: NG_BIAS_RADIUS_METERS },
  language: 'en' as const,
  region: 'ng' as const,
}

let legacyService: google.maps.places.AutocompleteService | null = null
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null

async function getLegacyService(): Promise<google.maps.places.AutocompleteService> {
  if (legacyService) return legacyService
  const placesLib = (await importLibrary('places')) as google.maps.PlacesLibrary
  const AutocompleteService = placesLib.AutocompleteService ?? google.maps.places.AutocompleteService
  if (!AutocompleteService) throw new Error('AutocompleteService not available')
  legacyService = new AutocompleteService()
  return legacyService
}

function ensureSessionToken(): google.maps.places.AutocompleteSessionToken {
  if (!sessionToken) {
    sessionToken = new google.maps.places.AutocompleteSessionToken()
  }
  return sessionToken
}

export function resetPlaceAutocompleteSession(): void {
  sessionToken = new google.maps.places.AutocompleteSessionToken()
}

export async function fetchLegacyPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const service = await getLegacyService()
  const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
    service.getPlacePredictions(
      { input: query, ...legacyRequestBase },
      (results, statusVal) => {
        if (statusVal === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results)
          return
        }
        if (statusVal === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([])
          return
        }
        reject(new Error(`Places autocomplete failed: ${statusVal}`))
      },
    )
  })

  return predictions.map((prediction, index) => ({
    key: `legacy-${prediction.place_id}-${index}`,
    placeId: prediction.place_id,
    mainText: prediction.structured_formatting?.main_text ?? prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text ?? '',
    source: 'legacy',
    prediction: null,
  }))
}

export async function fetchNewPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const placesLib = (await importLibrary('places')) as google.maps.PlacesLibrary
  const AutocompleteSuggestion = placesLib.AutocompleteSuggestion
  if (!AutocompleteSuggestion) throw new Error('AutocompleteSuggestion not available')

  const request: google.maps.places.AutocompleteRequest = {
    input: query,
    sessionToken: ensureSessionToken(),
    includedRegionCodes: ['ng'],
    locationBias: { center: NG_BIAS_CENTER, radius: NG_BIAS_RADIUS_METERS },
    language: 'en',
    region: 'ng',
  }

  const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
  const mapped: PlaceSuggestion[] = []

  result.suggestions.forEach((suggestion, index) => {
    const placePrediction = suggestion.placePrediction
    if (!placePrediction) return
    mapped.push({
      key: `new-${placePrediction.placeId ?? 'p'}-${index}`,
      placeId: placePrediction.placeId ?? '',
      mainText: placePrediction.mainText?.toString() ?? placePrediction.text?.toString() ?? '',
      secondaryText: placePrediction.secondaryText?.toString() ?? '',
      source: 'new',
      prediction: placePrediction,
    })
  })

  return mapped
}

/**
 * Legacy Places API first (works with standard "Places API" + referrer allowlist).
 * New API only when VITE_GOOGLE_PLACES_USE_NEW_API=true and not previously forbidden.
 */
export async function fetchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  let lastError: unknown = null

  try {
    return await fetchLegacyPlaceSuggestions(query)
  } catch (error) {
    lastError = error
  }

  if (shouldUseGooglePlacesNewApi()) {
    try {
      return await fetchNewPlaceSuggestions(query)
    } catch (error) {
      if (isLikelyPlacesPermissionError(error)) {
        markGooglePlacesNewApiUnavailable()
      }
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Places autocomplete failed')
}
