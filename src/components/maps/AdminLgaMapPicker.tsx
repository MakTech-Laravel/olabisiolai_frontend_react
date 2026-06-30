import { importLibrary } from '@googlemaps/js-api-loader'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { parsePlaceToLgaPick } from '@/features/maps/parsePlaceToLgaPick'
import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'
import { ensureGoogleMapsConfigured } from '@/lib/googleMapsInit'

const NG_BIAS_CENTER: google.maps.LatLngLiteral = { lat: 9.082, lng: 8.6753 }
const NG_BIAS_RADIUS_METERS = 900_000
const NG_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 13.892,
  south: 4.272,
  east: 14.677,
  west: 2.692,
}

type Props = {
  apiKey: string | undefined
  onPick: (pick: LgaMapPickResult) => void
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

export function AdminLgaMapPicker({ apiKey, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mapHostRef = useRef<HTMLDivElement>(null)

  const mapRef = useRef<google.maps.Map | null>(null)
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null)
  const selectedInfoRef = useRef<google.maps.InfoWindow | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const legacyServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const debounceRef = useRef<number | null>(null)
  const requestSeqRef = useRef(0)
  /** Sticky once the new Places API fails so we don't keep re-trying it on every keystroke. */
  const forceLegacyRef = useRef(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState<
    { top: number; left: number; width: number } | null
  >(null)

  const applyPick = useCallback(
    (pick: LgaMapPickResult, opts?: { preserveMapView?: boolean }) => {
      onPick(pick)
      const map = mapRef.current
      if (!map) return

      const center = { lat: pick.lat, lng: pick.lng }
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setPosition(center)
        selectedMarkerRef.current.setVisible(true)
        selectedMarkerRef.current.setAnimation(google.maps.Animation.BOUNCE)
        window.setTimeout(() => {
          selectedMarkerRef.current?.setAnimation(null)
        }, 700)
      }
      if (selectedInfoRef.current && map) {
        const title = pick.displayName ?? 'Selected point'
        selectedInfoRef.current.setContent(
          `<div style="font-size:12px;font-weight:600;max-width:240px;">${title}</div><div style="font-size:11px;color:#555;">${pick.lat.toFixed(5)}, ${pick.lng.toFixed(5)}</div>`,
        )
        selectedInfoRef.current.setPosition(center)
        selectedInfoRef.current.open(map)
      }
      if (!opts?.preserveMapView) {
        const vp = pick.viewport
        if (vp) {
          map.fitBounds(
            new google.maps.LatLngBounds(
              { lat: vp.south, lng: vp.west },
              { lat: vp.north, lng: vp.east },
            ),
          )
        }
        map.panTo(center)
        const currentZoom = map.getZoom() ?? 6
        if (!vp && currentZoom < 12) {
          map.setZoom(13)
        } else if (vp && currentZoom < 10) {
          map.setZoom(11)
        }
      }
    },
    [onPick],
  )

  // Initialize map + geocoder + places session token once API key is available.
  useEffect(() => {
    const mapHost = mapHostRef.current
    if (!apiKey?.trim() || !mapHost) {
      setStatus('idle')
      return
    }

    let cancelled = false
    let mapClickListener: google.maps.MapsEventListener | null = null

    setStatus('loading')
    setErrorMessage(null)

    const run = async () => {
      try {
        ensureGoogleMapsConfigured(apiKey.trim())
        const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary
        await importLibrary('places')
        await importLibrary('geocoding')

        if (cancelled) return

        mapHost.innerHTML = ''

        const map = new Map(mapHost, {
          center: NG_BIAS_CENTER,
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          draggableCursor: 'crosshair',
        })
        mapRef.current = map
        selectedMarkerRef.current = new google.maps.Marker({
          map,
          clickable: false,
          visible: false,
          title: 'Selected location',
          zIndex: 1000,
          animation: google.maps.Animation.DROP,
        })
        selectedInfoRef.current = new google.maps.InfoWindow({
          content: '<div style="font-size:12px;font-weight:600;">Selected point</div>',
        })
        geocoderRef.current = new google.maps.Geocoder()

        try {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
        } catch {
          sessionTokenRef.current = null
        }
        try {
          legacyServiceRef.current = new google.maps.places.AutocompleteService()
        } catch {
          legacyServiceRef.current = null
        }

        const onMapPick = async (latLng: google.maps.LatLng) => {
          const location = { lat: latLng.lat(), lng: latLng.lng() }
          try {
            const response = await geocoderRef.current!.geocode({ location })
            const first = response.results[0]
            if (!first) return
            selectedMarkerRef.current?.setVisible(true)
            const parsed = pickFromGeocoderResult(first, location)
            applyPick(parsed, { preserveMapView: true })
          } catch {
            // Keep silent; the click + autocomplete UX is still usable.
          }
        }

        mapClickListener = map.addListener('click', (ev: google.maps.MapMouseEvent) => {
          if (!ev.latLng) return
          void onMapPick(ev.latLng)
        })

        if (!cancelled) setStatus('ready')
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to load Google Maps'
        setErrorMessage(msg)
        setStatus('error')
      }
    }

    void run()

    return () => {
      cancelled = true
      mapClickListener?.remove()
      mapClickListener = null
      selectedMarkerRef.current?.setMap(null)
      selectedMarkerRef.current = null
      selectedInfoRef.current?.close()
      selectedInfoRef.current = null
      mapRef.current = null
      geocoderRef.current = null
      sessionTokenRef.current = null
      legacyServiceRef.current = null
      mapHost.innerHTML = ''
    }
  }, [apiKey, applyPick])

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
      const main = pp.mainText?.toString() ?? pp.text?.toString() ?? ''
      const secondary = pp.secondaryText?.toString() ?? ''
      mapped.push({
        key: `new-${pp.placeId ?? 'p'}-${idx}`,
        placeId: pp.placeId ?? '',
        mainText: main,
        secondaryText: secondary,
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

  // Debounced autocomplete fetch tied to inputValue.
  useEffect(() => {
    if (status !== 'ready') return

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const query = inputValue.trim()
    if (query.length < 2) {
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

      // Try the new API first unless we've already proven it's unavailable on this key.
      let mapped: Suggestion[] | null = null
      if (!forceLegacyRef.current) {
        try {
          mapped = await fetchWithNewApi(query)
        } catch (err) {
          lastError = err
          console.warn('[AdminLgaMapPicker] new Places API failed, trying legacy:', err)
          forceLegacyRef.current = true
        }
      }

      if (mapped === null) {
        try {
          mapped = await fetchWithLegacyApi(query)
        } catch (err) {
          lastError = err
          console.error('[AdminLgaMapPicker] legacy Places API also failed:', err)
        }
      }

      if (seq !== requestSeqRef.current) return

      if (mapped === null) {
        const msg = lastError instanceof Error ? lastError.message : 'Search failed'
        setSearchError(`${msg}. Enable “Places API (New)” or “Places API” for your Google Maps key.`)
        setSuggestions([])
        setShowDropdown(true)
        setSearching(false)
        return
      }

      setSuggestions(mapped)
      setShowDropdown(true)
      setActiveIdx(mapped.length > 0 ? 0 : -1)
      setSearching(false)
    }, 220)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [inputValue, status, fetchWithNewApi, fetchWithLegacyApi])

  // Keep dropdown position aligned with input across scroll / resize.
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

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!showDropdown) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (inputRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setShowDropdown(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showDropdown])

  const resolveAndApplyPrediction = useCallback(
    async (sug: Suggestion) => {
      // Strategy: try the modern Place.fetchFields when we have a PlacePrediction,
      // otherwise fall back to Geocoder by placeId (works with the basic Places API only too).
      if (sug.source === 'new' && sug.prediction) {
        try {
          const place = sug.prediction.toPlace()
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
          if (parsed) {
            applyPick(parsed)
            return
          }
        } catch (err) {
          console.warn('[AdminLgaMapPicker] Place.fetchFields failed, falling back to Geocoder:', err)
        }
      }

      // Geocoder fallback — also used for legacy AutocompleteService predictions.
      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder()
      }
      try {
        const resp = await geocoderRef.current.geocode({ placeId: sug.placeId })
        const first = resp.results[0]
        if (!first) {
          setSearchError(`Couldn’t resolve “${sug.mainText}”.`)
          return
        }
        const loc = first.geometry?.location
        if (!loc) {
          setSearchError(`No coordinates for “${sug.mainText}”.`)
          return
        }
        const location = { lat: loc.lat(), lng: loc.lng() }
        const parsed = pickFromGeocoderResult(first, location)
        applyPick(parsed)
      } catch (err) {
        console.error('[AdminLgaMapPicker] geocode by placeId failed:', err)
        const msg = err instanceof Error ? err.message : 'Failed to load place details'
        setSearchError(msg)
      }
    },
    [applyPick],
  )

  const handleSelectSuggestion = useCallback(
    async (sug: Suggestion) => {
      setShowDropdown(false)
      setInputValue(sug.mainText)
      setSearchError(null)
      try {
        await resolveAndApplyPrediction(sug)
      } finally {
        // Refresh session token after a successful (or failed) selection.
        try {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
        } catch {
          sessionTokenRef.current = null
        }
      }
    },
    [resolveAndApplyPrediction],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!showDropdown && suggestions.length > 0) {
        setShowDropdown(true)
        return
      }
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      if (showDropdown && activeIdx >= 0 && activeIdx < suggestions.length) {
        e.preventDefault()
        void handleSelectSuggestion(suggestions[activeIdx])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const clearSearch = () => {
    setInputValue('')
    setSuggestions([])
    setShowDropdown(false)
    setActiveIdx(-1)
    setSearchError(null)
    inputRef.current?.focus()
  }

  if (!apiKey?.trim()) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Set <code className="rounded bg-blue-100/80 px-1">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
        <code className="rounded bg-blue-100/80 px-1">.env</code> and enable{' '}
        <strong>Maps JavaScript API</strong>, <strong>Places API</strong> (or{' '}
        <strong>Places API (New)</strong>), and <strong>Geocoding API</strong> on the key. Restrict the key by HTTP
        referrer for this app.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {status === 'loading' && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="size-3 animate-spin" /> Loading map…
        </p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || searchError) setShowDropdown(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search city, LGA, or any location in Nigeria…"
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="lga-autocomplete-listbox"
          role="combobox"
          disabled={status !== 'ready'}
        />
        {searching && (
          <Loader2 className="pointer-events-none absolute right-9 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
        {inputValue && !searching && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {searchError && (
        <p className="text-[11px] text-red-600" role="alert">
          {searchError}
        </p>
      )}

      {showDropdown && dropdownRect && (suggestions.length > 0 || searching || searchError) &&
        createPortal(
          <div
            ref={dropdownRef}
            id="lga-autocomplete-listbox"
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="max-h-72 overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {suggestions.length === 0 && searching && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-500">
                <Loader2 className="size-3 animate-spin" />
                Searching…
              </div>
            )}
            {suggestions.length === 0 && !searching && searchError && (
              <div className="px-3 py-3 text-xs text-red-600">{searchError}</div>
            )}
            {suggestions.length === 0 && !searching && !searchError && inputValue.trim().length >= 2 && (
              <div className="px-3 py-3 text-xs text-gray-500">
                No matches in Nigeria for “{inputValue.trim()}”.
              </div>
            )}
            {suggestions.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void handleSelectSuggestion(s)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-start gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 ${i === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-gray-900">{s.mainText}</span>
                  {s.secondaryText && (
                    <span className="block truncate text-xs text-gray-500">{s.secondaryText}</span>
                  )}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}

      <div
        ref={mapHostRef}
        className="h-[300px] w-full overflow-hidden rounded-md border border-gray-200 bg-gray-100"
        aria-label="Map preview"
      />
    </div>
  )
}
