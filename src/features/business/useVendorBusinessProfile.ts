import { useQuery } from "@tanstack/react-query";
import {
  fetchVendorBusinessProfile,
  VendorBusinessNotFoundError,
} from "@/features/business/vendorBusinessProfileApi";

export function useVendorBusinessProfile() {
  return useQuery({
    queryKey: ["vendor", "business", "profile"],
    queryFn: fetchVendorBusinessProfile,
    retry: (failureCount, error) => {
      if (error instanceof VendorBusinessNotFoundError) return false;
      return failureCount < 2;
    },
  });
}
