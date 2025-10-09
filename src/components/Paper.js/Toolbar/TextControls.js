import useTextFormatting from '../../../hooks/UseTextFormatting';
import FormatButtons from './FormatButtons.js';
import TextColorPicker from './TextColorPicker';
import HighlightPicker from './HighlightPicker';
import FontSizeSelector from './FontSizeSelector';
import FontFamilySelector from './FontFamilySelector';
import TextAlignment from './TextAlignment';

export default function TextControls({ textFormatting, setTextFormatting }) {
  const {
    hasSelection,
    selectedText,
    detectedFontSize,
    setDetectedFontSize,
    isBold,
    isItalic,
    isUnderline,
    applyFormat,
  } = useTextFormatting("text", textFormatting, setTextFormatting);

  return (
    <div className="flex flex-wrap gap-4 space-x-4">
      
      <FormatButtons
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        applyFormat={applyFormat}
      />
      
      <TextColorPicker
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        applyFormat={applyFormat}
      />
      
      <HighlightPicker
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        applyFormat={applyFormat}
      />
      
      <FontSizeSelector
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        detectedFontSize={detectedFontSize}
        setDetectedFontSize={setDetectedFontSize}
        applyFormat={applyFormat}
      />
      
      <FontFamilySelector
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        applyFormat={applyFormat}
      />
      
      <TextAlignment
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        applyFormat={applyFormat}
      />
    </div>
  );
}