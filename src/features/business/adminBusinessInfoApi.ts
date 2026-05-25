import { request } from "@/api/request";
import { resolveMediaUrl, resolveMediaUrls } from "@/lib/mediaUrl";

type RawRecord = Record<string, unknown>;

export type AdminBusinessInfo = {
  id: number;
  name: string;
  category: string;
  type: string;
  location: string;
  status: "pending" | "active" | "inactive" | "suspended";
  /** `verified` includes API value `approved`. */
  verification: "none" | "pending" | "verified" | "flagged";
  is_flagged?: boolean;
  boost: "none" | "active";
  plan: "free" | "premium";
  joinDate: string;
};

export type AdminBusinessListSummary = {
  total: number;
  pending_verification: number;
  approved_verification: number;
  free_plan: number;
  premium_plan: number;
};

export type AdminBusinessListPagination = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

export type AdminBusinessListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  /** API: none | pending | approved */
  verification_status?: string;
  /** API: active | inactive | suspended (BusinessStatus) */
  business_status?: string;
  category_id?: number;
  /** API: active | none */
  boost_status?: string;
};

export type AdminFilterOption = { value: string; label: string };

export type AdminBusinessFilterOptions = {
  verification_statuses: AdminFilterOption[];
  business_statuses: AdminFilterOption[];
  boost_statuses: AdminFilterOption[];
  categories: AdminCategoryOption[];
};

export type AdminBusinessListResponse = {
  items: AdminBusinessInfo[];
  summary: AdminBusinessListSummary;
  pagination: AdminBusinessListPagination;
  filterOptions: AdminBusinessFilterOptions;
};

export type AdminCategoryOption = { id: number; name: string };

export type AdminBusinessVendor = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type AdminBusinessMessage = {
  id: number;
  message: string;
  adminName: string;
  vendorName: string;
  createdAt: string;
};

export type AdminBusinessDetail = {
  id: number;
  name: string;
  description: string;
  services: string[];
  category: string;
  categoryId: number | null;
  location: string;
  locationFull: string;
  phone: string;
  whatsapp: string;
  website: string;
  logoUrl: string;
  coverPhotoUrls: string[];
  status: AdminBusinessInfo["status"];
  verification: AdminBusinessInfo["verification"];
  boost: AdminBusinessInfo["boost"];
  averageRating: number;
  reviewsCount: number;
  joinDate: string;
  updatedAt: string;
  vendor: AdminBusinessVendor | null;
  messages: AdminBusinessMessage[];
};

const DEFAULT_FILTER_OPTIONS: AdminBusinessFilterOptions = {
  verification_statuses: [
    { value: "none", label: "Not applied" },
    { value: "pending", label: "Pending review" },
    { value: "approved", label: "Verified" },
    { value: "flagged", label: "Flagged" },
  ],
  business_statuses: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ],
  boost_statuses: [
    { value: "active", label: "Active boost" },
    { value: "none", label: "No boost" },
  ],
  categories: [],
};

/** Matches `App\Enums\BusinessStatus` API values. */
export type AdminBusinessStatusApi = "active" | "inactive" | "suspended";

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as RawRecord;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "verified", "active", "approved"].includes(normalized)) return true;
    if (["0", "false", "no", "flagged", "inactive", "pending"].includes(normalized)) return false;
  }
  return null;
}

function toSafeId(raw: unknown, fallbackSeed: string): number {
  const numeric = asNumber(raw);
  if (numeric !== null) return numeric;

  const text = asString(raw, fallbackSeed).trim() || fallbackSeed;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || Math.abs(fallbackSeed.length * 101);
}

function pickString(
  source: RawRecord,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = source[key];
    const text = asString(value).trim();
    if (text) return text;
  }
  return fallback;
}

function pickRecord(source: RawRecord, keys: string[]): RawRecord | null {
  for (const key of keys) {
    const value = asRecord(source[key]);
    if (value) return value;
  }
  return null;
}

function toStatus(raw: string): AdminBusinessInfo["status"] {
  if (raw === "active" || raw === "inactive" || raw === "suspended" || raw === "pending") return raw;
  return "active";
}

function toVerification(raw: string): AdminBusinessInfo["verification"] {
  const n = raw.trim().toLowerCase();
  if (n === "none") return "none";
  if (n === "pending") return "pending";
  if (n === "approved" || n === "verified") return "verified";
  if (n === "flagged") return "flagged";
  return "none";
}

function toBoost(raw: string): AdminBusinessInfo["boost"] {
  if (raw === "active") return "active";
  return "none";
}

function toPlan(raw: string): AdminBusinessInfo["plan"] {
  if (raw === "premium") return "premium";
  return "free";
}

function parseBusiness(raw: unknown, index: number): AdminBusinessInfo | null {
  const item = asRecord(raw);
  if (!item) return null;

  const categoryObj = pickRecord(item, ["category"]);
  const locationObj = pickRecord(item, ["location"]);
  const verificationObj = pickRecord(item, ["verification"]);
  const planObj = pickRecord(item, ["plan"]);
  const boostObj = pickRecord(item, ["boost"]);
  const fallbackSeed = `${pickString(item, ["business_name", "name"], "business")}-${index + 1}`;

  const id = toSafeId(item.id ?? item.business_id ?? item.uuid ?? item.slug, fallbackSeed);

  const name = pickString(item, ["business_name", "name"], `Business ${id}`);
  const category =
    pickString(item, ["category_name"], "") ||
    pickString(categoryObj ?? {}, ["name", "title"], "") ||
    pickString(item, ["category"], "Uncategorized");
  const type = pickString(item, ["business_type", "type"], "service");
  const cityFromObj = pickString(locationObj ?? {}, ["city", "name"], "");
  const stateFromObj = pickString(locationObj ?? {}, ["state", "region"], "");
  const locationFromObj = [cityFromObj, stateFromObj].filter(Boolean).join(", ");
  const location =
    locationFromObj ||
    pickString(item, ["location", "address"], "") ||
    [pickString(item, ["city"], ""), pickString(item, ["state"], "")].filter(Boolean).join(", ") ||
    "N/A";
  const joinDate = pickString(item, ["join_date", "created_at"], "");

  const status = toStatus(pickString(item, ["business_status", "status"], "active").toLowerCase());

  const verificationBool = asBoolean(item.is_verified ?? item.verified ?? verificationObj?.is_verified);
  const isFlagged = asBoolean(item.is_flagged) === true;
  let verification = toVerification(
    (
      pickString(item, ["verification_status"], "") ||
      pickString(verificationObj ?? {}, ["status"], "") ||
      (verificationBool === null ? "" : verificationBool ? "verified" : "") ||
      pickString(item, ["verification"], "")
    ).toLowerCase(),
  );
  if (isFlagged) {
    verification = "flagged";
  }
  const boost = toBoost(
    (
      pickString(item, ["boost_status"], "") ||
      pickString(boostObj ?? {}, ["status"], "") ||
      pickString(item, ["boost"], "none")
    ).toLowerCase(),
  );
  const plan = toPlan(
    (
      pickString(item, ["subscription_plan"], "") ||
      pickString(planObj ?? {}, ["name", "tier"], "") ||
      pickString(item, ["plan"], "free")
    ).toLowerCase(),
  );

  return {
    id,
    name,
    category,
    type,
    location,
    status,
    verification,
    is_flagged: isFlagged,
    boost,
    plan,
    joinDate,
  };
}

function toUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickFirstArray(candidates: unknown[]): unknown[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function extractBusinessList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];

  const rootDirect = pickFirstArray([
    root.businesses,
    root.business_profiles,
    root.items,
    root.results,
    root.rows,
    root.list,
  ]);
  if (rootDirect.length > 0) return rootDirect;

  const data = root.data;
  if (Array.isArray(data)) return data;
  const inner = asRecord(data);
  if (!inner) return [];

  const innerDirect = pickFirstArray([
    inner.data, // Laravel paginator/resource collection often nests here
    inner.business_profiles,
    inner.businesses,
    inner.items,
    inner.results,
    inner.rows,
    inner.list,
  ]);
  if (innerDirect.length > 0) return innerDirect;

  // Support shapes like { data: { businesses: { data: [...] } } }
  const nestedSources = [inner.business_profiles, inner.businesses, inner.items, inner.results, inner.rows];
  for (const source of nestedSources) {
    const node = asRecord(source);
    if (!node) continue;
    const nested = pickFirstArray([node.data, node.items, node.rows]);
    if (nested.length > 0) return nested;
  }

  return toUnknownArray(inner.data);
}

function extractPaginationBlock(payload: unknown): AdminBusinessListPagination {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const p = asRecord(data?.pagination);
  return {
    current_page: Math.max(1, asNumber(p?.current_page) ?? 1),
    per_page: Math.max(1, asNumber(p?.per_page) ?? 15),
    last_page: Math.max(1, asNumber(p?.last_page) ?? 1),
    total: Math.max(0, asNumber(p?.total) ?? 0),
  };
}

function parseFilterOption(raw: unknown): AdminFilterOption | null {
  const item = asRecord(raw);
  if (!item) return null;
  const value = pickString(item, ["value"], "");
  if (!value) return null;
  const label = pickString(item, ["label"], value);
  return { value, label };
}

function extractFilterOptionsBlock(payload: unknown): AdminBusinessFilterOptions {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const block = asRecord(data?.filter_options);
  if (!block) return DEFAULT_FILTER_OPTIONS;

  const verification = (Array.isArray(block.verification_statuses) ? block.verification_statuses : [])
    .map((row) => parseFilterOption(row))
    .filter((row): row is AdminFilterOption => row !== null);

  const business = (Array.isArray(block.business_statuses) ? block.business_statuses : [])
    .map((row) => parseFilterOption(row))
    .filter((row): row is AdminFilterOption => row !== null);

  const boost = (Array.isArray(block.boost_statuses) ? block.boost_statuses : [])
    .map((row) => parseFilterOption(row))
    .filter((row): row is AdminFilterOption => row !== null);

  const categories = (Array.isArray(block.categories) ? block.categories : [])
    .map((row) => parseCategoryOption(row))
    .filter((row): row is AdminCategoryOption => row !== null);

  return {
    verification_statuses: verification.length > 0 ? verification : DEFAULT_FILTER_OPTIONS.verification_statuses,
    business_statuses: business.length > 0 ? business : DEFAULT_FILTER_OPTIONS.business_statuses,
    boost_statuses: boost.length > 0 ? boost : DEFAULT_FILTER_OPTIONS.boost_statuses,
    categories,
  };
}

function extractSummaryBlock(payload: unknown): AdminBusinessListSummary {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const s = asRecord(data?.summary);
  return {
    total: Math.max(0, asNumber(s?.total) ?? 0),
    pending_verification: Math.max(0, asNumber(s?.pending_verification) ?? 0),
    approved_verification: Math.max(0, asNumber(s?.approved_verification) ?? 0),
    free_plan: Math.max(0, asNumber(s?.free_plan) ?? 0),
    premium_plan: Math.max(0, asNumber(s?.premium_plan) ?? 0),
  };
}

function parseCategoryOption(raw: unknown): AdminCategoryOption | null {
  const item = asRecord(raw);
  if (!item) return null;
  const id = asNumber(item.id);
  if (id === null || id <= 0) return null;
  const name = pickString(item, ["name", "title"], `Category ${id}`);
  return { id, name };
}

export async function fetchAdminBusinessList(
  params: AdminBusinessListParams = {},
): Promise<AdminBusinessListResponse> {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 15;

  const body: Record<string, unknown> = {
    page,
    per_page: perPage,
  };

  const search = params.search?.trim();
  if (search) body.search = search;

  if (params.verification_status && params.verification_status !== "all") {
    body.verification_status = params.verification_status;
  }
  if (params.business_status && params.business_status !== "all") {
    body.business_status = params.business_status;
  }
  if (params.category_id != null && params.category_id > 0) {
    body.category_id = params.category_id;
  }
  if (params.boost_status && params.boost_status !== "all") {
    body.boost_status = params.boost_status;
  }

  const res = await request.post("/admin/business-info", body);
  const root = asRecord(res.data);

  if (!root || root.success !== true) {
    const msg =
      pickString(root ?? {}, ["message"], "") ||
      pickString(asRecord(root?.data) ?? {}, ["message"], "") ||
      "Failed to load businesses.";
    throw new Error(msg);
  }

  const rows = extractBusinessList(res.data);
  const items = rows
    .map((row, index) => parseBusiness(row, index))
    .filter((item): item is AdminBusinessInfo => item !== null);

  return {
    items,
    summary: extractSummaryBlock(res.data),
    pagination: extractPaginationBlock(res.data),
    filterOptions: extractFilterOptionsBlock(res.data),
  };
}

function extractCategoryRows(payload: unknown): unknown[] {
  const root = asRecord(payload);
  if (!root || root.success !== true) return [];
  const data = asRecord(root.data);
  if (!data) return [];
  const direct = pickFirstArray([data.categories, data.data]);
  if (direct.length > 0) return direct;
  const nested = asRecord(data.categories);
  if (nested) {
    const inner = pickFirstArray([nested.data, nested.items]);
    if (inner.length > 0) return inner;
  }
  return [];
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asString(entry).trim())
    .filter((entry) => entry.length > 0);
}

function parseAdminBusinessDetail(raw: unknown): AdminBusinessDetail | null {
  const item = asRecord(raw);
  if (!item) return null;

  const categoryObj = pickRecord(item, ["category"]);
  const locationObj = pickRecord(item, ["location"]);
  const vendorObj = pickRecord(item, ["vendor"]);

  const id = toSafeId(item.id, "business-detail");
  const name = pickString(item, ["business_name", "name"], `Business ${id}`);
  const category = pickString(categoryObj ?? {}, ["name"], pickString(item, ["category_name"], "Uncategorized"));
  const categoryId = asNumber(categoryObj?.id ?? item.category_id);

  const city = pickString(locationObj ?? {}, ["city", "name"], "");
  const state = pickString(locationObj ?? {}, ["state"], "");
  const location =
    [city, state].filter(Boolean).join(", ") ||
    pickString(locationObj ?? {}, ["full_name"], pickString(item, ["location"], "N/A"));
  const locationFull = pickString(locationObj ?? {}, ["full_name"], location);

  const status = toStatus(pickString(item, ["business_status", "status"], "active").toLowerCase());
  const verification = toVerification(pickString(item, ["verification_status"], "none").toLowerCase());
  const boost = toBoost(pickString(item, ["boost_status"], "none").toLowerCase());

  const coverPhotoUrls = parseStringArray(item.cover_photo_urls);

  const vendor: AdminBusinessVendor | null = vendorObj
    ? {
      id: toSafeId(vendorObj.id, `vendor-${id}`),
      name: pickString(vendorObj, ["name"], "Vendor"),
      email: pickString(vendorObj, ["email"], ""),
      phone: pickString(vendorObj, ["phone"], ""),
    }
    : null;

  return {
    id,
    name,
    description: pickString(item, ["business_description", "description"], ""),
    services: parseStringArray(item.services_offered),
    category,
    categoryId: categoryId !== null && categoryId > 0 ? categoryId : null,
    location,
    locationFull,
    phone: pickString(item, ["phone"], ""),
    whatsapp: pickString(item, ["whatsapp"], ""),
    website: pickString(item, ["website"], ""),
    logoUrl: resolveMediaUrl(pickString(item, ["logo_url", "logo"], "")),
    coverPhotoUrls: resolveMediaUrls(coverPhotoUrls),
    status,
    verification,
    boost,
    averageRating: asNumber(item.average_rating) ?? 0,
    reviewsCount: asNumber(item.reviews_count) ?? 0,
    joinDate: pickString(item, ["created_at", "join_date"], ""),
    updatedAt: pickString(item, ["updated_at"], ""),
    vendor,
    messages: [],
  };
}

function parseAdminBusinessMessages(raw: unknown): AdminBusinessMessage[] {
  const rows = toUnknownArray(raw);
  return rows
    .map((row) => {
      const item = asRecord(row);
      if (!item) return null;
      const admin = pickRecord(item, ["admin"]);
      const vendor = pickRecord(item, ["vendor"]);
      const message = pickString(item, ["message"], "");
      if (!message) return null;
      return {
        id: toSafeId(item.id, message),
        message,
        adminName: pickString(admin ?? {}, ["name"], "Admin"),
        vendorName: pickString(vendor ?? {}, ["name"], "Vendor"),
        createdAt: pickString(item, ["created_at"], ""),
      };
    })
    .filter((row): row is AdminBusinessMessage => row !== null);
}

function extractAdminBusinessDetailPayload(payload: unknown): {
  business: AdminBusinessDetail | null;
  messages: AdminBusinessMessage[];
} {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const businessRaw = data?.business ?? root?.business;
  const business = parseAdminBusinessDetail(businessRaw);
  const messages = parseAdminBusinessMessages(data?.messages ?? root?.messages);
  if (business) {
    return { business: { ...business, messages }, messages };
  }
  return { business: null, messages };
}

export async function fetchAdminBusinessDetail(businessInfoId: number): Promise<AdminBusinessDetail> {
  const res = await request.post("/admin/business-info/view", {
    business_info_id: businessInfoId,
  });
  assertApiSuccess(res.data, "Failed to load business details.");
  const { business } = extractAdminBusinessDetailPayload(res.data);
  if (!business) {
    throw new Error("Business profile not found.");
  }
  return business;
}

export async function fetchAdminCategoryOptions(maxRows = 200): Promise<AdminCategoryOption[]> {
  const res = await request.post("/admin/categories", { page: 1, per_page: maxRows });
  const rows = extractCategoryRows(res.data);
  return rows
    .map((row) => parseCategoryOption(row))
    .filter((item): item is AdminCategoryOption => item !== null);
}

/** @deprecated Use fetchAdminBusinessList for paginated admin directory. */
export async function fetchAdminBusinessInfo(): Promise<AdminBusinessInfo[]> {
  const { items } = await fetchAdminBusinessList({ page: 1, per_page: 100 });
  return items;
}

function assertApiSuccess(payload: unknown, fallbackMessage: string): Record<string, unknown> {
  const root = asRecord(payload);
  if (!root || root.success !== true) {
    const msg =
      pickString(root ?? {}, ["message"], "") ||
      pickString(asRecord(root?.data) ?? {}, ["message"], "") ||
      fallbackMessage;
    throw new Error(msg);
  }
  return root;
}

export async function changeAdminBusinessStatus(
  businessInfoId: number,
  status: AdminBusinessStatusApi,
): Promise<AdminBusinessInfo> {
  const res = await request.post("/admin/business-info/status-change", {
    business_info_id: businessInfoId,
    status,
  });
  assertApiSuccess(res.data, "Failed to update business status.");
  const data = asRecord(asRecord(res.data)?.data);
  const businessRaw = data?.business ?? data;
  const parsed = parseBusiness(businessRaw, 0);
  if (!parsed) {
    throw new Error("Could not read business after status update.");
  }
  return parsed;
}

export async function deleteAdminBusiness(businessInfoId: number): Promise<void> {
  const res = await request.post("/admin/business-info/delete", {
    business_info_id: businessInfoId,
  });
  assertApiSuccess(res.data, "Failed to delete business profile.");
}

export type AdminVendorConversationResult = {
  conversationUuid: string;
  vendorUserUuid: string | null;
};

/** Open vendor chat in admin Messages (uses `messages` table). */
export async function startAdminVendorConversation(
  businessInfoId: number,
  message?: string,
): Promise<AdminVendorConversationResult> {
  const res = await request.post("/admin/business-info/message", {
    business_info_id: businessInfoId,
    ...(message?.trim() ? { message: message.trim() } : {}),
  });
  assertApiSuccess(res.data, "Failed to open vendor chat.");
  const data = asRecord(asRecord(res.data)?.data);
  const conversationUuid = pickString(data ?? {}, ["conversation_uuid"], "");
  if (!conversationUuid) {
    throw new Error("Could not start conversation with vendor.");
  }
  const vendorUserUuid = pickString(data ?? {}, ["vendor_user_uuid"], "") || null;

  return { conversationUuid, vendorUserUuid };
}
