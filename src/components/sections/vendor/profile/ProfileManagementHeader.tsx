import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

export function ProfileManagementHeader() {
  const {
    profile,
    isEditing,
    isSaving,
    saveError,
    startEditing,
    cancelEditing,
    saveProfile,
  } = useVendorProfileContext();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-manrope md:text-3xl">
            Profile Management
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground font-inter">
            {profile
              ? `Managing ${profile.businessName} — keep your listing up to date to attract more clients.`
              : "Keep your business information up-to-date to attract more clients."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg px-5"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 rounded-lg bg-sky-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-sky-600/90"
                onClick={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="h-11 rounded-lg bg-sky-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-sky-600/90"
              onClick={startEditing}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
      {saveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{saveError}</p>
      ) : null}
    </div>
  );
}
