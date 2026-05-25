import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import {
  CUSTOMER_LOGIN_PATH,
  loginReturnFromLocation,
} from "@/features/auth/loginReturn";
import { MessagingLayout } from "@/features/messaging/MessagingLayout";
import { useStartDirectConversation } from "@/hooks/useStartDirectConversation";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

export default function DirectMessage() {
  const { user, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { from?: string } | null;
  const from = state?.from;

  const { starting, pendingPeer } = useStartDirectConversation({
    isAuthenticated,
    conversationQueryParam: "c",
    messagesPath: "/messages",
  });

  const goBack = () => {
    if (
      typeof from === "string" &&
      from.startsWith("/") &&
      !from.startsWith("//")
    ) {
      navigate(from);
      return;
    }
    navigate(-1);
  };

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={CUSTOMER_LOGIN_PATH}
        replace
        state={{ from: loginReturnFromLocation(location) }}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-bg-section pb-16 pt-6 font-sans text-ink md:pt-10">
      <div className={cn(container)}>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-base font-normal text-accent-foreground hover:underline"
        >
          <ArrowLeft className="size-6 shrink-0" aria-hidden />
          Back
        </button>

        <div
          className={cn(
            "relative mt-6 flex max-h-[min(1024px,calc(100dvh-10rem))] min-h-[min(640px,calc(100dvh-12rem))] flex-col overflow-hidden rounded-2xl border border-chat-border bg-chat-surface shadow-lg",
          )}
        >
          {starting || pendingPeer ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-chat-surface/90">
              <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
              <p className="text-sm font-medium text-stat-muted">
                Opening conversation…
              </p>
            </div>
          ) : null}
          <MessagingLayout selfUser={user} conversationQueryParam="c" />
        </div>
      </div>
    </div>
  );
}
