import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Plus, Upload, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCategoryCatalog } from "@/features/categories/useCategoryCatalog";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";
import { VendorProfileLocationSection } from "@/components/sections/vendor/profile/VendorProfileLocationSection";
import {
  BUSINESS_OVERVIEW_MAX_LENGTH,
  clampBusinessOverview,
} from "@/constants/businessOverview";

function Label({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function DashedFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[repeating-linear-gradient(90deg,#d1d5db_0px,#d1d5db_10px,transparent_10px,transparent_18px)] p-[2px]",
        className,
      )}
    >
      <div className="rounded-[10px] bg-neutral-50/95">{children}</div>
    </div>
  );
}

export function BusinessInfoCard() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const {
    profile,
    isEditing,
    draft,
    setDraftField,
    setServices,
    setLogoFile,
    fieldErrors,
  } = useVendorProfileContext();
  const { data: formOptions, isPending, isError } = useVendorBusinessFormOptions();
  const { data: publicCategories = [] } = useCategoryCatalog();
  const categories =
    (formOptions?.categories?.length ?? 0) > 0
      ? (formOptions?.categories ?? [])
      : publicCategories;

  if (!profile) return null;

  const openLogoPicker = () => logoInputRef.current?.click();

  const businessName = isEditing && draft ? draft.businessName : profile.businessName;
  const categoryId = isEditing && draft ? draft.categoryId : String(profile.categoryId);
  const subcategory = isEditing && draft ? draft.subcategory : profile.subcategory;
  const savedCategoryOption = useMemo(() => {
    if (!profile.categoryId || profile.categoryId <= 0) return null;
    const id = String(profile.categoryId);
    if (categories.some((category) => String(category.id) === id)) return null;
    const name = profile.categoryName.trim();
    if (!name) return null;
    return { id, name };
  }, [categories, profile.categoryId, profile.categoryName]);

  const subcategoryOptions = useMemo(() => {
    const category = categories.find((c) => String(c.id) === categoryId);
    return category?.subcategories ?? [];
  }, [categories, categoryId]);

  useEffect(() => {
    if (!isEditing || !draft || subcategoryOptions.length === 0) return;
    if (subcategory && !subcategoryOptions.includes(subcategory)) {
      setDraftField("subcategory", "");
    }
  }, [categoryId, isEditing, draft, subcategory, subcategoryOptions, setDraftField]);

  const showSubcategoryField =
    subcategoryOptions.length > 0 || Boolean(profile.subcategory?.trim());

  const description = isEditing && draft ? draft.description : profile.description;
  const services = isEditing && draft ? draft.services : profile.services;
  const logoPreview = isEditing && draft ? draft.logoPreview : profile.logoUrl;

  return (
    <Card className="h-fit w-full overflow-hidden rounded-xl border-border-light shadow-sm">
      <CardHeader className="space-y-1 border-b border-border-light bg-card px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">Business Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div>
          <Label>Business Name</Label>
          <Input
            value={businessName}
            readOnly={!isEditing}
            onChange={(e) => setDraftField("businessName", e.target.value)}
            className="h-11 border-border-light bg-background text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
          />
          {isEditing && fieldErrors.business_name ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.business_name}</p>
          ) : null}
        </div>

        <div>
          <Label>Category</Label>
          {isEditing ? (
            <select
              value={categoryId}
              onChange={(e) => setDraftField("categoryId", e.target.value)}
              disabled={isPending || isError}
              className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
            >
              <option value="">{isPending ? "Loading…" : "Select category"}</option>
              {savedCategoryOption ? (
                <option value={savedCategoryOption.id}>{savedCategoryOption.name}</option>
              ) : null}
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <Input value={profile.categoryName} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
          )}
          {isEditing && fieldErrors.category_id ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.category_id}</p>
          ) : null}
        </div>

        {showSubcategoryField ? (
          <div>
            <Label>Subcategory</Label>
            {isEditing ? (
              <select
                value={subcategory}
                onChange={(e) => setDraftField("subcategory", e.target.value)}
                className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={profile.subcategory || "—"}
                readOnly
                className="h-11 border-border-light bg-background text-sm shadow-sm"
              />
            )}
            {isEditing && fieldErrors.subcategory ? (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.subcategory}</p>
            ) : null}
          </div>
        ) : null}

        <VendorProfileLocationSection />

        <div>
          <Label>Business Description</Label>
          <Textarea
            value={description}
            readOnly={!isEditing}
            onChange={(e) => setDraftField("description", clampBusinessOverview(e.target.value))}
            rows={5}
            maxLength={isEditing ? BUSINESS_OVERVIEW_MAX_LENGTH : undefined}
            className="min-h-[120px] max-h-56 resize-none border-border-light bg-background text-sm leading-relaxed shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
          />
          {isEditing ? (
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {description.length}/{BUSINESS_OVERVIEW_MAX_LENGTH}
            </p>
          ) : null}
          {isEditing && fieldErrors.business_description ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.business_description}</p>
          ) : null}
        </div>

        <div>
          <Label>Services offered</Label>
          {isEditing && draft ? (
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={`service-${index}`} className="flex gap-2">
                  <Input
                    value={service}
                    onChange={(e) => {
                      const next = [...services];
                      next[index] = e.target.value;
                      setServices(next);
                    }}
                    placeholder="Service name"
                    className="h-10 border-border-light bg-background text-sm"
                  />
                  {services.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setServices(services.filter((_, i) => i !== index))}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => setServices([...services, ""])}
              >
                <Plus className="mr-1 size-4" />
                Add service
              </Button>
              {isEditing && fieldErrors.services ? (
                <p className="text-xs text-destructive">{fieldErrors.services}</p>
              ) : null}
            </div>
          ) : services.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {services.map((service) => (
                <li
                  key={service}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {service}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No services listed.</p>
          )}
        </div>

        <div>
          <Label>Business Logo</Label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              setLogoFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <DashedFrame>
            {isEditing ? (
              <div className="flex min-h-[168px] w-full flex-col items-center justify-center gap-3 px-4 py-8">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 max-w-full rounded-lg object-contain"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg"
                      onClick={openLogoPicker}
                    >
                      Change logo
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openLogoPicker}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] transition-colors hover:bg-neutral-100/60"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-neutral-200/80 text-foreground">
                      <Upload className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">Click to upload logo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex min-h-[168px] w-full flex-col items-center justify-center gap-3 px-4 py-8">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={`${profile.businessName} logo`}
                    className="max-h-32 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="flex size-11 items-center justify-center rounded-full bg-neutral-200/80 text-foreground">
                      <Upload className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm text-muted-foreground">No logo uploaded</span>
                  </>
                )}
              </div>
            )}
          </DashedFrame>
          {isEditing && fieldErrors.logo ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.logo}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
