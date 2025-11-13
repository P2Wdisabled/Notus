"use client";

export default function WysiwygEditorStyles() {
  return (
    <style jsx global>{`
      .wysiwyg-editor ul {
        list-style-type: disc !important;
        margin: 1rem 0 !important;
        padding-left: 1.5rem !important;
        display: block !important;
        list-style-position: outside !important;
      }
      .wysiwyg-editor ol {
        list-style-type: decimal !important;
        margin: 1rem 0 !important;
        padding-left: 1.5rem !important;
        display: block !important;
        list-style-position: outside !important;
      }
      .wysiwyg-editor li {
        margin: 0.25rem 0 !important;
        display: list-item !important;
        list-style-position: outside !important;
      }
      /* Ensure list markers stay outside even when list has text-align */
      .wysiwyg-editor ul[style*="text-align"],
      .wysiwyg-editor ol[style*="text-align"] {
        list-style-position: outside !important;
        padding-left: 1.5rem !important;
      }
      .wysiwyg-editor ul[style*="text-align"] li,
      .wysiwyg-editor ol[style*="text-align"] li {
        list-style-position: outside !important;
      }
      .wysiwyg-editor a {
        color: #3b82f6 !important;
        text-decoration: underline !important;
        cursor: pointer !important;
      }
      .wysiwyg-editor a:hover {
        color: #1d4ed8 !important;
        text-decoration: underline !important;
      }
      .wysiwyg-editor h1 {
        font-size: 1.875rem !important;
        font-weight: bold !important;
        margin: 1rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor h2 {
        font-size: 1.5rem !important;
        font-weight: bold !important;
        margin: 0.875rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor h3 {
        font-size: 1.25rem !important;
        font-weight: bold !important;
        margin: 0.75rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor h4 {
        font-size: 1.125rem !important;
        font-weight: bold !important;
        margin: 0.625rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor h5 {
        font-size: 1rem !important;
        font-weight: bold !important;
        margin: 0.5rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor h6 {
        font-size: 0.875rem !important;
        font-weight: bold !important;
        margin: 0.5rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor p {
        margin: 0.5rem 0 !important;
        color: #111827 !important;
      }
      .wysiwyg-editor strong {
        font-weight: bold !important;
        color: #111827 !important;
      }
      .wysiwyg-editor em {
        font-style: italic !important;
        color: #111827 !important;
      }
      .wysiwyg-editor u {
        text-decoration: underline !important;
      }
      .wysiwyg-editor s {
        text-decoration: line-through !important;
      }
      .wysiwyg-editor blockquote {
        border-left: 4px solid #e5e7eb !important;
        padding-left: 1rem !important;
        margin: 1rem 0 !important;
        color: #6b7280 !important;
        font-style: italic !important;
      }
      .wysiwyg-editor hr {
        border: none !important;
        border-top: 1px solid #e5e7eb !important;
        margin: 2rem 0 !important;
      }
      .wysiwyg-editor img {
        max-width: 100% !important;
        height: auto !important;
      }
      .wysiwyg-editor img[data-selected-image="true"] {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      /* Dark mode styles */
      .dark .wysiwyg-editor h1,
      .dark .wysiwyg-editor h2,
      .dark .wysiwyg-editor h3,
      .dark .wysiwyg-editor h4,
      .dark .wysiwyg-editor h5,
      .dark .wysiwyg-editor h6 {
        color: #f9fafb !important;
      }
      .dark .wysiwyg-editor p {
        color: #f9fafb !important;
      }
      .dark .wysiwyg-editor strong {
        color: #f9fafb !important;
      }
      .dark .wysiwyg-editor em {
        color: #f9fafb !important;
      }
      .dark .wysiwyg-editor blockquote {
        border-left-color: #374151 !important;
        color: #d1d5db !important;
      }
      .dark .wysiwyg-editor hr {
        border-top-color: #374151 !important;
      }
    `}</style>
  );
}
