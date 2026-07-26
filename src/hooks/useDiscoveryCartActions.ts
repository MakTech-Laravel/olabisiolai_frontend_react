import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import {
  addBuyerCartItem,
  buyerCartQueryKey,
  removeBuyerCartItem,
  updateBuyerCartItemQuantity,
} from '@/features/catalog/buyerCartApi'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { useBuyerCarts } from '@/hooks/useBuyerCatalogCart'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { showError } from '@/lib/sweetAlert'

/** Cross-business cart helpers for /catalog and home discovery cards. */
export function useDiscoveryCartActions(returnPath = '/catalog') {
  const queryClient = useQueryClient()
  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const { carts, totalItemCount } = useBuyerCarts()

  const qtyByCatalogItemId = useMemo(() => {
    const map = new Map<number, number>()
    for (const cart of carts) {
      for (const line of cart.items) {
        map.set(line.catalogItemId, line.quantity)
      }
    }
    return map
  }, [carts])

  const lineIdByCatalogItemId = useMemo(() => {
    const map = new Map<number, number>()
    for (const cart of carts) {
      for (const line of cart.items) {
        map.set(line.catalogItemId, line.id)
      }
    }
    return map
  }, [carts])

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: buyerCartQueryKey })
  }, [queryClient])

  const ensureAuth = useCallback(() => {
    if (!isAuthReady) return false
    if (!isAuthenticated) {
      requireAuthNavigate(returnPath)
      return false
    }
    return true
  }, [isAuthReady, isAuthenticated, requireAuthNavigate, returnPath])

  const addItem = useCallback(
    async (catalogItemId: number, quantity = 1) => {
      if (!ensureAuth()) return
      try {
        await addBuyerCartItem(catalogItemId, quantity)
        refresh()
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not add to cart.'))
      }
    },
    [ensureAuth, refresh],
  )

  const setQty = useCallback(
    async (catalogItemId: number, quantity: number) => {
      if (!ensureAuth()) return
      const lineId = lineIdByCatalogItemId.get(catalogItemId)
      try {
        if (!lineId) {
          if (quantity < 1) return
          await addBuyerCartItem(catalogItemId, quantity)
        } else if (quantity < 1) {
          await removeBuyerCartItem(lineId)
        } else {
          await updateBuyerCartItemQuantity(lineId, quantity)
        }
        refresh()
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not update cart.'))
      }
    },
    [ensureAuth, lineIdByCatalogItemId, refresh],
  )

  return {
    totalItemCount,
    qtyFor: (catalogItemId: number) => qtyByCatalogItemId.get(catalogItemId) ?? 0,
    addItem,
    setQty,
    isAuthenticated,
    isAuthReady,
  }
}
