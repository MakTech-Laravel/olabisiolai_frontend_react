import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { fetchUserBusinesses } from "@/api/userBusinesses";
import { useAuth } from "@/auth/useAuth";
import { UserShell } from "@/components/partials/user/UserShell";
import { MessagingLayout } from "@/features/messaging/MessagingLayout";
import type { MessagingInboxKey } from "@/features/messaging/MessagingInboxTabs";
import { useStartDirectConversation } from "@/hooks/useStartDirectConversation";
import { cn } from "@/lib/utils";

const LOGO_FOOTER = "/images/landing/gidira-logo-footer.svg";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Gidira", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Careers", to: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Cookies Policy", to: "/cookies-policy" },
    ],
  },
  {
    title: "Resources",
    links: [{ label: "FAQs", to: "/faq" }],
  },
] as const;

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
    <>
      <UserShell active="messages">
        <div className="relative min-h-[min(640px,70vh)]">
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
      </UserShell>

      <footer className="bg-footer-bar">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-14 xl:px-12">
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <div>
              <img src={LOGO_FOOTER} alt="Gidira" className="h-8 w-auto" />
              <p className="mt-4 text-sm text-white">FIND BETTER | CONNECT FASTER</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 className="text-base font-semibold text-white">{column.title}</h4>
                  <ul className="mt-4 space-y-2">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.to} className="text-sm text-footer-muted hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-8 text-center">
            <p className="text-sm text-footer-muted">
              © 2026 GIDIRA. All rights reserved. Built for Nigeria&apos;s Digital Economy.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
