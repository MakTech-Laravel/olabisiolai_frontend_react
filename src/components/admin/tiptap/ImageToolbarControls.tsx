import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { updateImageLayout } from "@/components/admin/tiptap/imageLayout";
import { moveSelectedBlock } from "@/components/admin/tiptap/imageNodeActions";
import { getImageLayout } from "@/components/admin/tiptap/imageSelection";
import {
  IMAGE_ALIGN_OPTIONS,
  IMAGE_WIDTH_PRESETS,
  nextImageWidth,
  parseImageWidthPercent,
} from "@/components/admin/tiptap/ResizableImage";
import { cn } from "@/lib/utils";

function ControlButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-body-secondary transition-colors",
        "hover:bg-muted hover:text-ink",
        active && "bg-surface-soft text-chat-accent",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-6 w-px shrink-0 bg-border-gray" aria-hidden />;
}

type ImageToolbarControlsProps = {
  editor: Editor;
  compact?: boolean;
};

export function ImageToolbarControls({ editor, compact }: ImageToolbarControlsProps) {
  const { size: imageSize, align: imageAlign, width: imageWidthPx, sizeLabel } = getImageLayout(editor);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5",
        compact ? "rounded-lg border border-border-gray bg-card px-1.5 py-1 shadow-md" : "",
      )}
      role="group"
      aria-label="Image size and position"
    >
      <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-chat-accent">
        Image
      </span>
      <span className="mr-1 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-body-secondary">
        {sizeLabel} · {imageAlign}
      </span>
      <span className="mr-1 hidden text-[10px] text-chat-meta sm:inline">Drag corners to resize</span>

      <Divider />

      <span className="px-0.5 text-[10px] text-chat-meta">Size</span>
      <ControlButton
        label="Smaller"
        onClick={() => updateImageLayout(editor, { size: nextImageWidth(imageSize, "smaller") })}
      >
        <ZoomOut className="size-4" />
      </ControlButton>
      <ControlButton
        label="Larger"
        onClick={() => updateImageLayout(editor, { size: nextImageWidth(imageSize, "larger") })}
      >
        <ZoomIn className="size-4" />
      </ControlButton>
      {IMAGE_WIDTH_PRESETS.map((preset) => (
        <ControlButton
          key={preset}
          label={`Width ${preset}`}
          onClick={() => updateImageLayout(editor, { size: preset })}
          active={
            imageWidthPx === null &&
            parseImageWidthPercent(imageSize) === parseImageWidthPercent(preset)
          }
        >
          <span className="text-[10px] font-bold">{preset}</span>
        </ControlButton>
      ))}

      <Divider />

      <span className="px-0.5 text-[10px] text-chat-meta">Position</span>
      {IMAGE_ALIGN_OPTIONS.map((align) => (
        <ControlButton
          key={align}
          label={`Align ${align}`}
          onClick={() => updateImageLayout(editor, { align })}
          active={imageAlign === align}
        >
          {align === "left" ? (
            <AlignLeft className="size-4" />
          ) : align === "right" ? (
            <AlignRight className="size-4" />
          ) : (
            <AlignCenter className="size-4" />
          )}
        </ControlButton>
      ))}
      <ControlButton label="Move up" onClick={() => moveSelectedBlock(editor, "up")}>
        <ArrowUp className="size-4" />
      </ControlButton>
      <ControlButton label="Move down" onClick={() => moveSelectedBlock(editor, "down")}>
        <ArrowDown className="size-4" />
      </ControlButton>
    </div>
  );
}
