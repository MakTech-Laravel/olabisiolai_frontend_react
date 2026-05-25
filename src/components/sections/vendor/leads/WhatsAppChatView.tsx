import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { Avatar } from "@/components/ui/Avatar";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MESSAGING_ATTACHMENT_ACCEPT,
  MESSAGING_ATTACHMENT_MAX_COUNT,
  TYPING_DEBOUNCE_MS,
} from "@/constants/config";
import { cn } from "@/lib/utils";
import type { TypingUser } from "@/types/message";
import { Paperclip, Send, Smile } from "lucide-react";
import { MessageStatusIcon } from "@/components/chat/MessageStatusIcon";
import type { Message } from "@/types/message";
import { resolveOwnMessageDisplayStatus } from "@/utils/messageStatus";
import { type Lead, type ChatMessage } from "./leadsData";

export function WhatsAppChatInterface({
  selectedLead,
  selectedConversation,
  newMessagesDividerAfterIndex,
  messageDraft,
  onMessageDraftChange,
  onComposerTyping,
  onSend,
  onFiles,
  pendingFiles = [],
  onRemoveFile,
  isSending = false,
  fileBusy = false,
  messagesLoading = false,
  typingPeers = [],
  peerIsOnline = false,
}: {
  selectedLead: Lead | null;
  selectedConversation: ChatMessage[];
  newMessagesDividerAfterIndex: number;
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  /** Fires while the vendor types (drives API typing + realtime for the other party). */
  onComposerTyping?: () => void;
  onSend: () => void;
  onFiles?: (files: File[]) => void;
  pendingFiles?: File[];
  onRemoveFile?: (index: number) => void;
  isSending?: boolean;
  fileBusy?: boolean;
  messagesLoading?: boolean;
  typingPeers?: TypingUser[];
  peerIsOnline?: boolean;
}) {
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const emojiAnchorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const composerDisabled = !selectedLead || isSending || fileBusy;
  const canSend = messageDraft.trim().length > 0 || pendingFiles.length > 0;

  const handleDraftChange = (value: string) => {
    onMessageDraftChange(value);
    onComposerTyping?.();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onComposerTyping?.();
    }, TYPING_DEBOUNCE_MS);
  };

  const insertEmoji = (emoji: string) => {
    onMessageDraftChange(messageDraft + emoji);
    onComposerTyping?.();
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useLayoutEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedConversation, selectedLead?.id, messagesLoading]);

  return (
    <div className="flex min-h-[480px] min-w-0 max-h-[calc(100dvh-11rem)] flex-col overflow-hidden bg-[#FAF8FF]">
      <div className="shrink-0 border-b border-neutral-200 bg-[#FAF8FF] px-5 py-4">
        {selectedLead ? (
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-neutral-200/90 text-xs font-semibold text-neutral-700">
              {selectedLead.initials}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {selectedLead.name}
                {selectedLead.chatSubtitle
                  ? ` - ${selectedLead.chatSubtitle}`
                  : ""}
              </p>
              {peerIsOnline || selectedLead.online ? (
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                  Online
                </p>
              ) : (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Last seen {selectedLead.lastSeen}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No conversation selected
          </p>
        )}
      </div>

      <div
        ref={messagesScrollRef}
        className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-y-contain px-4 py-5 md:px-6"
      >
        {messagesLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading messages…</p>
        ) : null}
        {!messagesLoading && selectedLead && selectedConversation.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello below.</p>
        ) : null}
        {selectedConversation.map((message, idx) => (
          <Fragment key={message.id}>
            {idx === newMessagesDividerAfterIndex + 1 &&
              newMessagesDividerAfterIndex >= 0 ? (
              <div className="relative py-6">
                <div className="absolute inset-x-0 top-1/2 border-t border-neutral-200" />
                <p className="relative mx-auto w-fit bg-[#f5f6fa] px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  New messages
                </p>
              </div>
            ) : null}
            {message.from === "lead" ? (
              <div className="mb-4 flex w-full min-w-0 items-end gap-2">
                <Avatar
                  src={selectedLead?.avatarUrl}
                  name={selectedLead?.name ?? "Lead"}
                  className="size-8 shrink-0 rounded-full"
                />
                <div className="min-w-0 max-w-[min(100%,18rem)] sm:max-w-md">
                  <div className="rounded-2xl rounded-bl-md bg-[#e8e6f4] px-3.5 py-2.5 text-sm leading-relaxed wrap-anywhere text-foreground shadow-sm">
                    {message.text ? <p>{message.text}</p> : null}
                    <AttachmentPreview items={message.attachments ?? []} />
                  </div>
                  <p className="mt-1 pl-1 text-[11px] text-muted-foreground">
                    {message.time}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex w-full min-w-0 justify-end">
                <div className="min-w-0 max-w-[min(100%,18rem)] text-right sm:max-w-md">
                  <div className="rounded-2xl rounded-br-md bg-sky-600 px-3.5 py-2.5 text-left text-sm leading-relaxed wrap-anywhere text-white shadow-sm">
                    {message.text ? <p>{message.text}</p> : null}
                    <AttachmentPreview items={message.attachments ?? []} />
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 pr-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {message.time}
                    </span>
                    <MessageStatusIcon
                      isOwn
                      peerIsOnline={peerIsOnline}
                      status={resolveOwnMessageDisplayStatus(
                        {
                          uuid: message.id,
                          status: message.status ?? "sent",
                        } as Message,
                        peerIsOnline,
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <div className="shrink-0 border-t border-chat-border-footer bg-card px-3 pt-2 sm:px-4">
        <TypingIndicator users={typingPeers} />
      </div>
      {pendingFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-chat-border bg-card px-4 py-2">
          {pendingFiles.map((f, i) => (
            <button
              key={`${f.name}-${f.size}-${i}`}
              type="button"
              className="rounded-lg bg-muted px-2 py-1 text-xs"
              onClick={() => onRemoveFile?.(i)}
            >
              {f.name} ×
            </button>
          ))}
        </div>
      ) : null}
      <footer className="flex shrink-0 items-end gap-2 border-t border-chat-border-footer bg-card px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={MESSAGING_ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) {
              onFiles?.(Array.from(list).slice(0, MESSAGING_ATTACHMENT_MAX_COUNT));
            }
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-xl text-ink hover:bg-muted"
          aria-label="Attach file"
          disabled={composerDisabled}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-5" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Textarea
            value={messageDraft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Type your message here..."
            disabled={composerDisabled}
            className="max-h-32 min-h-12 overflow-y-auto rounded-2xl border-0 bg-chat-input-bg py-3 pl-5 pr-12 text-sm text-ink scrollbar-hide placeholder:text-placeholder-text focus-visible:ring-2 focus-visible:ring-chat-accent-ring"
          />
          <div ref={emojiAnchorRef} className="absolute bottom-1.5 right-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-stat-muted hover:bg-transparent hover:text-ink"
              aria-label="Emoji"
              disabled={composerDisabled}
              onClick={() => setEmojiOpen((open) => !open)}
            >
              <Smile className="size-5" />
            </Button>
            <EmojiPicker
              open={emojiOpen}
              onClose={() => setEmojiOpen(false)}
              onPick={insertEmoji}
              anchorRef={emojiAnchorRef}
            />
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          disabled={composerDisabled || !canSend}
          className={cn(
            "size-11 shrink-0 rounded-xl bg-chat-accent text-text-white shadow-md hover:opacity-90 sm:size-12",
          )}
          aria-label="Send message"
          onClick={onSend}
        >
          <Send className="size-5" />
        </Button>
      </footer>
    </div>
  );
}
