import { useQuery } from '@tanstack/react-query'

import {
  fetchVendorBusinessFormOptions,
  type VendorFormOptions,
} from '@/features/categories/vendorFormOptionsApi'

const staleMs = 5 * 60 * 1000

export function useVendorBusinessFormOptions(options?: { enabled?: boolean }) {
  return useQuery<VendorFormOptions>({
    queryKey: ['vendor', 'business-form-options'],
    queryFn: fetchVendorBusinessFormOptions,
    staleTime: staleMs,
    enabled: options?.enabled ?? true,
  })
}
