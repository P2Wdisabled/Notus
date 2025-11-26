"use client";

import React, { useState } from "react";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";

// Local markdown renderer
const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

function renderMarkdownToHtml(content: string) {
  const trimmed = content.trim();
  // If the content looks like raw HTML, return as-is; otherwise render markdown
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) return trimmed;
  return md.render(content);
}

function sanitizeHtml(html: string) {
  try {
    return DOMPurify.sanitize(html);
  } catch (e) {
    return html;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Helper: convert a Blob -> data URL (reusable)
async function blobToDataURL(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

// Preprocess HTML in the main document: convert canvases -> images and inline images
async function inlineImagesAndCanvases(inputHtml: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = inputHtml;

  // Convert canvas elements to images (for drawing widgets)
  const canvases = Array.from(tmp.querySelectorAll("canvas")) as HTMLCanvasElement[];
  canvases.forEach((c) => {
    try {
      const data = c.toDataURL("image/png");
      const img = document.createElement("img");
      img.src = data;
      if (c.width) img.width = c.width;
      if (c.height) img.height = c.height;
      c.replaceWith(img);
    } catch (e) {
      console.warn("Failed to convert canvas to image for export", e);
    }
  });

  const images = Array.from(tmp.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || img.src || "";
      if (!src || src.startsWith("data:")) return;
      try {
        // Fetch with credentials in case the image is protected by cookies
        const res = await fetch(src, { mode: "cors" }); // ou simplement fetch(src)
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await blobToDataURL(blob);
        img.src = dataUrl;
      } catch (e) {
        console.warn("Could not inline image for export", src, e);
      }
    })
  );

  return tmp.innerHTML;
}

// Export to PDF using an isolated same-origin iframe (avoids host CSS parsing)
async function exportAsPDF(html: string, filename: string) {
  // Helper: convert a Blob -> data URL
  async function blobToDataURL(blob: Blob) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
  }

  // Preprocess HTML in the main document: convert canvases -> images and inline images
  async function inlineImagesAndCanvases(inputHtml: string) {
    const tmp = document.createElement("div");
    tmp.innerHTML = inputHtml;

    // Convert canvas elements to images (for drawing widgets)
    const canvases = Array.from(tmp.querySelectorAll("canvas")) as HTMLCanvasElement[];
    canvases.forEach((c) => {
      try {
        const data = c.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = data;
        if (c.width) img.width = c.width;
        if (c.height) img.height = c.height;
        c.replaceWith(img);
      } catch (e) {
        console.warn("Failed to convert canvas to image for export", e);
      }
    });

    const images = Array.from(tmp.querySelectorAll("img")) as HTMLImageElement[];
    // Helper: try to convert a live DOM image (matching src) into a data URL by drawing it to canvas
    async function captureImageFromLiveDOM(src: string) {
      try {
        const selector = `img[src="${src}"]`;
        const live = document.querySelector(selector) as HTMLImageElement | null;
        if (!live) return null;
        // Ensure it's loaded
        await new Promise<void>((resolve) => {
          if (live.complete) return resolve();
          const onDone = () => { cleanup(); resolve(); };
          const cleanup = () => { live.removeEventListener('load', onDone); live.removeEventListener('error', onDone); };
          live.addEventListener('load', onDone);
          live.addEventListener('error', onDone);
        });
        const w = live.naturalWidth || live.width || 1;
        const h = live.naturalHeight || live.height || 1;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(live, 0, 0, w, h);
        return canvas.toDataURL('image/png');
      } catch (err) {
        return null;
      }
    }

    await Promise.all(
      images.map(async (img) => {
        const src = img.getAttribute("src") || img.src || "";
        if (!src || src.startsWith("data:")) return;
        // First, try fetch (works for http/https same-origin or CORS-enabled)
        try {
          const res = await fetch(src);
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await blobToDataURL(blob);
            img.src = dataUrl;
            return;
          }
        } catch (e) {
          // swallow and try fallback below
        }

        // If fetch failed (blob: URLs or other cases), try to capture from live DOM
        try {
          if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/')) {
            const dataUrl = await captureImageFromLiveDOM(src);
            if (dataUrl) {
              img.src = dataUrl;
              return;
            }
          }
        } catch (e) {
          // ignore
        }

        console.warn("Could not inline image for export", src);
      })
    );

    return tmp.innerHTML;
  }

  const processedHtml = await inlineImagesAndCanvases(html);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0px";
  iframe.style.width = "800px";
  iframe.style.height = "auto";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const iframeDoc = (iframe.contentDocument || iframe.contentWindow?.document) as Document;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("Unable to create export iframe");
  }

  // Wrap images in a non-breaking container to avoid page-breaks inside images
  const processedHtmlWrapped = processedHtml.replace(/<img\b([^>]*)>/gi, '<div class="export-image-wrap"><img$1></div>');

  const safeHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0}body{font-family:Inter, Arial, sans-serif;background:#ffffff;color:#000;}img{max-width:100%;height:auto;display:block;} .export-image-wrap{break-inside:avoid;page-break-inside:avoid;display:block;margin:0;padding:0;}</style></head><body>${processedHtmlWrapped}</body></html>`;
  iframeDoc.open();
  iframeDoc.write(safeHtml);
  iframeDoc.close();

  try {
    // Remove inline styles/classes that may use advanced color functions
    try {
      const all = Array.from(iframeDoc.querySelectorAll("*") as NodeListOf<HTMLElement>);
      all.forEach((el) => { el.removeAttribute('class'); el.removeAttribute('style'); });
      try {
        (iframeDoc.body as HTMLElement).style.backgroundColor = '#ffffff';
        (iframeDoc.body as HTMLElement).style.color = '#000000';
      } catch (_) {}
    } catch (e) {
      console.warn('Failed to strip styles in iframe:', e);
    }

    // Ensure images in iframe have loaded
    const iframeImages = Array.from((iframeDoc as any).images || []) as HTMLImageElement[];
    await Promise.all(iframeImages.map((img) => new Promise<void>((res) => {
      if (img.complete) return res();
      const onDone = () => { cleanup(); res(); };
      const cleanup = () => { img.removeEventListener('load', onDone); img.removeEventListener('error', onDone); };
      img.addEventListener('load', onDone);
      img.addEventListener('error', onDone);
    })));

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const iframeWidth = parseInt(iframe.style.width || '800', 10) || 800;
    // Points per CSS px
    const pointsPerCssPx = pdfWidth / iframeWidth;
    const pageHeightCss = Math.floor(pdfHeight / pointsPerCssPx);
    const pagePadding = 20; // matches page container padding
    const pageContentHeight = Math.max(0, pageHeightCss - pagePadding * 2);

    // Create page containers and flow content into them so elements are not split
    const root = iframeDoc.createElement('div');
    root.style.width = `${iframeWidth}px`;
    root.style.boxSizing = 'border-box';
    iframeDoc.body.style.margin = '0';
    // Capture the existing children first, then attach the root so measurements are accurate.
    const originalChildren = Array.from(iframeDoc.body.childNodes) as ChildNode[];
    iframeDoc.body.appendChild(root);
    // Move nodes from the captured list into paged containers
    const pages: HTMLElement[] = [];
    function createPage() {
      const d = iframeDoc.createElement('div');
      d.style.width = `${iframeWidth}px`;
      d.style.height = `${pageHeightCss}px`;
      d.style.overflow = 'hidden';
      d.style.boxSizing = 'border-box';
      d.style.padding = `${pagePadding}px`;
      d.style.background = '#ffffff';
      root.appendChild(d);
      pages.push(d);
      return d;
    }

    let current = createPage();
    // Move captured original children into pages, avoiding splitting images
    for (const child of originalChildren) {
      // Skip if child is the root itself (shouldn't happen) or not an element
      if (child === root) continue;
      const node = child as HTMLElement;
      current.appendChild(node);

      // If current page now overflows, try to move the just-appended node to next page
      if (current.scrollHeight > pageHeightCss) {
        // If node is an image or a wrapper containing a single image, treat it as an atomic image
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const isImg = el.tagName.toLowerCase() === 'img';
          const wrapperImg = el.querySelector && (el.querySelector('img') as HTMLImageElement | null);
          if (isImg || wrapperImg) {
            const img = (isImg ? (el as HTMLImageElement) : wrapperImg) as HTMLImageElement;
            const imgCssHeight = Math.ceil((img.getBoundingClientRect?.().height) || img.height || img.naturalHeight || 0);
            if (imgCssHeight <= pageContentHeight) {
              // move the whole node (wrapper or img) to a fresh page so it's not split
              current.removeChild(node);
              current = createPage();
              current.appendChild(node);
              continue;
            } else {
              // Image taller than a page: scale it down to fit the page content height
              try {
                img.style.maxHeight = `${pageContentHeight}px`;
                img.style.width = 'auto';
              } catch (e) {
                // ignore styling errors
              }
              // leave it in place (now constrained)
            }
          } else {
            // For other elements: if the element itself fits on a page, move it entirely
            const elHeight = (node as HTMLElement).scrollHeight || (node as HTMLElement).getBoundingClientRect?.().height || 0;
            if (elHeight <= pageContentHeight) {
              current.removeChild(node);
              current = createPage();
              current.appendChild(node);
              continue;
            }
            // Otherwise the element is larger than a page (e.g., long pre/code); leave it (will be split)
          }
        }
      }
    }

    // Root is already attached to the iframe body; paged children are present inside it.

    // Render each page container to canvas and add to PDF
    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl as HTMLElement, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      const outHeight = canvas.height * (pdfWidth / canvas.width);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, outHeight);
    }

    pdf.save(`${filename}.pdf`);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn("html2canvas failed, falling back to text PDF:", err);
    const text = iframeDoc.body?.innerText || iframeDoc.body?.textContent || "Exported document";
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 12;
    const lines = pdf.splitTextToSize(text, maxWidth);
    let cursorY = margin;
    for (const line of lines) {
      if (cursorY > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    pdf.save(`${filename}.pdf`);
  } finally {
    iframe.remove();
  }
}

async function exportAsDocx(html: string, filename: string) {
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(html, "text/html");
  const body = htmlDoc.body;

  const children: any[] = [];

  function walk(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      if (text) children.push(new Paragraph({ children: [new TextRun(text)] }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const size = tag === "h1" ? 28 : tag === "h2" ? 24 : 20;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || "", bold: true, size })],
        })
      );
      return;
    }

    if (tag === "p" || tag === "div") {
      children.push(new Paragraph({ children: [new TextRun(el.textContent || "")] }));
      return;
    }

    if (tag === "pre" || tag === "code") {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: el.textContent || "", font: "Courier New" })],
        })
      );
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll("li"));
      for (const li of items)
        children.push(
          // docx Paragraph bullet API expects specific config; use simple text paragraph for now
          new Paragraph({ children: [new TextRun(li.textContent || "")] } as any)
        );
      return;
    }

    node.childNodes.forEach(walk);
  }

  body.childNodes.forEach(walk);

  const docx = new DocxDocument({ sections: [{ children }] });

  // Use Packer.toBuffer and create a Blob (robust across environments)
  const buffer = await Packer.toBuffer(docx);
  const uint8Array =
    buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as any);
  const blob = new Blob([uint8Array], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadBlob(blob, `${filename}.docx`);
}

async function exportAsTxt(html: string, filename: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = tmp.innerText || tmp.textContent || "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${filename}.txt`);
}

interface ExportOverlayProps {
  open: boolean;
  onClose?: () => void;
  markdown: string;
  getRichHtml?: () => string;
}

export default function ExportOverlay({
  open,
  onClose,
  markdown,
  getRichHtml,
}: ExportOverlayProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const generateFilename = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    return `note-${date}`;
  };

  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    setIsExporting(true);
    setError(null);
    const filename = generateFilename();
    try {
      const content = getRichHtml ? getRichHtml() : markdown;
      const rawHtml = renderMarkdownToHtml(content);
      const sanitized = sanitizeHtml(rawHtml);

      if (format === "pdf") await exportAsPDF(sanitized, filename);
      else if (format === "docx") await exportAsDocx(sanitized, filename);
      else await exportAsTxt(sanitized, filename);

      onClose?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={() => onClose?.()} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg p-4 w-[320px]">
        <h3 className="text-lg font-semibold mb-2">Exporter la note</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choisissez un format pour exporter votre note (entièrement côté client).
        </p>

        <div className="space-y-3">
          <div className="flex flex-col">
            <button
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-60 flex items-center justify-between"
              disabled={isExporting}
              onClick={() => handleExport("pdf")}
            >
              <span>Exporter en PDF</span>
              <span className="text-sm opacity-90">📄</span>
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Génère un PDF côté client — capture HTML → canvas → PDF.
            </p>
          </div>

          <div className="flex flex-col">
            <button
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-60 flex items-center justify-between"
              disabled={isExporting}
              onClick={() => handleExport("docx")}
            >
              <span>Exporter en Word (.docx)</span>
              <span className="text-sm opacity-90">📝</span>
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Convertit la structure (titres, listes, blocs de code) en .docx. Styles simples conservés.
            </p>
          </div>

          <div className="flex flex-col">
            <button
              className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-60 flex items-center justify-between"
              disabled={isExporting}
              onClick={() => handleExport("txt")}
            >
              <span>Exporter en texte (.txt)</span>
              <span className="text-sm opacity-90">📋</span>
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Télécharge le texte brut (Markdown/HTML nettoyé), sans mise en forme.
            </p>
          </div>

          {error && <p className="text-sm text-destructive mt-1">Erreur: {error}</p>}

          <div className="flex justify-end mt-2">
            <button className="px-3 py-1 text-sm" onClick={() => onClose?.()} disabled={isExporting}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
