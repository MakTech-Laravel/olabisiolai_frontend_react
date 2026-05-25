import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VendorAnalyticsListing } from "@/features/analytics/vendorAnalyticsApi";

export function TopListingsTable({ listings }: { listings: VendorAnalyticsListing[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-2xl font-semibold">Top Performing Listings</p>
          <button type="button" className="text-xs font-semibold text-brand-red hover:underline">
            Export Report
          </button>
        </div>
        {listings.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Add services to your profile to see performance breakdown here.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Service Name</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Enquiries</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.name} className="border-t">
                  <td className="px-4 py-3 font-medium">{listing.name}</td>
                  <td className="px-4 py-3">{listing.views}</td>
                  <td className="px-4 py-3">{listing.clicks}</td>
                  <td className="px-4 py-3">{listing.ctr}</td>
                  <td className="px-4 py-3">{listing.enquiries}</td>
                  <td className="px-4 py-3">
                    <Badge variant={listing.status === "Active" ? "default" : "secondary"}>
                      {listing.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
