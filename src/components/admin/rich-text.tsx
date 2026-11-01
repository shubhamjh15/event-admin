"use client";
import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TextAlign } from "@tiptap/extension-text-align";
import { marked } from "marked";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Link2, Unlink,
  AlignLeft, AlignCenter, AlignRight, Minus, Undo2, Redo2, RemoveFormatting,
} from "lucide-react";

const isHtml = (s: string) => /^\s*<(p|h[1-6]|ul|ol|blockquote|div|pre)[\s>]/i.test(s);

/** Older content was written in Markdown — convert it once so the editor shows it formatted. */
function toHtml(value?: string) {
  if (!value) return "";
  if (isHtml(value)) return value;
  return marked.parse(value.replace(/<(?=[a-zA-Z/!])/g, "&lt;"), { async: false }) as string;
}

function Btn({ on, label, active, disabled, children }: { on: () => void; label: string; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      className={`grid h-8 w-8 place-items-center rounded-md transition disabled:opacity-30 ${active ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const sep = <span className="mx-1 h-5 w-px bg-ink/10" />;
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://…, mailto: or tel:)", prev || "https://");
    if (url === null) return;
    if (!url.trim()) return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  const c = () => editor.chain().focus();
  return (
    <div className="sticky top-[148px] z-10 flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-ink/10 bg-[#FBF9FC] px-2 py-1.5">
      <Btn label="Bold" active={editor.isActive("bold")} on={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
      <Btn label="Italic" active={editor.isActive("italic")} on={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
      <Btn label="Underline" active={editor.isActive("underline")} on={() => c().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
      <Btn label="Strikethrough" active={editor.isActive("strike")} on={() => c().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
      {sep}
      <Btn label="Heading" active={editor.isActive("heading", { level: 2 })} on={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
      <Btn label="Subheading" active={editor.isActive("heading", { level: 3 })} on={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
      <Btn label="Bulleted list" active={editor.isActive("bulletList")} on={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
      <Btn label="Numbered list" active={editor.isActive("orderedList")} on={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
      <Btn label="Quote" active={editor.isActive("blockquote")} on={() => c().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
      <Btn label="Divider" on={() => c().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
      {sep}
      <Btn label="Add link" active={editor.isActive("link")} on={setLink}><Link2 className="h-4 w-4" /></Btn>
      <Btn label="Remove link" disabled={!editor.isActive("link")} on={() => c().unsetLink().run()}><Unlink className="h-4 w-4" /></Btn>
      {sep}
      <Btn label="Align left" active={editor.isActive({ textAlign: "left" })} on={() => c().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
      <Btn label="Align centre" active={editor.isActive({ textAlign: "center" })} on={() => c().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
      <Btn label="Align right" active={editor.isActive({ textAlign: "right" })} on={() => c().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
      {sep}
      <Btn label="Clear formatting" on={() => c().unsetAllMarks().clearNodes().run()}><RemoveFormatting className="h-4 w-4" /></Btn>
      <Btn label="Undo" disabled={!editor.can().undo()} on={() => c().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
      <Btn label="Redo" disabled={!editor.can().redo()} on={() => c().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing…" }: { value?: string; onChange: (html: string) => void; placeholder?: string }) {
  const last = useRef<string>("");
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // keeps the toolbar active states current
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"] } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: toHtml(value),
    editorProps: { attributes: { class: "prose-lux !text-[15px] min-h-[260px] max-h-[640px] overflow-y-auto px-5 py-4 outline-none" } },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      last.current = html;
      onChange(html);
    },
  });

  // Keep in sync when the form loads a record after the editor mounted.
  useEffect(() => {
    if (!editor || value === undefined || value === last.current) return;
    const html = toHtml(value);
    if (html !== editor.getHTML()) editor.commands.setContent(html, { emitUpdate: false });
    last.current = value;
  }, [value, editor]);

  return (
    <div className="rich-editor rounded-md border border-ink/15 bg-white focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-ink/10 bg-[#FBF9FC]" />}
      <EditorContent editor={editor} />
    </div>
  );
}
