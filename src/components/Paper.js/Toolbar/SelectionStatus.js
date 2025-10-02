export default function SelectionStatus({ hasSelection, selectedText }) {
  return (
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
  );
}