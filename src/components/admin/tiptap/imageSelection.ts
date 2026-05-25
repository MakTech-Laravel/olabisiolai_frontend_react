import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";

import type { ImageAlign } from "@/components/admin/tiptap/ResizableImage";
import { formatImageSizeLabel } from "@/components/admin/tiptap/ResizableImage";

export function getSelectedImagePos(editor: Editor): number | null {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection && selection.node.type.name === "image") {
    return selection.from;
  }

  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "image") {
      return $from.before(depth);
    }
  }

  return null;
}

export function isImageNodeSelected(editor: Editor): boolean {
  return getSelectedImagePos(editor) !== null;
}

export function getImageLayout(editor: Editor): {
  size: string;
  align: ImageAlign;
  width: number | null;
  height: number | null;
  sizeLabel: string;
} {
  const pos = getSelectedImagePos(editor);
  if (pos === null) {
    return { size: "100%", align: "center", width: null, height: null, sizeLabel: "100%" };
  }

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "image") {
    return { size: "100%", align: "center", width: null, height: null, sizeLabel: "100%" };
  }

  const width = typeof node.attrs.width === "number" ? node.attrs.width : null;
  const height = typeof node.attrs.height === "number" ? node.attrs.height : null;
  const size = (node.attrs.size as string | undefined) ?? "100%";
  const align = (node.attrs.align as ImageAlign | undefined) ?? "center";

  return {
    size,
    align,
    width,
    height,
    sizeLabel: formatImageSizeLabel({ size, width, height }),
  };
}
