"use client";

import React, { useState } from "react";
import MarkdownIt from "markdown-it";
import WysiwygEditor from "./WysiwygEditor";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

function renderMarkdownToHtml(content: string) {
  const trimmed = content.trim();
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

async function blobToDataURL(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function inlineImagesAndCanvases(inputHtml: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = inputHtml;

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

  async function captureImageFromLiveDOM(src: string) {
    try {
      const selector = `img[src="${src}"]`;
      const live = document.querySelector(selector) as HTMLImageElement | null;
      if (!live) return null;
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
      try {
        const res = await fetch(src);
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await blobToDataURL(blob);
          img.src = dataUrl;
          return;
        }
      } catch (e) {
        // ignore, try capture fallback
      }

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

async function exportAsPDF(html: string, filename: string) {
  const liveEditor = document.querySelector('[data-wysiwyg-editor-root="true"]') as HTMLElement | null;

  const fallbackRoot = () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.style.whiteSpace = "normal";
    return tmp;
  };

  const sourceElement = liveEditor instanceof HTMLElement ? liveEditor : fallbackRoot();
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.setAttribute("data-export-clone", "true");

  const clamp01 = (val: number) => Math.min(1, Math.max(0, val));
  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  const extractFuncBody = (input: string) => {
    const start = input.indexOf("(");
    const end = input.lastIndexOf(")");
    return start >= 0 && end > start ? input.slice(start + 1, end) : "";
  };

  const parseAlpha = (value?: string | null) => {
    if (!value) return 1;
    const trimmed = value.trim();
    if (!trimmed) return 1;
    const percent = trimmed.endsWith("%");
    const num = parseFloat(trimmed.replace(/%/g, ""));
    if (Number.isNaN(num)) return 1;
    return clamp01(percent ? num / 100 : num);
  };

  const parseLab = (input: string) => {
    const body = extractFuncBody(input);
    const [labPart, alphaPart] = body.split("/");
    const parts = labPart
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length < 3) return null;
    const L = parseFloat(parts[0]);
    const a = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    if ([L, a, b].some((n) => Number.isNaN(n))) return null;
    const alpha = parseAlpha(alphaPart);
    return { L, a, b, alpha };
  };

  const parseLch = (input: string) => {
    const body = extractFuncBody(input);
    const [lchPart, alphaPart] = body.split("/");
    const parts = lchPart
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length < 3) return null;
    const L = parseFloat(parts[0]);
    const C = parseFloat(parts[1]);
    const H = parseFloat(parts[2]);
    if ([L, C, H].some((n) => Number.isNaN(n))) return null;
    const alpha = parseAlpha(alphaPart);
    const rad = degToRad(H % 360);
    return { L, a: C * Math.cos(rad), b: C * Math.sin(rad), alpha };
  };

  const labToRgb = (lab: { L: number; a: number; b: number; alpha: number }) => {
    const { L, a, b, alpha } = lab;
    const refX = 0.96422;
    const refY = 1;
    const refZ = 0.82521;
    const epsilon = 216 / 24389;
    const kappa = 24389 / 27;

    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;

    const fx3 = fx ** 3;
    const fz3 = fz ** 3;

    const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa;
    const yr = L > kappa * epsilon ? ((L + 16) / 116) ** 3 : L / kappa;
    const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa;

    const Xd50 = xr * refX;
    const Yd50 = yr * refY;
    const Zd50 = zr * refZ;

    const M = [
      [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
      [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
      [0.012314001688319899, -0.020507696433477912, 1.3299097632096058],
    ];

    const X = M[0][0] * Xd50 + M[0][1] * Yd50 + M[0][2] * Zd50;
    const Y = M[1][0] * Xd50 + M[1][1] * Yd50 + M[1][2] * Zd50;
    const Z = M[2][0] * Xd50 + M[2][1] * Yd50 + M[2][2] * Zd50;

    const xyzToRgb = [
      [3.2404542, -1.5371385, -0.4985314],
      [-0.9692660, 1.8760108, 0.0415560],
      [0.0556434, -0.2040259, 1.0572252],
    ];

    const rLin = xyzToRgb[0][0] * X + xyzToRgb[0][1] * Y + xyzToRgb[0][2] * Z;
    const gLin = xyzToRgb[1][0] * X + xyzToRgb[1][1] * Y + xyzToRgb[1][2] * Z;
    const bLin = xyzToRgb[2][0] * X + xyzToRgb[2][1] * Y + xyzToRgb[2][2] * Z;

    const linearToSrgb = (c: number) => {
      if (Number.isNaN(c)) return 0;
      if (c <= 0.0031308) return 12.92 * c;
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    };

    const r = Math.round(clamp01(linearToSrgb(rLin)) * 255);
    const g = Math.round(clamp01(linearToSrgb(gLin)) * 255);
    const bVal = Math.round(clamp01(linearToSrgb(bLin)) * 255);

    return alpha < 1 ? `rgba(${r}, ${g}, ${bVal}, ${alpha})` : `rgb(${r}, ${g}, ${bVal})`;
  };

  const normalizeColor = (value: string | null): string | null => {
    if (!value) return null;
    let output = value;
    const replaceLab = (match: string) => {
      const parsed = parseLab(match);
      return parsed ? labToRgb(parsed) : match;
    };
    const replaceLch = (match: string) => {
      const parsed = parseLch(match);
      return parsed ? labToRgb(parsed) : match;
    };
    if (/lab\(/i.test(output)) {
      output = output.replace(/lab\([^()]*\)/gi, replaceLab);
    }
    if (/lch\(/i.test(output)) {
      output = output.replace(/lch\([^()]*\)/gi, replaceLch);
    }
    return output;
  };

  const propertiesToCopy = [
    "color",
    "backgroundColor",
    "backgroundImage",
    "fontSize",
    "fontFamily",
    "fontWeight",
    "fontStyle",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "textAlign",
    "textTransform",
    "textDecoration",
    "textDecorationColor",
    "textIndent",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderTopStyle",
    "borderRightStyle",
    "borderBottomStyle",
    "borderLeftStyle",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineStyle",
    "outlineWidth",
    "outlineColor",
    "listStyleType",
    "listStylePosition",
    "listStyleImage",
    "whiteSpace",
    "display",
    "verticalAlign",
    "backgroundClip",
  ];

  const copyComputedStyles = (original: HTMLElement, target: HTMLElement) => {
    const origNodes = [original, ...Array.from(original.querySelectorAll("*"))] as HTMLElement[];
    const cloneNodes = [target, ...Array.from(target.querySelectorAll("*"))] as HTMLElement[];
    origNodes.forEach((node, index) => {
      const cloneNode = cloneNodes[index];
      if (!cloneNode) return;
      const styles = window.getComputedStyle(node);
      propertiesToCopy.forEach((prop) => {
        const val = (styles as any)[prop];
        if (!val) return;
        const needsColor = /color/i.test(prop) || prop.includes("Shadow") || prop.startsWith("background");
        const normalized = needsColor ? normalizeColor(val) : val;
        if (normalized) (cloneNode.style as any)[prop] = normalized;
      });
      cloneNode.style.boxShadow = "none";
      cloneNode.style.textShadow = "none";
      cloneNode.style.filter = "none";
    });
  };

  const normalizeInlineDeclarations = (root: HTMLElement) => {
    const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
    elements.forEach((el) => {
      const style = el.style;
      if (!style) return;
      for (let i = 0; i < style.length; i += 1) {
        const prop = style.item(i);
        if (!prop) continue;
        const value = style.getPropertyValue(prop);
        if (!value) continue;
        if (/color|background|shadow/i.test(prop) || /lab\(|lch\(/i.test(value)) {
          const normalized = normalizeColor(value);
          if (normalized && normalized !== value) {
            const priority = style.getPropertyPriority(prop) || "";
            style.setProperty(prop, normalized, priority);
          }
        }
      }
      el.removeAttribute("class");
    });
  };

  const normalizeStyleTags = (root: HTMLElement) => {
    const styleNodes = Array.from(root.querySelectorAll("style"));
    styleNodes.forEach((styleNode) => {
      const cssText = styleNode.textContent;
      if (!cssText) return;
      if (!/lab\(|lch\(/i.test(cssText)) return;
      const normalized = normalizeColor(cssText);
      if (normalized && normalized !== cssText) {
        styleNode.textContent = normalized;
      }
    });
  };

  const normalizeListStructure = (root: HTMLElement) => {
    const lists = Array.from(root.querySelectorAll("ul, ol"));
    lists.forEach((list) => {
      const isOrdered = list.tagName === "OL";
      let counter = isOrdered ? parseInt(list.getAttribute("start") || "1", 10) || 1 : 1;
      Array.from(list.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        if (child.tagName !== "LI") return;
        if (child.dataset.exportListNormalized === "true") return;

        const marker = child.ownerDocument.createElement("span");
        marker.textContent = isOrdered ? `${counter}.` : "\u2022";
        marker.style.display = "inline-block";
        marker.style.minWidth = isOrdered ? "2rem" : "1.5rem";
        marker.style.paddingRight = "0.5rem";
        marker.style.textAlign = isOrdered ? "right" : "center";
        marker.style.lineHeight = "inherit";
        marker.style.verticalAlign = "baseline";
        marker.style.flex = "0 0 auto";

        counter += 1;

        const contentWrapper = child.ownerDocument.createElement("span");
        contentWrapper.style.display = "inline";
        contentWrapper.style.lineHeight = "inherit";
        contentWrapper.style.verticalAlign = "baseline";
        contentWrapper.style.flex = "1 1 auto";

        while (child.firstChild) {
          contentWrapper.appendChild(child.firstChild);
        }

        child.style.display = "flex";
        child.style.alignItems = "baseline";
        child.style.listStyleType = "none";
        child.style.listStylePosition = "outside";
        child.style.paddingLeft = "0";
        child.style.marginLeft = "0";
        child.style.gap = "0";
        child.dataset.exportListNormalized = "true";

        child.appendChild(marker);
        child.appendChild(contentWrapper);
      });
    });
  };

  const shiftHighlightsDown = (root: HTMLElement, offsetPx: number) => {
    const highlightCandidates = Array.from(root.querySelectorAll<HTMLElement>('mark, [style*="background"], [style*="background-color"]'));
    highlightCandidates.forEach((el) => {
      if (el.dataset.exportHighlightShifted === "true") return;

      const inlineStyle = el.getAttribute("style") || "";
      let colorMatch = inlineStyle.match(/background(?:-color)?:\s*([^;]+)/i);
      let bgColor = colorMatch ? normalizeColor(colorMatch[1]) : null;

      if ((!bgColor || /transparent|rgba\(0,\s*0,\s*0,\s*0\)/i.test(bgColor)) && typeof window !== "undefined" && el.ownerDocument === document) {
        try {
          const computed = window.getComputedStyle(el);
          if (computed.backgroundColor && !/rgba\(0,\s*0,\s*0,\s*0\)/i.test(computed.backgroundColor)) {
            bgColor = normalizeColor(computed.backgroundColor);
          }
        } catch (err) {
          // ignore
        }
      }

      if (!bgColor || /transparent|rgba\(0,\s*0,\s*0,\s*0\)/i.test(bgColor)) return;

      const doc = el.ownerDocument;
      const highlightLayer = doc.createElement("span");
      highlightLayer.style.position = "absolute";
      highlightLayer.style.left = "-2.5px";
      highlightLayer.style.right = "-20px";
      highlightLayer.style.top = `${offsetPx}px`;
      highlightLayer.style.height = `calc(100% + ${offsetPx}px)`;
      highlightLayer.style.backgroundColor = bgColor;
      highlightLayer.style.zIndex = "0";
      highlightLayer.style.borderRadius = "0.1em";
      highlightLayer.style.pointerEvents = "none";
      highlightLayer.style.display = "block";
      highlightLayer.style.transformOrigin = "top center";
      highlightLayer.style.transform = "scaleY(0.3333)";

      const textHolder = doc.createElement("span");
      textHolder.style.position = "relative";
      textHolder.style.zIndex = "1";
      textHolder.style.display = "inline";
      textHolder.style.lineHeight = "inherit";

      while (el.firstChild) {
        textHolder.appendChild(el.firstChild);
      }

      el.style.position = "relative";
      el.style.display = "inline-block";
      el.style.lineHeight = "inherit";
      el.style.verticalAlign = "baseline";
      el.style.backgroundColor = "transparent";
      el.style.paddingBottom = `${offsetPx}px`;
      el.style.overflow = "visible";

      el.appendChild(highlightLayer);
      el.appendChild(textHolder);
      el.dataset.exportHighlightShifted = "true";
    });
  };

  const waitForImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            const done = () => {
              img.removeEventListener("load", done);
              img.removeEventListener("error", done);
              resolve();
            };
            img.addEventListener("load", done);
            img.addEventListener("error", done);
          })
      )
    );
  };

  const forceLightThemeForExport = () => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    if (!htmlEl || !bodyEl) return () => {};

    const hadDarkClass = htmlEl.classList.contains("dark");
    if (!hadDarkClass) return () => {};

    const previousVisibility = bodyEl.style.visibility;
    const previousTransition = bodyEl.style.transition;

    bodyEl.style.transition = "none";
    bodyEl.style.visibility = "hidden";
    htmlEl.classList.remove("dark");

    return () => {
      if (hadDarkClass) {
        htmlEl.classList.add("dark");
      }
      bodyEl.style.visibility = previousVisibility;
      bodyEl.style.transition = previousTransition;
    };
  };

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = `${Math.max(900, sourceElement.clientWidth || 0) + 64}px`;
  iframe.style.height = `${Math.max(1200, sourceElement.clientHeight || 0) + 64}px`;
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const ensureIframeDoc = () => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error("Could not initialize export iframe");
    return doc;
  };

  const iframeDoc = ensureIframeDoc();
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.5; }
    [data-export-clone] img { max-width: 100%; height: auto; }
    [data-export-clone] ul,
    [data-export-clone] ol { margin: 0.5rem 0; padding-left: 1.5rem; list-style-position: outside; }
    [data-export-clone] li { margin: 0.25rem 0; display: list-item; list-style-position: outside; line-height: inherit; }
    [data-export-clone] li::marker { font-size: 1em; }
    [data-export-clone] span[style*="background"],
    [data-export-clone] mark { display: inline; vertical-align: baseline; line-height: inherit; padding: 0; margin: 0; }
  </style></head><body></body></html>`);
  iframeDoc.close();

  const wrapper = iframeDoc.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.minHeight = "100%";
  wrapper.style.backgroundColor = "#ffffff";
  iframeDoc.body.appendChild(wrapper);

  try {
    if (liveEditor) {
      const restoreTheme = forceLightThemeForExport();
      try {
        copyComputedStyles(liveEditor, clone);
      } finally {
        restoreTheme();
      }
    }

    normalizeInlineDeclarations(clone);
    normalizeStyleTags(clone);
    normalizeListStructure(clone);
    shiftHighlightsDown(clone, 15);
    await waitForImages(clone);

    const adoptedClone = iframeDoc.importNode(clone, true) as HTMLElement;
    wrapper.appendChild(adoptedClone);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const rootRect = adoptedClone.getBoundingClientRect();
    const domImagePositions = Array.from(adoptedClone.querySelectorAll("img")).map((img) => {
      const rect = img.getBoundingClientRect();
      return {
        top: rect.top - rootRect.top,
        bottom: rect.bottom - rootRect.top,
        height: rect.height,
      };
    });

    const canvas = await html2canvas(adoptedClone, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: iframeDoc.documentElement.scrollWidth,
      windowHeight: iframeDoc.documentElement.scrollHeight,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ratio = pageWidth / canvas.width;
    const sliceHeightPx = pageHeight / ratio;

    const scaleFactor = canvas.width / Math.max(1, rootRect.width || adoptedClone.clientWidth || 1);
    const imagePositions = domImagePositions.map((pos) => ({
      top: pos.top * scaleFactor,
      bottom: pos.bottom * scaleFactor,
      height: pos.height * scaleFactor,
    }));

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height) {
      const remaining = canvas.height - currentY;
      let sliceHeight = Math.min(sliceHeightPx, remaining);
      const sliceEnd = currentY + sliceHeight;

      for (const imgPos of imagePositions) {
        if (imgPos.top >= currentY && imgPos.top < sliceEnd && imgPos.bottom > sliceEnd) {
          if (imgPos.height <= sliceHeightPx) {
            sliceHeight = Math.max(0, imgPos.top - currentY);
            break;
          }
        }
      }

      if (sliceHeight < 20) {
        sliceHeight = Math.min(sliceHeightPx, remaining);
      }

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const pageCtx = pageCanvas.getContext("2d");
      if (pageCtx) {
        pageCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
        const imgData = pageCanvas.toDataURL("image/png", 0.98);
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, sliceHeight * ratio);
      }

      currentY += sliceHeight;
      pageIndex += 1;
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
          new Paragraph({ children: [new TextRun(li.textContent || "")] } as any)
        );
      return;
    }

    node.childNodes.forEach(walk);
  }

  body.childNodes.forEach(walk);

  const docx = new DocxDocument({ sections: [{ children }] });

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
