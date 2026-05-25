import * as React from "react";
import { showError } from "@/lib/sweetAlert";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { createConversation } from "@/api/conversations";
import { useAuth } from "@/auth/useAuth";
import {
  CUSTOMER_LOGIN_PATH,
  loginReturnFromLocation,
} from "@/features/auth/loginReturn";
import { MessagingLayout } from "@/features/messaging/MessagingLayout";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

export default function DirectMessage() {
  const { user, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const paramC = searchParams.get("c");
  const state = location.state as
    | { participantUserUuid?: string; from?: string }
    | null;
  const from = state?.from;

  React.useEffect(() => {
    const peerUuid = state?.participantUserUuid?.trim().toUpperCase();
    if (!peerUuid || paramC || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const conv = await createConversation([peerUuid]);
        if (cancelled) return;
        navigate(
          `/messages?c=${encodeURIComponent(conv.uuid)}`,
          { replace: true, state: { from: state?.from } },
        );
      } catch {
        showError("Could not start conversation");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state?.participantUserUuid, state?.from, paramC, isAuthenticated, navigate]);

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
            "mt-6 flex max-h-[min(1024px,calc(100dvh-10rem))] min-h-[min(640px,calc(100dvh-12rem))] flex-col overflow-hidden rounded-2xl border border-chat-border bg-chat-surface shadow-lg",
          )}
        >
          <MessagingLayout selfUser={user} conversationQueryParam="c" />
        </div>
      </div>
    </div>
  );
}
