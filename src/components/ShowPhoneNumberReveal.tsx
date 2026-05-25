import { useState } from "react";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/whatsappUrl";
import { cn } from "@/lib/utils";

type ShowPhoneNumberRevealProps = {
  className?: string;
  iconClassName?: string;
  /** Business phone from API (`phone` or `whatsapp`). */
  phoneNumber?: string | null;
  /** Use shadcn `Button` (e.g. favorites / service sidebar). */
  useShadcnButton?: boolean;
  /**
   * When true, stops the click (and space/enter on the control) from bubbling.
   * Use on cards whose parent navigates on click.
   */
  isolateFromParentClicks?: boolean;
};

export function ShowPhoneNumberReveal({
  className,
  iconClassName,
  phoneNumber,
  useShadcnButton = false,
  isolateFromParentClicks = true,
}: ShowPhoneNumberRevealProps) {
  const [shown, setShown] = useState(false);
  const displayPhone = phoneNumber ? formatPhoneDisplay(phoneNumber) : null;
  const hasPhone = Boolean(displayPhone);

  const isolateClick = (event: React.MouseEvent) => {
    if (!isolateFromParentClicks) return;
    event.stopPropagation();
  };

  const isolateKey = (event: React.KeyboardEvent) => {
    if (!isolateFromParentClicks) return;
    if (event.key === "Enter" || event.key === " ") {
      event.stopPropagation();
    }
    if (event.key === " ") {
      event.preventDefault();
    }
  };

  const reveal = () => setShown(true);

  if (shown && hasPhone) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 font-semibold tabular-nums tracking-wide",
          className,
          "cursor-default select-text",
        )}
      >
        <Phone className={iconClassName} aria-hidden />
        {displayPhone}
      </div>
    );
  }

  const content = (
    <>
      <Phone className={iconClassName} aria-hidden />
      {hasPhone ? "Show phone number" : "Phone unavailable"}
    </>
  );

  const disabledClass = !hasPhone ? "cursor-not-allowed opacity-60" : undefined;

  if (useShadcnButton) {
    return (
      <Button
        type="button"
        className={cn(className, disabledClass)}
        disabled={!hasPhone}
        onKeyDown={isolateKey}
        onClick={(event) => {
          isolateClick(event);
          if (!hasPhone) return;
          reveal();
        }}
      >
        {content}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={cn(className, disabledClass)}
      disabled={!hasPhone}
      onKeyDown={isolateKey}
      onClick={(event) => {
        isolateClick(event);
        if (!hasPhone) return;
        reveal();
      }}
    >
      {content}
    </button>
  );
}
