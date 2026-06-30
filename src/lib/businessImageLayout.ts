/** Consistent product-style aspect ratio for business cover / gallery thumbnails. */
export const BUSINESS_GALLERY_ASPECT_CLASS = "aspect-[4/3]";

/** Hero banner uses the same ratio with a sensible max height on large screens. */
export const businessPageHero =
  "aspect-[4/3] w-full max-h-[min(540px,72vh)] rounded-[22px] shadow-sm lg:rounded-2xl";

/** Listing card image container (home featured grid). */
export const businessListingImageClass = `${BUSINESS_GALLERY_ASPECT_CLASS} w-full`;
