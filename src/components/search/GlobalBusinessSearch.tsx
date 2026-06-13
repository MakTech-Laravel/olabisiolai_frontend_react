import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const PLACEHOLDER =
  "Search by business name, category, or location...";

type GlobalBusinessSearchProps = {
  variant?: "hero" | "header";
  className?: string;
};

export function GlobalBusinessSearch({
  variant = "header",
  className,
}: GlobalBusinessSearchProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = (searchParams.get("search") ?? "").trim();
  const [query, setQuery] = useState(urlSearch);

  useEffect(() => {
    if (pathname === "/filters") {
      setQuery(urlSearch);
    }
  }, [pathname, urlSearch]);

  const applySearch = (raw: string) => {
    const term = raw.trim();

    if (pathname === "/filters") {
      const next = new URLSearchParams(searchParams);
      if (term) {
        next.set("search", term);
      } else {
        next.delete("search");
      }
      next.delete("page");
      setSearchParams(next, { replace: true });
      return;
    }

    const next = new URLSearchParams();
    if (term) {
      next.set("search", term);
    }
    const qs = next.toString();
    navigate(qs ? `/filters?${qs}` : "/filters");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    applySearch(query);
  };

  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("mx-auto w-full max-w-2xl px-1 sm:px-0", className)}
        role="search"
        aria-label="Search businesses"
      >
        <InputGroup className="w-full min-w-0 border-muted bg-transparent px-1 py-2 sm:py-4 lg:py-6">
          <InputGroupInput
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER}
            className="min-w-0 text-sm text-text-primary placeholder:text-xs placeholder:text-muted-foreground sm:text-base sm:placeholder:text-sm"
            aria-label="Search businesses"
          />
          <InputGroupAddon
            align="inline-end"
            className="shrink-0 cursor-pointer rounded-lg bg-primary p-2 sm:p-3"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="size-5 text-primary-foreground sm:h-6 sm:w-6" />
            </button>
          </InputGroupAddon>
        </InputGroup>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full min-w-0", className)}
      role="search"
      aria-label="Search businesses"
    >
      <div className="relative min-w-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={PLACEHOLDER}
          aria-label="Search businesses"
          className={cn(
            "h-10 w-full min-w-0 rounded-xl border border-border-light bg-card pl-9 pr-12 text-sm text-foreground sm:h-11 sm:pl-10 sm:pr-14 sm:text-base",
            "outline-none ring-0 transition focus:border-brand/50",
            "placeholder:text-xs sm:placeholder:text-sm",
          )}
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg bg-brand-red text-white transition hover:bg-brand-red/90 sm:size-9"
          aria-label="Search"
        >
          <Search className="size-4 sm:size-[18px]" aria-hidden />
        </button>
      </div>
    </form>
  );
}
