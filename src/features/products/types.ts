export type Money = {
  currency: 'USD' | 'BDT' | string
  amount: number
}

export type Product = {
  id: string
  name: string
  subtitle?: string
  price: Money
  badge?: string
}

