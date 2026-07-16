import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { BusinessHoursEditor } from "@/components/business/BusinessHoursEditor";
import { SocialAccountsEditor } from "@/components/business/SocialAccountsEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BUSINESS_COVER_UPLOAD_HINT,
  BUSINESS_LOGO_UPLOAD_HINT,
} from "@/lib/businessImageLayout";
import {
  businessCreateRequiresPayment,
  createVendorBusiness,
  isPremiumPlanSelected,
} from "@/features/business/vendorBusinessApi";
import { fetchVendorOnboardingStatus } from "@/features/subscription/vendorOnboardingApi";
import { buildVendorPremiumInfoPath } from "@/hooks/useVendorSubscriptionAccess";
import { clearBoostCheckoutSelection, saveBoostCheckoutSelection } from "@/features/boost/boostCheckoutSession";
import { DynamicBoostSelectionFields } from "@/components/sections/vendor/boost/DynamicBoostSelectionFields";
import {
  clampBoostBudget,
  computeBoostTotal,
  DYNAMIC_BOOST_TIER_KEY,
  type DynamicBoostDuration,
} from "@/features/boost/dynamicBoostConfig";
import {
  BUSINESS_OVERVIEW_MAX_LENGTH,
  clampBusinessOverview,
} from "@/constants/businessOverview";
import { LocationCascadeSelects } from "@/components/locations/LocationCascadeSelects";
import {
  cloneBusinessHours,
  defaultBusinessHours,
  validateBusinessHours,
} from "@/features/business/businessHours";
import { useAuth } from "@/auth/useAuth";
import { formatPhoneDisplay } from "@/lib/whatsappUrl";
import {
  normalizeSocialAccount,
  type SocialAccount,
  validateSocialAccounts,
} from "@/features/business/socialAccounts";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import {
  locationEntryForStateLgaCity,
  parseVendorLocationOptions,
  uniqueLocationCitiesForStateLga,
  uniqueLocationLgas,
  uniqueLocationStates,
} from "@/features/locations/vendorLocationOptions";

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function FieldErrorText({ message, id }: { message?: string | null; id?: string }) {
  if (!message?.trim()) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-destructive" role="alert">
      {message.trim()}
    </p>
  );
}

function SelectField({
  label,
  children,
  className,
  rightIcon: RightIcon,
  value,
  onChange,
  disabled,
  required,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  rightIcon?: LucideIcon;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  required?: boolean;
}) {
  const Extra = RightIcon;
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={cn(
            "relative z-[1] h-11 w-full cursor-pointer appearance-none rounded-md border border-border-light bg-secondary/80 px-3 pr-10 text-sm text-foreground shadow-sm transition-shadow",
            Extra && "pr-12",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25",
            disabled && "cursor-not-allowed opacity-70",
          )}
        >
          {children}
        </select>
        {Extra ? (
          <Extra
            className="pointer-events-none absolute right-9 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        ) : null}
        <ChevronRight
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}

function DashedUpload({
  id,
  accept,
  helper,
  subhelper,
  minHeight,
  multiple,
  onChange,
  preview,
}: {
  id: string;
  accept: string;
  helper: string;
  subhelper: string;
  minHeight?: string;
  multiple?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  preview?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[repeating-linear-gradient(90deg,#d1d5db_0px,#d1d5db_10px,transparent_10px,transparent_18px)] p-[2px]",
      )}
    >
      <div
        className={cn(
          "rounded-[10px] bg-neutral-50/95",
          minHeight ?? "min-h-[168px]",
        )}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          multiple={multiple}
          onChange={onChange}
        />
        {preview ? (
          <div className="h-full w-full">{preview}</div>
        ) : (
          <label
            htmlFor={id}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-10 transition-colors hover:bg-neutral-100/60"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-neutral-200/80 text-foreground">
              <Upload className="size-5" aria-hidden />
            </span>
            <span className="text-center text-sm font-semibold text-foreground font-inter">
              {helper}
            </span>
            <span className="text-center text-xs text-muted-foreground font-inter">
              {subhelper}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

export default function ChoosePlanForm() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const { data: formOptions, isPending: formOptionsLoading, isError: formOptionsError } =
    useVendorBusinessFormOptions();
  const categories = formOptions?.categories ?? [];
  const parsedLocations = useMemo(() => parseVendorLocationOptions(formOptions?.locations), [formOptions?.locations]);
  const allStates = useMemo(() => uniqueLocationStates(parsedLocations), [parsedLocations]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [locationId, setLocationId] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [city, setCity] = useState("");
  const [includeBoost, setIncludeBoost] = useState(false);
  const [boostDurationDays, setBoostDurationDays] = useState<DynamicBoostDuration>(3);
  const [boostBudgetAmount, setBoostBudgetAmount] = useState(1500);
  const [services, setServices] = useState<string[]>([""]);
  const [logo, setLogo] = useState<File | null>(null);
  const [coverPhotos, setCoverPhotos] = useState<File[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [phone, setPhone] = useState("");
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrls, setCoverPreviewUrls] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Server or client validation messages keyed by API field name (e.g. location_id, services). */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const showLocationSection = true;
  const lgasForState = useMemo(
    () => uniqueLocationLgas(parsedLocations, state),
    [parsedLocations, state],
  );
  const citiesForStateLga = useMemo(
    () => uniqueLocationCitiesForStateLga(parsedLocations, state, lga),
    [parsedLocations, state, lga],
  );

  const addService = () => setServices((s) => [...s, ""]);
  const setServiceAt = (index: number, value: string) =>
    setServices((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  const selectedCategory = useMemo(
    () => categories.find((entry) => String(entry.id) === categoryId) ?? null,
    [categories, categoryId],
  );
  const subcategoryOptions = selectedCategory?.subcategories ?? [];
  const selectedLocation = useMemo(
    () => parsedLocations.find((entry) => entry.id === locationId) ?? null,
    [locationId, parsedLocations],
  );
  const stateOptions = allStates;
  const lgaOptions = lgasForState;
  const cityOptions = citiesForStateLga;
  const premiumSelected = isPremiumPlanSelected();

  const orphanFieldErrorSummary = useMemo(() => {
    const parts = Object.entries(fieldErrors)
      .filter(([key]) => !VENDOR_FORM_INLINE_ERROR_KEYS.has(key))
      .map(([, msg]) => msg.trim())
      .filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(" ");
  }, [fieldErrors]);

  useEffect(() => {
    setSubcategory("");
  }, [categoryId]);

  useEffect(() => {
    if (!user?.phone) {
      void refreshSession();
    }
  }, [refreshSession, user?.phone]);

  useEffect(() => {
    const registeredPhone = typeof user?.phone === "string" ? user.phone.trim() : "";
    if (!registeredPhone) return;

    setPhone((current) => current || formatPhoneDisplay(registeredPhone));
  }, [user?.phone]);

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }
    setState(selectedLocation.state);
    setLga(selectedLocation.lga);
    setCity(selectedLocation.city);
  }, [selectedLocation?.id]);

  useEffect(() => {
    if (!state) {
      setLga("");
      setCity("");
      setLocationId("");
      return;
    }
    if (lga && !lgasForState.includes(lga)) {
      setLga("");
      setCity("");
      setLocationId("");
      return;
    }
    if (city && !citiesForStateLga.includes(city)) {
      setCity("");
      setLocationId("");
    }
  }, [state, lga, city, lgasForState, citiesForStateLga]);

  useEffect(() => {
    if (!logo) {
      setLogoPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(logo);
    setLogoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [logo]);

  useEffect(() => {
    const urls = coverPhotos.map((file) => URL.createObjectURL(file));
    setCoverPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPhotos]);

  const queryClient = useQueryClient();

  const createBusinessMutation = useMutation({
    mutationFn: createVendorBusiness,
    onSuccess: (response) => {
      const requiresPayment = businessCreateRequiresPayment(response);

      localStorage.setItem("vendorBusinessCreated", "true");
      void queryClient.invalidateQueries({ queryKey: ["vendor", "business", "profile"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "subscription", "status"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "onboarding", "status"] });

      if (requiresPayment) {
        void fetchVendorOnboardingStatus().then((status) => {
          navigate(buildVendorPremiumInfoPath(status.business_id), { replace: true });
        });
        return;
      }

      navigate("/user/profile", { replace: true });
    },
    onError: (error: unknown) => {
      clearBoostCheckoutSelection();
      const parsed = parseVendorBusinessApiFailure(error);
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.general);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    const normalizedServices = services.map((service) => service.trim()).filter(Boolean);

    const resolvedLga = showLocationSection ? (selectedLocation?.lga ?? lga).trim() : "";
    if (!categoryId && !locationId) {
      setFieldErrors({
        category_id: "Please select a category.",
        location_id: "Please select a location.",
      });
      return;
    }
    if (!categoryId) {
      setFieldErrors({ category_id: "Please select a category." });
      return;
    }
    if (subcategoryOptions.length > 0 && !subcategory.trim()) {
      setFieldErrors({ subcategory: "Please select a subcategory." });
      return;
    }
    if (!locationId) {
      setFieldErrors({ location_id: "Please select a location." });
      return;
    }
    if (showLocationSection && (!state || !lga || !city)) {
      setFieldErrors({
        location_id: "Please complete location details (state, LGA, and city).",
      });
      return;
    }
    if (normalizedServices.length === 0) {
      setFieldErrors({ services: "Please add at least one service." });
      return;
    }

    const hourErrors = validateBusinessHours(businessHours);
    if (Object.keys(hourErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...hourErrors }));
      return;
    }

    const activeSocialAccounts = socialAccounts
      .map((account) => normalizeSocialAccount(account))
      .filter((account) => account.url);
    const socialError = validateSocialAccounts(activeSocialAccounts);
    if (socialError) {
      setFieldErrors({ social_accounts: socialError });
      return;
    }

    if (includeBoost && premiumSelected) {
      if (!selectedLocation) {
        setFieldErrors({ boost_duration: "Select a location before adding boost." });
        return;
      }
    }

    const boostDaily = clampBoostBudget(boostBudgetAmount);
    const boostCheckout =
      includeBoost && premiumSelected && selectedLocation
        ? {
          locationId: selectedLocation.id,
          locationLabel: selectedLocation.label,
          tierKey: DYNAMIC_BOOST_TIER_KEY,
          tierLabel: "Dynamic Boost",
          durationDays: boostDurationDays,
          amount: computeBoostTotal(boostDaily, boostDurationDays),
          budgetAmount: boostDaily,
        }
        : null;

    if (boostCheckout && premiumSelected) {
      saveBoostCheckoutSelection(boostCheckout, { bundledWithPremium: true });
    } else {
      clearBoostCheckoutSelection();
    }

    createBusinessMutation.mutate({
      subscription_plan: isPremiumPlanSelected() ? "premium" : "free",
      category_id: categoryId,
      subcategory: subcategory.trim() || undefined,
      location_id: locationId,
      business_name: String(formData.get("businessName") ?? ""),
      location: selectedLocation?.location ?? "",
      state: showLocationSection ? state : "",
      city: showLocationSection ? city : "",
      lga: resolvedLga,
      full_address: showLocationSection ? String(formData.get("fullAddress") ?? "") : "",
      business_description: clampBusinessOverview(String(formData.get("description") ?? "")),
      services: normalizedServices,
      phone: phone.trim(),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      website: String(formData.get("website") ?? ""),
      social_accounts: activeSocialAccounts,
      logo,
      cover_photos: coverPhotos,
      business_hours: cloneBusinessHours(businessHours),
    });
  };

  return (
    <form className="mx-auto max-w-3xl space-y-5 pb-8" onSubmit={handleSubmit}>
      <div className="overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground shadow-sm md:px-10 md:py-10">
        <h1 className="text-2xl font-bold tracking-tight font-manrope md:text-3xl">
          Reach more customers
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 font-inter md:text-base">
          Create your free business profile and start connecting with customers
          across Nigeria. Get verified for more trust!
        </p>
      </div>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Basic information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div>
            <Label>
              Business name <span className="text-destructive">*</span>
            </Label>
            <Input
              name="businessName"
              placeholder="e.g. Swift Plumbing Services"
              className="h-11 border-border-light bg-secondary/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              required
              aria-invalid={Boolean(fieldErrors.business_name)}
              aria-describedby={fieldErrors.business_name ? "err-business_name" : undefined}
            />
            <FieldErrorText id="err-business_name" message={fieldErrors.business_name} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <SelectField
                label={
                  <>
                    Category <span className="text-destructive">*</span>
                  </>
                }
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.category_id;
                    return next;
                  });
                }}
                disabled={formOptionsLoading || categories.length === 0}
                required
              >
                <option value="">
                  {formOptionsLoading
                    ? "Loading categoriesâ€¦"
                    : formOptionsError
                      ? "Categories unavailable"
                      : "Select category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              {formOptionsError ? (
                <p className="text-xs text-destructive">
                  Form options failed to load. Try again or contact support if this continues.
                </p>
              ) : null}
              <FieldErrorText id="err-category_id" message={fieldErrors.category_id} />
            </div>

            {subcategoryOptions.length > 0 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <SelectField
                  label={
                    <>
                      Subcategory <span className="text-destructive">*</span>
                    </>
                  }
                  value={subcategory}
                  onChange={(e) => {
                    setSubcategory(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.subcategory;
                      return next;
                    });
                  }}
                  disabled={!categoryId}
                  required
                >
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </SelectField>
                <FieldErrorText id="err-subcategory" message={fieldErrors.subcategory} />
              </div>
            ) : null}

          </div>

          <div>
            <Label>Street address</Label>
            <Textarea
              name="fullAddress"
              placeholder="Street name and number, building name, landmark…"
              rows={2}
              className="min-h-[72px] resize-y border-border-light bg-secondary/80 text-sm leading-relaxed shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
            />
          </div>

          <LocationCascadeSelects
            state={state}
            lga={lga}
            city={city}
            states={stateOptions}
            lgas={lgaOptions}
            cities={cityOptions}
            disabled={formOptionsLoading}
            stateLoading={formOptionsLoading}
            onStateChange={(nextState) => {
              setState(nextState);
              setLga("");
              setCity("");
              setLocationId("");
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.location_id;
                delete next.lga;
                return next;
              });
            }}
            onLgaChange={(nextLga) => {
              setLga(nextLga);
              const nextCities = uniqueLocationCitiesForStateLga(parsedLocations, state, nextLga);
              const nextCity = nextCities.length === 1 ? nextCities[0] : "";
              setCity(nextCity);
              const nextEntry = locationEntryForStateLgaCity(parsedLocations, state, nextLga, nextCity);
              setLocationId(nextEntry?.id ?? "");
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.location_id;
                delete next.lga;
                return next;
              });
            }}
            onCityChange={(nextCity) => {
              setCity(nextCity);
              const nextEntry = locationEntryForStateLgaCity(parsedLocations, state, lga, nextCity);
              setLocationId(nextEntry?.id ?? "");
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.location_id;
                delete next.lga;
                return next;
              });
            }}
          />
          <FieldErrorText id="err-location_id" message={fieldErrors.location_id} />
          <FieldErrorText id="err-lga" message={fieldErrors.lga} />

          {selectedLocation && premiumSelected ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <p className="text-xs text-muted-foreground">
                {selectedLocation.state} / {selectedLocation.lga} / {selectedLocation.city}
              </p>

              <DynamicBoostSelectionFields
                className="mt-4"
                includeBoost={includeBoost}
                onIncludeBoostChange={setIncludeBoost}
                durationDays={boostDurationDays}
                budgetAmount={boostBudgetAmount}
                onDurationChange={setBoostDurationDays}
                onBudgetChange={setBoostBudgetAmount}
              />

              <FieldErrorText id="err-boost_duration" message={fieldErrors.boost_duration} />
            </div>
          ) : null}

          <div>
            <Label>
              Business description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              name="description"
              placeholder="Describe your business in up to 150 characters..."
              rows={4}
              maxLength={BUSINESS_OVERVIEW_MAX_LENGTH}
              className="min-h-[100px] resize-y border-border-light bg-secondary/80 text-sm leading-relaxed shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              required
              aria-invalid={Boolean(fieldErrors.business_description)}
              aria-describedby={fieldErrors.business_description ? "err-business_description" : undefined}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              Max {BUSINESS_OVERVIEW_MAX_LENGTH} characters
            </p>
            <FieldErrorText id="err-business_description" message={fieldErrors.business_description} />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Services offered <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <FieldErrorText id="err-services" message={fieldErrors.services} />
          {services.map((value, index) => (
            <div key={index}>
              <Label>{`Service ${index + 1}`}</Label>
              <Input
                value={value}
                onChange={(e) => setServiceAt(index, e.target.value)}
                placeholder={`Service ${index + 1}`}
                className="h-11 border-border-light bg-secondary/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-border font-inter"
            onClick={addService}
          >
            <Plus className="size-4" aria-hidden />
            Add another service
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Contact details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-3">
            <div>
              <Label>
                Phone number <span className="text-destructive">*</span>
              </Label>
              <Input
                type="tel"
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+234 800 123 4567"
                className="h-11 border-border-light bg-secondary/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                required
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
              />
              <FieldErrorText id="err-phone" message={fieldErrors.phone} />
            </div>
            <div>
              <Label>WhatsApp number</Label>
              <Input
                type="tel"
                name="whatsapp"
                placeholder="+234 800 123 4567"
                className="h-11 border-border-light bg-secondary/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                aria-invalid={Boolean(fieldErrors.whatsapp)}
                aria-describedby={fieldErrors.whatsapp ? "err-whatsapp" : undefined}
              />
              <FieldErrorText id="err-whatsapp" message={fieldErrors.whatsapp} />
            </div>
            <div>
              <Label>Website (optional)</Label>
              <Input
                type="url"
                name="website"
                placeholder="https://yourbusiness.com"
                className="h-11 border-border-light bg-secondary/80 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                aria-invalid={Boolean(fieldErrors.website)}
                aria-describedby={fieldErrors.website ? "err-website" : undefined}
              />
              <FieldErrorText id="err-website" message={fieldErrors.website} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Social accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SocialAccountsEditor
            accounts={socialAccounts}
            onChange={setSocialAccounts}
            error={fieldErrors.social_accounts}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Business logo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DashedUpload
            id="logo-upload"
            accept="image/jpeg,image/png,image/webp"
            helper="Click to upload photos or drag and drop"
            subhelper={BUSINESS_LOGO_UPLOAD_HINT}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) {
                setLogo(null);
                return;
              }
              if (!isAcceptedImage(file)) {
                setFieldErrors((prev) => ({ ...prev, logo: "Logo must be JPG, PNG, or WebP." }));
                e.currentTarget.value = "";
                setLogo(null);
                return;
              }
              if (!isWithinSizeLimit(file, 10)) {
                setFieldErrors((prev) => ({ ...prev, logo: "Logo must be 10MB or smaller." }));
                e.currentTarget.value = "";
                setLogo(null);
                return;
              }
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.logo;
                return next;
              });
              setSubmitError(null);
              setLogo(file);
            }}
            preview={
              logoPreviewUrl ? (
                <div className="relative h-full min-h-[168px] w-full overflow-hidden rounded-[10px]">
                  <img src={logoPreviewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-2">
                    <p className="max-w-[75%] truncate text-xs text-white">{logo?.name}</p>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer rounded bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLogo(null);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.logo;
                            return next;
                          });
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                        aria-label="Remove logo"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : undefined
            }
          />
          <FieldErrorText id="err-logo" message={fieldErrors.logo} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardHeader className="border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">
            Business cover photos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DashedUpload
            id="cover-upload"
            accept="image/jpeg,image/png,image/webp"
            helper="Click to upload photos or drag and drop"
            subhelper={`${BUSINESS_COVER_UPLOAD_HINT} Max 5 photos.`}
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 5) {
                setFieldErrors((prev) => ({
                  ...prev,
                  cover_photos: "You can upload up to 5 cover photos.",
                }));
                setCoverPhotos(files.slice(0, 5));
                return;
              }
              const hasBadType = files.some((file) => !isAcceptedImage(file));
              if (hasBadType) {
                setFieldErrors((prev) => ({
                  ...prev,
                  cover_photos: "Cover photos must be JPG, PNG, or WebP.",
                }));
                e.currentTarget.value = "";
                setCoverPhotos([]);
                return;
              }
              const hasBigFile = files.some((file) => !isWithinSizeLimit(file, 10));
              if (hasBigFile) {
                setFieldErrors((prev) => ({
                  ...prev,
                  cover_photos: "Each cover photo must be 10MB or smaller.",
                }));
                e.currentTarget.value = "";
                setCoverPhotos([]);
                return;
              }
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.cover_photos;
                return next;
              });
              setSubmitError(null);
              setCoverPhotos(files);
            }}
            preview={
              coverPhotos.length > 0 ? (
                <div className="h-full min-h-[168px] space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{coverPhotos.length} file(s) selected</p>
                    <label
                      htmlFor="cover-upload"
                      className="cursor-pointer rounded border border-border-light bg-background px-2 py-1 text-xs text-foreground hover:bg-neutral-100"
                    >
                      Add/Change
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {coverPhotos.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-border-light">
                        <img
                          src={coverPreviewUrls[index]}
                          alt={`Cover preview ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCoverPhotos((prev) => prev.filter((_, prevIndex) => prevIndex !== index))
                          }
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                          aria-label={`Remove cover photo ${index + 1}`}
                        >
                          <X className="size-4" />
                        </button>
                        <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : undefined
            }
          />
          <FieldErrorText id="err-cover_photos" message={fieldErrors.cover_photos} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
        <CardContent className="p-6 md:p-8">
          <BusinessHoursEditor
            hours={businessHours}
            errors={fieldErrors}
            onChange={setBusinessHours}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border-sky-100/80 bg-sky-50/60 shadow-sm">
        <CardContent className="space-y-6 p-6 md:p-8">
          <p className="text-sm leading-relaxed text-foreground font-inter md:text-base">
            Your business will appear as{" "}
            <span className="font-semibold">Unverified</span> until you complete
            the verification process. Verified businesses get{" "}
            <span className="font-semibold text-success">
              3x more visibility!
            </span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {submitError || orphanFieldErrorSummary ? (
              <p className="text-sm text-destructive sm:mr-auto">
                {[submitError, orphanFieldErrorSummary].filter(Boolean).join(" ")}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="border-border bg-card font-inter sm:min-w-[120px]"
              onClick={() => navigate("/user/profile")}
              disabled={createBusinessMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBusinessMutation.isPending}>
              {createBusinessMutation.isPending ? "Creating..." : "Create business profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

/** API / client keys for which we render an inline message next to the control. */
const VENDOR_FORM_INLINE_ERROR_KEYS = new Set([
  "business_name",
  "category_id",
  "subcategory",
  "location_id",
  "lga",
  "business_description",
  "services",
  "phone",
  "whatsapp",
  "website",
  "social_accounts",
  "logo",
  "cover_photos",
  "boost_tier",
  "boost_duration",
]);

function parseVendorBusinessApiFailure(error: unknown): {
  fieldErrors: Record<string, string>;
  general: string | null;
} {
  const data = getAxiosResponseData(error);
  if (!data) {
    return { fieldErrors: {}, general: getMessageFromUnknown(error) };
  }

  const fieldErrors = extractLaravelValidationErrors(data);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, general: null };
  }

  const msg =
    typeof data.message === "string" && data.message.trim() ? data.message.trim() : null;
  return { fieldErrors: {}, general: msg ?? getMessageFromUnknown(error) };
}

function getAxiosResponseData(error: unknown): Record<string, unknown> | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    !Array.isArray(error.response.data)
  ) {
    return error.response.data as Record<string, unknown>;
  }
  return null;
}

function firstValidationMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

function extractLaravelValidationErrors(payload: Record<string, unknown>): Record<string, string> {
  let raw: unknown = payload.errors;
  if (
    (!raw || typeof raw !== "object" || Array.isArray(raw)) &&
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    const inner = (payload.data as Record<string, unknown>).errors;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      raw = inner;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const msg = firstValidationMessage(val);
    if (!msg) continue;

    if (key.startsWith("services.")) {
      if (!out.services) out.services = msg;
      continue;
    }
    if (key.startsWith("cover_photos.")) {
      if (!out.cover_photos) out.cover_photos = msg;
      continue;
    }
    out[key] = msg;
  }
  return out;
}

function getMessageFromUnknown(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Could not create business profile.";
}

function isAcceptedImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function isWithinSizeLimit(file: File, maxMb: number): boolean {
  return file.size <= maxMb * 1024 * 1024;
}
