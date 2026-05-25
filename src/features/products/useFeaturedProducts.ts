import { useQuery } from '@tanstack/react-query'

import { featuredProducts } from '@/features/products/sampleData'
import { type Product } from '@/features/products/types'

export function useFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      return featuredProducts
    },
  })
}

