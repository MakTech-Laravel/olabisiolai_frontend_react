export interface PaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  next_cursor?: string | null
  prev_cursor?: string | null
  has_more?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
  meta?: {
    pagination?: PaginationMeta
  }
}

export interface CursorPaginated<T> {
  data: T[]
  next_cursor: string | null
  prev_cursor: string | null
  per_page: number
  path: string
}
