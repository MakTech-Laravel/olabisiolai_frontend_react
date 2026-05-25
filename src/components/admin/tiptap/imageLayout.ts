import type { Editor } from "@tiptap/react";

import type { ImageAlign, ImageWidthPreset } from "@/components/admin/tiptap/ResizableImage";
import { getImageLayout, getSelectedImagePos } from "@/components/admin/tiptap/imageSelection";

export type ImageLayoutPatch = {
  size?: string | ImageWidthPreset;
  align?: ImageAlign;
};

/** Apply size and/or position together without dropping the other attribute. */
export function updateImageLayout(editor: Editor, patch: ImageLayoutPatch): boolean {
  const pos = getSelectedImagePos(editor);
  if (pos === null) return false;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "image") return false;

  const current = getImageLayout(editor);
  const nextSize = patch.size ?? current.size;
  const usePresetSize = patch.size !== undefined;

  return editor
    .chain()
    .setNodeSelection(pos)
    .updateAttributes("image", {
      size: nextSize,
      align: patch.align ?? current.align,
      ...(usePresetSize ? { width: null, height: null } : {}),
    })
    .run();
}

export { getImageLayout };
