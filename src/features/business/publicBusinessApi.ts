import { request } from '@/api/request';
import {
  parseBusinessHours,
  parseBusinessHoursDisplay,
  type BusinessHourEntry,
  type BusinessHoursDisplayRow,
} from '@/features/business/businessHours';
import { parseSocialAccounts, type SocialAccount } from '@/features/business/socialAccounts';
import { parseCatalogItems, type BusinessCatalogItem } from '@/features/catalog/businessCatalogApi';
import { normalizeSubcategories } from '@/features/categories/categoryParsers';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export type PublicBusiness = {
  id: number;
  name: string;
  category: string;
  categoryId?: number | null;
  subcategory?: string | null;
  categorySubcategories?: string[];
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  socialAccounts: SocialAccount[];
  location: string;
  locationId?: number | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  reviews: number;
  description: string;
  /** Card thumbnail: first cover, else logo. */
  image: string;
  logoUrl: string;
  coverPhotoUrls: string[];
  servicesOffered: string[];
  verified: boolean;
  /** e.g. "March 2026" — from API `member_since`. */
  memberSince: string | null;
  /** e.g. "May 2026" — from API `verified_since` when badge is shown. */
  verifiedSince: string | null;
  /** e.g. "Usually responds within 15 minutes" — from messaging analytics when available. */
  responseTimeLabel: string | null;
  /** From API e.g. `is_favorite` on GET /businesses/home when authenticated. */
  isFavorite: boolean;
  followersCount: number;
  /** Whether the authenticated viewer follows this vendor. */
  isFollowing: boolean;
  boostStatus: 'active' | 'none';
  isPremium: boolean;
  /** Vendor account id — for "message yourself" guard on own listing. */
  vendorUserId: number | null;
  /** Vendor account UUID — required to start a direct conversation. */
  vendorUserUuid: string | null;
  businessHours: BusinessHourEntry[];
  businessHoursDisplay: BusinessHoursDisplayRow[];
  catalogItems: BusinessCatalogItem[];
  catalogLocked: boolean;
  catalogCount: number;
};

export type PublicBusinessesPage = {
  items: PublicBusiness[];
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
};

type Raw = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  return fallback;
}

function rec(v: unknown): Raw | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Raw;
  return null;
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const obj = rec(item);
      return str(obj?.url ?? obj?.image_path ?? obj?.path, '').trim();
    })
    .filter((item) => item.length > 0);
}

function parseCoverPhotoUrls(r: Raw): string[] {
  const rawList = parseStringList(r.cover_photo_urls ?? r.cover_photos);
  return rawList
    .map((path) => resolveMediaUrl(path, ''))
    .filter((url) => url.length > 0);
}

export function resolveSubcategoryFromServices(
  allowed: string[],
  servicesOffered: string[],
): string | null {
  if (allowed.length === 0 || servicesOffered.length === 0) return null;

  for (const service of servicesOffered) {
    const normalizedService = service.trim();
    if (!normalizedService) continue;

    const match = allowed.find(
      (candidate) => candidate.trim().toLowerCase() === normalizedService.toLowerCase(),
    );
    if (match) return match;
  }

  return null;
}

export function resolvePublicBusinessSubcategory(
  business: Pick<PublicBusiness, 'subcategory' | 'servicesOffered' | 'categorySubcategories'>,
): string | null {
  const direct = business.subcategory?.trim();
  if (direct) return direct;

  return resolveSubcategoryFromServices(
    business.categorySubcategories ?? [],
    business.servicesOffered ?? [],
  );
}

function parseBusiness(raw: unknown, idx: number): PublicBusiness | null {
  const r = rec(raw);
  if (!r) return null;

  const id = num(r.id ?? r.business_id, idx + 1);
  const name = str(r.business_name ?? r.name, `Business ${id}`);

  const catObj = rec(r.category);
  const category = str(catObj?.name ?? r.category_name ?? r.category, 'General');
  const categoryId = num(catObj?.id ?? r.category_id, NaN);
  const categoryIdNorm = Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null;
  const categorySubcategories = normalizeSubcategories(catObj?.subcategories);
  const subcategoryRaw = str(r.subcategory, '').trim();
  const subcategory =
    subcategoryRaw ||
    resolveSubcategoryFromServices(categorySubcategories, parseStringList(r.services_offered)) ||
    null;
  const phoneRaw = str(r.phone, '').trim();
  const phone = phoneRaw || null;
  const whatsappRaw = str(r.whatsapp, '').trim();
  const whatsapp = whatsappRaw || null;
  const websiteRaw = str(r.website, '').trim();
  const website = websiteRaw || null;
  const socialAccounts = parseSocialAccounts(r.social_accounts ?? r.socialAccounts);

  const locObj = rec(r.location);
  const streetAddress = str(r.street_address ?? r.full_address, '').trim();
  const formattedAddress = str(locObj?.formatted_address ?? r.formatted_address, '').trim();
  const fullName = str(locObj?.full_name, '').trim();
  const city = str(locObj?.city ?? r.city, '');
  const state = str(locObj?.state ?? r.state, '');
  const location =
    streetAddress ||
    formattedAddress ||
    fullName ||
    [city, state].filter(Boolean).join(', ') ||
    str(r.location, 'N/A');
  const locationId = num(locObj?.id ?? r.location_id, 0) || null;
  const locationName = str(locObj?.name ?? locObj?.full_name ?? city, '') || null;
  const latRaw = num(locObj?.latitude ?? r.latitude, NaN);
  const lngRaw = num(locObj?.longitude ?? r.longitude, NaN);
  const latitude = Number.isFinite(latRaw) ? latRaw : null;
  const longitude = Number.isFinite(lngRaw) ? lngRaw : null;

  const summary = rec(r.reviews_summary);
  const rating = summary
    ? num(
      summary.average_rating ?? summary.avg_rating ?? summary.average,
      num(r.average_rating ?? r.rating, 0),
    )
    : num(r.average_rating ?? r.rating, 0);
  const reviews = summary
    ? num(
      summary.total_reviews ?? summary.reviews_count ?? summary.count,
      num(r.reviews_count ?? r.total_reviews ?? r.reviews, 0),
    )
    : num(r.reviews_count ?? r.total_reviews ?? r.reviews, 0);
  const description = str(r.business_description ?? r.description, '');

  const logoUrl = resolveMediaUrl(str(r.logo_url ?? r.logo, ''), '/images/service/avatar.jpg');
  const coverPhotoUrls = parseCoverPhotoUrls(r);
  const image = coverPhotoUrls[0] ?? logoUrl;
  const servicesOffered = parseStringList(r.services_offered);

  const businessHours = parseBusinessHours(r.business_hours ?? r.businessHours);
  const businessHoursDisplay = parseBusinessHoursDisplay(
    r.business_hours_display ?? r.businessHoursDisplay,
  );

  const verified =
    r.shows_verified_badge === true ||
    r.is_verified === true ||
    r.verification_status === 'approved';

  const isFavorite =
    r.is_favorite === true ||
    r.isFavorite === true ||
    r.favorited === true;

  const followersCount = num(r.followers_count ?? r.followersCount, 0);
  const isFollowing =
    r.is_following === true ||
    r.isFollowing === true;

  const boostRaw = str(r.boost_status ?? r.boostStatus, 'none').toLowerCase();
  const boostStatus: PublicBusiness['boostStatus'] =
    boostRaw === 'active' ? 'active' : 'none';
  const isPremium = r.is_premium === true || r.isPremium === true;

  const vendorObj = rec(r.vendor) ?? rec(r.user);
  const vendorUserIdRaw = num(vendorObj?.id ?? r.vendor_id ?? r.user_id, NaN);
  const vendorUserId =
    Number.isFinite(vendorUserIdRaw) && vendorUserIdRaw > 0 ? vendorUserIdRaw : null;
  const vendorUuidRaw = str(vendorObj?.uuid ?? r.vendor_uuid ?? r.vendor_user_uuid, '').trim();
  const vendorUserUuid = vendorUuidRaw || null;

  const memberSinceRaw = str(r.member_since ?? r.memberSince, "").trim();
  const memberSince = memberSinceRaw || null;
  const verifiedSinceRaw = str(r.verified_since ?? r.verifiedSince, "").trim();
  const verifiedSince = verifiedSinceRaw || null;
  const responseTimeRaw = str(r.response_time_label ?? r.responseTimeLabel, "").trim();
  const responseTimeLabel = responseTimeRaw || null;
  const catalogItems = parseCatalogItems(r.catalog_items ?? r.catalogItems);
  const catalogLocked = r.catalog_locked === true || r.catalogLocked === true;
  const catalogCount = num(r.catalog_count ?? r.catalogCount, catalogItems.length);

  return {
    id,
    name,
    category,
    categoryId: categoryIdNorm,
    subcategory,
    categorySubcategories,
    phone,
    whatsapp,
    website,
    socialAccounts,
    location,
    locationId,
    locationName,
    latitude,
    longitude,
    rating,
    reviews,
    description,
    image,
    logoUrl,
    coverPhotoUrls,
    servicesOffered,
    verified,
    memberSince,
    verifiedSince,
    responseTimeLabel,
    isFavorite,
    followersCount,
    isFollowing,
    boostStatus,
    isPremium,
    vendorUserId,
    vendorUserUuid,
    businessHours,
    businessHoursDisplay,
    catalogItems,
    catalogLocked,
    catalogCount,
  };
}

const LIST_KEYS = ['businesses', 'business_profiles', 'items', 'data', 'results'] as const;
const PAGINATION_KEYS = ['pagination', 'meta', 'page'] as const;

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = rec(data);
  if (!r) return [];

  // Direct top-level match
  for (const key of LIST_KEYS) {
    const val = r[key];
    if (Array.isArray(val)) return val;
  }

  // One level deeper — handles { data: { businesses: [...] } }
  for (const key of LIST_KEYS) {
    const inner = rec(r[key]);
    if (!inner) continue;
    for (const innerKey of LIST_KEYS) {
      const val = inner[innerKey];
      if (Array.isArray(val)) return val;
    }
  }

  return [];
}

function extractPagination(data: unknown): Partial<PublicBusinessesPage> | null {
  const r = rec(data);
  if (!r) return null;

  const candidates: Raw[] = [];
  for (const key of PAGINATION_KEYS) {
    const direct = rec(r[key]);
    if (direct) candidates.push(direct);
  }
  const inner = rec(r.data);
  if (inner) {
    for (const key of PAGINATION_KEYS) {
      const nested = rec(inner[key]);
      if (nested) candidates.push(nested);
    }
  }

  for (const p of candidates) {
    const currentPage = num(p.current_page ?? p.currentPage ?? p.page, 1);
    const perPage = num(p.per_page ?? p.perPage ?? p.page_size, 12);
    const lastPage = num(p.last_page ?? p.lastPage ?? 1, 1);
    const total = num(p.total ?? p.count, 0);
    if (currentPage > 0 && perPage > 0 && lastPage > 0) {
      return { currentPage, perPage, lastPage, total };
    }
  }

  return null;
}

/** Fisher–Yates shuffle for public marketplace cards only (admin lists are unchanged). */
export function shufflePublicBusinesses(items: PublicBusiness[]): PublicBusiness[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled;
}

function parseBusinessesPage(data: unknown): PublicBusinessesPage {
  const rows = extractList(data);
  const items = shufflePublicBusinesses(
    rows
      .map((row, i) => parseBusiness(row, i))
      .filter((b): b is PublicBusiness => b !== null),
  );

  const pagination = extractPagination(data);
  return {
    items,
    currentPage: pagination?.currentPage ?? 1,
    perPage: pagination?.perPage ?? Math.max(items.length, 1),
    lastPage: pagination?.lastPage ?? 1,
    total: pagination?.total ?? items.length,
  };
}

export async function fetchPublicBusinesses(params?: {
  category?: string;
  category_id?: number;
  subcategory?: string;
  location_id?: number;
  lat?: number;
  lng?: number;
  radius_km?: number;
  search?: string;
  verification_status?: string;
  page?: number;
  per_page?: number;
}): Promise<PublicBusiness[]> {
  const page = await fetchPublicBusinessesPage(params);
  return page.items;
}

function hasGeoFilter(params?: { lat?: number; lng?: number }): boolean {
  if (!params) return false;
  return (
    params.lat != null &&
    params.lng != null &&
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng)
  );
}

function hasServerListFilters(params?: {
  category_id?: number;
  subcategory?: string;
  location_id?: number;
  lat?: number;
  lng?: number;
  search?: string;
  verification_status?: string;
}): boolean {
  if (!params) return false;
  if (params.category_id != null && params.category_id > 0) return true;
  if (params.subcategory != null && params.subcategory.trim() !== '') return true;
  if (params.location_id != null && params.location_id > 0) return true;
  if (hasGeoFilter(params)) return true;
  if (params.search != null && params.search.trim() !== '') return true;
  if (params.verification_status != null && params.verification_status.trim() !== '') return true;
  return false;
}

export async function fetchPublicBusinessesPage(params?: {
  category?: string;
  category_id?: number;
  subcategory?: string;
  location_id?: number;
  lat?: number;
  lng?: number;
  radius_km?: number;
  search?: string;
  verification_status?: string;
  page?: number;
  per_page?: number;
}): Promise<PublicBusinessesPage> {
  /**
   * When the user applies category / location / search / verification filters we must NOT
   * fall through to legacy endpoints that ignore those params — that produced wrong rows
   * (e.g. Plumbing selected but Cleaning businesses shown after `/businesses/home` returned []).
   */
  const strictFiltered = hasServerListFilters(params);

  const endpointsStrict: Array<{ label: string; fn: () => Promise<unknown> }> = [
    {
      label: 'GET /businesses/all',
      fn: () =>
        request
          .get('/businesses/all', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: 'GET /businesses/home',
      fn: () =>
        request
          .get('/businesses/home', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
  ];

  const endpointsLoose: Array<{ label: string; fn: () => Promise<unknown> }> = [
    {
      label: 'GET /businesses/home',
      fn: () =>
        request
          .get('/businesses/home', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: 'GET /public/businesses',
      fn: () =>
        request
          .get('/public/businesses', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: 'GET /public/business-info',
      fn: () =>
        request
          .get('/public/business-info', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: 'POST /public/businesses',
      fn: () =>
        request
          .post('/public/businesses', params ?? {}, { skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: 'GET /businesses',
      fn: () =>
        request
          .get('/businesses', { params, skipAuthRedirect: true })
          .then((r) => r.data),
    },
  ];

  const endpoints = strictFiltered ? endpointsStrict : endpointsLoose;

  let lastError: unknown = null;

  for (const { label, fn } of endpoints) {
    try {
      const data = await fn();
      if (import.meta.env.DEV) {
        console.debug('[publicBusinessApi] response from', label, data);
      }
      const parsedPage = parseBusinessesPage(data);
      if (strictFiltered) {
        return parsedPage;
      }
      if (parsedPage.items.length > 0) return parsedPage;
    } catch (err) {
      lastError = err;
      if (import.meta.env.DEV) {
        console.warn('[publicBusinessApi] failed:', label, err);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    items: [],
    currentPage: Math.max(1, params?.page ?? 1),
    perPage: Math.max(1, params?.per_page ?? 12),
    lastPage: 1,
    total: 0,
  };
}

/**
 * `GET /businesses/:id` returns `data.business` and often `data.reviews_summary` as siblings.
 * Merge so `parseBusiness` sees `reviews_summary` together with business fields (and `average_rating` on `business` still works as fallback).
 */
function mergeBusinessPayloadForParse(data: unknown): unknown {
  const r = rec(data);
  const dataObj = rec(r?.data);
  const summaryFromEnvelope = rec(r?.reviews_summary);

  const biz =
    rec(dataObj?.business) ??
    rec(dataObj?.business_info) ??
    rec(dataObj?.business_profile);

  const summary =
    rec(dataObj?.reviews_summary) ??
    summaryFromEnvelope ??
    (biz ? rec(biz.reviews_summary) : null);

  if (biz && summary) {
    return { ...biz, reviews_summary: summary };
  }
  if (biz) {
    return biz;
  }

  return dataObj ?? r?.data ?? data;
}

export async function fetchPublicBusinessById(id: number): Promise<PublicBusiness | null> {
  const endpoints: Array<{ label: string; fn: () => Promise<unknown> }> = [
    {
      // confirmed response: { data: { business: {...} } }
      label: `GET /businesses/${id}`,
      fn: () =>
        request
          .get(`/businesses/${id}`, { skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: `GET /public/businesses/${id}`,
      fn: () =>
        request
          .get(`/public/businesses/${id}`, { skipAuthRedirect: true })
          .then((r) => r.data),
    },
    {
      label: `GET /public/business-info/${id}`,
      fn: () =>
        request
          .get(`/public/business-info/${id}`, { skipAuthRedirect: true })
          .then((r) => r.data),
    },
  ];

  for (const { label, fn } of endpoints) {
    try {
      const data = await fn();
      if (import.meta.env.DEV) {
        console.debug('[publicBusinessApi] single response from', label, data);
      }
      const root = rec(data);
      if (root?.success === false) {
        continue;
      }
      const inner = mergeBusinessPayloadForParse(data);
      const parsed = parseBusiness(inner, 0);
      if (parsed) return parsed;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[publicBusinessApi] failed:', label, err);
      }
    }
  }

  return null;
}
