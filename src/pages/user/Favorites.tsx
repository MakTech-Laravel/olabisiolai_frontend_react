import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Heart,
  ListFilter,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  fetchUserFavorites,
  USER_FAVORITES_DEFAULT_PER_PAGE,
  type UserFavoriteBusiness,
} from "@/api/favorites";
import { FavoriteBusinessCard } from "@/components/partials/user/FavoriteBusinessCard";
import { UserShell } from "@/components/partials/user/UserShell";
import { Button } from "@/components/ui/button";
import { userFavoriteImage, userFavoriteLocationLabel } from "@/lib/userFavoriteDisplay";

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

function mapFavoriteToCardProps(item: UserFavoriteBusiness) {
  return {
    businessInfoId: item.business_info_id,
    title: item.business_name,
    category: item.category_name,
    location: userFavoriteLocationLabel(item),
    rating: item.rating,
    reviews: item.reviews_count,
    image: userFavoriteImage(item),
    verified: item.is_verified,
    phone: item.phone,
    whatsapp: item.whatsapp,
    vendorUserUuid: item.vendor_user_uuid,
  };
}

export default function Favorites() {
  const [page, setPage] = useState(1);

  const favoritesQuery = useQuery({
    queryKey: ["user-favorites", page, USER_FAVORITES_DEFAULT_PER_PAGE],
    queryFn: () =>
      fetchUserFavorites({ page, per_page: USER_FAVORITES_DEFAULT_PER_PAGE }),
  });

  const payload = favoritesQuery.data;
  const favorites = payload?.favorites ?? [];
  const pagination = payload?.pagination;
  const lastPage = pagination?.last_page ?? 1;

  return (
    <>
      <UserShell active="favorites">
        <section className="min-h-0 flex-1 bg-chat-surface p-3 sm:p-6 lg:min-h-screen lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-ink sm:text-3xl md:text-4xl">Favorites</h1>
              <p className="mt-2 text-sm font-medium text-body-secondary sm:text-base">
                Manage and book your curated list of preferred service providers.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-12 shrink-0 items-center gap-3 self-start rounded-full bg-surface-soft px-5 text-sm font-semibold leading-none text-chat-accent shadow-none sm:h-14 sm:px-6"
            >
              <ListFilter className="size-5 text-chat-accent" strokeWidth={2.2} aria-hidden />
              All Services
            </button>
          </div>

          {favoritesQuery.isLoading ? (
            <p className="mt-6 text-sm font-medium text-body-secondary sm:mt-8">
              Loading your favorites…
            </p>
          ) : favoritesQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:mt-8">
              <p className="text-sm font-medium text-ink">Could not load favorites.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void favoritesQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : favorites.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border-light bg-card p-8 text-center sm:mt-8">
              <Heart className="mx-auto size-10 text-chat-accent/40" aria-hidden />
              <p className="mt-4 text-sm font-medium text-body-secondary">
                You have not saved any businesses yet. Browse services and tap the heart on a listing to
                add it here.
              </p>
              <Button className="mt-6 rounded-full" asChild>
                <Link to="/filters">Browse services</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 xl:grid-cols-2">
                {favorites.map((item) => (
                  <FavoriteBusinessCard key={item.business_info_id} {...mapFavoriteToCardProps(item)} />
                ))}
              </div>

              {lastPage > 1 ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || favoritesQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-body-secondary">
                    Page {pagination?.current_page ?? page} of {lastPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage || favoritesQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}

          <section className="mt-6 flex flex-col gap-5 rounded-2xl border border-success/10 bg-brand p-5 sm:mt-8 sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-ice sm:text-2xl md:text-3xl">Want to discover more?</h2>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-ice sm:text-base">
                Based on your favorites, we think you&apos;ll love these personalized recommendations in your
                area.
              </p>
            </div>
            <Button className="h-12 w-full shrink-0 rounded-full bg-brand-red px-6 text-sm font-semibold text-ice hover:bg-brand-red/90 sm:h-14 sm:w-auto sm:px-8 sm:text-base" asChild>
              <Link to="/filters" className="inline-flex items-center justify-center gap-2">
                Explore More Services
                <ArrowUpRight className="size-5" aria-hidden />
              </Link>
            </Button>
          </section>
        </section>
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
