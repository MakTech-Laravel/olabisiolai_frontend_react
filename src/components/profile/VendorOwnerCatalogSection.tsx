import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'

import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { BusinessCatalogSection } from '@/components/business/BusinessCatalogSection'
import { VendorOwnerModalShell } from '@/components/profile/VendorOwnerModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATALOG_MAX_ITEMS_PER_BUSINESS } from '@/constants/config'
import {
  CATALOG_DESCRIPTION_MAX_LENGTH,
  CATALOG_NAME_MAX_LENGTH,
  catalogPriceEditorValue,
  computeSalePriceKobo,
  createCatalogItem,
  deleteCatalogItem,
  fetchVendorCatalog,
  isExactNairaPriceInput,
  nairaDigitsToKobo,
  updateCatalogItem,
  type BusinessCatalogItem,
  type CatalogDiscountType,
  type CatalogItemInput,
  type CatalogItemType,
} from '@/features/catalog/businessCatalogApi'
import { CatalogPriceDisplay } from '@/components/catalog/CatalogPriceDisplay'
import { CATALOG_IMAGE_ASPECT_CLASS, CATALOG_IMAGE_UPLOAD_HINT } from '@/lib/businessImageLayout'
import { buildVendorPremiumInfoPath } from '@/hooks/useVendorSubscriptionAccess'
import { businessPageCatalogGrid } from '@/lib/businessPageLayout'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import alert, { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg,#2e3b52,#46587a)',
  'linear-gradient(135deg,#7a4b2a,#a3683b)',
  'linear-gradient(135deg,#1f5f4f,#2f8a72)',
  'linear-gradient(135deg,#43325c,#6b4f8f)',
  'linear-gradient(135deg,#5a2e3b,#8a4658)',
  'linear-gradient(135deg,#2a4a6a,#3f6c97)',
]

type VendorOwnerCatalogSectionProps = {
  businessId: number
  isPremiumActive: boolean
  onProfileUpdated?: () => void
  layout?: 'default' | 'edit'
}

type EditorState = {
  item: BusinessCatalogItem | null
  type: CatalogItemType
  name: string
  description: string
  priceLabel: string
  priceFrom: boolean
  discountType: CatalogDiscountType | null
  discountValue: string
  images: File[]
  keepImagePaths: string[]
  removeImage: boolean
}

const emptyEditor = (): EditorState => ({
  item: null,
  type: 'service',
  name: '',
  description: '',
  priceLabel: '',
  priceFrom: false,
  discountType: null,
  discountValue: '',
  images: [],
  keepImagePaths: [],
  removeImage: false,
})

function CatalogEditControls({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="edit-only absolute right-2 top-2 flex gap-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
      <button
        type="button"
        onClick={onEdit}
        className="grid size-[30px] place-items-center rounded-full bg-[rgba(15,22,32,0.62)] text-white shadow-sm"
        aria-label="Edit item"
      >
        <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="grid size-[30px] place-items-center rounded-full bg-white text-brand shadow-sm"
        aria-label="Delete item"
      >
        <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

export function VendorOwnerCatalogSection({
  businessId,
  isPremiumActive,
  onProfileUpdated,
  layout = 'default',
}: VendorOwnerCatalogSectionProps) {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState>(emptyEditor)
  const [saving, setSaving] = useState(false)

  const catalogQuery = useQuery({
    queryKey: ['vendor', 'catalog', businessId],
    queryFn: () => fetchVendorCatalog(businessId),
    enabled: isPremiumActive,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!sheetOpen) setEditor(emptyEditor())
  }, [sheetOpen])

  function openCreate() {
    if (items.length >= CATALOG_MAX_ITEMS_PER_BUSINESS) {
      showError(`You can add up to ${CATALOG_MAX_ITEMS_PER_BUSINESS} catalog items.`)
      return
    }
    setEditor(emptyEditor())
    setSheetOpen(true)
  }

  function openEdit(item: BusinessCatalogItem) {
    setEditor({
      item,
      type: item.type,
      name: item.name,
      description: item.description ?? '',
      priceLabel: catalogPriceEditorValue(item),
      priceFrom: item.priceFrom,
      discountType: item.hasDiscount ? item.discountType : null,
      discountValue:
        item.hasDiscount && item.discountValue !== null
          ? item.discountType === 'flat'
            ? String(Math.round(item.discountValue / 100))
            : String(item.discountValue)
          : '',
      images: [],
      keepImagePaths: [...item.imagePaths],
      removeImage: false,
    })
    setSheetOpen(true)
  }

  async function refreshCatalog() {
    await queryClient.invalidateQueries({ queryKey: ['vendor', 'catalog', businessId] })
    await queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    onProfileUpdated?.()
  }

  async function handleSave() {
    const resolvedName = editor.name.trim()

    if (!resolvedName) {
      showError('Enter a name for this catalog item.')
      return
    }

    if (!editor.item && items.length >= CATALOG_MAX_ITEMS_PER_BUSINESS) {
      showError(`You can add up to ${CATALOG_MAX_ITEMS_PER_BUSINESS} catalog items.`)
      return
    }

    if (resolvedName.length > CATALOG_NAME_MAX_LENGTH) {
      showError(`Name must be ${CATALOG_NAME_MAX_LENGTH} characters or fewer.`)
      return
    }

    const description = editor.description.trim()
    if (description.length > CATALOG_DESCRIPTION_MAX_LENGTH) {
      showError(`Description must be ${CATALOG_DESCRIPTION_MAX_LENGTH} characters or fewer.`)
      return
    }

    const rawPrice = editor.priceLabel.trim()
    let priceKobo: number | null = null
    let priceLabel = ''

    if (rawPrice) {
      if (isExactNairaPriceInput(rawPrice)) {
        priceKobo = nairaDigitsToKobo(rawPrice)
        if (priceKobo === null) {
          showError('Enter a valid price in naira, or a range like from 1500 - 2000.')
          return
        }
      } else {
        // Free-text / range — stored as price_label; cart will not show an exact total.
        priceLabel = rawPrice.slice(0, 64)
      }
    }

    let discountType: CatalogDiscountType | null = editor.discountType
    let discountValue: number | null = null

    if (discountType && !editor.priceFrom && priceKobo !== null) {
      const rawDiscount = editor.discountValue.trim()
      if (!rawDiscount) {
        showError(
          discountType === 'percent'
            ? 'Enter a discount percentage.'
            : 'Enter a flat discount amount in naira.',
        )
        return
      }

      if (discountType === 'percent') {
        const percent = Number(rawDiscount)
        if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
          showError('Percentage discount must be between 1 and 100.')
          return
        }
        discountValue = Math.round(percent)
      } else {
        discountValue = nairaDigitsToKobo(rawDiscount)
        if (discountValue === null || discountValue < 1) {
          showError('Enter a valid flat discount in naira.')
          return
        }
        if (discountValue > priceKobo) {
          showError('Flat discount cannot exceed the list price.')
          return
        }
      }
    } else {
      discountType = null
      discountValue = null
    }

    const input: CatalogItemInput = {
      type: editor.type,
      name: resolvedName,
      description,
      priceKobo,
      priceLabel,
      priceFrom: editor.priceFrom,
      discountType,
      discountValue,
      images: editor.images,
      keepImagePaths: editor.item ? editor.keepImagePaths : undefined,
      removeImage: editor.removeImage,
    }

    setSaving(true)
    try {
      if (editor.item) {
        await updateCatalogItem(editor.item.id, input, businessId)
        showSuccess('Catalog item updated.')
      } else {
        await createCatalogItem(input, businessId)
        showSuccess('Item added to catalog.')
      }
      setSheetOpen(false)
      await refreshCatalog()
    } catch (error) {
      showError(getLaravelErrorMessage(error, 'Could not save catalog item.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item?: BusinessCatalogItem) {
    const target = item ?? editor.item
    if (!target) return

    const confirmed = await alert.confirmDelete(target.name)
    if (!confirmed) return

    setSaving(true)
    try {
      await deleteCatalogItem(target.id, businessId)
      showSuccess('Catalog item deleted.')
      setSheetOpen(false)
      await refreshCatalog()
    } catch (error) {
      showError(getLaravelErrorMessage(error, 'Could not delete catalog item.'))
    } finally {
      setSaving(false)
    }
  }

  const items = catalogQuery.data?.items ?? []
  const atCatalogLimit = items.length >= CATALOG_MAX_ITEMS_PER_BUSINESS
  const canAddItem = isPremiumActive && !atCatalogLimit
  const upgradePath = buildVendorPremiumInfoPath(businessId)

  const editorSheet = (
    <VendorOwnerModalShell
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title={editor.item ? 'Edit catalog item' : 'Add catalog item'}
      saveLabel={editor.item ? 'Save changes' : 'Add to catalog'}
      loading={saving}
      onSave={() => void handleSave()}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['service', 'product'] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={editor.type === type}
              onClick={() => setEditor((current) => ({ ...current, type }))}
              className={cn(
                'flex-1 rounded-xl border-[1.5px] px-3 py-3 text-sm font-semibold capitalize transition-colors',
                editor.type === type
                  ? 'border-chat-accent bg-[#EAF2FD] text-[#1568C0]'
                  : 'border-border-light bg-white text-body-secondary',
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Name</label>
          <Input
            value={editor.name}
            maxLength={CATALOG_NAME_MAX_LENGTH}
            onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Full house rewiring"
          />
          <p className="mt-1 text-xs text-stat-muted">
            {editor.name.length}/{CATALOG_NAME_MAX_LENGTH} characters
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Description</label>
          <Textarea
            value={editor.description}
            maxLength={CATALOG_DESCRIPTION_MAX_LENGTH}
            onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
            placeholder="Short description"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Price (₦)</label>
          <Input
            type="text"
            autoComplete="off"
            maxLength={64}
            value={editor.priceLabel}
            onChange={(event) =>
              setEditor((current) => ({
                ...current,
                priceLabel: event.target.value.slice(0, 64),
              }))
            }
            placeholder="e.g. 250000 or from 1500 - 2000"
          />
          <p className="mt-1 text-xs text-stat-muted">
            Exact amount, or a range/text like from 1500 - 2000 (cart will not show an exact total).
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={editor.priceFrom}
            onChange={(event) =>
              setEditor((current) => ({
                ...current,
                priceFrom: event.target.checked,
                ...(event.target.checked
                  ? { discountType: null, discountValue: '' }
                  : {}),
              }))
            }
            className="size-4 rounded border-border-light text-chat-accent"
          />
          Show as &quot;from&quot; price
        </label>

        {!editor.priceFrom && isExactNairaPriceInput(editor.priceLabel) ? (
          <div className="space-y-3 rounded-xl border border-border-light bg-[#f8fafc] p-3">
            <p className="text-sm font-medium text-body-secondary">Discount (optional)</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: null, label: 'None' },
                  { key: 'percent' as const, label: '%' },
                  { key: 'flat' as const, label: 'Flat ₦' },
                ] as const
              ).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={editor.discountType === option.key}
                  onClick={() =>
                    setEditor((current) => ({
                      ...current,
                      discountType: option.key,
                      discountValue: option.key === current.discountType ? current.discountValue : '',
                    }))
                  }
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    editor.discountType === option.key
                      ? 'bg-chat-accent text-white'
                      : 'bg-white text-ink ring-1 ring-border-light',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {editor.discountType ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-body-secondary">
                  {editor.discountType === 'percent' ? 'Percentage' : 'Amount (₦)'}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editor.discountValue}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      discountValue:
                        current.discountType === 'percent'
                          ? event.target.value.replace(/\D/g, '').slice(0, 3)
                          : event.target.value.replace(/\D/g, '').slice(0, 12),
                    }))
                  }
                  placeholder={editor.discountType === 'percent' ? 'e.g. 20' : 'e.g. 5000'}
                />
              </div>
            ) : null}

            {(() => {
              const listKobo = nairaDigitsToKobo(editor.priceLabel)
              if (!listKobo || !editor.discountType || !editor.discountValue.trim()) return null
              const discountValue =
                editor.discountType === 'percent'
                  ? Number(editor.discountValue)
                  : nairaDigitsToKobo(editor.discountValue)
              if (discountValue === null || !Number.isFinite(discountValue) || discountValue < 1) {
                return null
              }
              const saleKobo = computeSalePriceKobo(
                listKobo,
                editor.discountType,
                Math.round(discountValue),
              )
              if (saleKobo === null || saleKobo >= listKobo) return null
              return (
                <div className="pt-1">
                  <p className="mb-1 text-xs text-stat-muted">Customer will see</p>
                  <CatalogPriceDisplay
                    item={{
                      priceKobo: saleKobo,
                      originalPriceKobo: listKobo,
                      priceLabel: null,
                      priceFrom: false,
                      hasDiscount: true,
                    }}
                    saleClassName="text-[15px]"
                  />
                </div>
              )
            })()}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">
            Photos (optional)
          </label>
          <p className="mb-2 text-xs text-stat-muted">{CATALOG_IMAGE_UPLOAD_HINT}</p>

          {editor.item && editor.keepImagePaths.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {editor.item.imageUrls.map((url, index) => {
                const path = editor.item?.imagePaths[index]
                if (!path || !editor.keepImagePaths.includes(path)) return null
                return (
                  <div key={path} className="relative size-16 overflow-hidden rounded-lg border border-border-light">
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/60 text-[10px] text-white"
                      onClick={() =>
                        setEditor((current) => ({
                          ...current,
                          keepImagePaths: current.keepImagePaths.filter((entry) => entry !== path),
                          removeImage: current.keepImagePaths.length <= 1 && current.images.length === 0,
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          ) : null}

          {editor.images.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {editor.images.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative size-16 overflow-hidden rounded-lg border border-border-light">
                  <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove new photo ${index + 1}`}
                    className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/60 text-[10px] text-white"
                    onClick={() =>
                      setEditor((current) => ({
                        ...current,
                        images: current.images.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? [])
              event.target.value = ''
              if (selected.length === 0) return
              setEditor((current) => ({
                ...current,
                images: [...current.images, ...selected],
                removeImage: false,
              }))
            }}
          />
          {editor.keepImagePaths.length + editor.images.length > 0 ? (
            <p className="mt-1 text-xs text-stat-muted">
              {editor.keepImagePaths.length + editor.images.length} photos
            </p>
          ) : null}
        </div>
      </div>

      {editor.item ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-4 h-12 w-full text-brand"
          disabled={saving}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="mr-2 size-4" aria-hidden />
          Delete item
        </Button>
      ) : null}
    </VendorOwnerModalShell>
  )

  if (layout === 'edit') {
    return (
      <>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-ink">
            Catalog{' '}
            <span className="text-[13.5px] font-semibold text-stat-muted">
              {isPremiumActive
                ? `${items.length}/${CATALOG_MAX_ITEMS_PER_BUSINESS} items`
                : 'Premium feature'}
            </span>
          </h2>
          {canAddItem ? (
            <button
              type="button"
              onClick={openCreate}
              className="edit-only inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#cfe2fb] bg-white px-3 py-2 text-[13px] font-semibold text-chat-accent"
            >
              <Plus className="size-4" strokeWidth={2.2} aria-hidden />
              Add item
            </button>
          ) : isPremiumActive && atCatalogLimit ? (
            <span className="text-[12px] font-semibold text-stat-muted">Limit reached</span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-body-secondary">
          {isPremiumActive
            ? atCatalogLimit
              ? `You’ve reached the maximum of ${CATALOG_MAX_ITEMS_PER_BUSINESS} catalog items.`
              : 'Products and services customers can browse.'
            : 'Catalogs are available on Premium. Upgrade to list your products and services.'}
        </p>

        {!isPremiumActive ? (
          <Link
            to={upgradePath}
            className="mt-3.5 flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#e3d6b5] bg-[#fffbf0] px-5 py-6 text-center"
          >
            <Lock className="size-8 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
            <b className="font-heading text-base font-bold text-ink">Catalog is a Premium feature</b>
            <span className="max-w-[260px] text-[13px] leading-relaxed text-body-secondary">
              Upgrade to add products and services customers can browse.
            </span>
            <span className="mt-2 inline-flex rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-4 py-2 text-[13px] font-bold text-white">
              Upgrade to Premium
            </span>
          </Link>
        ) : (
          <div className={cn('mt-3.5', businessPageCatalogGrid)}>
            {items.map((item, index) => (
              <article
                key={item.id}
                className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div
                  className="relative shrink-0"
                  style={{
                    background: item.imageUrl ? undefined : GRADIENTS[index % GRADIENTS.length],
                  }}
                >
                  {item.imageUrl ? (
                    <BusinessCatalogImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="rounded-none"
                      fit="cover"
                    />
                  ) : (
                    <div className={cn(CATALOG_IMAGE_ASPECT_CLASS, 'w-full')} />
                  )}
                  <span
                    className={cn(
                      'absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                      item.type === 'service' ? 'text-chat-accent' : 'text-brand',
                    )}
                  >
                    {item.type}
                  </span>
                  <CatalogEditControls
                    onEdit={() => openEdit(item)}
                    onDelete={() => void handleDelete(item)}
                  />
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-stat-muted">
                      {item.description}
                    </p>
                  ) : (
                    <span className="flex-1" aria-hidden />
                  )}
                  <CatalogPriceDisplay
                    item={item}
                    className="mt-2 font-heading text-[15px] text-ink"
                    saleClassName="font-heading text-[15px] font-bold"
                  />
                </div>
              </article>
            ))}
            {canAddItem ? (
              <button
                type="button"
                onClick={openCreate}
                className="edit-only flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#cfdae6] bg-[#fbfcfe] text-[13.5px] font-semibold text-chat-accent"
              >
                <Plus className="size-7" strokeWidth={2} aria-hidden />
                Add item
              </button>
            ) : null}
          </div>
        )}
        {editorSheet}
      </>
    )
  }

  return (
    <>
      <div className="relative">
        {canAddItem ? (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe2fb] bg-white px-3.5 py-2 text-sm font-semibold text-chat-accent transition-colors hover:bg-[#EAF2FD]"
            >
              <Plus className="size-4" aria-hidden />
              Add item
            </button>
          </div>
        ) : isPremiumActive && atCatalogLimit ? (
          <p className="mb-3 text-right text-xs font-semibold text-stat-muted">
            Catalog limit: {CATALOG_MAX_ITEMS_PER_BUSINESS} items
          </p>
        ) : null}

        <BusinessCatalogSection
          items={items}
          catalogLocked={!isPremiumActive}
          isOwnerMode
          businessId={businessId}
        />
      </div>
      {editorSheet}
    </>
  )
}
