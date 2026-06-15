import { Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CategoryDto } from "@/features/categories/types";
import type { LocationFilterOption } from "@/features/locations/types";
import {
  findLocationById,
  lgaOptionsForStateCity,
  uniqueCitiesFromCatalog,
  uniqueStatesFromCatalog,
} from "@/features/locations/locationCascadeOptions";
import { cn } from "@/lib/utils";

export type FiltersSectionProps = {
  /** Unique prefix so multiple filter panels on one page do not share radio `name` (breaks selection on mobile). */
  radioGroupId?: string;
  categories: CategoryDto[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  subcategoryOptions: string[];
  selectedSubcategory: string | null;
  onSelectSubcategory: (subcategory: string | null) => void;
  locationOptions: LocationFilterOption[];
  selectedLocationId: number | null;
  onSelectLocation: (id: number | null) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  selectedMinRating: number | null;
  onSelectMinRating: (rating: number | null) => void;
  categoriesLoading?: boolean;
  /** Drawer/mobile panel — drop sticky card chrome for narrow screens. */
  layout?: "sidebar" | "drawer";
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
  layout = "sidebar",
}: FiltersSectionProps) {
  const size = 24;
  const catName = `${radioGroupId}-category`;
  const locName = `${radioGroupId}-location`;
  const ratingName = `${radioGroupId}-rating`;
  const [categorySearch, setCategorySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const selectedLocation = useMemo(
    () => findLocationById(locationOptions, selectedLocationId),
    [locationOptions, selectedLocationId],
  );

  useEffect(() => {
    if (selectedLocation) {
      setSelectedState(selectedLocation.stateName);
      setSelectedCity(selectedLocation.cityName);
      return;
    }
    if (selectedLocationId === null) {
      setSelectedState("");
      setSelectedCity("");
    }
  }, [selectedLocation, selectedLocationId]);

  const stateOptions = useMemo(
    () => uniqueStatesFromCatalog(locationOptions),
    [locationOptions],
  );

  const cityOptions = useMemo(
    () => uniqueCitiesFromCatalog(locationOptions, selectedState),
    [locationOptions, selectedState],
  );

  const lgaOptions = useMemo(() => {
    const entries = lgaOptionsForStateCity(locationOptions, selectedState, selectedCity);
    const query = locationSearch.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.lgaName.toLowerCase().includes(query) ||
        entry.label.toLowerCase().includes(query),
    );
  }, [locationOptions, selectedState, selectedCity, locationSearch]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  return (
    <div
      className={cn(
        layout === "drawer"
          ? "bg-transparent p-0 shadow-none"
          : "sticky top-16 rounded-lg bg-card p-4 sm:top-20 sm:p-6 lg:p-8",
      )}
    >
      <h2 className="mb-4 text-xl font-inter font-bold text-text-primary sm:mb-6 sm:text-2xl">
        Filters
      </h2>

      {/* Search */}
      <div className="mb-5 sm:mb-6">
        <h3 className="mb-2 font-inter text-sm font-semibold text-text-primary sm:mb-3 sm:text-base">
          Search
        </h3>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search business name..."
          aria-label="Search businesses"
          className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
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
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="w-full min-w-0 rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto overscroll-contain pr-1">
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
            {filteredCategories.length === 0 ? (
              <p className="py-2 text-sm text-text-secondary">No categories match your search.</p>
            ) : (
              filteredCategories.map((category) => (
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
            ))
            )}
            </div>
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

        <div className="space-y-3">
          <div>
            <label htmlFor={`${radioGroupId}-filter-state`} className="mb-1.5 block text-sm font-medium text-text-primary">
              State
            </label>
            <select
              id={`${radioGroupId}-filter-state`}
              value={selectedState}
              onChange={(event) => {
                const nextState = event.target.value;
                setSelectedState(nextState);
                setSelectedCity("");
                onSelectLocation(null);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="">All states</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {selectedState ? (
            <div>
              <label htmlFor={`${radioGroupId}-filter-city`} className="mb-1.5 block text-sm font-medium text-text-primary">
                City
              </label>
              <select
                id={`${radioGroupId}-filter-city`}
                value={selectedCity}
                onChange={(event) => {
                  setSelectedCity(event.target.value);
                  onSelectLocation(null);
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="">All cities</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selectedState && selectedCity ? (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  placeholder="Search LGA..."
                  aria-label="Search LGA"
                  className="w-full min-w-0 rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <label className="flex cursor-pointer items-center">
                <input
                  type="radio"
                  name={locName}
                  className="mr-2 accent-primary"
                  checked={selectedLocationId === null}
                  onChange={() => onSelectLocation(null)}
                />
                <span className="text-text-secondary">All areas in {selectedCity}</span>
              </label>

              <div className="max-h-52 space-y-2 overflow-y-auto overscroll-contain pr-1">
                {lgaOptions.length === 0 ? (
                  <p className="py-2 text-sm text-text-secondary">No areas match your search.</p>
                ) : (
                  lgaOptions.map((location) => (
                    <label key={location.id} className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name={locName}
                        className="mr-2 accent-primary"
                        checked={selectedLocationId === location.id}
                        onChange={() => onSelectLocation(location.id)}
                      />
                      <span className="text-sm text-text-secondary">
                        {location.lgaName || location.label}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </>
          ) : null}
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
