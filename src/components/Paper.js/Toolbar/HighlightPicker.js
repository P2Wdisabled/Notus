export default function HighlightPicker({ textFormatting, setTextFormatting, applyFormat }) {
  return (
    <div className="flex items-center space-x-2 relative">
      <label className="text-sm font-medium">Highlight:</label>
      <div className="relative">
        <button
          onClick={() => {
            // Hide color palette if it's open
            document.getElementById("colorPalette")?.classList.add("hidden");
            // Toggle highlight palette
            document.getElementById("highlightPalette").classList.toggle("hidden");
          }}
          className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
            textFormatting.backgroundColor && textFormatting.backgroundColor !== "transparent"
              ? "border-white shadow-lg"
              : "border-gray-400"
          }`}
          style={{
            backgroundColor: (() => {
              // Get background color from selection or cursor position
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                const selectedNode = range.startContainer;
                let elementToCheck;
                
                if (selectedNode.nodeType === 3) {
                  elementToCheck = selectedNode.parentElement;
                } else if (selectedNode.childNodes.length > 0 && range.startOffset > 0) {
                  const childNode = selectedNode.childNodes[range.startOffset - 1];
                  elementToCheck = childNode.nodeType === 3 ? childNode.parentElement : childNode;
                } else {
                  elementToCheck = selectedNode;
                }
                
                if (elementToCheck) {
                  const computedStyle = window.getComputedStyle(elementToCheck);
                  if (
                    computedStyle.backgroundColor &&
                    computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                    computedStyle.backgroundColor !== "transparent"
                  ) {
                    if (computedStyle.backgroundColor !== textFormatting.backgroundColor) {
                      setTimeout(
                        () =>
                          setTextFormatting((prev) => ({
                            ...prev,
                            backgroundColor: computedStyle.backgroundColor,
                          })),
                        0
                      );
                    }
                    return computedStyle.backgroundColor;
                  }
                }
              }
              if (textFormatting.backgroundColor === "transparent" || !textFormatting.backgroundColor) {
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
                  setTextFormatting({ ...textFormatting, backgroundColor: color });
                  
                  const selection = window.getSelection();
                  if (selection && selection.isCollapsed) {
                    const span = document.createElement('span');
                    span.style.backgroundColor = color;
                    span.style.display = "inline";
                    span.style.lineHeight = "1.2";
                    span.style.paddingTop = "0.2em";
                    span.style.paddingBottom = "0.2em";
                    span.style.boxDecorationBreak = "clone";
                    span.innerHTML = '&#8203;';
                    
                    const range = selection.getRangeAt(0);
                    range.insertNode(span);
                    
                    range.setStartAfter(span);
                    range.setEndAfter(span);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    const event = new Event("input", { bubbles: true });
                    document.querySelector("[contenteditable]")?.dispatchEvent(event);
                  } else if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
                    // COMPLETELY REWRITTEN: Use the same direct approach as "None" button
                    try {
                      const range = selection.getRangeAt(0);
                      
                      // Get all span elements that intersect with the selection
                      const container = range.commonAncestorContainer;
                      const rootElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
                      
                      // Find all spans within the selection
                      const allSpans = rootElement.querySelectorAll('span');
                      const spansInSelection = Array.from(allSpans).filter(span => {
                        return range.intersectsNode(span);
                      });
                      
                      let foundAndUpdatedHighlight = false;
                      
                      // Update existing highlight spans directly
                      spansInSelection.forEach(span => {
                        const hasHighlight = span.style.backgroundColor && 
                                            span.style.backgroundColor !== "transparent" && 
                                            span.style.backgroundColor !== "rgba(0, 0, 0, 0)";
                        const hasPadding = span.style.paddingTop || span.style.paddingBottom;
                        
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
                      
                      // If no highlight spans were found, use the standard execCommand approach
                      if (!foundAndUpdatedHighlight) {
                        // Fallback to standard browser highlighting
                        document.execCommand('hiliteColor', false, color);
                      }
                      
                      const event = new Event("input", { bubbles: true });
                      document.querySelector("[contenteditable]")?.dispatchEvent(event);
                      
                    } catch (error) {
                      // console.log("Error highlighting content:", error);
                      // Final fallback
                      document.execCommand('hiliteColor', false, color);
                    }
                  } else {
                    applyFormat("hiliteColor", color);
                  }
                  
                  document.getElementById("highlightPalette").classList.add("hidden");
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
                  // Enhanced span detection - check all elements, not just spans
                  try {
                    const range = selection.getRangeAt(0);
                    
                    // Get all elements that intersect with the selection
                    const container = range.commonAncestorContainer;
                    let rootElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
                    
                    // Go up to find a better root element if needed
                    while (rootElement && rootElement.tagName === 'FONT') {
                      rootElement = rootElement.parentElement;
                    }
                    
                    // Find all spans AND font elements within the selection
                    const allElements = rootElement.querySelectorAll('span, font[style*="background"]');
                    const elementsInSelection = Array.from(allElements).filter(element => {
                      return range.intersectsNode(element);
                    });
                    
                    // Also check if the selection contains any elements with inline background styles
                    const rangeContents = range.cloneContents();
                    const tempDiv = document.createElement('div');
                    tempDiv.appendChild(rangeContents);
                    const inlineStyledElements = tempDiv.querySelectorAll('[style*="background"]');
                    
                    let foundAndUpdatedHighlight = false;
                    
                    // Process all found elements
                    [...elementsInSelection, ...Array.from(inlineStyledElements)].forEach(element => {
                      if (!element.parentElement) return; // Skip if not in DOM
                      
                      const hasHighlight = element.style.backgroundColor && 
                                          element.style.backgroundColor !== "transparent" && 
                                          element.style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                                          element.style.backgroundColor !== "";
                      const hasPadding = element.style.paddingTop || element.style.paddingBottom;
                      
                      if (hasHighlight || hasPadding) {
                        foundAndUpdatedHighlight = true;
                        
                        // Try multiple removal approaches
                        element.style.removeProperty('background-color');
                        element.style.removeProperty('background');
                        element.style.removeProperty('padding-top');
                        element.style.removeProperty('padding-bottom');
                        element.style.removeProperty('box-decoration-break');
                        
                        // If still has background, try setting to empty or transparent
                        if (element.style.backgroundColor) {
                          element.style.backgroundColor = "";
                          if (element.style.backgroundColor) {
                            element.style.backgroundColor = "transparent";
                          }
                        }
                      }
                    });
                    
                    // If no elements were found, try execCommand as fallback
                    if (!foundAndUpdatedHighlight) {
                      document.execCommand('removeFormat', false, null);
                    }
                    
                    const event = new Event("input", { bubbles: true });
                    document.querySelector("[contenteditable]")?.dispatchEvent(event);
                    
                  } catch (error) {
                    // console.log("Error removing highlighting:", error);
                    // Fallback
                    document.execCommand('removeFormat', false, null);
                  }
                } else if (selection && selection.rangeCount > 0) {
                  // No selection, just cursor position
                  const range = selection.getRangeAt(0);
                  const selectedNode = range.startContainer;
                  let elementToCheck = selectedNode.nodeType === 3 ? selectedNode.parentElement : selectedNode;
                  
                  while (elementToCheck && elementToCheck !== document.body) {
                    if (elementToCheck.tagName && (elementToCheck.tagName.toLowerCase() === "span" || elementToCheck.tagName.toLowerCase() === "font")) {
                      const hasBackground = elementToCheck.style.backgroundColor && 
                                           elementToCheck.style.backgroundColor !== "transparent" && 
                                           elementToCheck.style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                                           elementToCheck.style.backgroundColor !== "";
                      const hasPadding = elementToCheck.style.paddingTop || elementToCheck.style.paddingBottom;
                      const hasBoxDecoration = elementToCheck.style.boxDecorationBreak;
                      
                      if (hasBackground || hasPadding || hasBoxDecoration) {
                        // Try multiple removal approaches
                        elementToCheck.style.removeProperty('background-color');
                        elementToCheck.style.removeProperty('background');
                        elementToCheck.style.removeProperty('padding-top');
                        elementToCheck.style.removeProperty('padding-bottom');
                        elementToCheck.style.removeProperty('box-decoration-break');
                        
                        // If still has background, try setting to empty or transparent
                        if (elementToCheck.style.backgroundColor) {
                          elementToCheck.style.backgroundColor = "";
                          if (elementToCheck.style.backgroundColor) {
                            elementToCheck.style.backgroundColor = "transparent";
                          }
                        }
                        
                        const event = new Event("input", { bubbles: true });
                        document.querySelector("[contenteditable]")?.dispatchEvent(event);
                        break;
                      }
                    }
                    elementToCheck = elementToCheck.parentElement;
                  }
                }

                document.getElementById("highlightPalette").classList.add("hidden");
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
  );
}