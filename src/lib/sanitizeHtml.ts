import type { Config } from "dompurify";
import DOMPurify from "dompurify";

export const EDITOR_SANITIZE_CONFIG: Config = {
  ADD_ATTR: [
    "style",
    "data-file-name",
    "data-file-type",
    "data-file-data",
    "data-draggable-attachment",
    "class",
    "controls",
    "contenteditable",
    "data-selected-file",
  ],
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "del",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "div",
    "span",
    "hr",
    "details",
    "summary",
    "video",
    "button",
  ],
  ALLOWED_ATTR: [
    "href",
    "src",
    "alt",
    "title",
    "style",
    "color",
    "open",
    "target",
    "rel",
    "data-file-name",
    "data-file-type",
    "data-file-data",
    "data-draggable-attachment",
    "class",
    "controls",
    "type",
    "contenteditable",
    "data-selected-file",
  ],
};

export const PREVIEW_SANITIZE_CONFIG: Config = {
  ALLOWED_ATTR: ["style", "color"],
};

export function sanitizeHtml(html: string, config?: Config): string {
  if (!html || typeof html !== "string") {
    return "";
  }
  if (typeof window === "undefined") {
    return html;
  }
  return DOMPurify.sanitize(html, config);
}

