import { useCallback, useEffect, useState } from 'react'

import type { BusinessCatalogItem } from '@/features/catalog/businessCatalogApi'
import {
  addItemToVendorCart,
  clearVendorCart,
  formatVendorCartEstimatedTotal,
  getVendorCartLineQty,
  loadVendorCart,
  removeVendorCartLine,
  setVendorCartLineQty,
  vendorCartItemCount,
  type VendorCart,
} from '@/features/catalog/vendorCart'

export function useVendorCatalogCart(
  businessInfoId: number | null | undefined,
  meta?: {
    businessName?: string
    vendorUserUuid?: string | null
  },
) {
  const id = businessInfoId && businessInfoId > 0 ? businessInfoId : null
  const [cart, setCart] = useState<VendorCart | null>(() => (id ? loadVendorCart(id) : null))

  useEffect(() => {
    setCart(id ? loadVendorCart(id) : null)
  }, [id])

  useEffect(() => {
    if (!id) return
    const reload = () => setCart(loadVendorCart(id))
    const onStorage = (event: StorageEvent) => {
      if (event.key !== `gidira.vendorCart.${id}`) return
      reload()
    }
    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<{ businessInfoId?: number }>).detail
      if (detail?.businessInfoId !== id) return
      reload()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('gidira:vendor-cart', onLocal)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('gidira:vendor-cart', onLocal)
    }
  }, [id])

  const businessName = meta?.businessName?.trim() || cart?.businessName || 'Business'
  const vendorUserUuid = meta?.vendorUserUuid ?? cart?.vendorUserUuid ?? null

  const addItem = useCallback(
    (item: BusinessCatalogItem, qtyDelta = 1) => {
      if (!id) return null
      const next = addItemToVendorCart(id, businessName, vendorUserUuid, item, qtyDelta)
      setCart(next)
      return next
    },
    [id, businessName, vendorUserUuid],
  )

  const setQty = useCallback(
    (catalogItemId: number, qty: number) => {
      if (!id) return null
      const next = setVendorCartLineQty(id, catalogItemId, qty)
      setCart(next)
      return next
    },
    [id],
  )

  const removeLine = useCallback(
    (catalogItemId: number) => {
      if (!id) return null
      const next = removeVendorCartLine(id, catalogItemId)
      setCart(next)
      return next
    },
    [id],
  )

  const clear = useCallback(() => {
    if (!id) return
    clearVendorCart(id)
    setCart(null)
  }, [id])

  const itemCount = vendorCartItemCount(cart)
  const estimatedTotalDisplay = formatVendorCartEstimatedTotal(cart)

  return {
    cart,
    itemCount,
    estimatedTotalDisplay,
    qtyFor: (catalogItemId: number) => getVendorCartLineQty(cart, catalogItemId),
    addItem,
    setQty,
    removeLine,
    clear,
  }
}
