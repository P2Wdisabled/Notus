interface ModeSelectorProps {
  mode: string;
  setMode: (mode: string) => void;
  onClearAllData: () => void;
}

export default function ModeSelector({ mode, setMode, onClearAllData }: ModeSelectorProps) {
  const toggleMode = () => {
    setMode(mode === "draw" ? "text" : "draw");
  };

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`p-2 rounded transition-colors ${
        mode === "draw"
          ? "bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
          : "bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
      }`}
      title={mode === "draw" ? "Switch to Text Mode" : "Switch to Draw Mode"}
    >
      {mode === "draw" ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3h6v2h-2v14h2v2H9v-2h2V5H9V3z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )}
    </button>
  );
}

