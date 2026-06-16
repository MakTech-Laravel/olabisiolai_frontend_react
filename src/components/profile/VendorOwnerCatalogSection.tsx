import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'

import { BusinessCatalogSection } from '@/components/business/BusinessCatalogSection'
import { VendorOwnerModalShell } from '@/components/profile/VendorOwnerModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createCatalogItem,
  deleteCatalogItem,
  fetchVendorCatalog,
  formatCatalogPrice,
  updateCatalogItem,
  type BusinessCatalogItem,
  type CatalogItemInput,
  type CatalogItemType,
} from '@/features/catalog/businessCatalogApi'
import { VENDOR_PREMIUM_PAYMENT_PATH } from '@/hooks/useVendorSubscriptionAccess'
import { businessPageCatalogGrid } from '@/lib/businessPageLayout'
import { showError, showSuccess } from '@/lib/sweetAlert'
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
  image: File | null
  removeImage: boolean
}

const emptyEditor = (): EditorState => ({
  item: null,
  type: 'service',
  name: '',
  description: '',
  priceLabel: '',
  priceFrom: false,
  image: null,
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
    setEditor(emptyEditor())
    setSheetOpen(true)
  }

  function openEdit(item: BusinessCatalogItem) {
    setEditor({
      item,
      type: item.type,
      name: item.name,
      description: item.description ?? '',
      priceLabel: item.priceLabel ?? '',
      priceFrom: item.priceFrom,
      image: null,
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
    if (!editor.name.trim()) {
      showError('Enter a name for this catalog item.')
      return
    }

    const input: CatalogItemInput = {
      type: editor.type,
      name: editor.name,
      description: editor.description,
      priceLabel: editor.priceLabel,
      priceFrom: editor.priceFrom,
      image: editor.image,
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
      showError(error instanceof Error ? error.message : 'Could not save catalog item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item?: BusinessCatalogItem) {
    const target = item ?? editor.item
    if (!target) return
    setSaving(true)
    try {
      await deleteCatalogItem(target.id, businessId)
      showSuccess('Catalog item deleted.')
      setSheetOpen(false)
      await refreshCatalog()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not delete catalog item.')
    } finally {
      setSaving(false)
    }
  }

  const items = catalogQuery.data?.items ?? []
  const upgradePath = `${VENDOR_PREMIUM_PAYMENT_PATH}?business_id=${businessId}`

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
            onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Full house rewiring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Description</label>
          <Textarea
            value={editor.description}
            onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
            placeholder="Short description"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Price</label>
          <Input
            value={editor.priceLabel}
            onChange={(event) => setEditor((current) => ({ ...current, priceLabel: event.target.value }))}
            placeholder="e.g. ₦250,000"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={editor.priceFrom}
            onChange={(event) => setEditor((current) => ({ ...current, priceFrom: event.target.checked }))}
            className="size-4 rounded border-border-light text-chat-accent"
          />
          Show as &quot;from&quot; price
        </label>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-body-secondary">Photo (optional)</label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) =>
              setEditor((current) => ({
                ...current,
                image: event.target.files?.[0] ?? null,
                removeImage: false,
              }))
            }
          />
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
              {isPremiumActive ? `${items.length} items` : 'Premium feature'}
            </span>
          </h2>
          {isPremiumActive ? (
            <button
              type="button"
              onClick={openCreate}
              className="edit-only inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#cfe2fb] bg-white px-3 py-2 text-[13px] font-semibold text-chat-accent"
            >
              <Plus className="size-4" strokeWidth={2.2} aria-hidden />
              Add item
            </button>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-body-secondary">
          {isPremiumActive
            ? 'Products and services customers can browse.'
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
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div
                  className="relative h-[100px]"
                  style={{
                    background: item.imageUrl ? undefined : GRADIENTS[index % GRADIENTS.length],
                  }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                  ) : null}
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
                <div className="flex flex-1 flex-col px-3 py-3">
                  <h3 className="text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                  {item.description ? (
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-stat-muted">{item.description}</p>
                  ) : null}
                  <p className="mt-2 font-heading text-[15px] font-bold text-ink">
                    {formatCatalogPrice(item)}
                  </p>
                </div>
              </article>
            ))}
            <button
              type="button"
              onClick={openCreate}
              className="edit-only flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#cfdae6] bg-[#fbfcfe] text-[13.5px] font-semibold text-chat-accent"
            >
              <Plus className="size-7" strokeWidth={2} aria-hidden />
              Add item
            </button>
          </div>
        )}
        {editorSheet}
      </>
    )
  }

  return (
    <>
      <div className="relative">
        {isPremiumActive ? (
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
