import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type VendorBusinessProfile,
} from "@/features/business/vendorBusinessProfileApi";
import { updateVendorBusiness } from "@/features/business/vendorBusinessApi";
import { validateBusinessHours } from "@/features/business/businessHours";
import { normalizeSocialUrl, validateSocialAccounts } from "@/features/business/socialAccounts";
import { parseVendorBusinessApiFailure } from "@/features/business/vendorBusinessFormErrors";
import {
  profileToDraft,
  totalCoverCount,
  type VendorProfileDraft,
} from "@/features/business/vendorProfileDraft";
import { parseVendorLocationOptions } from "@/features/locations/vendorLocationOptions";
import { useCategoryCatalog } from "@/features/categories/useCategoryCatalog";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import type { UseQueryResult } from "@tanstack/react-query";
import { useVendorBusinessProfile } from "@/features/business/useVendorBusinessProfile";

type VendorProfileContextValue = {
  profile: VendorBusinessProfile | undefined;
  query: UseQueryResult<VendorBusinessProfile, Error>;
  isNotFound: boolean;
  isEditing: boolean;
  draft: VendorProfileDraft | null;
  fieldErrors: Record<string, string>;
  saveError: string | null;
  isSaving: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  saveProfile: () => void;
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
  setDraftField: <K extends keyof VendorProfileDraft>(key: K, value: VendorProfileDraft[K]) => void;
  addCoverFiles: (files: File[]) => void;
  removeExistingCover: (index: number) => void;
  removeNewCover: (index: number) => void;
  setLogoFile: (file: File | null) => void;
  setServices: (services: string[]) => void;
};

const VendorProfileContext = createContext<VendorProfileContextValue | null>(null);

export function useVendorProfileContext(): VendorProfileContextValue {
  const ctx = useContext(VendorProfileContext);
  if (!ctx) {
    throw new Error("useVendorProfileContext must be used within VendorProfileProvider");
  }
  return ctx;
}

function ProfileShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:px-8">{children}</div>
  );
}

const MAX_COVER_PHOTOS = 5;

export function VendorProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useVendorBusinessProfile();
  const { data: formOptions } = useVendorBusinessFormOptions();
  const { data: publicCategories = [] } = useCategoryCatalog();
  const categoryCatalog =
    (formOptions?.categories?.length ?? 0) > 0
      ? (formOptions?.categories ?? [])
      : publicCategories;
  const parsedLocations = useMemo(
    () => parseVendorLocationOptions(formOptions?.locations),
    [formOptions?.locations],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<VendorProfileDraft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const isNotFound =
    query.isError &&
    (query.error?.name === "VendorBusinessNotFoundError" ||
      /no business profile/i.test(query.error?.message ?? ""));

  const startEditing = useCallback(() => {
    if (!query.data) return;
    const profile = query.data;
    let nextDraft = profileToDraft(profile);

    if (!nextDraft.categoryId && profile.categoryName && categoryCatalog.length > 0) {
      const match = categoryCatalog.find(
        (category) =>
          category.name.trim().toLowerCase() === profile.categoryName.trim().toLowerCase(),
      );
      if (match) {
        nextDraft = { ...nextDraft, categoryId: String(match.id) };
      }
    }

    if (!nextDraft.locationId && parsedLocations.length > 0) {
      const stateKey = profile.state.trim().toLowerCase();
      const cityKey = profile.city.trim().toLowerCase();
      const lgaKey = profile.lga.trim().toLowerCase();
      const match = parsedLocations.find(
        (location) =>
          location.state.trim().toLowerCase() === stateKey &&
          location.city.trim().toLowerCase() === cityKey &&
          location.lga.trim().toLowerCase() === lgaKey,
      );
      if (match) {
        nextDraft = { ...nextDraft, locationId: match.id };
      }
    }

    setDraft(nextDraft);
    setFieldErrors({});
    setSaveError(null);
    setIsEditing(true);
  }, [categoryCatalog, parsedLocations, query.data]);

  const cancelEditing = useCallback(() => {
    setDraft((prev) => {
      if (prev) {
        prev.newCoverPreviews.forEach((url) => URL.revokeObjectURL(url));
        if (prev.logoFile && prev.logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(prev.logoPreview);
        }
      }
      return null;
    });
    setIsEditing(false);
    setFieldErrors({});
    setSaveError(null);
  }, []);

  const updateDraft = useCallback((patch: Partial<VendorProfileDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const setDraftField = useCallback(<K extends keyof VendorProfileDraft>(key: K, value: VendorProfileDraft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const setLogoFile = useCallback((file: File | null) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (prev.logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(prev.logoPreview);
      }
      const logoPreview = file ? URL.createObjectURL(file) : query.data?.logoUrl ?? "";
      return { ...prev, logoFile: file, logoPreview };
    });
  }, [query.data?.logoUrl]);

  const addCoverFiles = useCallback((files: File[]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const room = MAX_COVER_PHOTOS - totalCoverCount(prev);
      if (room <= 0) return prev;
      const accepted = files.slice(0, room);
      const previews = accepted.map((f) => URL.createObjectURL(f));
      return {
        ...prev,
        newCoverFiles: [...prev.newCoverFiles, ...accepted],
        newCoverPreviews: [...prev.newCoverPreviews, ...previews],
      };
    });
  }, []);

  const removeExistingCover = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        existingCoverUrls: prev.existingCoverUrls.filter((_, i) => i !== index),
      };
    });
  }, []);

  const removeNewCover = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const url = prev.newCoverPreviews[index];
      if (url) URL.revokeObjectURL(url);
      return {
        ...prev,
        newCoverFiles: prev.newCoverFiles.filter((_, i) => i !== index),
        newCoverPreviews: prev.newCoverPreviews.filter((_, i) => i !== index),
      };
    });
  }, []);

  const setServices = useCallback((services: string[]) => {
    setDraftField("services", services);
  }, [setDraftField]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nothing to save.");
      const services = draft.services.map((s) => s.trim()).filter(Boolean);
      if (!draft.businessName.trim()) throw new Error("Business name is required.");
      if (!draft.categoryId) throw new Error("Please select a category.");
      if (!draft.locationId) throw new Error("Please select a location.");
      if (!draft.description.trim()) throw new Error("Business description is required.");
      if (!draft.phone.trim()) throw new Error("Phone number is required.");
      if (services.length === 0) throw new Error("Please add at least one service.");

      const selectedCategory = categoryCatalog.find(
        (category) => String(category.id) === draft.categoryId,
      );
      if (
        (selectedCategory?.subcategories?.length ?? 0) > 0 &&
        !draft.subcategory.trim()
      ) {
        throw new Error("Please select a subcategory.");
      }

      const hourErrors = validateBusinessHours(draft.businessHours);
      if (Object.keys(hourErrors).length > 0) {
        const err = new Error("Please fix business hours.");
        (err as Error & { hourErrors: Record<string, string> }).hourErrors = hourErrors;
        throw err;
      }

      const activeSocialAccounts = draft.socialAccounts
        .map((account) => ({ ...account, url: normalizeSocialUrl(account.url) }))
        .filter((account) => account.url);
      const socialError = validateSocialAccounts(activeSocialAccounts);
      if (socialError) {
        const err = new Error(socialError);
        (err as Error & { socialError: string }).socialError = socialError;
        throw err;
      }

      const profile = query.data;
      const selectedLocation = parsedLocations.find((l) => l.id === draft.locationId);
      const coverPhotos = draft.newCoverFiles.length > 0 ? draft.newCoverFiles : undefined;

      return updateVendorBusiness({
        category_id: draft.categoryId,
        subcategory: draft.subcategory.trim() || undefined,
        location_id: draft.locationId,
        business_name: draft.businessName,
        location: selectedLocation?.location ?? profile?.locationLabel ?? "Nigeria",
        state: selectedLocation?.state ?? profile?.state ?? "",
        city: selectedLocation?.city ?? profile?.city ?? "",
        lga: selectedLocation?.lga ?? profile?.lga ?? "",
        business_description: draft.description,
        services,
        phone: draft.phone,
        whatsapp: draft.whatsapp || undefined,
        website: draft.website || undefined,
        social_accounts: activeSocialAccounts,
        logo: draft.logoFile,
        cover_photos: coverPhotos,
        business_hours: draft.businessHours,
      });
    },
    onSuccess: async () => {
      setFieldErrors({});
      setSaveError(null);
      setIsEditing(false);
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["vendor", "business", "profile"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error && "hourErrors" in error) {
        const hourErrors = (error as Error & { hourErrors?: Record<string, string> }).hourErrors;
        if (hourErrors) {
          setFieldErrors(hourErrors);
          setSaveError(error.message);
          return;
        }
      }
      if (error instanceof Error && "socialError" in error) {
        const socialError = (error as Error & { socialError?: string }).socialError;
        if (socialError) {
          setFieldErrors({ social_accounts: socialError });
          setSaveError(error.message);
          return;
        }
      }
      if (error instanceof Error && !("response" in (error as object))) {
        setSaveError(error.message);
        return;
      }
      const parsed = parseVendorBusinessApiFailure(error);
      setFieldErrors(parsed.fieldErrors);
      setSaveError(parsed.general);
    },
  });

  const saveProfile = useCallback(() => {
    setSaveError(null);
    saveMutation.mutate();
  }, [saveMutation]);

  if (query.isLoading) {
    return (
      <ProfileShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading your business profile…</p>
        </div>
      </ProfileShell>
    );
  }

  if (isNotFound) {
    return (
      <ProfileShell>
        <div className="mx-auto max-w-lg rounded-xl border border-border-light bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-foreground font-manrope">No business profile yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your business listing to manage your profile, gallery, and contact details here.
          </p>
          <Button asChild className="mt-6 bg-sky-600 hover:bg-sky-600/90">
            <Link to="/vendor/plan-form">Create business profile</Link>
          </Button>
        </div>
      </ProfileShell>
    );
  }

  if (query.isError) {
    return (
      <ProfileShell>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.error?.message ?? "Failed to load business profile."}
        </div>
      </ProfileShell>
    );
  }

  const value: VendorProfileContextValue = {
    profile: query.data,
    query,
    isNotFound: false,
    isEditing,
    draft,
    fieldErrors,
    saveError,
    isSaving: saveMutation.isPending,
    startEditing,
    cancelEditing,
    updateDraft,
    setDraftField,
    addCoverFiles,
    removeExistingCover,
    removeNewCover,
    setLogoFile,
    setServices,
    saveProfile,
  };

  return <VendorProfileContext.Provider value={value}>{children}</VendorProfileContext.Provider>;
}
