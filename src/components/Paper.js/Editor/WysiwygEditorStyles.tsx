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
      /* Handle aligned lists - ensure markers follow alignment */
      /* Center aligned lists */
      .wysiwyg-editor ul[style*="text-align: center"],
      .wysiwyg-editor ul[style*="text-align:center"],
      .wysiwyg-editor ol[style*="text-align: center"],
      .wysiwyg-editor ol[style*="text-align:center"] {
        list-style-position: inside !important;
        padding-left: 0 !important;
        text-align: center !important;
      }
      .wysiwyg-editor ul[style*="text-align: center"] li,
      .wysiwyg-editor ul[style*="text-align:center"] li,
      .wysiwyg-editor ol[style*="text-align: center"] li,
      .wysiwyg-editor ol[style*="text-align:center"] li {
        list-style-position: inside !important;
        text-align: center !important;
      }
      
      /* Right aligned lists */
      .wysiwyg-editor ul[style*="text-align: right"],
      .wysiwyg-editor ul[style*="text-align:right"],
      .wysiwyg-editor ol[style*="text-align: right"],
      .wysiwyg-editor ol[style*="text-align:right"] {
        list-style-position: inside !important;
        padding-left: 0 !important;
        padding-right: 1.5rem !important;
        text-align: right !important;
      }
      .wysiwyg-editor ul[style*="text-align: right"] li,
      .wysiwyg-editor ul[style*="text-align:right"] li,
      .wysiwyg-editor ol[style*="text-align: right"] li,
      .wysiwyg-editor ol[style*="text-align:right"] li {
        list-style-position: inside !important;
        text-align: right !important;
      }
      
      /* Justified lists */
      .wysiwyg-editor ul[style*="text-align: justify"],
      .wysiwyg-editor ul[style*="text-align:justify"],
      .wysiwyg-editor ol[style*="text-align: justify"],
      .wysiwyg-editor ol[style*="text-align:justify"] {
        list-style-position: inside !important;
        padding-left: 0 !important;
        text-align: justify !important;
      }
      .wysiwyg-editor ul[style*="text-align: justify"] li,
      .wysiwyg-editor ul[style*="text-align:justify"] li,
      .wysiwyg-editor ol[style*="text-align: justify"] li,
      .wysiwyg-editor ol[style*="text-align:justify"] li {
        list-style-position: inside !important;
        text-align: justify !important;
      }
      
      /* Keep default behavior for left-aligned lists */
      .wysiwyg-editor ul[style*="text-align: left"],
      .wysiwyg-editor ul[style*="text-align:left"],
      .wysiwyg-editor ol[style*="text-align: left"],
      .wysiwyg-editor ol[style*="text-align:left"] {
        list-style-position: outside !important;
        padding-left: 1.5rem !important;
        text-align: left !important;
      }
      .wysiwyg-editor ul[style*="text-align: left"] li,
      .wysiwyg-editor ul[style*="text-align:left"] li,
      .wysiwyg-editor ol[style*="text-align: left"] li,
      .wysiwyg-editor ol[style*="text-align:left"] li {
        list-style-position: outside !important;
        text-align: left !important;
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
      .wysiwyg-editor .wysiwyg-file-attachment {
        margin: 1rem 0 !important;
        padding: 0.75rem !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.5rem !important;
        background-color: #f9fafb !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .wysiwyg-editor .wysiwyg-file-attachment[data-selected-file="true"] {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      .wysiwyg-editor .wysiwyg-file-download-btn {
        padding: 0.375rem 0.75rem !important;
        font-size: 0.875rem !important;
        background-color: #3b82f6 !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 0.375rem !important;
        cursor: pointer !important;
      }
      .wysiwyg-editor .wysiwyg-file-download-btn:hover {
        background-color: #2563eb !important;
      }
      .wysiwyg-editor .wysiwyg-file-link {
        color: #3b82f6 !important;
        text-decoration: underline !important;
        cursor: pointer !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .wysiwyg-editor .wysiwyg-file-link:hover {
        color: #2563eb !important;
      }
      .wysiwyg-editor video {
        max-width: 100% !important;
        height: auto !important;
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
