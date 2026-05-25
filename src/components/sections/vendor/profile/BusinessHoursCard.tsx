import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessHoursDisplay } from "@/components/business/BusinessHoursDisplay";
import { BusinessHoursEditor } from "@/components/business/BusinessHoursEditor";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

export function BusinessHoursCard() {
  const { profile, isEditing, draft, fieldErrors, setDraftField } = useVendorProfileContext();

  if (!profile) return null;

  const hours = isEditing && draft ? draft.businessHours : profile.businessHours;
  const displayRows = isEditing && draft ? undefined : profile.businessHoursDisplay;

  return (
    <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
      <CardHeader className="border-b border-border-light bg-card px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">Business Hours</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isEditing && draft ? (
          <BusinessHoursEditor
            hours={draft.businessHours}
            errors={fieldErrors}
            onChange={(next) => setDraftField("businessHours", next)}
          />
        ) : (
          <BusinessHoursDisplay hours={hours} displayRows={displayRows} className="rounded-xl border-0 bg-transparent p-0" title="" />
        )}
      </CardContent>
    </Card>
  );
}
