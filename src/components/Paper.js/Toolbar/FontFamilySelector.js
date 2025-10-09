export default function FontFamilySelector({ textFormatting, setTextFormatting, applyFormat }) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Font:</label>
      <select
        value={(() => {
          // Get font family from selection or cursor position
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            let elementToCheck;
            
            if (selection.toString().length > 0) {
              // Text is selected - check the first character
              const selectedNode = range.startContainer;
              if (selectedNode.nodeType === 3) {
                elementToCheck = selectedNode.parentElement;
              } else if (selectedNode.childNodes.length > 0 && range.startOffset < selectedNode.childNodes.length) {
                const childNode = selectedNode.childNodes[range.startOffset];
                elementToCheck = childNode.nodeType === 3 ? childNode.parentElement : childNode;
              } else {
                elementToCheck = selectedNode;
              }
            } else {
              // Just cursor position - improved detection
              const selectedNode = range.startContainer;
              
              if (selectedNode.nodeType === 3) {
                // Cursor is in a text node - check parent
                elementToCheck = selectedNode.parentElement;
              } else {
                // Cursor is in an element node
                if (range.startOffset > 0 && selectedNode.childNodes.length > 0) {
                  // Check the element before the cursor
                  const prevChild = selectedNode.childNodes[range.startOffset - 1];
                  if (prevChild.nodeType === 3) {
                    elementToCheck = prevChild.parentElement;
                  } else {
                    elementToCheck = prevChild;
                  }
                } else if (range.startOffset < selectedNode.childNodes.length) {
                  // Check the element at the cursor position
                  const currentChild = selectedNode.childNodes[range.startOffset];
                  if (currentChild.nodeType === 3) {
                    elementToCheck = currentChild.parentElement;
                  } else {
                    elementToCheck = currentChild;
                  }
                } else {
                  // Cursor is at the end or element has no children
                  elementToCheck = selectedNode;
                }
              }
            }
            
            if (elementToCheck) {
              // Walk up the DOM tree to find font styling
              let currentElement = elementToCheck;
              while (currentElement && currentElement !== document.body) {
                // Check for font tag first
                if (currentElement.tagName && currentElement.tagName.toLowerCase() === 'font' && currentElement.face) {
                  const fontFace = currentElement.face;
                  // Map font face to our select options
                  switch (fontFace.toLowerCase()) {
                    case 'inter':
                      return "Inter, sans-serif";
                    case 'arial':
                      return "Arial, sans-serif";
                    case 'georgia':
                      return "Georgia, serif";
                    case 'times new roman':
                      return "'Times New Roman', serif";
                    case 'courier new':
                      return "'Courier New', monospace";
                    case 'verdana':
                      return "Verdana, sans-serif";
                    default:
                      // Try to match partial names
                      if (fontFace.toLowerCase().includes('inter')) return "Inter, sans-serif";
                      if (fontFace.toLowerCase().includes('arial')) return "Arial, sans-serif";
                      if (fontFace.toLowerCase().includes('georgia')) return "Georgia, serif";
                      if (fontFace.toLowerCase().includes('times')) return "'Times New Roman', serif";
                      if (fontFace.toLowerCase().includes('courier')) return "'Courier New', monospace";
                      if (fontFace.toLowerCase().includes('verdana')) return "Verdana, sans-serif";
                      return fontFace; // Return as-is if no match
                  }
                }
                
                // Check for CSS font-family on this element
                if (currentElement.style && currentElement.style.fontFamily) {
                  const fontFamily = currentElement.style.fontFamily;
                  const lowerFont = fontFamily.toLowerCase();
                  if (lowerFont.includes('inter')) return "Inter, sans-serif";
                  if (lowerFont.includes('arial')) return "Arial, sans-serif";
                  if (lowerFont.includes('georgia')) return "Georgia, serif";
                  if (lowerFont.includes('times')) return "'Times New Roman', serif";
                  if (lowerFont.includes('courier')) return "'Courier New', monospace";
                  if (lowerFont.includes('verdana')) return "Verdana, sans-serif";
                  return fontFamily;
                }
                
                currentElement = currentElement.parentElement;
              }
              
              // Final check with computed style on the original element
              if (elementToCheck && elementToCheck instanceof Element) {
                const computedStyle = window.getComputedStyle(elementToCheck);
                if (computedStyle.fontFamily) {
                  const fontFamily = computedStyle.fontFamily;
                  
                  // Update state if different from current
                  if (fontFamily !== textFormatting.fontFamily) {
                    setTimeout(
                      () =>
                        setTextFormatting((prev) => ({
                          ...prev,
                          fontFamily: fontFamily,
                        })),
                      0
                    );
                  }
                  
                  // Match computed font family to our options
                  const lowerFont = fontFamily.toLowerCase();
                  if (lowerFont.includes('inter')) return "Inter, sans-serif";
                  if (lowerFont.includes('arial')) return "Arial, sans-serif";
                  if (lowerFont.includes('georgia')) return "Georgia, serif";
                  if (lowerFont.includes('times')) return "'Times New Roman', serif";
                  if (lowerFont.includes('courier')) return "'Courier New', monospace";
                  if (lowerFont.includes('verdana')) return "Verdana, sans-serif";
                  
                  return fontFamily;
                }
              }
            }
          }
          
          // Fallback to current text formatting
          return textFormatting.fontFamily || "Inter, sans-serif";
        })()}
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
  );
}