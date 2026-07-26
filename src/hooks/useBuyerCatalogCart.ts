import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useAuth } from '@/auth/useAuth'
import {
  addBuyerCartItem,
  buyerCartBusinessQueryKey,
  buyerCartQueryKey,
  fetchBuyerCartForBusiness,
  fetchBuyerCarts,
  removeBuyerCartItem,
  sendBuyerCart,
  updateBuyerCartItemQuantity,
  type BuyerCart,
} from '@/features/catalog/buyerCartApi'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { showError } from '@/lib/sweetAlert'

function invalidateCartQueries(queryClient: ReturnType<typeof useQueryClient>, businessInfoId?: number) {
  void queryClient.invalidateQueries({ queryKey: buyerCartQueryKey })
  if (businessInfoId) {
    void queryClient.invalidateQueries({ queryKey: buyerCartBusinessQueryKey(businessInfoId) })
  }
}

/** All open carts for the signed-in buyer (catalog FAB + /cart hub). */
export function useBuyerCarts() {
  const { isAuthenticated, isSessionLoading, isUserLoading } = useAuth()
  const ready = !isSessionLoading && !isUserLoading
  const query = useQuery({
    queryKey: buyerCartQueryKey,
    queryFn: fetchBuyerCarts,
    enabled: ready && isAuthenticated,
    staleTime: 15_000,
  })

  const carts = query.data ?? []
  const totalItemCount = useMemo(
    () => carts.reduce((sum, cart) => sum + cart.itemCount, 0),
    [carts],
  )

  return {
    ...query,
    carts,
    totalItemCount,
  }
}

/** Open cart for one business — used on business catalog / detail. */
export function useBuyerCatalogCart(businessInfoId: number | null | undefined) {
  const id = businessInfoId && businessInfoId > 0 ? businessInfoId : null
  const queryClient = useQueryClient()
  const { isAuthenticated, isSessionLoading, isUserLoading } = useAuth()
  const ready = !isSessionLoading && !isUserLoading

  const query = useQuery({
    queryKey: id ? buyerCartBusinessQueryKey(id) : ['buyer-cart', 'none'],
    queryFn: () => fetchBuyerCartForBusiness(id!),
    enabled: Boolean(id) && ready && isAuthenticated,
    staleTime: 10_000,
  })

  const cart: BuyerCart | null = query.data ?? null

  const addItem = useCallback(
    async (catalogItemId: number, quantity = 1) => {
      try {
        const next = await addBuyerCartItem(catalogItemId, quantity)
        queryClient.setQueryData(buyerCartBusinessQueryKey(next.businessInfoId), next)
        invalidateCartQueries(queryClient, next.businessInfoId)
        return next
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not add to cart.'))
        throw error
      }
    },
    [queryClient],
  )

  const setQtyByCatalogItemId = useCallback(
    async (catalogItemId: number, quantity: number) => {
      const line = cart?.items.find((entry) => entry.catalogItemId === catalogItemId)
      if (!line) {
        if (quantity < 1) return cart
        return addItem(catalogItemId, quantity)
      }
      try {
        const next =
          quantity < 1
            ? await removeBuyerCartItem(line.id)
            : await updateBuyerCartItemQuantity(line.id, quantity)
        queryClient.setQueryData(buyerCartBusinessQueryKey(next.businessInfoId), next)
        invalidateCartQueries(queryClient, next.businessInfoId)
        return next
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not update cart.'))
        throw error
      }
    },
    [addItem, cart, queryClient],
  )

  const setQtyByCartItemId = useCallback(
    async (cartItemId: number, quantity: number) => {
      try {
        const next =
          quantity < 1
            ? await removeBuyerCartItem(cartItemId)
            : await updateBuyerCartItemQuantity(cartItemId, quantity)
        queryClient.setQueryData(buyerCartBusinessQueryKey(next.businessInfoId), next)
        invalidateCartQueries(queryClient, next.businessInfoId)
        return next
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not update cart.'))
        throw error
      }
    },
    [queryClient],
  )

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!cart?.id) throw new Error('Cart is empty.')
      return sendBuyerCart({ cartId: cart.id })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(buyerCartBusinessQueryKey(result.cart.businessInfoId), null)
      invalidateCartQueries(queryClient, result.cart.businessInfoId)
    },
  })

  return {
    cart,
    itemCount: cart?.itemCount ?? 0,
    estimatedTotalDisplay: cart?.estimatedTotalDisplay ?? 'Price on request',
    isLoading: query.isLoading,
    qtyFor: (catalogItemId: number) =>
      cart?.items.find((line) => line.catalogItemId === catalogItemId)?.quantity ?? 0,
    addItem,
    setQty: setQtyByCatalogItemId,
    setQtyByCartItemId,
    send: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    isAuthenticated,
    isAuthReady: ready,
  }
}
