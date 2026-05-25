import { create } from 'zustand'

import type { Message } from '@/types/message'

interface UIState {
  isSidebarOpen: boolean
  isMobileDrawerOpen: boolean
  isNewConversationModalOpen: boolean
  replyingTo: Message | null
  editingMessage: Message | null
  toggleSidebar: () => void
  setMobileDrawer: (open: boolean) => void
  setNewConversationModalOpen: (open: boolean) => void
  setReplyingTo: (message: Message | null) => void
  setEditingMessage: (message: Message | null) => void
}

export const useUiStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobileDrawerOpen: false,
  isNewConversationModalOpen: false,
  replyingTo: null,
  editingMessage: null,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setMobileDrawer: (open) => set({ isMobileDrawerOpen: open }),
  setNewConversationModalOpen: (open) => set({ isNewConversationModalOpen: open }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
}))
