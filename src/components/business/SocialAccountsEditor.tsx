import { Plus, X } from "lucide-react";

import { SocialPlatformIcon } from "@/components/business/SocialPlatformIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  emptySocialAccount,
  SOCIAL_PLATFORM_OPTIONS,
  type SocialAccount,
  type SocialPlatform,
} from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

type SocialAccountsEditorProps = {
  accounts: SocialAccount[];
  onChange: (accounts: SocialAccount[]) => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  showIntro?: boolean;
};

export function SocialAccountsEditor({
  accounts,
  onChange,
  disabled,
  error,
  className,
  showIntro = true,
}: SocialAccountsEditorProps) {
  const rows = accounts.length > 0 ? accounts : [];

  const updateRow = (index: number, patch: Partial<SocialAccount>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    if (rows.length >= 10) return;
    onChange([...rows, emptySocialAccount()]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showIntro ? (
        <p className="text-sm text-muted-foreground">
          Add your social handles (e.g. @gidira) or full profile links. Visitors can tap the icons on your business page.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No social accounts added yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={`${row.platform}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-border-light bg-secondary/40 p-4 sm:flex-row sm:items-end"
            >
              <div className="sm:w-44">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Platform
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <SocialPlatformIcon platform={row.platform} variant="brand" className="size-5" />
                  </span>
                  <select
                    value={row.platform}
                    disabled={disabled}
                    onChange={(e) =>
                      updateRow(index, { platform: e.target.value as SocialPlatform })
                    }
                    className="h-11 w-full appearance-none rounded-md border border-border-light bg-background pl-10 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25"
                  >
                    {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile link
                </label>
                <Input
                  type="text"
                  value={row.url}
                  disabled={disabled}
                  placeholder="@gidira or https://instagram.com/gidira"
                  onChange={(e) => updateRow(index, { url: e.target.value })}
                  className="h-11 border-border-light bg-background text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => removeRow(index)}
                className="shrink-0 self-end text-muted-foreground hover:text-destructive"
                aria-label="Remove social account"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={disabled || rows.length >= 10}
        onClick={addRow}
        className="h-10 rounded-xl border-dashed border-border-light"
      >
        <Plus className="mr-2 size-4" aria-hidden />
        Add social account
      </Button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
