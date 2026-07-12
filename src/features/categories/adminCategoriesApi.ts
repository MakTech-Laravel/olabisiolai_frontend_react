import { request } from '@/api/request'
import { laravelInnerData, parseCategoryDto, parseCategoryList } from '@/features/categories/categoryParsers'
import type { AdminCategoriesListResult, CategoryDto } from '@/features/categories/types'

function paginationFrom(inner: Record<string, unknown>): AdminCategoriesListResult['pagination'] {
  const p = inner.pagination
  const o = p && typeof p === 'object' ? (p as Record<string, unknown>) : {}
  return {
    current_page: typeof o.current_page === 'number' ? o.current_page : Number(o.current_page) || 1,
    per_page: typeof o.per_page === 'number' ? o.per_page : Number(o.per_page) || 10,
    last_page: typeof o.last_page === 'number' ? o.last_page : Number(o.last_page) || 1,
    total: typeof o.total === 'number' ? o.total : Number(o.total) || 0,
  }
}

function appendSubcategories(form: FormData, subcategories?: string[] | string | null) {
  if (subcategories == null) return
  if (Array.isArray(subcategories)) {
    subcategories.forEach((item, index) => {
      const value = item.trim()
      if (value) form.append(`subcategories[${index}]`, value)
    })
    return
  }
  const value = subcategories.trim()
  if (value) form.append('subcategories', value)
}

export async function adminListCategories(params: {
  search?: string
  page?: number
  per_page?: number
}): Promise<AdminCategoriesListResult> {
  const res = await request.post('/admin/categories', {
    search: params.search?.trim() || undefined,
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  })
  const inner = laravelInnerData(res.data) ?? {}
  const categories = parseCategoryList(inner.categories)
  return {
    categories,
    pagination: paginationFrom(inner),
    filter: {
      search:
        inner.filter && typeof inner.filter === 'object' && inner.filter !== null
          ? String((inner.filter as Record<string, unknown>).search ?? '') || null
          : null,
    },
    count: typeof inner.count === 'number' ? inner.count : Number(inner.count) || 0,
  }
}

export async function adminCreateCategory(payload: {
  name: string
  subcategories?: string[] | string | null
  icon: File
}): Promise<CategoryDto> {
  const form = new FormData()
  form.append('name', payload.name.trim())
  appendSubcategories(form, payload.subcategories)
  form.append('icon', payload.icon)

  const res = await request.post('/admin/categories/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const inner = laravelInnerData(res.data) ?? {}
  const cat = parseCategoryDto(inner.category)
  if (!cat) throw new Error('Invalid create category response')
  return cat
}

export async function adminViewCategory(id: number): Promise<CategoryDto> {
  const res = await request.post('/admin/categories/view', { id })
  const inner = laravelInnerData(res.data) ?? {}
  const cat = parseCategoryDto(inner.category)
  if (!cat) throw new Error('Invalid view category response')
  return cat
}

export async function adminUpdateCategory(payload: {
  id: number
  name: string
  subcategories?: string[] | string | null
  icon?: File | null
}): Promise<CategoryDto> {
  const form = new FormData()
  form.append('id', String(payload.id))
  form.append('name', payload.name.trim())
  appendSubcategories(form, payload.subcategories)
  if (payload.icon) form.append('icon', payload.icon)

  const res = await request.post('/admin/categories/update', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const inner = laravelInnerData(res.data) ?? {}
  const cat = parseCategoryDto(inner.category)
  if (!cat) throw new Error('Invalid update category response')
  return cat
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await request.post('/admin/categories/delete', { id })
}
