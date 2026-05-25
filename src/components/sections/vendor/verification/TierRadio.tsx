import { cn } from "@/lib/utils";

export function TierRadio({ selected }: { selected: boolean }) {
    return (
        <span
            className={cn(
                "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-card transition-colors",
                selected ? "border-brand-red" : "border-neutral-300",
            )}
            aria-hidden
        >
            {selected ? <span className="size-2.5 rounded-full bg-brand-red" /> : null}
        </span>
    );
}
