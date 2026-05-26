import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";
import { handleTradePageVendorCta } from "@/lib/tradeLanding";

export function LandingCta() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const authReady = !isSessionLoading && !isUserLoading;

  const onCreateProfile = () => {
    if (!authReady) return;
    void handleTradePageVendorCta({
      user,
      logout,
      isAuthenticated,
      navigate,
    });
  };

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div
        className={`${container} flex max-w-3xl flex-col items-center gap-6 text-center`}
      >
        <ScrollReveal>
          <h2 className="lg:text-3xl text-2xl font-bold text-ink sm:text-4xl sm:leading-10">
            Ready to Grow Your Business?
          </h2>
        </ScrollReveal>
        <ScrollReveal delayMs={90}>
          <p className="text-lg text-ink-muted">
            Join thousands of Nigerian vendors already trading on Gidira. Your
            first listing is completely free.
          </p>
        </ScrollReveal>
        <ScrollReveal delayMs={160}>
          <button
            type="button"
            disabled={!authReady}
            onClick={onCreateProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-10 py-4 text-base font-medium text-ice disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="size-5" />
            Create Your Business Profile
          </button>
        </ScrollReveal>
      </div>
    </section>
  );
}
