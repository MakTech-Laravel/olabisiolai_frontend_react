/** Payload to send to your Laravel API when saving an LGA / location row. */
export type LgaMapPickResult = {
  googlePlaceId: string
  resourceName?: string
  displayName: string | null
  formattedAddress: string | null
  lat: number
  lng: number
  /** ISO country name from address_components */
  country: string | null
  /** administrative_area_level_1 — usually state */
  administrativeAreaLevel1: string | null
  /** administrative_area_level_2 — often LGA / district where Google provides it */
  administrativeAreaLevel2: string | null
  locality: string | null
  /** Serialized bounds for backend / map restore */
  viewport: { north: number; south: number; east: number; west: number } | null
  /** Raw component types → long names for audit / future use */
  addressComponentsJson: string
}
