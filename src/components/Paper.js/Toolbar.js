"use client";
import { useCallback, useState, useEffect } from "react";

export default function Toolbar({
  mode,
  setMode,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  textFormatting,
  setTextFormatting,
  onClearAllData,
}) {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [detectedFontSize, setDetectedFontSize] = useState(null);

  // Formatting state tracking
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Check selection and formatting state
  useEffect(() => {
    if (mode !== "text") return;

    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString();
        const hasSelectionNow = text.length > 0;

        setHasSelection(hasSelectionNow);
        setSelectedText(text);

        // Check formatting state
        try {
          const bold = document.queryCommandState("bold");
          const italic = document.queryCommandState("italic");
          const underline = document.queryCommandState("underline");

          setIsBold(bold);
          setIsItalic(italic);
          setIsUnderline(underline);

          // Check font size at cursor position or selection
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer;
            let elementToCheck;

            // Determine which element to check for font size
            if (selectedNode.nodeType === 3) {
              // Text node
              elementToCheck = selectedNode.parentElement;
            } else if (
              selectedNode.childNodes.length > 0 &&
              range.startOffset > 0
            ) {
              // Check if cursor is at the end of a specific node
              const childNode = selectedNode.childNodes[range.startOffset - 1];
              elementToCheck =
                childNode.nodeType === 3 ? childNode.parentElement : childNode;
            } else {
              elementToCheck = selectedNode;
            }

            // Get computed font size
            if (elementToCheck) {
              const computedStyle = window.getComputedStyle(elementToCheck);
              if (computedStyle.fontSize) {
                // Extract the numeric part of the font size (remove 'px')
                const fontSizeValue = Math.round(
                  parseFloat(computedStyle.fontSize)
                );
                console.log("Detected font size:", fontSizeValue + "px"); // Debug log

                if (fontSizeValue && fontSizeValue !== detectedFontSize) {
                  // Update detected size immediately
                  setDetectedFontSize(fontSizeValue);

                  // Also update textFormatting state
                  setTimeout(
                    () =>
                      setTextFormatting((prev) => ({
                        ...prev,
                        fontSize: fontSizeValue,
                      })),
                    0
                  );
                }
              }
            }
          }
        } catch (error) {
          console.log("Could not check formatting state:", error);
        }
      }
    };

    const handleMouseUp = () => checkSelection();
    const handleKeyUp = () => checkSelection();

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    const interval = setInterval(checkSelection, 1000);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(interval);
    };
  }, [mode, textFormatting.fontSize, setTextFormatting]);

  // Simple apply format function that uses the RichTextEditor
  const applyFormat = useCallback((command, value = null) => {
    if (window.applyRichTextFormat) {
      window.applyRichTextFormat(command, value);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const colorPalette = document.getElementById("colorPalette");
      const highlightPalette = document.getElementById("highlightPalette");

      // Close color palette if clicking outside
      if (
        colorPalette &&
        !colorPalette.contains(event.target) &&
        !event.target.closest("[title='Select text color']")
      ) {
        colorPalette.classList.add("hidden");
      }

      // Close highlight palette if clicking outside
      if (
        highlightPalette &&
        !highlightPalette.contains(event.target) &&
        !event.target.closest("[title='Select highlight color']")
      ) {
        highlightPalette.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-800 text-white p-4 gap-4 flex flex-wrap">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMode("draw")}
          className={`px-4 py-2 rounded transition-colors ${
            mode === "draw" ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded transition-colors ${
            mode === "text" ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          Text
        </button>

        {onClearAllData && (
          <button
            onClick={onClearAllData}
            className="px-3 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors text-sm"
            title="Clear all local data"
          >
            Clear Data
          </button>
        )}
      </div>

      {mode === "draw" && (
        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-10 h-10 cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-32 cursor-pointer"
          />
          <span className="text-sm">Size: {brushSize}px</span>
        </div>
      )}

      {mode === "text" && (
        <div className="flex flex-wrap gap-4 space-x-4">
          {/* Selection Status */}
          <div
            className={`text-xs px-2 py-1 rounded ${
              hasSelection ? "bg-green-600" : "bg-gray-600"
            }`}
          >
            {hasSelection
              ? `Selected: "${
                  selectedText.length > 20
                    ? selectedText.substring(0, 20) + "..."
                    : selectedText
                }"`
              : "No selection"}
          </div>

          {/* Quick Format Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => applyFormat("bold")}
              className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
                isBold
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-600 hover:bg-gray-500 text-gray-200"
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => applyFormat("italic")}
              className={`px-2 py-1 rounded text-sm italic transition-colors ${
                isItalic
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-600 hover:bg-gray-500 text-gray-200"
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => applyFormat("underline")}
              className={`px-2 py-1 rounded text-sm underline transition-colors ${
                isUnderline
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-600 hover:bg-gray-500 text-gray-200"
              }`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
          </div>

          {/* Text Color */}
          <div className="flex items-center space-x-2 relative">
            <label className="text-sm font-medium">Color:</label>
            <div className="relative">
              <button
                onClick={() =>
                  document
                    .getElementById("colorPalette")
                    .classList.toggle("hidden")
                }
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  textFormatting.color
                    ? "border-white shadow-lg"
                    : "border-gray-400"
                }`}
                style={{
                  backgroundColor: (() => {
                    // Get selection color if there's a selection or cursor position
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);

                      // Get color from selection or cursor position
                      const selectedNode = range.startContainer;
                      let elementToCheck;

                      if (selectedNode.nodeType === 3) {
                        // Text node
                        elementToCheck = selectedNode.parentElement;
                      } else if (
                        selectedNode.childNodes.length > 0 &&
                        range.startOffset > 0
                      ) {
                        // Check if cursor is at the end of a specific node
                        const childNode =
                          selectedNode.childNodes[range.startOffset - 1];
                        elementToCheck =
                          childNode.nodeType === 3
                            ? childNode.parentElement
                            : childNode;
                      } else {
                        elementToCheck = selectedNode;
                      }

                      // Use computed style to get the actual color
                      if (elementToCheck) {
                        const computedStyle =
                          window.getComputedStyle(elementToCheck);
                        if (
                          computedStyle.color &&
                          computedStyle.color !== "rgb(0, 0, 0)"
                        ) {
                          // Update state to match what we see
                          if (computedStyle.color !== textFormatting.color) {
                            setTimeout(
                              () =>
                                setTextFormatting((prev) => ({
                                  ...prev,
                                  color: computedStyle.color,
                                })),
                              0
                            );
                          }
                          return computedStyle.color;
                        }
                      }
                    }
                    // Otherwise use the state color
                    return textFormatting.color || "#ffffff";
                  })(),
                }}
                title="Select text color"
              />

              <div
                id="colorPalette"
                className="absolute top-full left-0 mt-1 p-2 bg-gray-700 rounded shadow-lg hidden z-10"
              >
                <div className="grid grid-cols-3 gap-1 w-24">
                  {[
                    { color: "#000000", label: "Black" },
                    { color: "#ff0000", label: "Red" },
                    { color: "#00ff00", label: "Green" },
                    { color: "#0000ff", label: "Blue" },
                    { color: "#ffff00", label: "Yellow" },
                    { color: "#ff00ff", label: "Magenta" },
                    { color: "#00ffff", label: "Cyan" },
                    { color: "#ffa500", label: "Orange" },
                    { color: "#800080", label: "Purple" },
                    { color: "#ffffff", label: "White" },
                  ].map(({ color, label }) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTextFormatting({ ...textFormatting, color });

                        const selection = window.getSelection();
                        // If cursor is just at a position with no selection
                        if (selection && selection.isCollapsed) {
                          // Create a span with the selected color
                          const span = document.createElement("span");
                          span.style.color = color;
                          // Add a zero-width space so color is visible at cursor position
                          span.innerHTML = "&#8203;"; // zero-width space

                          const range = selection.getRangeAt(0);
                          range.insertNode(span);

                          // Move cursor after our inserted span
                          range.setStartAfter(span);
                          range.setEndAfter(span);
                          selection.removeAllRanges();
                          selection.addRange(range);

                          // Trigger content change manually
                          const event = new Event("input", { bubbles: true });
                          document
                            .querySelector("[contenteditable]")
                            ?.dispatchEvent(event);
                        } else {
                          // Normal selection, use standard approach
                          applyFormat("foreColor", color);
                        }

                        document
                          .getElementById("colorPalette")
                          .classList.add("hidden");
                      }}
                      className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                        textFormatting.color === color
                          ? "border-white shadow-lg"
                          : "border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`${label} text`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Background Color / Highlight */}
          <div className="flex items-center space-x-2 relative">
            <label className="text-sm font-medium">Highlight:</label>
            <div className="relative">
              <button
                onClick={() => {
                  // Hide color palette if it's open
                  document
                    .getElementById("colorPalette")
                    ?.classList.add("hidden");
                  // Toggle highlight palette
                  document
                    .getElementById("highlightPalette")
                    .classList.toggle("hidden");
                }}
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  textFormatting.backgroundColor &&
                  textFormatting.backgroundColor !== "transparent"
                    ? "border-white shadow-lg"
                    : "border-gray-400"
                }`}
                style={{
                  backgroundColor: (() => {
                    // Get background color from selection or cursor position
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);

                      // Get color from selection or cursor position
                      const selectedNode = range.startContainer;
                      let elementToCheck;

                      if (selectedNode.nodeType === 3) {
                        // Text node
                        elementToCheck = selectedNode.parentElement;
                      } else if (
                        selectedNode.childNodes.length > 0 &&
                        range.startOffset > 0
                      ) {
                        // Check if cursor is at the end of a specific node
                        const childNode =
                          selectedNode.childNodes[range.startOffset - 1];
                        elementToCheck =
                          childNode.nodeType === 3
                            ? childNode.parentElement
                            : childNode;
                      } else {
                        elementToCheck = selectedNode;
                      }

                      // Use computed style to get the actual background color
                      if (elementToCheck) {
                        const computedStyle =
                          window.getComputedStyle(elementToCheck);
                        if (
                          computedStyle.backgroundColor &&
                          computedStyle.backgroundColor !==
                            "rgba(0, 0, 0, 0)" &&
                          computedStyle.backgroundColor !== "transparent"
                        ) {
                          // Update state to match what we see
                          if (
                            computedStyle.backgroundColor !==
                            textFormatting.backgroundColor
                          ) {
                            setTimeout(
                              () =>
                                setTextFormatting((prev) => ({
                                  ...prev,
                                  backgroundColor:
                                    computedStyle.backgroundColor,
                                })),
                              0
                            );
                          }
                          return computedStyle.backgroundColor;
                        }
                      }
                    }
                    // If no highlight detected, show white instead of yellow
                    if (
                      textFormatting.backgroundColor === "transparent" ||
                      !textFormatting.backgroundColor
                    ) {
                      return "#ffffff";
                    }
                    return textFormatting.backgroundColor;
                  })(),
                }}
                title="Select highlight color"
              />

              <div
                id="highlightPalette"
                className="absolute top-full left-0 mt-1 p-2 bg-gray-700 rounded shadow-lg hidden z-10"
              >
                <div className="grid grid-cols-3 gap-1 w-24">
                  {[
                    { color: "#ffff00", name: "Yellow" },
                    { color: "#ff00ff", name: "Magenta" },
                    { color: "#00ffff", name: "Cyan" },
                    { color: "#90ee90", name: "Light Green" },
                    { color: "#ffb6c1", name: "Light Pink" },
                    { color: "#ffa500", name: "Orange" },
                    { color: "#87ceeb", name: "Sky Blue" },
                    { color: "#dda0dd", name: "Plum" },
                    { color: "#f0e68c", name: "Khaki" },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTextFormatting({
                          ...textFormatting,
                          backgroundColor: color,
                        });

                        const selection = window.getSelection();
                        // If cursor is just at a position with no selection
                        if (selection && selection.isCollapsed) {
                          // Create a span with the selected highlight color
                          const span = document.createElement("span");
                          span.style.backgroundColor = color;
                          span.style.display = "inline";
                          span.style.lineHeight = "1.2";
                          span.style.paddingTop = "0.15em";
                          span.style.paddingBottom = "0.15em";
                          span.style.boxDecorationBreak = "clone";
                          // Add a zero-width space so color is visible at cursor position
                          span.innerHTML = "&#8203;"; // zero-width space

                          const range = selection.getRangeAt(0);
                          range.insertNode(span);

                          // Move cursor after our inserted span
                          range.setStartAfter(span);
                          range.setEndAfter(span);
                          selection.removeAllRanges();
                          selection.addRange(range);

                          // Trigger content change manually
                          const event = new Event("input", { bubbles: true });
                          document
                            .querySelector("[contenteditable]")
                            ?.dispatchEvent(event);
                        } else if (
                          selection &&
                          selection.rangeCount > 0 &&
                          selection.toString().length > 0
                        ) {
                          // Enhanced highlighting for multi-line selections
                          const range = selection.getRangeAt(0);

                          // Function to recursively highlight content while preserving structure
                          const highlightContent = (node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                              // Text node - wrap in highlight span
                              const span = document.createElement("span");
                              span.style.backgroundColor = color;
                              span.style.display = "inline";
                              span.style.lineHeight = "1.2";
                              span.style.paddingTop = "0.15em";
                              span.style.paddingBottom = "0.15em";
                              span.style.boxDecorationBreak = "clone";
                              span.textContent = node.textContent;
                              return span;
                            } else if (node.nodeType === Node.ELEMENT_NODE) {
                              // Element node - preserve the element but highlight its contents
                              const newElement = node.cloneNode(false); // Clone without children

                              // Process each child
                              for (let i = 0; i < node.childNodes.length; i++) {
                                const highlightedChild = highlightContent(
                                  node.childNodes[i]
                                );
                                newElement.appendChild(highlightedChild);
                              }

                              return newElement;
                            }
                            // For other node types, return as is
                            return node.cloneNode(true);
                          };

                          try {
                            // Get the contents of the selection
                            const contents = range.extractContents();
                            const fragment = document.createDocumentFragment();

                            // Process each top-level node in the selection
                            for (
                              let i = 0;
                              i < contents.childNodes.length;
                              i++
                            ) {
                              const highlightedNode = highlightContent(
                                contents.childNodes[i]
                              );
                              fragment.appendChild(highlightedNode);
                            }

                            // Insert the highlighted content back
                            range.insertNode(fragment);

                            // Clear selection
                            selection.removeAllRanges();

                            // Trigger content change manually
                            const event = new Event("input", { bubbles: true });
                            document
                              .querySelector("[contenteditable]")
                              ?.dispatchEvent(event);
                          } catch (error) {
                            console.log(
                              "Error highlighting multi-line content:",
                              error
                            );
                            // Fallback to standard approach
                            applyFormat("hiliteColor", color);
                          }
                        } else {
                          // No selection, apply standard approach
                          applyFormat("hiliteColor", color);
                        }

                        // Hide the palette
                        document
                          .getElementById("highlightPalette")
                          .classList.add("hidden");
                      }}
                      className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                        textFormatting.backgroundColor === color
                          ? "border-white shadow-lg"
                          : "border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`${name} highlight`}
                    />
                  ))}

                  {/* Remove Highlight Button */}
                  <button
                    onClick={() => {
                      setTextFormatting({
                        ...textFormatting,
                        backgroundColor: "transparent",
                      });

                      const selection = window.getSelection();
                      if (
                        selection &&
                        selection.rangeCount > 0 &&
                        selection.toString().length > 0
                      ) {
                        // Enhanced remove highlighting for multi-line selections
                        const range = selection.getRangeAt(0);

                        // Function to recursively remove background colors while preserving structure
                        const cleanContent = (node) => {
                          if (node.nodeType === Node.TEXT_NODE) {
                            // Text node - return as is
                            return document.createTextNode(node.textContent);
                          } else if (node.nodeType === Node.ELEMENT_NODE) {
                            // Element node - check if this is a highlight span
                            if (
                              node.tagName.toLowerCase() === "span" &&
                              (node.style.backgroundColor ||
                                node.style.paddingTop ||
                                node.style.paddingBottom ||
                                node.style.boxDecorationBreak)
                            ) {
                              // This is a highlight span - extract its content without the span
                              const fragment =
                                document.createDocumentFragment();
                              for (let i = 0; i < node.childNodes.length; i++) {
                                const cleanedChild = cleanContent(
                                  node.childNodes[i]
                                );
                                if (
                                  cleanedChild.nodeType ===
                                  Node.DOCUMENT_FRAGMENT_NODE
                                ) {
                                  // If it's a fragment, append all its children
                                  while (cleanedChild.firstChild) {
                                    fragment.appendChild(
                                      cleanedChild.firstChild
                                    );
                                  }
                                } else {
                                  fragment.appendChild(cleanedChild);
                                }
                              }
                              return fragment;
                            } else {
                              // Regular element - preserve but clean highlight styles
                              const newElement = document.createElement(
                                node.tagName
                              );

                              // Copy all attributes
                              for (let i = 0; i < node.attributes.length; i++) {
                                const attr = node.attributes[i];
                                newElement.setAttribute(attr.name, attr.value);
                              }

                              // Copy styles except highlight-related ones
                              if (node.style) {
                                for (let i = 0; i < node.style.length; i++) {
                                  const property = node.style[i];
                                  if (
                                    property !== "background-color" &&
                                    property !== "padding-top" &&
                                    property !== "padding-bottom" &&
                                    property !== "box-decoration-break"
                                  ) {
                                    newElement.style[property] =
                                      node.style[property];
                                  }
                                }
                              }

                              // Process each child
                              for (let i = 0; i < node.childNodes.length; i++) {
                                const cleanedChild = cleanContent(
                                  node.childNodes[i]
                                );
                                if (
                                  cleanedChild.nodeType ===
                                  Node.DOCUMENT_FRAGMENT_NODE
                                ) {
                                  // If it's a fragment, append all its children
                                  while (cleanedChild.firstChild) {
                                    newElement.appendChild(
                                      cleanedChild.firstChild
                                    );
                                  }
                                } else {
                                  newElement.appendChild(cleanedChild);
                                }
                              }

                              return newElement;
                            }
                          }
                          // For other node types, return as is
                          return node.cloneNode(true);
                        };

                        try {
                          // Get the contents of the selection
                          const contents = range.extractContents();
                          const fragment = document.createDocumentFragment();

                          // Process each top-level node in the selection
                          for (let i = 0; i < contents.childNodes.length; i++) {
                            const cleanedNode = cleanContent(
                              contents.childNodes[i]
                            );
                            if (
                              cleanedNode.nodeType ===
                              Node.DOCUMENT_FRAGMENT_NODE
                            ) {
                              // If it's a fragment, append all its children
                              while (cleanedNode.firstChild) {
                                fragment.appendChild(cleanedNode.firstChild);
                              }
                            } else {
                              fragment.appendChild(cleanedNode);
                            }
                          }

                          // Insert the cleaned content back
                          range.insertNode(fragment);

                          // Clear selection
                          selection.removeAllRanges();

                          // Trigger content change
                          const event = new Event("input", { bubbles: true });
                          document
                            .querySelector("[contenteditable]")
                            ?.dispatchEvent(event);
                        } catch (error) {
                          console.log(
                            "Error removing multi-line highlighting:",
                            error
                          );
                          // Fallback to standard approach
                          applyFormat("removeFormat");
                        }
                      } else {
                        // For cursor position or no selection, try to remove highlight at cursor
                        try {
                          const range = selection.getRangeAt(0);
                          const selectedNode = range.startContainer;
                          let elementToCheck;

                          if (selectedNode.nodeType === 3) {
                            elementToCheck = selectedNode.parentElement;
                          } else {
                            elementToCheck = selectedNode;
                          }

                          // Check if we're inside a highlighted span
                          while (
                            elementToCheck &&
                            elementToCheck !== document.body
                          ) {
                            if (
                              elementToCheck.tagName &&
                              elementToCheck.tagName.toLowerCase() === "span" &&
                              (elementToCheck.style.backgroundColor ||
                                elementToCheck.style.paddingTop ||
                                elementToCheck.style.paddingBottom ||
                                elementToCheck.style.boxDecorationBreak)
                            ) {
                              // Found a highlight span - completely remove all highlight styles
                              elementToCheck.style.backgroundColor = "";
                              elementToCheck.style.paddingTop = "";
                              elementToCheck.style.paddingBottom = "";
                              elementToCheck.style.boxDecorationBreak = "";
                              elementToCheck.style.lineHeight = "";

                              // If the span has no remaining styles or content, remove it entirely
                              if (
                                !elementToCheck.style.cssText ||
                                elementToCheck.style.cssText.trim() === ""
                              ) {
                                const parent = elementToCheck.parentNode;
                                while (elementToCheck.firstChild) {
                                  parent.insertBefore(
                                    elementToCheck.firstChild,
                                    elementToCheck
                                  );
                                }
                                parent.removeChild(elementToCheck);
                              }
                              break;
                            }
                            elementToCheck = elementToCheck.parentElement;
                          }

                          // Trigger content change
                          const event = new Event("input", { bubbles: true });
                          document
                            .querySelector("[contenteditable]")
                            ?.dispatchEvent(event);
                        } catch (error) {
                          console.log(
                            "Error removing highlight at cursor:",
                            error
                          );
                          applyFormat("removeFormat");
                        }
                      }

                      // Hide the palette
                      document
                        .getElementById("highlightPalette")
                        .classList.add("hidden");
                    }}
                    className="col-span-3 w-full px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs mt-1"
                    title="Remove highlight"
                  >
                    None
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Font Size Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Size:</label>
            <select
              value={(() => {
                // Use detected font size or fallback to textFormatting.fontSize
                const pixelSize =
                  detectedFontSize || textFormatting.fontSize || 16;

                console.log("Current font size for dropdown:", pixelSize); // Debug log

                // Convert the number to string for exact comparison
                const pixelSizeNum = parseInt(pixelSize);

                // Map pixel sizes to dropdown values - exact matching first
                if (pixelSizeNum === 12) return "1";
                if (pixelSizeNum === 16) return "2";
                if (pixelSizeNum === 18) return "3";
                if (pixelSizeNum === 24) return "4";
                if (pixelSizeNum === 32) return "5";
                if (pixelSizeNum === 40) return "6";
                if (pixelSizeNum === 48) return "7";

                // If no exact match, find closest
                if (pixelSizeNum <= 14) return "1"; // 13-14px -> Size 1 (12px)
                if (pixelSizeNum <= 17) return "2"; // 15-17px -> Size 2 (16px)
                if (pixelSizeNum <= 21) return "3"; // 19-21px -> Size 3 (18px)
                if (pixelSizeNum <= 28) return "4"; // 22-28px -> Size 4 (24px)
                if (pixelSizeNum <= 36) return "5"; // 29-36px -> Size 5 (32px)
                if (pixelSizeNum <= 44) return "6"; // 37-44px -> Size 6 (40px)
                return "7"; // 45px+ -> Size 7 (48px)
              })()}
              onChange={(e) => {
                // Map dropdown values to pixel sizes - use STRING keys to match e.target.value
                const sizeMap = {
                  "1": 12,
                  "2": 16,
                  "3": 18,
                  "4": 24,
                  "5": 32,
                  "6": 40,
                  "7": 48,
                };
                const pixelSize = sizeMap[e.target.value] || 18;

                console.log(
                  "Selected dropdown value:",
                  e.target.value,
                  "-> Pixel size:",
                  pixelSize
                ); // Debug log

                // Update both detected size and formatting state
                setDetectedFontSize(pixelSize);
                setTextFormatting({ ...textFormatting, fontSize: pixelSize });
                applyFormat("fontSize", e.target.value);
              }}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              title="Choose font size"
            >
              <option value="1">12px</option>
              <option value="2">16px</option>
              <option value="3">18px</option>
              <option value="4">24px</option>
              <option value="5">32px</option>
              <option value="6">40px</option>
              <option value="7">48px</option>
            </select>
          </div>

          {/* Enhanced debug info */}
          <div className="text-xs text-gray-400">
            Debug: Detected={detectedFontSize}px, State=
            {textFormatting.fontSize}px, Dropdown Value=
            {(() => {
              const pixelSize =
                detectedFontSize || textFormatting.fontSize || 16;
              const pixelSizeNum = parseInt(pixelSize);
              if (pixelSizeNum === 12) return "1 (12px)";
              if (pixelSizeNum === 16) return "2 (16px)";
              if (pixelSizeNum === 18) return "3 (18px)";
              if (pixelSizeNum === 24) return "4 (24px)";
              if (pixelSizeNum === 32) return "5 (32px)";
              if (pixelSizeNum === 40) return "6 (40px)";
              if (pixelSizeNum === 48) return "7 (48px)";
              return "unknown";
            })()}
          </div>

          {/* Font Family */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Font:</label>
            <select
              value={textFormatting.fontFamily}
              onChange={(e) => {
                setTextFormatting({
                  ...textFormatting,
                  fontFamily: e.target.value,
                });
                applyFormat("fontName", e.target.value);
              }}
              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              title="Choose font family"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Align:</label>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  setTextFormatting({ ...textFormatting, textAlign: "left" });
                  applyFormat("justifyLeft");
                }}
                className={`px-2 py-1 rounded text-sm ${
                  textFormatting.textAlign === "left"
                    ? "bg-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                L
              </button>
              <button
                onClick={() => {
                  setTextFormatting({ ...textFormatting, textAlign: "center" });
                  applyFormat("justifyCenter");
                }}
                className={`px-2 py-1 rounded text-sm ${
                  textFormatting.textAlign === "center"
                    ? "bg-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                C
              </button>
              <button
                onClick={() => {
                  setTextFormatting({ ...textFormatting, textAlign: "right" });
                  applyFormat("justifyRight");
                }}
                className={`px-2 py-1 rounded text-sm ${
                  textFormatting.textAlign === "right"
                    ? "bg-blue-500"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                R
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
