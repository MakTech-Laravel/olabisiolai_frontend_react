import { type Product } from '@/features/products/types'

export const featuredProducts: Product[] = [
  {
    id: 'p1',
    name: 'Premium Tee',
    subtitle: 'Soft cotton, everyday fit',
    price: { currency: 'USD', amount: 39 },
    badge: 'New',
  },
  {
    id: 'p2',
    name: 'Everyday Sneakers',
    subtitle: 'Comfort all day',
    price: { currency: 'USD', amount: 79 },
    badge: 'Hot',
  },
  {
    id: 'p3',
    name: 'Minimal Watch',
    subtitle: 'Clean, timeless design',
    price: { currency: 'USD', amount: 119 },
    badge: '-10',
  },
  {
    id: 'p4',
    name: 'Travel Backpack',
    subtitle: 'Carry more, feel less',
    price: { currency: 'USD', amount: 89 },
  },
  {
    id: 'p5',
    name: 'Studio Headphones',
    subtitle: 'Crisp sound, deep bass',
    price: { currency: 'USD', amount: 149 },
  },
  {
    id: 'p6',
    name: 'Desk Lamp',
    subtitle: 'Warm light, modern build',
    price: { currency: 'USD', amount: 49 },
  },
]

