import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { QUERY_KEYS } from "@/constants/queryKeys";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { startDirectConversationWithVendor } from "@/features/messaging/startDirectConversation";
import { directMessageTo } from "@/lib/directMessage";
import {
  B2B_MESSAGING_DISABLED_REASON,
  canMessageBusinessListing,
} from "@/lib/messagingInitiation";
import { showError } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";

type DirectMessageButtonProps = {
  businessInfoId: number;
  vendorUserId?: number | null;
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
  vendorUserId,
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
  const { user } = useAuth();
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();
  const [loading, setLoading] = useState(false);

  const blockedForVendorAccount = Boolean(user) && !canMessageBusinessListing(user, vendorUserId);
  const isDisabled = disabled || blockedForVendorAccount;
  const resolvedDisabledReason = blockedForVendorAccount
    ? B2B_MESSAGING_DISABLED_REASON
    : disabledReason;

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isDisabled || loading) return;
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

        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

        navigate(
          {
            pathname: messagesPath,
            search: `?c=${encodeURIComponent(conv.uuid)}`,
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
      disabled={isDisabled || loading}
      title={isDisabled ? resolvedDisabledReason : undefined}
      onClick={handleClick}
      className={cn(
        "border border-primary text-primary rounded-lg flex items-center justify-center font-semibold hover:bg-primary/10 transition-colors text-sm",
        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
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
