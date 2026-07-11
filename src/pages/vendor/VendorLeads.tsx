import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NewConversationModal } from "@/features/messaging/NewConversationModal";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError } from "@/lib/sweetAlert";

import { fetchVendorAdminConversation } from "@/api/vendorAdminChat";
import { getConversations } from "@/api/conversations";
import { sendMessageWithAttachments } from "@/api/messages";
import { useAuth } from "@/auth/useAuth";
import type { MessagingUser } from "@/types/user";
import { useMessagingPresenceLifecycle } from "@/hooks/useMessagingPresenceLifecycle";
import { useMessagingRealtime } from "@/hooks/useMessagingRealtime";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useAttachmentUpload } from "@/hooks/useAttachmentUpload";
import type { Conversation } from "@/types/conversation";
import { DirectLeadsTable } from "@/components/sections/vendor/leads/DirectLeadsTable";
import { LeadDetailsModal } from "@/components/sections/vendor/leads/LeadDetailsModal";
import { LeadsTabs } from "@/components/sections/vendor/leads/LeadsChannelTabs";
import { LeadsHeader } from "@/components/sections/vendor/leads/LeadsHeader";
import { WhatsAppLeadsList } from "@/components/sections/vendor/leads/WhatsAppLeadsList";
import { WhatsAppChatInterface } from "@/components/sections/vendor/leads/WhatsAppChatView";
import { type Lead, type LeadChannel } from "@/components/sections/vendor/leads/leadsData";
import { flattenMessagesChronological } from "@/utils/flattenMessages";
import { isPeerOnline } from "@/utils/messageStatus";
import { conversationToLead, messageToChatMessage } from "@/utils/vendorLeads";
import { appendOrMergeMessageInCache } from "@/features/messaging/messageCache";
import { applyNewMessagePreview } from "@/features/messaging/conversationCache";

export default function VendorLeads() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const selfId = Number(user?.id ?? 0);
  const me = useMemo((): MessagingUser | null => {
    if (!user) return null;
    return {
      id: Number(user.id),
      name: user.name ?? "You",
      avatar: null,
      status: "online",
      last_seen_at: null,
    };
  }, [user]);

  const [channelFilter, setChannelFilter] = useState<LeadChannel>(() => {
    const channel = searchParams.get("channel");
    return channel === "admin" ? "admin" : "whatsapp";
  });

  useEffect(() => {
    if (searchParams.get("channel") === "admin") {
      setChannelFilter("admin");
    }
  }, [searchParams]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [openLeadDetails, setOpenLeadDetails] = useState<Lead | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const { files, addFiles, removeFile, clearFiles } = useAttachmentUpload();

  const conversationsQuery = useQuery({
    queryKey: ["vendor-conversations"],
    queryFn: async () => {
      const { conversations } = await getConversations({ type: "direct", page: 1 });
      return conversations;
    },
    enabled: isAuthenticated && selfId > 0,
  });

  const adminChatQuery = useQuery({
    queryKey: ["vendor-admin-chat"],
    queryFn: fetchVendorAdminConversation,
    enabled: isAuthenticated && selfId > 0,
  });

  const adminLead = useMemo(() => {
    if (!adminChatQuery.data) return null;
    return conversationToLead(adminChatQuery.data, selfId, "admin");
  }, [adminChatQuery.data, selfId]);

  const adminChatUuid = adminChatQuery.data?.uuid;

  const chatLeads = useMemo(() => {
    const list = conversationsQuery.data ?? [];
    return list
      .filter((c) => c.uuid !== adminChatUuid)
      .map((c) => conversationToLead(c, selfId, "whatsapp"));
  }, [conversationsQuery.data, selfId, adminChatUuid]);

  const tableLeads = useMemo(() => {
    const list = conversationsQuery.data ?? [];
    return list.map((c) => conversationToLead(c, selfId, "direct"));
  }, [conversationsQuery.data, selfId]);

  const filteredLeads = useMemo(() => {
    if (channelFilter === "admin") {
      return adminLead ? [adminLead] : [];
    }
    const base = channelFilter === "whatsapp" ? chatLeads : tableLeads;
    if (channelFilter !== "whatsapp") return base;
    const q = chatSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (l) => l.name.toLowerCase().includes(q) || l.message.toLowerCase().includes(q),
    );
  }, [channelFilter, chatLeads, tableLeads, chatSearch, adminLead]);

  const directCount = tableLeads.length;
  const whatsappCount = chatLeads.length;
  const adminCount = adminChatQuery.data?.unread_count ?? 0;

  const isChatChannel = channelFilter === "whatsapp" || channelFilter === "admin";

  useMessagingPresenceLifecycle(isAuthenticated && selfId > 0 && isChatChannel);

  useEffect(() => {
    if (conversationsQuery.isError) {
      showError("Could not load conversations");
    }
  }, [conversationsQuery.isError]);

  useEffect(() => {
    if (adminChatQuery.isError) {
      showError("Could not load admin messages");
    }
  }, [adminChatQuery.isError]);

  useEffect(() => {
    if (!isChatChannel) return;
    const conversationUuid = searchParams.get("c")?.trim();
    if (!conversationUuid || !conversationsQuery.data?.length) return;
    const match = conversationsQuery.data.find((c) => c.uuid === conversationUuid);
    if (!match) return;
    setChannelFilter("whatsapp");
    setSelectedLeadId(match.uuid);
  }, [searchParams, conversationsQuery.data]);

  useEffect(() => {
    if (channelFilter !== "whatsapp") return;
    if (!filteredLeads.length) {
      if (selectedLeadId) setSelectedLeadId("");
      return;
    }
    if (!filteredLeads.some((l) => l.id === selectedLeadId)) {
      setSelectedLeadId(filteredLeads[0].id);
    }
  }, [isChatChannel, filteredLeads, selectedLeadId]);

  useEffect(() => {
    if (channelFilter === "admin" && adminLead) {
      setSelectedLeadId(adminLead.id);
    }
  }, [channelFilter, adminLead]);

  const activeRealtimeConversation = useMemo((): Conversation | null => {
    if (!isChatChannel || !selectedLeadId) return null;
    if (channelFilter === "admin") {
      return adminChatQuery.data ?? null;
    }
    return conversationsQuery.data?.find((c) => c.uuid === selectedLeadId) ?? null;
  }, [isChatChannel, channelFilter, selectedLeadId, conversationsQuery.data, adminChatQuery.data]);

  useMessagingRealtime(activeRealtimeConversation, selfId);

  const messagesInf = useInfiniteMessages(isChatChannel ? selectedLeadId : null);

  const { sendMessage: sendMessageAction, markAsRead, isSending } = useMessageActions(
    isChatChannel ? selectedLeadId : null,
    me,
  );

  const peerIsOnline = isPeerOnline(activeRealtimeConversation?.peer?.presence?.status);
  const lastMarkedPeerUuid = useRef<string | null>(null);

  useEffect(() => {
    lastMarkedPeerUuid.current = null;
  }, [selectedLeadId]);

  useEffect(() => {
    if (!isChatChannel || !selectedLeadId) return;
    const pages = messagesInf.data?.pages;
    if (!pages?.length) return;
    const chrono = flattenMessagesChronological(pages);
    const latestPeer = [...chrono]
      .reverse()
      .find((m) => m.sender.id !== selfId);
    if (!latestPeer || latestPeer.uuid === lastMarkedPeerUuid.current) return;
    lastMarkedPeerUuid.current = latestPeer.uuid;
    markAsRead(latestPeer.uuid);
  }, [isChatChannel, selectedLeadId, messagesInf.data, selfId, markAsRead]);

  const { typingUsers, signalTyping } = useTypingIndicator(
    activeRealtimeConversation
      ? { uuid: activeRealtimeConversation.uuid, id: activeRealtimeConversation.id }
      : null,
    me ? { id: me.id, name: me.name } : null,
  );

  const peerTyping = useMemo(
    () => typingUsers.filter((u) => u.is_typing && u.user_id !== selfId),
    [typingUsers, selfId],
  );

  const selectedConversation = useMemo(() => {
    const pages = messagesInf.data?.pages ?? [];
    if (!pages.length) return [];
    return flattenMessagesChronological(pages).map((m) =>
      messageToChatMessage(m, selfId),
    );
  }, [messagesInf.data, selfId]);

  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? null;

  const isDirectChannel = channelFilter === "direct";

  const handleSend = async () => {
    const t = messageDraft.trim();
    if ((!t && files.length === 0) || !selectedLeadId || isSending || fileBusy) return;

    if (files.length > 0) {
      const draftSnapshot = t;
      const filesSnapshot = [...files];
      setMessageDraft("");
      clearFiles();
      try {
        setFileBusy(true);
        const sent = await sendMessageWithAttachments(
          selectedLeadId,
          draftSnapshot || null,
          filesSnapshot,
        );
        appendOrMergeMessageInCache(queryClient, selectedLeadId, sent);
        if (me) {
          applyNewMessagePreview(queryClient, selectedLeadId, sent, {
            selfUserId: me.id,
            isActiveConversation: true,
          });
        }
        void queryClient.invalidateQueries({ queryKey: ["vendor-conversations"] });
        void queryClient.invalidateQueries({ queryKey: ["vendor-admin-chat"] });
      } catch {
        showError("Failed to send attachment");
        setMessageDraft(draftSnapshot);
        addFiles(filesSnapshot);
      } finally {
        setFileBusy(false);
      }
      return;
    }

    setMessageDraft("");
    try {
      await sendMessageAction(t);
      void queryClient.invalidateQueries({ queryKey: ["vendor-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-admin-chat"] });
    } catch {
      setMessageDraft(t);
    }
  };

  const chatLoading =
    (channelFilter === "admin" && adminChatQuery.isLoading) ||
    (channelFilter === "whatsapp" && conversationsQuery.isLoading);

  return (
    <div className="container mx-auto p-2 md:p-4">
      <div className="space-y-5 md:space-y-6">
        <LeadsHeader />

        {chatLoading ? (
          <p className="text-sm text-muted-foreground">Loading your inbox…</p>
        ) : null}

        <LeadsTabs
          channelFilter={channelFilter}
          onChange={(c) => {
            setChannelFilter(c);
            if (c === "direct") setChatSearch("");
            clearFiles();
            setMessageDraft("");
          }}
          directCount={directCount}
          whatsappCount={whatsappCount}
          adminCount={adminCount}
        />

        {isDirectChannel ? (
          <DirectLeadsTable leads={filteredLeads} onOpenLeadDetails={setOpenLeadDetails} />
        ) : (
          <div className="grid min-h-[min(640px,calc(100dvh-220px))] min-w-0 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
            <WhatsAppLeadsList
              leads={filteredLeads}
              selectedLeadId={selectedLeadId}
              onSelectLead={(id) => {
                setSelectedLeadId(id);
                setMessageDraft("");
                clearFiles();
              }}
              searchQuery={chatSearch}
              onSearchChange={setChatSearch}
              onNewConversation={
                channelFilter === "admin" ? undefined : () => setNewConversationOpen(true)
              }
            />
            <WhatsAppChatInterface
              selectedLead={selectedLead}
              selectedConversation={selectedConversation}
              peerIsOnline={peerIsOnline}
              newMessagesDividerAfterIndex={-1}
              messageDraft={messageDraft}
              onMessageDraftChange={setMessageDraft}
              onComposerTyping={signalTyping}
              onSend={handleSend}
              onFiles={addFiles}
              pendingFiles={files}
              onRemoveFile={removeFile}
              isSending={isSending}
              fileBusy={fileBusy}
              messagesLoading={messagesInf.isLoading}
              typingPeers={peerTyping}
            />
          </div>
        )}

        <LeadDetailsModal
          openLead={openLeadDetails}
          onClose={() => setOpenLeadDetails(null)}
        />

        <NewConversationModal
          open={newConversationOpen}
          onClose={() => setNewConversationOpen(false)}
          onCreated={(uuid) => {
            setChannelFilter("whatsapp");
            setSelectedLeadId(uuid);
            setMessageDraft("");
            clearFiles();
            void queryClient.invalidateQueries({ queryKey: ["vendor-conversations"] });
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(uuid) });
          }}
        />
      </div>
    </div>
  );
}
