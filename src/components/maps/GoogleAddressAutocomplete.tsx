import { importLibrary } from '@googlemaps/js-api-loader'
import { Loader2, MapPin, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'
import { parsePlaceToLgaPick } from '@/features/maps/parsePlaceToLgaPick'
import { ensureGoogleMapsConfigured } from '@/lib/googleMapsInit'
import { cn } from '@/lib/utils'

const NG_BIAS_CENTER: google.maps.LatLngLiteral = { lat: 9.082, lng: 8.6753 }
const NG_BIAS_RADIUS_METERS = 900_000
const NG_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 13.892,
  south: 4.272,
  east: 14.677,
  west: 2.692,
}

type SuggestionSource = 'new' | 'legacy'

type Suggestion = {
  key: string
  placeId: string
  mainText: string
  secondaryText: string
  source: SuggestionSource
  prediction: google.maps.places.PlacePrediction | null
}

function extractComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
): string | null {
  if (!components?.length) return null
  const found = components.find((c) => c.types.includes(type))
  return found?.long_name ?? null
}

function pickFromGeocoderResult(
  result: google.maps.GeocoderResult,
  location: google.maps.LatLngLiteral,
): LgaMapPickResult {
  const viewportBounds = result.geometry?.viewport ?? null
  const viewport = viewportBounds
    ? {
        north: viewportBounds.getNorthEast().lat(),
        east: viewportBounds.getNorthEast().lng(),
        south: viewportBounds.getSouthWest().lat(),
        west: viewportBounds.getSouthWest().lng(),
      }
    : null

  const components = result.address_components ?? []
  const addressComponentsJson = JSON.stringify(
    components.map((c) => ({
      longText: c.long_name,
      shortText: c.short_name,
      types: c.types,
    })),
  )

  return {
    googlePlaceId: result.place_id || `latlng:${location.lat.toFixed(6)},${location.lng.toFixed(6)}`,
    resourceName: undefined,
    displayName: result.formatted_address ?? null,
    formattedAddress: result.formatted_address ?? null,
    lat: location.lat,
    lng: location.lng,
    country: extractComponent(components, 'country'),
    administrativeAreaLevel1: extractComponent(components, 'administrative_area_level_1'),
    administrativeAreaLevel2: extractComponent(components, 'administrative_area_level_2'),
    locality: extractComponent(components, 'locality'),
    viewport,
    addressComponentsJson,
  }
}

type GoogleAddressAutocompleteProps = {
  apiKey: string | undefined
  value: string
  onValueChange: (value: string) => void
  onPick: (pick: LgaMapPickResult) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function GoogleAddressAutocomplete({
  apiKey,
  value,
  onValueChange,
  onPick,
  disabled = false,
  placeholder = 'Start typing your street address…',
  className,
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const legacyServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const debounceRef = useRef<number | null>(null)
  const requestSeqRef = useRef(0)
  const forceLegacyRef = useRef(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    const trimmed = apiKey?.trim()
    if (!trimmed) {
      setStatus('error')
      setErrorMessage('Google Maps API key is not configured.')
      return
    }

    let cancelled = false
    setStatus('loading')

    void (async () => {
      try {
        ensureGoogleMapsConfigured(trimmed)
        await importLibrary('places')
        await importLibrary('geocoding')
        if (!cancelled) setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load Google Maps.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiKey])

  const fetchWithNewApi = useCallback(async (query: string): Promise<Suggestion[]> => {
    const placesLib = (await importLibrary('places')) as google.maps.PlacesLibrary
    const AutocompleteSuggestion = placesLib.AutocompleteSuggestion
    if (!AutocompleteSuggestion) throw new Error('AutocompleteSuggestion not available')
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
    }
    const request: google.maps.places.AutocompleteRequest = {
      input: query,
      sessionToken: sessionTokenRef.current,
      includedRegionCodes: ['ng'],
      locationBias: { center: NG_BIAS_CENTER, radius: NG_BIAS_RADIUS_METERS },
      language: 'en',
      region: 'ng',
    }
    const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
    const mapped: Suggestion[] = []
    result.suggestions.forEach((s, idx) => {
      const pp = s.placePrediction
      if (!pp) return
      mapped.push({
        key: `new-${pp.placeId ?? 'p'}-${idx}`,
        placeId: pp.placeId ?? '',
        mainText: pp.mainText?.toString() ?? pp.text?.toString() ?? '',
        secondaryText: pp.secondaryText?.toString() ?? '',
        source: 'new',
        prediction: pp,
      })
    })
    return mapped
  }, [])

  const fetchWithLegacyApi = useCallback(async (query: string): Promise<Suggestion[]> => {
    if (!legacyServiceRef.current) {
      const placesLib = (await importLibrary('places')) as google.maps.PlacesLibrary
      const AutocompleteService = placesLib.AutocompleteService ?? google.maps.places.AutocompleteService
      if (!AutocompleteService) throw new Error('AutocompleteService not available')
      legacyServiceRef.current = new AutocompleteService()
    }
    const service = legacyServiceRef.current
    const bounds = new google.maps.LatLngBounds(
      { lat: NG_BOUNDS.south, lng: NG_BOUNDS.west },
      { lat: NG_BOUNDS.north, lng: NG_BOUNDS.east },
    )
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'ng' },
          bounds,
          language: 'en',
          region: 'ng',
        },
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
    return predictions.map((p, idx) => ({
      key: `legacy-${p.place_id}-${idx}`,
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
      source: 'legacy' as const,
      prediction: null,
    }))
  }, [])

  const resolveSuggestion = useCallback(async (suggestion: Suggestion): Promise<LgaMapPickResult | null> => {
    if (suggestion.source === 'new' && suggestion.prediction) {
      try {
        const place = suggestion.prediction.toPlace()
        await place.fetchFields({
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'viewport',
            'addressComponents',
          ],
        })
        const parsed = parsePlaceToLgaPick(place)
        if (parsed) return parsed
      } catch {
        // fall through to geocoder
      }
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder()
    }

    const resp = await geocoderRef.current.geocode({ placeId: suggestion.placeId })
    const result = resp.results?.[0]
    const loc = result?.geometry?.location
    if (!result || !loc) return null

    return pickFromGeocoderResult(result, { lat: loc.lat(), lng: loc.lng() })
  }, [])

  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setSearching(true)
      setSearchError(null)
      try {
        const pick = await resolveSuggestion(suggestion)
        if (!pick) {
          setSearchError('Could not resolve that address. Try another suggestion.')
          return
        }
        const label =
          pick.formattedAddress ??
          `${suggestion.mainText}${suggestion.secondaryText ? `, ${suggestion.secondaryText}` : ''}`
        onValueChange(label)
        onPick(pick)
        setSuggestions([])
        setShowDropdown(false)
        setActiveIdx(-1)
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Could not load address details.')
      } finally {
        setSearching(false)
      }
    },
    [onPick, onValueChange, resolveSuggestion],
  )

  useEffect(() => {
    if (status !== 'ready' || disabled) return

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const query = value.trim()
    if (query.length < 1) {
      setSuggestions([])
      setSearching(false)
      setActiveIdx(-1)
      setSearchError(null)
      return
    }

    debounceRef.current = window.setTimeout(async () => {
      const seq = ++requestSeqRef.current
      setSearching(true)
      setSearchError(null)
      let lastError: unknown = null
      let mapped: Suggestion[] | null = null

      if (!forceLegacyRef.current) {
        try {
          mapped = await fetchWithNewApi(query)
        } catch (error) {
          lastError = error
          forceLegacyRef.current = true
        }
      }

      if (mapped === null) {
        try {
          mapped = await fetchWithLegacyApi(query)
        } catch (error) {
          lastError = error
        }
      }

      if (seq !== requestSeqRef.current) return

      if (mapped === null) {
        const msg = lastError instanceof Error ? lastError.message : 'Search failed'
        setSearchError(`${msg}. Enable Places API and Geocoding API for your Google Maps key.`)
        setSuggestions([])
        setShowDropdown(true)
        setSearching(false)
        return
      }

      setSuggestions(mapped)
      setShowDropdown(true)
      setActiveIdx(mapped.length > 0 ? 0 : -1)
      setSearching(false)
    }, 180)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [value, status, disabled, fetchWithLegacyApi, fetchWithNewApi])

  useEffect(() => {
    if (!showDropdown) return
    const recalc = () => {
      const el = inputRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    recalc()
    window.addEventListener('scroll', recalc, true)
    window.addEventListener('resize', recalc)
    return () => {
      window.removeEventListener('scroll', recalc, true)
      window.removeEventListener('resize', recalc)
    }
  }, [showDropdown])

  useEffect(() => {
    if (!showDropdown) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (inputRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setShowDropdown(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDropdown(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showDropdown])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (!showDropdown && suggestions.length > 0) {
        setShowDropdown(true)
        return
      }
      if (suggestions.length === 0) return
      event.preventDefault()
      setActiveIdx((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      event.preventDefault()
      setActiveIdx((index) => (index - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      if (showDropdown && activeIdx >= 0 && activeIdx < suggestions.length) {
        event.preventDefault()
        void handleSelectSuggestion(suggestions[activeIdx])
      }
    } else if (event.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  if (!apiKey?.trim()) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Set <code className="rounded bg-blue-100/80 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to enable Google
        address autocomplete.
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-body-secondary" />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled || status !== 'ready'}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || searchError) setShowDropdown(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 w-full rounded-md border border-border-light bg-background py-2 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-chat-accent focus:outline-none focus:ring-2 focus:ring-chat-accent/25"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="google-address-autocomplete-listbox"
          role="combobox"
        />
        {(searching || status === 'loading') && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!searching && value.trim() && status === 'ready' ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => {
              onValueChange('')
              setSuggestions([])
              setShowDropdown(false)
              inputRef.current?.focus()
            }}
            aria-label="Clear address"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {status === 'error' && errorMessage ? (
        <p className="text-xs text-brand" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {searchError && !showDropdown ? (
        <p className="text-xs text-brand" role="alert">
          {searchError}
        </p>
      ) : null}

      {showDropdown && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              id="google-address-autocomplete-listbox"
              role="listbox"
              className="z-[120] max-h-64 overflow-y-auto rounded-md border border-border-light bg-white shadow-lg"
              style={{
                position: 'fixed',
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
              }}
            >
              {searchError ? (
                <p className="px-3 py-2 text-xs text-brand">{searchError}</p>
              ) : suggestions.length === 0 && !searching ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No addresses found.</p>
              ) : (
                suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.key}
                    type="button"
                    role="option"
                    aria-selected={index === activeIdx}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 border-b border-border-light px-3 py-2.5 text-left last:border-b-0',
                      index === activeIdx ? 'bg-[#EAF2FD]' : 'hover:bg-auth-bg',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void handleSelectSuggestion(suggestion)}
                  >
                    <span className="text-sm font-medium text-ink">{suggestion.mainText}</span>
                    {suggestion.secondaryText ? (
                      <span className="text-xs text-body-secondary">{suggestion.secondaryText}</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>,
            document.body,
          )
        : null}

      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span>Powered by</span>
        <img
          src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png"
          alt="Google"
          className="h-3.5 w-auto"
          loading="lazy"
        />
      </p>
    </div>
  )
}
