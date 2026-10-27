import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Render admin-authored markdown to HTML; raw HTML in the source is escaped. */
export function renderMarkdown(src?: string) {
  if (!src) return "";
  const escaped = src.replace(/<(?=[a-zA-Z/!])/g, "&lt;");
  const html = marked.parse(escaped, { async: false }) as string;
  // Neutralise script-capable link targets (javascript:, vbscript:, data:).
  return html.replace(/(href|src)="\s*(?:javascript|vbscript|data):[^"]*"/gi, '$1="#"');
}

export function readingTime(src?: string) {
  return Math.max(1, Math.round((src || "").split(/\s+/).length / 220));
}
