export default function TextColorPicker({
  textFormatting,
  setTextFormatting,
  applyFormat,
}) {
  const getCurrentColor = () => {
    // Get text color from selection or cursor position
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      selection.toString().length > 0
    ) {
      // There's a selection - check its color
      const range = selection.getRangeAt(0);

      const selectedNode = range.startContainer;
      let elementToCheck;

      if (selectedNode.nodeType === 3) {
        // Text node
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
            : childNode;
      } else {
        elementToCheck = selectedNode;
      }

      if (elementToCheck) {
        const computedStyle = window.getComputedStyle(elementToCheck);
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

    // Default to black when no selection or no color detected
    return textFormatting.color || "#000000";
  };

  return (
    <div className="flex items-center relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            // Hide highlight palette if it's open
            document
              .getElementById("highlightPalette")
              ?.classList.add("hidden");
            // Toggle color palette
            document.getElementById("colorPalette").classList.toggle("hidden");
          }}
          className="p-2 rounded bg-gray-600 hover:bg-gray-500 text-gray-200 transition-all hover:shadow-md relative"
          title="Select text color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.62 12L12 5.67 14.38 12M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: getCurrentColor() }}
          />
        </button>

        <div
          id="colorPalette"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          className="absolute top-full left-0 mt-1 p-2 bg-gray-700 rounded shadow-lg hidden z-50"
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
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                key={color}
                onClick={() => {
                  setTextFormatting({ ...textFormatting, color });
                  applyFormat("foreColor", color);
                  document
                    .getElementById("colorPalette")
                    .classList.add("hidden");
                }}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  (textFormatting.color || "#000000") === color
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
  );
}
