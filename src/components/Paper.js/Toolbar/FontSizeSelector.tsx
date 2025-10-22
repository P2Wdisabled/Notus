interface TextFormatting {
  fontSize?: number;
  [key: string]: any;
}

interface FontSizeSelectorProps {
  textFormatting: TextFormatting;
  setTextFormatting: (formatting: TextFormatting) => void;
  detectedFontSize: number;
  setDetectedFontSize: (size: number) => void;
  applyFormat: (command: string, value?: string) => void;
}

export default function FontSizeSelector({ 
  textFormatting, 
  setTextFormatting, 
  detectedFontSize, 
  setDetectedFontSize, 
  applyFormat 
}: FontSizeSelectorProps) {
  return (
    <div className="flex items-center">
      <select
        value={(() => {
          // Use detected font size or fallback to textFormatting.fontSize
          const pixelSize = detectedFontSize || textFormatting.fontSize || 16;

          // Convert the number to string for exact comparison
          const pixelSizeNum = parseInt(String(pixelSize));

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
          const sizeMap: Record<string, number> = {
            "1": 12,
            "2": 16,
            "3": 18,
            "4": 24,
            "5": 32,
            "6": 40,
            "7": 48,
          };
          const pixelSize = sizeMap[e.target.value] || 18;

          // Update both detected size and formatting state
          setDetectedFontSize(pixelSize);
          setTextFormatting({ ...textFormatting, fontSize: pixelSize });

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
            // There's selected text
            try {
              const range = selection.getRangeAt(0);
              const selectedText = selection.toString();
              
              if (selectedText && selectedText.trim()) {
                // Function to find and update existing spans or create new ones
                const updateFontSizeInSelection = (node: Node): Node => {
                  if (node.nodeType === Node.TEXT_NODE) {
                    // Plain text - create a new span for it
                    const span = document.createElement("span");
                    span.style.fontSize = pixelSize + "px";
                    span.textContent = node.textContent;
                    return span;
                  } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    const tagName = element.tagName.toLowerCase();
                    
                    if (tagName === 'span') {
                      // This is a span - update its font-size but keep everything else
                      const newSpan = element.cloneNode(false) as HTMLElement; // Clone without children
                      newSpan.style.fontSize = pixelSize + "px";
                      
                      // Process children and add them to the updated span
                      for (let i = 0; i < element.childNodes.length; i++) {
                        const updatedChild = updateFontSizeInSelection(element.childNodes[i]);
                        if (updatedChild.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                          while (updatedChild.firstChild) {
                            newSpan.appendChild(updatedChild.firstChild);
                          }
                        } else {
                          newSpan.appendChild(updatedChild);
                        }
                      }
                      
                      return newSpan;
                    } else {
                      // Other element - preserve it and process children
                      const newElement = element.cloneNode(false) as HTMLElement; // Clone without children
                      
                      // Process children
                      for (let i = 0; i < element.childNodes.length; i++) {
                        const updatedChild = updateFontSizeInSelection(element.childNodes[i]);
                        if (updatedChild.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                          while (updatedChild.firstChild) {
                            newElement.appendChild(updatedChild.firstChild);
                          }
                        } else {
                          newElement.appendChild(updatedChild);
                        }
                      }
                      
                      return newElement;
                    }
                  }
                  return node.cloneNode(true);
                };

                // Get the range contents
                const contents = range.extractContents();
                const updatedFragment = document.createDocumentFragment();
                
                // Check if the selection contains any spans
                let hasSpans = false;
                const checkForSpans = (node: Node) => {
                  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'span') {
                    hasSpans = true;
                    return;
                  }
                  for (let i = 0; i < node.childNodes.length; i++) {
                    checkForSpans(node.childNodes[i]);
                  }
                };
                
                for (let i = 0; i < contents.childNodes.length; i++) {
                  checkForSpans(contents.childNodes[i]);
                }
                
                if (hasSpans) {
                  // There are spans - update their font-size
                  for (let i = 0; i < contents.childNodes.length; i++) {
                    const updatedNode = updateFontSizeInSelection(contents.childNodes[i]);
                    updatedFragment.appendChild(updatedNode);
                  }
                } else {
                  // No spans - create a new one
                  const span = document.createElement("span");
                  span.style.fontSize = pixelSize + "px";
                  span.textContent = selectedText;
                  updatedFragment.appendChild(span);
                }
                
                // Insert the updated content
                range.insertNode(updatedFragment);
                
                // Position cursor after the content
                range.setStartAfter(updatedFragment.lastChild || updatedFragment);
                range.setEndAfter(updatedFragment.lastChild || updatedFragment);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger content change
                const event = new Event("input", { bubbles: true });
                document.querySelector("[contenteditable]")?.dispatchEvent(event);
              }
              
            } catch (error) {
              // Fallback to standard approach
              applyFormat("fontSize", e.target.value);
            }
          } else {
            // No selection - just cursor position
            applyFormat("fontSize", e.target.value);
          }
        }}
        className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
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
  );
}

