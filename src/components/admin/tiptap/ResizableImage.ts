import Image from "@tiptap/extension-image";
import { Extension, mergeAttributes, ResizableNodeView } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";

export const IMAGE_WIDTH_PRESETS = ["25%", "50%", "75%", "100%"] as const;

export type ImageWidthPreset = (typeof IMAGE_WIDTH_PRESETS)[number];

export const IMAGE_ALIGN_OPTIONS = ["left", "center", "right"] as const;

export type ImageAlign = (typeof IMAGE_ALIGN_OPTIONS)[number];

/** Block wrapper alignment (editor node view + saved HTML via img margins). */
export function buildContainerAlignStyle(
  align: ImageAlign,
  attrs: { size?: string | null; width?: number | null },
): string {
  const widthPx = typeof attrs.width === "number" && attrs.width > 0 ? attrs.width : null;
  const isFullWidth =
    widthPx === null &&
    (attrs.size === null ||
      attrs.size === undefined ||
      parseImageWidthPercent(attrs.size) >= 100);

  if (isFullWidth) {
    return "display: block; width: 100%; max-width: 100%; clear: both; margin: 1rem 0;";
  }

  if (align === "left") {
    return "display: block; width: fit-content; max-width: 100%; clear: both; margin: 0.5rem auto 0.5rem 0; margin-right: auto; margin-left: 0; float: left;";
  }
  if (align === "right") {
    return "display: block; width: fit-content; max-width: 100%; clear: both; margin: 0.5rem 0 0.5rem auto; margin-left: auto; margin-right: 0; float: right;";
  }
  return "display: block; width: fit-content; max-width: 100%; clear: both; margin: 1rem auto; margin-left: auto; margin-right: auto; float: none;";
}

function imageMarginForAlign(align: ImageAlign, usePercentSize: string | null, widthPx: number | null): string {
  const isFullWidth =
    widthPx === null && (usePercentSize === null || parseImageWidthPercent(usePercentSize) >= 100);

  if (align === "left") {
    return isFullWidth
      ? "margin: 1rem 0;"
      : "margin: 0; float: none;";
  }
  if (align === "right") {
    return isFullWidth
      ? "margin: 1rem 0;"
      : "margin: 0; float: none;";
  }
  return isFullWidth ? "margin: 1rem auto;" : "margin: 0 auto;";
}

function parseAlignFromElement(element: HTMLElement): ImageAlign {
  const dataAlign = element.getAttribute("data-align");
  if (dataAlign === "left" || dataAlign === "center" || dataAlign === "right") {
    return dataAlign;
  }

  const style = element.getAttribute("style") ?? "";
  if (style.includes("float: left") || style.includes("float:left")) return "left";
  if (style.includes("float: right") || style.includes("float:right")) return "right";

  return "center";
}

function parseSizeFromElement(element: HTMLElement): string {
  const dataSize = element.getAttribute("data-size") ?? element.getAttribute("data-width");
  if (dataSize) return dataSize;

  const styleWidth = element.style.width;
  if (styleWidth) return styleWidth;

  const widthAttr = element.getAttribute("width");
  if (widthAttr) {
    return widthAttr.includes("%") ? widthAttr : `${widthAttr}px`;
  }

  return "100%";
}

function parsePxFromElement(element: HTMLElement, attr: "width" | "height"): number | null {
  const raw = element.getAttribute(attr);
  if (raw && /^\d+$/.test(raw)) return Number(raw);

  const style = element.style[attr];
  if (style && style.endsWith("px")) {
    const n = Number.parseFloat(style);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  return null;
}

export function buildImageStyle(attrs: {
  size?: string | null;
  align?: ImageAlign | null;
  width?: number | null;
  height?: number | null;
}): string {
  const align = attrs.align ?? "center";
  const widthPx = typeof attrs.width === "number" && attrs.width > 0 ? attrs.width : null;
  const heightPx = typeof attrs.height === "number" && attrs.height > 0 ? attrs.height : null;

  if (widthPx) {
    return [
      `width: ${widthPx}px`,
      `height: ${heightPx ? `${heightPx}px` : "auto"}`,
      "max-width: 100%",
      "display: block",
      imageMarginForAlign(align, null, widthPx),
    ].join("; ");
  }

  const size = attrs.size || "100%";
  return [
    `width: ${size}`,
    "max-width: 100%",
    "height: auto",
    "display: block",
    imageMarginForAlign(align, size, null),
  ].join("; ");
}

/** Click image → NodeSelection (skip resize handles). */
export const ImageSelectOnClick = Extension.create({
  name: "imageSelectOnClick",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("imageSelectOnClick"),
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              const target = event.target;
              if (!(target instanceof HTMLElement)) return false;
              if (target.closest("[data-resize-handle]")) return false;

              const img = target.closest("img");
              if (!img || !view.dom.contains(img)) return false;

              const pos = view.posAtDOM(img, 0);
              const $pos = view.state.doc.resolve(pos);
              const node = $pos.nodeAfter;
              if (!node || node.type.name !== "image") return false;

              const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos));
              view.dispatch(tr);
              return false;
            },
          },
        },
      }),
    ];
  },
});

export const ResizableImage = Image.extend({
  addOptions() {
    const parent = this.parent?.();
    return {
      inline: parent?.inline ?? false,
      allowBase64: parent?.allowBase64 ?? false,
      HTMLAttributes: parent?.HTMLAttributes ?? {},
      resize: {
        enabled: true,
        directions: ["bottom-right", "bottom-left", "top-right", "top-left"],
        minWidth: 80,
        minHeight: 80,
        alwaysPreserveAspectRatio: true,
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "100%",
        parseHTML: (element) => parseSizeFromElement(element),
        renderHTML: (attributes) => {
          if (typeof attributes.width === "number" && attributes.width > 0) {
            return {};
          }
          const size = (attributes.size as string | undefined) || "100%";
          return { "data-size": size };
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => parseAlignFromElement(element),
        renderHTML: (attributes) => {
          const align = (attributes.align as ImageAlign | undefined) || "center";
          return { "data-align": align };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => parsePxFromElement(element, "width"),
        renderHTML: (attributes) => {
          if (typeof attributes.width !== "number" || attributes.width <= 0) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => parsePxFromElement(element, "height"),
        renderHTML: (attributes) => {
          if (typeof attributes.height !== "number" || attributes.height <= 0) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const align = (node.attrs.align ?? "center") as ImageAlign;
    const style = buildImageStyle({
      size: node.attrs.size as string | null,
      align,
      width: node.attrs.width as number | null,
      height: node.attrs.height as number | null,
    });

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-align": align,
        style,
        ...(typeof node.attrs.width === "number" && node.attrs.width > 0
          ? {}
          : { "data-size": String(node.attrs.size ?? "100%") }),
      }),
    ];
  },

  addNodeView() {
    const resize = this.options.resize;
    if (!resize || resize.enabled !== true || typeof document === "undefined") {
      return null;
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = resize;

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("img");

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value == null || key === "width" || key === "height") return;
        el.setAttribute(key, value);
      });

      el.src = HTMLAttributes.src ?? node.attrs.src ?? "";
      el.alt = node.attrs.alt ?? "";

      const containerRef: { el: HTMLElement | null } = { el: null };

      const applyLayoutFromNode = (n: typeof node) => {
        const align = (n.attrs.align as ImageAlign | undefined) ?? "center";
        const layoutAttrs = {
          size: n.attrs.size as string | null,
          width: n.attrs.width as number | null,
          height: n.attrs.height as number | null,
        };

        el.style.cssText = buildImageStyle({ ...layoutAttrs, align });
        el.setAttribute("data-align", align);

        if (containerRef.el) {
          containerRef.el.style.cssText = buildContainerAlignStyle(align, layoutAttrs);
          containerRef.el.setAttribute("data-align", align);
        }
      };

      applyLayoutFromNode(node);

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;

          editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes(this.name, {
              width: Math.round(width),
              height: Math.round(height),
              size: null,
            })
            .run();
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          applyLayoutFromNode(updatedNode);
          return true;
        },
        options: {
          directions,
          min: { width: minWidth, height: minHeight },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
          className: {
            container: "cms-image-resize-container",
            wrapper: "cms-image-resize-wrapper",
            handle: "cms-image-resize-handle",
            resizing: "cms-image-resize-active",
          },
        },
      });

      const dom = nodeView.dom as HTMLElement;
      containerRef.el = dom;
      applyLayoutFromNode(node);

      dom.style.visibility = "hidden";
      dom.style.pointerEvents = "none";
      el.onload = () => {
        dom.style.visibility = "";
        dom.style.pointerEvents = "";
        applyLayoutFromNode(node);
      };

      return nodeView;
    };
  },
});

export function parseImageWidthPercent(size: string | undefined): number {
  if (!size) return 100;
  const match = size.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (match) return Number(match[1]);
  return 100;
}

export function formatImageSizeLabel(attrs: {
  size?: string | null;
  width?: number | null;
  height?: number | null;
}): string {
  if (typeof attrs.width === "number" && attrs.width > 0) {
    if (typeof attrs.height === "number" && attrs.height > 0) {
      return `${attrs.width}×${attrs.height}px`;
    }
    return `${attrs.width}px`;
  }
  return attrs.size ?? "100%";
}

export function nextImageWidth(
  current: string | undefined,
  direction: "smaller" | "larger",
): ImageWidthPreset {
  const steps = IMAGE_WIDTH_PRESETS.map((w) => parseImageWidthPercent(w));
  const currentVal = parseImageWidthPercent(current);
  let index = steps.findIndex((step) => step === currentVal);
  if (index === -1) {
    index = steps.findIndex((step) => step >= currentVal);
    if (index === -1) index = steps.length - 1;
  }

  if (direction === "larger") {
    index = Math.min(index + 1, IMAGE_WIDTH_PRESETS.length - 1);
  } else {
    index = Math.max(index - 1, 0);
  }

  return IMAGE_WIDTH_PRESETS[index];
}
