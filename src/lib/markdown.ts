import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Render admin-authored markdown to HTML; raw HTML in the source is escaped. */
export function renderMarkdown(src?: string) {
  if (!src) return "";
  const escaped = src.replace(/<(?=[a-zA-Z/!])/g, "&lt;");
  return marked.parse(escaped, { async: false }) as string;
}

export function readingTime(src?: string) {
  return Math.max(1, Math.round((src || "").split(/\s+/).length / 220));
}
