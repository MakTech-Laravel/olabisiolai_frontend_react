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
  const [searchParams] = useSearchParams();
  const businessIdParam = Number(searchParams.get("business_id") ?? "");
  const scope = searchParams.get("scope");
  const inboxScope: MessagingInboxKey | undefined =
    Number.isFinite(businessIdParam) && businessIdParam > 0
      ? (`business:${businessIdParam}` as const)
      : scope === "personal"
        ? "personal"
        : undefined;

  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "messages-title"],
    queryFn: fetchUserBusinesses,
    enabled: Boolean(inboxScope?.startsWith("business:")),
    staleTime: 60_000,
  });

  const businessTitle =
    inboxScope?.startsWith("business:") && Number.isFinite(businessIdParam)
      ? businessesQuery.data?.find((business) => business.id === businessIdParam)?.businessName
      : null;

  const pageTitle =
    inboxScope === "personal"
      ? "Your messages"
      : businessTitle
        ? `${businessTitle} messages`
        : "Messages";

  const { starting, pendingPeer } = useStartDirectConversation({
    isAuthenticated,
    conversationQueryParam: "c",
    messagesPath: "/user/messages",
  });

  return (
    <div className="flex min-h-screen flex-col bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-3 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-4 lg:px-6 lg:pb-6">
        <div className="relative min-h-[min(640px,calc(100dvh-7rem))] flex-1">
          {starting || pendingPeer ? (
            <div
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80",
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
          />
        </div>
      </main>
    </div>
  );
}
