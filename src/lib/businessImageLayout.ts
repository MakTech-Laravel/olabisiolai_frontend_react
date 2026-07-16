/** Consistent product-style aspect ratio for business cover / gallery thumbnails. */
export const BUSINESS_GALLERY_ASPECT_CLASS = "aspect-[4/3]";

/**
 * Cover/hero frame — keep true 4:3 width-driven sizing.
 * Do not pair with max-height alone: that stretches the box wider than 4:3 on desktop
 * and causes side letterboxing with object-contain.
 */
export const businessPageHeroAspect = "aspect-[4/3] w-full";

export const businessPageHero =
  `${businessPageHeroAspect} rounded-[22px] shadow-sm lg:rounded-2xl`;

/** Listing card image container (home featured grid). */
export const businessListingImageClass = `${BUSINESS_GALLERY_ASPECT_CLASS} w-full`;

/**
 * Catalog product/service cards + detail sheet use the same 4:3 frame
 * (`BusinessCatalogImage` / catalog discovery feed).
 */
export const CATALOG_IMAGE_ASPECT_CLASS = BUSINESS_GALLERY_ASPECT_CLASS;

/**
 * Recommended pixel sizes for vendor graphics (display uses 4:3 with object-cover/contain).
 * Backend does not enforce these dimensions — format + 10MB max only.
 */
export const BUSINESS_COVER_RECOMMENDED_WIDTH = 1600;
export const BUSINESS_COVER_RECOMMENDED_HEIGHT = 1200;
export const BUSINESS_COVER_RECOMMENDED_SIZE = `${BUSINESS_COVER_RECOMMENDED_WIDTH} × ${BUSINESS_COVER_RECOMMENDED_HEIGHT} px`;
export const BUSINESS_COVER_ASPECT_LABEL = "4:3";

export const CATALOG_IMAGE_RECOMMENDED_WIDTH = BUSINESS_COVER_RECOMMENDED_WIDTH;
export const CATALOG_IMAGE_RECOMMENDED_HEIGHT = BUSINESS_COVER_RECOMMENDED_HEIGHT;
export const CATALOG_IMAGE_RECOMMENDED_SIZE = BUSINESS_COVER_RECOMMENDED_SIZE;
export const CATALOG_IMAGE_ASPECT_LABEL = BUSINESS_COVER_ASPECT_LABEL;

export const BUSINESS_LOGO_RECOMMENDED_SIZE = "400 × 400 px";
export const BUSINESS_LOGO_ASPECT_LABEL = "1:1";

export const BUSINESS_COVER_UPLOAD_HINT =
  `Recommended ${BUSINESS_COVER_RECOMMENDED_SIZE} (${BUSINESS_COVER_ASPECT_LABEL}). JPG, PNG, or WebP up to 10MB.`;

export const CATALOG_IMAGE_UPLOAD_HINT =
  `Recommended ${CATALOG_IMAGE_RECOMMENDED_SIZE} (${CATALOG_IMAGE_ASPECT_LABEL}). JPG, PNG, or WebP up to 10MB.`;

export const BUSINESS_LOGO_UPLOAD_HINT =
  `Recommended ${BUSINESS_LOGO_RECOMMENDED_SIZE} (${BUSINESS_LOGO_ASPECT_LABEL}). JPG, PNG, or WebP up to 10MB.`;
