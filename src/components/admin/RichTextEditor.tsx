import { useEffect, useRef, useState, type ReactNode } from "react";

import Link from "@tiptap/extension-link";

import Placeholder from "@tiptap/extension-placeholder";

import TextAlign from "@tiptap/extension-text-align";

import { TextStyle } from "@tiptap/extension-text-style";

import TiptapUnderline from "@tiptap/extension-underline";

import Color from "@tiptap/extension-color";

import Highlight from "@tiptap/extension-highlight";

import Youtube from "@tiptap/extension-youtube";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";

import { BubbleMenu } from "@tiptap/react/menus";

import StarterKit from "@tiptap/starter-kit";

import {

  AlignCenter,

  AlignJustify,

  AlignLeft,

  AlignRight,

  Bold,

  Code,

  Heading1,

  Heading2,

  Heading3,

  ImageIcon,

  Italic,

  Link as LinkIcon,

  List,

  ListOrdered,

  Loader2,

  Minus,

  Quote,

  Redo2,

  Strikethrough,

  Underline as UnderlineIcon,

  Undo2,

  Video,

} from "lucide-react";



import { ImageToolbarControls } from "@/components/admin/tiptap/ImageToolbarControls";

import { updateImageLayout } from "@/components/admin/tiptap/imageLayout";

import { isImageNodeSelected } from "@/components/admin/tiptap/imageSelection";

import { ImageSelectOnClick, ResizableImage } from "@/components/admin/tiptap/ResizableImage";

import { adminUploadCmsImage } from "@/features/cms/adminCmsApi";

import { cn } from "@/lib/utils";

import { showError } from "@/lib/sweetAlert";



import "@/styles/tiptap-editor.css";



type RichTextEditorProps = {

  value: string;

  onChange: (html: string) => void;

  placeholder?: string;

  className?: string;

  minHeight?: string;

};



function ToolbarButton({

  label,

  onClick,

  disabled,

  active,

  children,

}: {

  label: string;

  onClick: () => void;

  disabled?: boolean;

  active?: boolean;

  children: ReactNode;

}) {

  return (

    <button

      type="button"

      title={label}

      aria-label={label}

      disabled={disabled}

      onMouseDown={(e) => e.preventDefault()}

      onClick={onClick}

      className={cn(

        "inline-flex size-8 items-center justify-center rounded-md text-body-secondary transition-colors",

        "hover:bg-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",

        active && "bg-surface-soft text-chat-accent",

      )}

    >

      {children}

    </button>

  );

}



function ToolbarDivider() {

  return <span className="mx-0.5 h-6 w-px shrink-0 bg-border-gray" aria-hidden />;

}



function EditorToolbar({

  editor,

  onUploadImage,

  uploadingImage,

}: {

  editor: Editor;

  onUploadImage: () => void;

  uploadingImage: boolean;

}) {

  const [, setToolbarTick] = useState(0);



  useEffect(() => {

    const refresh = () => setToolbarTick((tick) => tick + 1);

    editor.on("selectionUpdate", refresh);

    editor.on("transaction", refresh);

    return () => {

      editor.off("selectionUpdate", refresh);

      editor.off("transaction", refresh);

    };

  }, [editor]);



  const imageSelected = isImageNodeSelected(editor);



  const setLink = () => {

    const previous = editor.getAttributes("link").href as string | undefined;

    const url = window.prompt("Enter link URL", previous ?? "https://");

    if (url === null) return;

    if (url === "") {

      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;

    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();

  };



  const addYoutube = () => {

    const url = window.prompt("Enter YouTube URL");

    if (!url?.trim()) return;

    editor.commands.setYoutubeVideo({ src: url.trim() });

  };



  return (

    <div className="flex w-full flex-col gap-1 border-b border-border-gray bg-muted/40 px-2 py-2">

      <div className="flex w-full flex-wrap items-center gap-0.5">

        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>

          <Undo2 className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>

          <Redo2 className="size-4" />

        </ToolbarButton>



        <ToolbarDivider />



        <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>

          <Bold className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>

          <Italic className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>

          <UnderlineIcon className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>

          <Strikethrough className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>

          <Code className="size-4" />

        </ToolbarButton>



        <ToolbarDivider />



        <ToolbarButton label="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>

          <Heading1 className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>

          <Heading2 className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>

          <Heading3 className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>

          <span className="text-xs font-semibold">P</span>

        </ToolbarButton>



        <ToolbarDivider />



        <label className="inline-flex cursor-pointer items-center rounded-md px-1.5 py-1 hover:bg-muted">

          <span className="sr-only">Text color</span>

          <input

            type="color"

            className="size-6 cursor-pointer rounded border border-border-gray bg-transparent p-0"

            defaultValue="#0f172a"

            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}

          />

        </label>

        <label className="inline-flex cursor-pointer items-center rounded-md px-1.5 py-1 hover:bg-muted">

          <span className="sr-only">Highlight</span>

          <input

            type="color"

            className="size-6 cursor-pointer rounded border border-border-gray bg-transparent p-0"

            defaultValue="#fef08a"

            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}

          />

        </label>



        <ToolbarDivider />



        <ToolbarButton label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>

          <AlignLeft className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>

          <AlignCenter className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>

          <AlignRight className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })}>

          <AlignJustify className="size-4" />

        </ToolbarButton>



        <ToolbarDivider />



        <ToolbarButton label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>

          <List className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>

          <ListOrdered className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>

          <Quote className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>

          <Code className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>

          <Minus className="size-4" />

        </ToolbarButton>



        <ToolbarDivider />



        <ToolbarButton label="Insert link" onClick={setLink} active={editor.isActive("link")}>

          <LinkIcon className="size-4" />

        </ToolbarButton>

        <ToolbarButton label="Upload image" onClick={onUploadImage} disabled={uploadingImage}>

          {uploadingImage ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4 text-chat-accent" />}

        </ToolbarButton>

        <ToolbarButton label="Insert YouTube" onClick={addYoutube}>

          <Video className="size-4" />

        </ToolbarButton>



        <ToolbarDivider />



        <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>

          <span className="text-[10px] font-bold">CLR</span>

        </ToolbarButton>

      </div>



      {imageSelected ? (

        <div className="w-full rounded-lg border border-chat-accent/25 bg-surface-soft/60 px-2 py-1.5">

          <ImageToolbarControls editor={editor} />

        </div>

      ) : null}

    </div>

  );

}



export function RichTextEditor({

  value,

  onChange,

  placeholder = "Write content…",

  className,

  minHeight = "480px",

}: RichTextEditorProps) {

  const imageInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const lastHtmlRef = useRef(value);

  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;



  const editor = useEditor({

    extensions: [

      StarterKit.configure({

        heading: { levels: [1, 2, 3] },

      }),

      TiptapUnderline,

      TextStyle,

      Color,

      Highlight.configure({ multicolor: true }),

      TextAlign.configure({ types: ["heading", "paragraph"] }),

      Link.configure({

        openOnClick: false,

        HTMLAttributes: { class: "text-chat-accent underline" },

      }),

      ResizableImage.configure({

        inline: false,

        allowBase64: false,

        HTMLAttributes: { class: "cms-tiptap-image" },

      }),

      ImageSelectOnClick,

      Youtube.configure({

        width: 640,

        height: 360,

        HTMLAttributes: { class: "cms-tiptap-youtube" },

      }),

      Placeholder.configure({ placeholder }),

    ],

    content: value,

    editorProps: {

      attributes: {

        class: "cms-tiptap-editor outline-none",

        style: `min-height: ${minHeight}`,

      },

    },

    onUpdate: ({ editor: ed }) => {

      const html = ed.getHTML();

      lastHtmlRef.current = html;

      onChangeRef.current(html);

    },

  });



  useEffect(() => {

    if (!editor) return;

    if (value !== lastHtmlRef.current && value !== editor.getHTML()) {

      editor.commands.setContent(value || "", { emitUpdate: false });

      lastHtmlRef.current = value;

    }

  }, [editor, value]);



  const handleImageUpload = async (file: File) => {

    if (!editor) return;



    if (!file.type.startsWith("image/")) {

      showError("Please choose an image file.");

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      showError("Image must be 5MB or smaller.");

      return;

    }



    setUploadingImage(true);

    try {

      const url = await adminUploadCmsImage(file);

      editor.chain().focus().setImage({ src: url, alt: "" }).run();

      updateImageLayout(editor, { size: "100%", align: "center" });

    } catch {

      showError("Failed to upload image. Please try again.");

    } finally {

      setUploadingImage(false);

    }

  };



  if (!editor) {

    return (

      <div className={cn("flex w-full items-center justify-center rounded-xl border border-border-gray bg-card py-16", className)}>

        <Loader2 className="size-6 animate-spin text-body-secondary" />

      </div>

    );

  }



  return (

    <div className={cn("w-full overflow-hidden rounded-xl border border-border-gray bg-card", className)}>

      <input

        ref={imageInputRef}

        type="file"

        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"

        className="hidden"

        onChange={(e) => {

          const file = e.target.files?.[0];

          e.target.value = "";

          if (file) void handleImageUpload(file);

        }}

      />



      <EditorToolbar

        editor={editor}

        uploadingImage={uploadingImage}

        onUploadImage={() => imageInputRef.current?.click()}

      />



      <BubbleMenu

        editor={editor}

        shouldShow={({ editor: ed }) => isImageNodeSelected(ed)}

        options={{ placement: "top", offset: 8 }}

      >

        <ImageToolbarControls editor={editor} compact />

      </BubbleMenu>



      <EditorContent editor={editor} className="cms-tiptap-wrapper w-full px-4 py-4" />

    </div>

  );

}


