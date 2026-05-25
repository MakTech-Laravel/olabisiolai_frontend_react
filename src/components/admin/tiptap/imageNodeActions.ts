import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";

import { getSelectedImagePos } from "@/components/admin/tiptap/imageSelection";

/** Swap the selected image with its sibling above or below. */
export function moveSelectedBlock(editor: Editor, direction: "up" | "down"): boolean {
  const pos = getSelectedImagePos(editor);
  if (pos === null) return false;

  const { state, view } = editor;
  const node = state.doc.nodeAt(pos);
  if (!node || node.type.name !== "image") return false;

  const $pos = state.doc.resolve(pos);
  const index = $pos.index();
  const parent = $pos.parent;

  if (direction === "up") {
    if (index === 0) return false;
    const prev = parent.child(index - 1);
    const insertPos = pos - prev.nodeSize;
    const tr = state.tr.delete(pos, pos + node.nodeSize).insert(insertPos, node);
    tr.setSelection(NodeSelection.create(tr.doc, insertPos));
    view.dispatch(tr);
    return true;
  }

  if (index >= parent.childCount - 1) return false;
  const next = parent.child(index + 1);
  const insertPos = pos + next.nodeSize;
  const tr = state.tr.delete(pos, pos + node.nodeSize).insert(insertPos, node);
  tr.setSelection(NodeSelection.create(tr.doc, insertPos));
  view.dispatch(tr);
  return true;
}
