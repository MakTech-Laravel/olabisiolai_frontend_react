import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { fetchUserBusinesses } from "@/api/userBusinesses";
import { useAuth } from "@/auth/useAuth";
import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";
import { MessagingLayout } from "@/features/messaging/MessagingLayout";
import type { MessagingInboxKey } from "@/features/messaging/MessagingInboxTabs";
import { useStartDirectConversation } from "@/hooks/useStartDirectConversation";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const businessIdParam = Number(searchParams.get("business_id") ?? "");
  const scope = searchParams.get("scope");
  const isChatOpen = Boolean(searchParams.get("c"));

  useEffect(() => {
    document.body.classList.add("messages-page-active");
    return () => {
      document.body.classList.remove("messages-page-active");
    };
  }, []);

  useEffect(() => {
    const hasBusiness = Number.isFinite(businessIdParam) && businessIdParam > 0;
    if (!scope && !hasBusiness) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("scope", "personal");
          return next;
        },
        { replace: true },
      );
    }
  }, [scope, businessIdParam, setSearchParams]);

  const inboxScope: MessagingInboxKey =
    Number.isFinite(businessIdParam) && businessIdParam > 0
      ? (`business:${businessIdParam}` as const)
      : "personal";

  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "messages-title"],
    queryFn: fetchUserBusinesses,
    enabled: inboxScope.startsWith("business:"),
    staleTime: 60_000,
  });

  const businessTitle =
    inboxScope.startsWith("business:") && Number.isFinite(businessIdParam)
      ? businessesQuery.data?.find((business) => business.id === businessIdParam)?.businessName
      : null;

  const pageTitle =
    inboxScope === "personal"
      ? "Messages"
      : businessTitle
        ? `${businessTitle} messages`
        : "Business messages";

  const pageSubtitle =
    inboxScope === "personal"
      ? "Your personal conversations"
      : "Customer enquiries for this business";

  const { starting, pendingPeer } = useStartDirectConversation({
    isAuthenticated,
    conversationQueryParam: "c",
    messagesPath: "/user/messages",
    inboxScope: "personal",
  });

  return (
    <div
      className={cn(
        "flex flex-col bg-auth-bg text-ink",
        "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-30 max-lg:flex max-lg:overflow-hidden",
        "max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]",
        "lg:flex lg:h-dvh lg:overflow-hidden",
      )}
    >
      <FrontendHeader compactOnMobile={isChatOpen} />

      <main
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col overflow-hidden",
          "max-lg:px-0 max-lg:py-0",
          "px-3 py-4 sm:px-4 lg:flex-1 lg:px-6 lg:py-5",
        )}
      >
        <div
          className={cn(
            "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
            "lg:max-h-none lg:rounded-2xl lg:border lg:border-chat-border lg:bg-chat-surface lg:shadow-sm",
          )}
        >
          {starting || pendingPeer ? (
            <div
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80",
              )}
            >
              <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
              <p className="text-sm font-medium text-muted-foreground">
                Opening conversation…
              </p>
            </div>
          ) : null}
          <MessagingLayout
            selfUser={user}
            conversationQueryParam="c"
            inboxScope={inboxScope}
            title={pageTitle}
            subtitle={pageSubtitle}
          />
        </div>
      </main>
    </div>
  );
}
