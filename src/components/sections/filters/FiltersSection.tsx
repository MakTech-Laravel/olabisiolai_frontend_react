import { Star } from "lucide-react";

import type { CategoryDto } from "@/features/categories/types";

export type FiltersSectionProps = {
  /** Unique prefix so multiple filter panels on one page do not share radio `name` (breaks selection on mobile). */
  radioGroupId?: string;
  categories: CategoryDto[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  subcategoryOptions: string[];
  selectedSubcategory: string | null;
  onSelectSubcategory: (subcategory: string | null) => void;
  locationOptions: Array<{ id: number; label: string }>;
  selectedLocationId: number | null;
  onSelectLocation: (id: number | null) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  selectedMinRating: number | null;
  onSelectMinRating: (rating: number | null) => void;
  categoriesLoading?: boolean;
};

export default function FiltersSection({
  radioGroupId = "filters",
  categories,
  selectedCategoryId,
  onSelectCategory,
  subcategoryOptions,
  selectedSubcategory,
  onSelectSubcategory,
  locationOptions,
  selectedLocationId,
  onSelectLocation,
  searchTerm,
  onSearchTermChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  selectedMinRating,
  onSelectMinRating,
  categoriesLoading,
}: FiltersSectionProps) {
  const size = 24;
  const catName = `${radioGroupId}-category`;
  const locName = `${radioGroupId}-location`;
  const ratingName = `${radioGroupId}-rating`;

  return (
    <div className="bg-card p-8 rounded-lg  sticky top-20">
      <h2 className="text-2xl font-inter font-bold text-text-primary mb-6">
        Filters
      </h2>

      {/* Search */}
      <div className="mb-6">
        <h3 className="font-inter font-semibold text-text-primary mb-3">
          Search
        </h3>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search business name..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      {/* Verified Only Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-2 bg-muted rounded-md shadow-md">
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="12" fill={verifiedOnly ? "#1A73E8" : "#9CA3AF"} />
            {verifiedOnly ? (
              <path
                d="M7 12.5l3 3 7-7"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>

          <span
            className={`text-sm font-medium ${verifiedOnly ? "text-primary" : "text-text-secondary"}`}
          >
            Verified Only
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={verifiedOnly}
              onChange={(event) => onVerifiedOnlyChange(event.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Category Section — list from API (`CategoryDto[]`) */}
      <div className="mb-8">
        <h3 className="font-inter font-semibold text-text-primary mb-3">
          Category
        </h3>
        {categoriesLoading ? (
          <p className="text-sm text-text-secondary">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-text-secondary">No categories available.</p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={catName}
                className="mr-2 accent-primary"
                checked={selectedCategoryId === null}
                onChange={() => onSelectCategory(null)}
              />
              <span className="text-text-secondary">All</span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={catName}
                  className="mr-2 accent-primary"
                  checked={selectedCategoryId === category.id}
                  onChange={() => onSelectCategory(category.id)}
                />
                <span className="text-text-secondary">{category.name}</span>
              </label>
            ))}
          </div>
        )}
        {selectedCategoryId !== null && subcategoryOptions.length > 0 ? (
          <div className="mt-4">
            <label
              htmlFor={`${radioGroupId}-subcategory`}
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Subcategory
            </label>
            <select
              id={`${radioGroupId}-subcategory`}
              value={selectedSubcategory ?? ""}
              onChange={(event) => {
                const value = event.target.value.trim();
                onSelectSubcategory(value === "" ? null : value);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="">All subcategories</option>
              {subcategoryOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {/* Location Section */}
      <div className="mb-6">
        <h3 className="font-inter font-semibold text-text-primary mb-3">
          Location
        </h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name={locName}
              className="mr-2 accent-primary"
              checked={selectedLocationId === null}
              onChange={() => onSelectLocation(null)}
            />
            <span className="text-text-secondary">All locations</span>
          </label>
          {locationOptions.map((location) => (
            <label key={location.id} className="flex items-center">
              <input
                type="radio"
                name={locName}
                className="mr-2 accent-primary"
                checked={selectedLocationId === location.id}
                onChange={() => onSelectLocation(location.id)}
              />
              <span className="text-text-secondary">{location.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="mb-6">
        <h3 className="font-inter font-semibold text-text-primary mb-3">
          Ratings & Reviews
        </h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              name={ratingName}
              className="mr-2 accent-primary"
              checked={selectedMinRating === null}
              onChange={() => onSelectMinRating(null)}
            />
            <span className="text-text-secondary">All ratings</span>
          </div>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center">
              <input
                type="radio"
                name={ratingName}
                className="mr-2 accent-primary"
                checked={selectedMinRating === rating}
                onChange={() => onSelectMinRating(rating)}
              />
              <div className="flex items-center mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/40"
                    }
                  />
                ))}
              </div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${rating * 20}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
