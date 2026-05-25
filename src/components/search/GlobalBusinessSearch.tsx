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
  const [searchParams] = useSearchParams();
  const urlSearch = (searchParams.get("search") ?? "").trim();
  const [query, setQuery] = useState(urlSearch);

  useEffect(() => {
    if (pathname === "/filters") {
      setQuery(urlSearch);
    }
  }, [pathname, urlSearch]);

  const goToFilters = (raw: string) => {
    const term = raw.trim();
    const next = new URLSearchParams();
    if (term) next.set("search", term);
    const qs = next.toString();
    navigate(qs ? `/filters?${qs}` : "/filters");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToFilters(query);
  };

  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex justify-center", className)}
        role="search"
        aria-label="Search businesses"
      >
        <InputGroup className="max-w-2xl border-muted bg-transparent px-1 py-6">
          <InputGroupInput
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER}
            className="text-sm text-text-primary placeholder:text-xs placeholder:text-muted-foreground sm:text-base sm:placeholder:text-sm"
            aria-label="Search businesses"
          />
          <InputGroupAddon
            align="inline-end"
            className="cursor-pointer rounded-lg bg-primary p-3"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-6 w-6 text-primary-foreground" />
            </button>
          </InputGroupAddon>
        </InputGroup>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      role="search"
      aria-label="Search businesses"
    >
      <div className="relative">
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
            "h-11 w-full rounded-xl border border-border-light bg-card pl-10 pr-3 text-sm text-foreground",
            "outline-none ring-0 transition focus:border-brand/50",
          )}
        />
      </div>
    </form>
  );
}
