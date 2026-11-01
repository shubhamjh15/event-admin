import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: false });

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: ["p", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "br", "hr", "code", "pre", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], "*": ["style"] },
  allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, ...(/^https?:/i.test(attribs.href || "") ? { target: "_blank", rel: "noopener noreferrer" } : {}) },
    }),
    h1: "h2",
  },
};

const looksLikeHtml = (s: string) => /^\s*<(p|h[1-6]|ul|ol|blockquote|div|pre)[\s>]/i.test(s);

/**
 * Render long-form content to safe HTML. New content comes from the rich-text editor (HTML);
 * older content may be Markdown — both are converted and sanitised the same way.
 */
export function renderMarkdown(src?: string) {
  if (!src) return "";
  const html = looksLikeHtml(src) ? src : (marked.parse(src.replace(/<(?=[a-zA-Z/!])/g, "&lt;"), { async: false }) as string);
  return sanitizeHtml(html, ALLOWED);
}

export const renderRich = renderMarkdown;

/** Plain text of rich or Markdown content (for reading time, excerpts and emails). */
export function plainText(src?: string) {
  return sanitizeHtml(renderMarkdown(src), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

export function readingTime(src?: string) {
  return Math.max(1, Math.round(plainText(src).split(/\s+/).length / 220));
}
