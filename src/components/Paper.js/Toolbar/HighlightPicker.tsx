import { useRef, useEffect, useState, useCallback } from "react";

interface TextFormatting {
  backgroundColor?: string;
  [key: string]: any;
}

interface HighlightPickerProps {
  textFormatting: TextFormatting;
  setTextFormatting: (formatting: TextFormatting | ((prev: TextFormatting) => TextFormatting)) => void;
  applyFormat: (command: string, value?: string) => void;
}

export default function HighlightPicker({
  textFormatting,
  setTextFormatting,
  applyFormat,
}: HighlightPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [computedStyle, setComputedStyle] = useState<CSSStyleDeclaration | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("transparent");

  // Helper: return the nearest contenteditable editor element (or null)
  const getEditorElement = (): Element | null => {
    if (typeof document === "undefined") return null;
    const editor = document.querySelector("[contenteditable]");
    if (!editor) return null;
    try {
      const sel = window.getSelection();
      // If there's no selection, don't assume editor context — return null
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      const container =
        range.commonAncestorContainer &&
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
      return container && editor.contains(container) ? editor : null;
    } catch (e) {
      return null;
    }
  };

  // Safely wrap a Range's contents with a span that applies highlight color.
  // This avoids using document.execCommand which can sometimes apply styles to
  // ancestor elements.
  const safeWrapSelection = (range: Range, color: string): boolean => {
    try {
      if (!range || !color) return false;
      // Create wrapper span
      const wrapper = document.createElement("span");
      wrapper.style.backgroundColor = color;
      wrapper.style.display = "inline";
      wrapper.style.lineHeight = "1.2";
      wrapper.style.boxDecorationBreak = "clone";

      // Extract selected contents and append to wrapper
      const extracted = range.extractContents();
      wrapper.appendChild(extracted);

      // Insert wrapper back into the range position
      range.insertNode(wrapper);

      // Collapse selection to after inserted node
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(wrapper);
        newRange.collapse(true);
        sel.addRange(newRange);
      }

      // Dispatch input event on editor
      const editor = getEditorElement();
      if (editor) {
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }

      return true;
    } catch (e) {
      return false;
    }
  };

  // Safely remove background styles from elements inside a range
  const safeRemoveSelection = (range: Range): boolean => {
    try {
      if (!range) return false;
      const contents = range.cloneContents();
      const temp = document.createElement("div");
      temp.appendChild(contents);

      // Find elements with inline background styles in the cloned contents
      const styled = temp.querySelectorAll('[style*="background"]');
      if (styled.length === 0) return false;

      // For each element in the cloned content, attempt to find corresponding
      // real elements inside the document range and remove their background
      styled.forEach((node) => {
        const el = node as HTMLElement;
        const bg = el.style && el.style.backgroundColor;
        if (!bg) return;
      });

      // Now operate on real DOM: find elements under the range common ancestor
      const root =
        range.commonAncestorContainer &&
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
      if (!root) return false;

      const candidates = Array.from(
        (root as Element).querySelectorAll('[style*="background"]')
      );
      candidates.forEach((el) => {
        try {
          const r = document.createRange();
          try {
            r.selectNodeContents(el);
          } catch (e) {
            return;
          }
          if (range.intersectsNode(el)) {
            (el as HTMLElement).style.removeProperty("background-color");
            (el as HTMLElement).style.removeProperty("background");
            (el as HTMLElement).style.removeProperty("padding-top");
            (el as HTMLElement).style.removeProperty("padding-bottom");
            (el as HTMLElement).style.removeProperty("box-decoration-break");
            if ((el as HTMLElement).style.backgroundColor) {
              (el as HTMLElement).style.backgroundColor = "";
              if ((el as HTMLElement).style.backgroundColor)
                (el as HTMLElement).style.backgroundColor = "transparent";
            }
          }
        } catch (e) {}
      });

      const editor = getEditorElement();
      if (editor) editor.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Robust removal: removes inline background styles and padding from elements
  // that intersect the range, then unwraps empty spans that remain.
  const unwrapOrCleanHighlightElements = (range: Range): boolean => {
    try {
      if (!range) return false;

      // Find the common ancestor for searching
      const root =
        range.commonAncestorContainer &&
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
      if (!root) return false;

      // Collect all elements under root that have inline background or padding
      const candidates = Array.from(
        (root as Element).querySelectorAll(
          '[style*="background"], [style*="padding-top"], [style*="padding-bottom"]'
        )
      );
      let acted = false;

      candidates.forEach((el) => {
        try {
          if (!range.intersectsNode(el)) return;

          // Remove highlight/padding styles
          (el as HTMLElement).style.removeProperty("background-color");
          (el as HTMLElement).style.removeProperty("background");
          (el as HTMLElement).style.removeProperty("padding-top");
          (el as HTMLElement).style.removeProperty("padding-bottom");
          (el as HTMLElement).style.removeProperty("box-decoration-break");
          (el as HTMLElement).style.removeProperty("line-height");

          // Ensure transparent if any leftover
          if ((el as HTMLElement).style.backgroundColor) {
            (el as HTMLElement).style.backgroundColor = "";
            if ((el as HTMLElement).style.backgroundColor)
              (el as HTMLElement).style.backgroundColor = "transparent";
          }

          acted = true;

          // If the element is a span and now has no attributes/styles, unwrap it
          const isSpan = el.tagName && el.tagName.toLowerCase() === "span";
          const hasStyleAttrs = el.getAttribute && el.getAttribute("style");
          const hasOtherAttrs =
            el.attributes &&
            Array.from(el.attributes).some((a) => a.name !== "style");
          if (isSpan && !hasStyleAttrs && !hasOtherAttrs) {
            // replace span with its children
            const parent = el.parentNode;
            if (parent) {
              while (el.firstChild) parent.insertBefore(el.firstChild, el);
              parent.removeChild(el);
            }
          }
        } catch (e) {
          // ignore per-element errors
        }
      });

      if (acted) {
        const editor = getEditorElement();
        if (editor) editor.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const cleanAllHighlightsInEditor = (editor: Element): boolean => {
    try {
      if (!editor) return false;
      let acted = false;

      // Select elements with inline background styles or legacy bgcolor attrs
      const candidates = Array.from(
        editor.querySelectorAll('[style*="background"], [bgcolor]')
      );
      candidates.forEach((el) => {
        try {
          // remove inline background/padding styles
          (el as HTMLElement).style.removeProperty("background-color");
          (el as HTMLElement).style.removeProperty("background");
          (el as HTMLElement).style.removeProperty("padding-top");
          (el as HTMLElement).style.removeProperty("padding-bottom");
          (el as HTMLElement).style.removeProperty("box-decoration-break");
          (el as HTMLElement).style.removeProperty("line-height");

          // remove legacy attribute
          if (el.hasAttribute && el.hasAttribute("bgcolor")) {
            el.removeAttribute("bgcolor");
          }

          // Normalize leftover value
          if ((el as HTMLElement).style.backgroundColor) {
            (el as HTMLElement).style.backgroundColor = "";
            if ((el as HTMLElement).style.backgroundColor)
              (el as HTMLElement).style.backgroundColor = "transparent";
          }

          acted = true;

          // unwrap empty spans
          if (el.tagName && el.tagName.toLowerCase() === "span") {
            const styleAttr = el.getAttribute && el.getAttribute("style");
            const otherAttrs =
              el.attributes &&
              Array.from(el.attributes).some((a) => a.name !== "style");
            if (!styleAttr && !otherAttrs) {
              const parent = el.parentNode;
              if (parent) {
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
              }
            }
          }
        } catch (e) {
          // ignore per-element errors
        }
      });

      if (acted) {
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const getCurrentHighlightColor = useCallback((): string => {
    // Get background color from selection or cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      const selectedNode = range.startContainer;
      let elementToCheck: Element | null = null;

      if (selectedNode.nodeType === 3) {
        elementToCheck = selectedNode.parentElement;
      } else if (
        selectedNode.childNodes.length > 0 &&
        range.startOffset > 0
      ) {
        const childNode =
          selectedNode.childNodes[range.startOffset - 1];
        elementToCheck =
          childNode.nodeType === 3
            ? childNode.parentElement
            : (childNode as Element);
      } else {
        elementToCheck = selectedNode as Element;
      }

      if (elementToCheck && elementToCheck instanceof Element) {
        const computedStyle = window.getComputedStyle(elementToCheck);
        if (
          computedStyle.backgroundColor &&
          computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          computedStyle.backgroundColor !== "transparent"
        ) {
          // Convert rgb to hex if needed
          let hexColor = computedStyle.backgroundColor;
          if (computedStyle.backgroundColor.startsWith('rgb')) {
            const rgb = computedStyle.backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          
          if (hexColor !== textFormatting.backgroundColor) {
            setTimeout(
              () =>
                setTextFormatting((prev) => ({
                  ...prev,
                  backgroundColor: hexColor,
                })),
              0
            );
          }
          return hexColor;
        }
      }
    }
    
    // Default to transparent when no selection or no color detected
    return textFormatting.backgroundColor || "transparent";
  }, [textFormatting.backgroundColor, setTextFormatting]);

  // Update current color when textFormatting changes
  useEffect(() => {
    setCurrentColor(textFormatting.backgroundColor || "transparent");
  }, [textFormatting.backgroundColor]);

  // Listen for selection changes to update color automatically
  useEffect(() => {
    const handleSelectionChange = () => {
      const detectedColor = getCurrentHighlightColor();
      if (detectedColor !== currentColor) {
        setCurrentColor(detectedColor);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [currentColor, getCurrentHighlightColor]);

  useEffect(() => {
    // Only run in browser and when ref is attached
    if (typeof window === "undefined") return;
    const el = pickerRef.current;
    if (el && el instanceof Element) {
      try {
        const style = window.getComputedStyle(el);
        setComputedStyle(style);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <div ref={pickerRef} className="flex items-center relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            // Hide color palette if it's open
            document.getElementById("colorPalette")?.classList.add("hidden");
            // Toggle highlight palette
            document
              .getElementById("highlightPalette")
              ?.classList.toggle("hidden");
          }}
          className="p-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all hover:shadow-md relative"
          title="Select highlight color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96a.996.996 0 000-1.41L18.37.29a.996.996 0 00-1.41 0L15 2.25 18.75 6l1.96-1.96z"/>
            <path fillOpacity=".36" d="M0 20h24v4H0z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: currentColor === "transparent" ? "#ffff00" : currentColor }}
          />
        </button>

        <div
          id="highlightPalette"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-700 rounded shadow-lg hidden z-50 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Choisir une couleur de surlignage
            </label>
            <input
              type="color"
              value={currentColor === "transparent" ? "#ffff00" : currentColor}
              onChange={(e) => {
                const color = e.target.value;
                setCurrentColor(color);
                setTextFormatting({ ...textFormatting, backgroundColor: color });
                
                const selection = window.getSelection();
                const editorEl = getEditorElement();
                
                if (selection && selection.isCollapsed) {
                  // Only insert caret span when selection is inside the editor
                  if (!editorEl) {
                    document
                      .getElementById("highlightPalette")
                      ?.classList.add("hidden");
                    return;
                  }
                  const span = document.createElement("span");
                  span.style.backgroundColor = color;
                  span.style.display = "inline";
                  span.style.lineHeight = "1.2";
                  span.style.paddingTop = "0.2em";
                  span.style.paddingBottom = "0.2em";
                  span.style.boxDecorationBreak = "clone";
                  span.innerHTML = "&#8203;";

                  const range = selection.getRangeAt(0);
                  range.insertNode(span);

                  range.setStartAfter(span);
                  range.setEndAfter(span);
                  selection.removeAllRanges();
                  selection.addRange(range);

                  const event = new Event("input", { bubbles: true });
                  document
                    .querySelector("[contenteditable]")
                    ?.dispatchEvent(event);
                } else if (
                  selection &&
                  selection.rangeCount > 0 &&
                  selection.toString().length > 0
                ) {
                  // Apply highlight to selection
                  try {
                    const range = selection.getRangeAt(0);

                    // Ensure the selection is inside the editor
                    const container = range.commonAncestorContainer;
                    const rootElement =
                      container.nodeType === Node.TEXT_NODE
                        ? container.parentElement
                        : (container as Element);
                    if (
                      !editorEl ||
                      !rootElement ||
                      !editorEl.contains(rootElement)
                    ) {
                      // Selection is outside the editor — do nothing
                      document
                        .getElementById("highlightPalette")
                        ?.classList.add("hidden");
                      return;
                    }

                    // Find all spans within the selection
                    const allSpans = rootElement.querySelectorAll("span");
                    const spansInSelection = Array.from(allSpans).filter(
                      (span) => {
                        return range.intersectsNode(span);
                      }
                    );

                    let foundAndUpdatedHighlight = false;

                    // Update existing highlight spans directly
                    spansInSelection.forEach((span) => {
                      const hasHighlight =
                        span.style.backgroundColor &&
                        span.style.backgroundColor !== "transparent" &&
                        span.style.backgroundColor !== "rgba(0, 0, 0, 0)";
                      const hasPadding =
                        span.style.paddingTop || span.style.paddingBottom;

                      if (hasHighlight || hasPadding) {
                        foundAndUpdatedHighlight = true;

                        // DIRECTLY update the existing span's properties
                        span.style.backgroundColor = color;

                        // Update padding based on font size
                        let fontSize = 16;
                        if (span.style.fontSize) {
                          fontSize = parseFloat(span.style.fontSize);
                        } else {
                          const computedStyle = window.getComputedStyle(span);
                          fontSize = parseFloat(computedStyle.fontSize);
                        }
                        const paddingRatio = Math.max(0.15, fontSize * 0.02);
                        span.style.paddingTop = paddingRatio + "em";
                        span.style.paddingBottom = paddingRatio + "em";
                        span.style.boxDecorationBreak = "clone";
                        span.style.display = "inline";
                        span.style.lineHeight = "1.2";
                      }
                    });

                    // If no highlight spans were found, use a safe range wrapper
                    if (!foundAndUpdatedHighlight) {
                      try {
                        safeWrapSelection(range, color);
                      } catch (e) {
                        // ignore
                      }
                    }

                    const event = new Event("input", { bubbles: true });
                    document
                      .querySelector("[contenteditable]")
                      ?.dispatchEvent(event);
                  } catch (error) {
                    // Final fallback - attempt safeWrapSelection on current selection
                    try {
                      const sel2 = window.getSelection();
                      if (sel2 && sel2.rangeCount > 0) {
                        const r2 = sel2.getRangeAt(0);
                        safeWrapSelection(r2, color);
                      }
                    } catch (e) {
                      // ignore
                    }
                  }
                } else {
                  const editorEl = getEditorElement();
                  if (editorEl) {
                    applyFormat("hiliteColor", color);
                  }
                }
              }}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              title="Sélectionner une couleur de surlignage"
            />
            <button
              type="button"
              onClick={() => {
                setCurrentColor("transparent");
                setTextFormatting({ ...textFormatting, backgroundColor: "transparent" });

                const selection = window.getSelection();
                const editorEl = getEditorElement();
                if (!editorEl) {
                  // Nothing to remove if selection is outside the editor
                } else if (
                  selection &&
                  selection.rangeCount > 0 &&
                  selection.toString().length > 0
                ) {
                  // Enhanced span detection - check all elements, not just spans
                  try {
                    const range = selection.getRangeAt(0);

                    // Get all elements that intersect with the selection
                    const container = range.commonAncestorContainer;
                    let rootElement: Element | null =
                      container.nodeType === Node.TEXT_NODE
                        ? container.parentElement
                        : (container as Element);

                    // Go up to find a better root element if needed
                    while (rootElement && rootElement.tagName === "FONT") {
                      rootElement = rootElement.parentElement;
                    }

                    if (!rootElement) return;

                    // Find all spans AND font elements within the selection
                    const allElements = rootElement.querySelectorAll(
                      'span, font[style*="background"]'
                    );
                    const elementsInSelection = Array.from(allElements).filter(
                      (element) => {
                        return range.intersectsNode(element);
                      }
                    );

                    // Also check if the selection contains any elements with inline background styles
                    const rangeContents = range.cloneContents();
                    const tempDiv = document.createElement("div");
                    tempDiv.appendChild(rangeContents);
                    const inlineStyledElements = tempDiv.querySelectorAll(
                      '[style*="background"]'
                    );

                    let foundAndUpdatedHighlight = false;

                    // Process all found elements
                    [
                      ...elementsInSelection,
                      ...Array.from(inlineStyledElements),
                    ].forEach((element) => {
                      if (!element.parentElement) return; // Skip if not in DOM

                      const el = element as HTMLElement;
                      const hasHighlight =
                        el.style.backgroundColor &&
                        el.style.backgroundColor !== "transparent" &&
                        el.style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                        el.style.backgroundColor !== "";
                      const hasPadding =
                        el.style.paddingTop || el.style.paddingBottom;

                      if (hasHighlight || hasPadding) {
                        foundAndUpdatedHighlight = true;

                        // Try multiple removal approaches
                        el.style.removeProperty("background-color");
                        el.style.removeProperty("background");
                        el.style.removeProperty("padding-top");
                        el.style.removeProperty("padding-bottom");
                        el.style.removeProperty("box-decoration-break");

                        // If still has background, try setting to empty or transparent
                        if (el.style.backgroundColor) {
                          el.style.backgroundColor = "";
                          if (el.style.backgroundColor) {
                            el.style.backgroundColor = "transparent";
                          }
                        }
                      }
                    });

                    // If no elements were found, try a robust cleanup/unwrap helper first,
                    // then fallback to safeRemoveSelection if that didn't act.
                    if (!foundAndUpdatedHighlight) {
                      try {
                        const cleaned = unwrapOrCleanHighlightElements(range);
                        if (!cleaned) {
                          try {
                            safeRemoveSelection(range);
                          } catch (e) {
                            /* ignore */
                          }
                          try {
                            cleanAllHighlightsInEditor(editorEl);
                          } catch (e) {
                            /* ignore */
                          }
                        }
                      } catch (e) {
                        /* ignore */
                      }
                    } else {
                      try {
                        unwrapOrCleanHighlightElements(range);
                      } catch (e) {
                        /* ignore */
                      }
                    }

                    const event = new Event("input", { bubbles: true });
                    document
                      .querySelector("[contenteditable]")
                      ?.dispatchEvent(event);
                  } catch (error) {
                    // Fallback - try safeRemoveSelection on current selection
                    try {
                      const sel2 = window.getSelection();
                      if (sel2 && sel2.rangeCount > 0) {
                        const r2 = sel2.getRangeAt(0);
                        safeRemoveSelection(r2);
                      }
                    } catch (e) {
                      // ignore
                    }
                    // Final attempt: sweep editor for inline background attributes
                    try {
                      cleanAllHighlightsInEditor(editorEl);
                    } catch (e) {
                      /* ignore */
                    }
                  }
                } else if (selection && selection.rangeCount > 0) {
                  // No selection, just cursor position
                  const range = selection.getRangeAt(0);
                  const selectedNode = range.startContainer;
                  let elementToCheck: Element | null =
                    selectedNode.nodeType === 3
                      ? selectedNode.parentElement
                      : (selectedNode as Element);

                  while (elementToCheck && elementToCheck !== document.body) {
                    if (
                      elementToCheck.tagName &&
                      (elementToCheck.tagName.toLowerCase() === "span" ||
                        elementToCheck.tagName.toLowerCase() === "font")
                    ) {
                      const el = elementToCheck as HTMLElement;
                      const hasBackground =
                        el.style.backgroundColor &&
                        el.style.backgroundColor !==
                          "transparent" &&
                        el.style.backgroundColor !==
                          "rgba(0, 0, 0, 0)" &&
                        el.style.backgroundColor !== "";
                      const hasPadding =
                        el.style.paddingTop ||
                        el.style.paddingBottom;

                      if (hasBackground || hasPadding) {
                        // Prefer using the robust unwrap/clean helper so empty spans are removed.
                        try {
                          const r = document.createRange();
                          try {
                            r.selectNodeContents(elementToCheck);
                          } catch (e) {
                            /* ignore */
                          }
                          if (unwrapOrCleanHighlightElements(r)) {
                            const event = new Event("input", { bubbles: true });
                            document
                              .querySelector("[contenteditable]")
                              ?.dispatchEvent(event);
                            break;
                          }
                        } catch (e) {
                          // Fallback to trying to directly strip styles
                          el.style.removeProperty(
                            "background-color"
                          );
                          el.style.removeProperty("background");
                          el.style.removeProperty("padding-top");
                          el.style.removeProperty("padding-bottom");
                          el.style.removeProperty(
                            "box-decoration-break"
                          );
                          if (el.style.backgroundColor) {
                            el.style.backgroundColor = "";
                            if (el.style.backgroundColor)
                              el.style.backgroundColor =
                                "transparent";
                          }
                          const event = new Event("input", { bubbles: true });
                          document
                            .querySelector("[contenteditable]")
                            ?.dispatchEvent(event);
                          break;
                        }
                      }
                    }
                    elementToCheck = elementToCheck.parentElement;
                  }
                }

                document
                  .getElementById("highlightPalette")
                  ?.classList.add("hidden");
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
            >
              None (Supprimer)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

