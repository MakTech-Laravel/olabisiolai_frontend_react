import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { seedNewConversationInCache } from "@/features/messaging/conversationCache";
import { startDirectConversationWithVendor } from "@/features/messaging/startDirectConversation";
import { directMessageTo } from "@/lib/directMessage";
import { showError } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

type DirectMessageButtonProps = {
  businessInfoId: number;
  vendorUserUuid?: string | null;
  fromPath: string;
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
  messagesPath?: "/messages" | "/user/messages";
  disabled?: boolean;
  disabledReason?: string;
};

/**
 * Creates (or reopens) a direct chat with the vendor, then navigates with `?c=<uuid>`.
 */
export function DirectMessageButton({
  businessInfoId,
  vendorUserUuid,
  fromPath,
  className,
  iconClassName = "w-4 h-4 mr-1.5",
  children,
  messagesPath = "/messages",
  disabled = false,
  disabledReason = "You cannot message your own business",
}: DirectMessageButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled || loading) return;
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      requireAuthNavigate(
        directMessageTo(
          {
            from: fromPath,
            participantUserUuid: vendorUserUuid ?? undefined,
            businessInfoId,
          },
          messagesPath,
        ),
      );
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const conv = await startDirectConversationWithVendor({
          vendorUserUuid,
          businessInfoId,
        });

        seedNewConversationInCache(queryClient, conv, "personal");

        const search = new URLSearchParams();
        search.set('scope', 'personal');
        search.set('c', conv.uuid);

        navigate(
          {
            pathname: messagesPath,
            search: `?${search.toString()}`,
          },
          { state: { from: fromPath } },
        );
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Could not start conversation";
        showError(message);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      title={disabled ? disabledReason : undefined}
      onClick={handleClick}
      className={cn(
        "border border-primary text-primary rounded-lg flex items-center justify-center font-semibold hover:bg-primary/10 transition-colors text-sm",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
        className,
      )}
    >
      {loading ? (
        <Loader2 className={cn("animate-spin", iconClassName)} aria-hidden />
      ) : (
        <MessageCircle className={iconClassName} aria-hidden />
      )}
      {loading ? "Opening…" : (children ?? "Direct Message")}
    </button>
  );
}
