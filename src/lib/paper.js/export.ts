'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { ExportOptions } from './types';

// Utility function to clean HTML content for text export
const htmlToText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Replace common HTML elements with text equivalents
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace and line breaks
  return text.replace(/\s+/g, ' ').trim();
};

// Export to text file
export const exportToPDF = async (content: string, filename: string = 'document'): Promise<void> => {
  try {
    console.log('Starting PDF export with content:', content.substring(0, 100) + '...');
    
    // Get the actual contentEditable element from the page
    const originalEditor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    
    if (!originalEditor) {
      throw new Error('Could not find contentEditable element');
    }
    
    console.log('Found original editor, creating optimized clone...');
    
    // Clone the original content with exact styles
    const clonedContent = originalEditor.cloneNode(true) as HTMLElement;
    clonedContent.removeAttribute('contenteditable');
    
    // Create a temporary iframe for isolated rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '794px'; // A4 width in pixels at 96 DPI
    iframe.style.height = '1123px'; // A4 height in pixels at 96 DPI
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Could not access iframe document');
    }
    
    // Create optimized HTML content for the iframe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 30px;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.4;
              color: #000;
              background: white;
              width: 794px;
              min-height: 1123px;
            }
            
            .content {
              max-width: 100%;
              background: white;
            }
            
            /* Preserve all text formatting */
            span, strong, em, b, i, u {
              color: inherit;
              background-color: inherit !important;
            }
            
            /* Fix bullet points */
            ul, ol {
              margin: 0.5em 0;
              padding-left: 1.5em;
            }
            
            li {
              margin: 0.2em 0;
              display: list-item;
              list-style-position: outside;
            }
            
            ul li {
              list-style-type: disc;
              color: black !important; /* Force bullet points to be black */
            }
            
            ol li {
              list-style-type: decimal;
              color: black !important; /* Force list numbers to be black */
            }
            
            /* Ensure proper paragraph spacing */
            p, div {
              margin: 0.5em 0;
            }
            
            /* Fix highlighted text alignment - critical fix */
            span[style*="background-color"] {
              display: inline !important;
              vertical-align: baseline !important;
              line-height: inherit !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Force background colors to show - comprehensive color coverage */
            [style*="background-color: yellow"] { background-color: yellow !important; }
            [style*="background-color: rgb(255, 255, 0)"] { background-color: rgb(255, 255, 0) !important; }
            [style*="background-color: #ffff00"] { background-color: #ffff00 !important; }
            
            [style*="background-color: green"] { background-color: green !important; }
            [style*="background-color: rgb(0, 128, 0)"] { background-color: rgb(0, 128, 0) !important; }
            [style*="background-color: rgb(0, 255, 0)"] { background-color: rgb(0, 255, 0) !important; }
            [style*="background-color: lime"] { background-color: lime !important; }
            [style*="background-color: #00ff00"] { background-color: #00ff00 !important; }
            [style*="background-color: #008000"] { background-color: #008000 !important; }
            [style*="background-color: rgb(128, 255, 128)"] { background-color: rgb(128, 255, 128) !important; }
            
            [style*="background-color: purple"] { background-color: purple !important; }
            [style*="background-color: rgb(128, 0, 128)"] { background-color: rgb(128, 0, 128) !important; }
            [style*="background-color: #800080"] { background-color: #800080 !important; }
            
            [style*="background-color: blue"] { background-color: blue !important; }
            [style*="background-color: rgb(0, 0, 255)"] { background-color: rgb(0, 0, 255) !important; }
            [style*="background-color: #0000ff"] { background-color: #0000ff !important; }
          </style>
        </head>
        <body>
          <div class="content">
            ${clonedContent.innerHTML}
          </div>
        </body>
      </html>
    `;
    
    // Write content to iframe
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for iframe to load, then fix colors dynamically
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dynamic color detection and preservation
    const spans = iframeDoc.querySelectorAll('span[style*="background-color"]');
    console.log(`Found ${spans.length} spans with background colors`);
    
    spans.forEach((span, index) => {
      const htmlSpan = span as HTMLElement;
      const styleAttr = htmlSpan.getAttribute('style') || '';
      console.log(`Span ${index}: ${styleAttr}`);
      
      // Extract the background-color value from the style attribute
      const bgColorMatch = styleAttr.match(/background-color:\s*([^;]+)/i);
      if (bgColorMatch) {
        const bgColor = bgColorMatch[1].trim();
        console.log(`Setting background color: ${bgColor}`);
        htmlSpan.style.backgroundColor = bgColor;
        htmlSpan.style.setProperty('background-color', bgColor, 'important');
      }
    });
    
    // Wait for layout to complete after color fixes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Rendering iframe content with html2canvas...');
    
    // Capture the iframe content
    const canvas = await html2canvas(iframe.contentDocument!.body, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: iframe.contentDocument!.body.scrollHeight || 1123,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: true
    });
    
    // Clean up iframe
    document.body.removeChild(iframe);
    
    // Generate PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate scaling to fit A4 page with margins
    const margin = 10;
    const availableWidth = pdfWidth - (2 * margin);
    const availableHeight = pdfHeight - (2 * margin);
    
    // Convert canvas dimensions to mm
    const imgWidthMM = (canvas.width * 25.4) / (96 * 2); // Account for scale=2
    const imgHeightMM = (canvas.height * 25.4) / (96 * 2);
    
    // Scale to fit page
    const scaleX = availableWidth / imgWidthMM;
    const scaleY = availableHeight / imgHeightMM;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    const finalWidth = imgWidthMM * scale;
    const finalHeight = imgHeightMM * scale;
    
    const x = margin + (availableWidth - finalWidth) / 2;
    const y = margin;
    
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(`${filename}.pdf`);
    
    console.log('PDF export completed successfully');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(`Failed to export PDF: ${error}`);
  }
};

// Enhanced HTML processing - simplified approach for perfect alignment
const processHTMLForExport = (html: string): string => {
  if (!html || html.trim() === '') return '<p>No content</p>';
  
  // Very minimal processing - just convert divs to paragraphs and clean up lists
  let processed = html.trim();
  
  // Simple div to paragraph conversion
  processed = processed.replace(/<div([^>]*?)>/gi, '<p$1>');
  processed = processed.replace(/<\/div>/gi, '</p>');
  
  // Fix list nesting
  processed = processed.replace(/<p[^>]*?>\s*<ul>/gi, '<ul>');
  processed = processed.replace(/<\/ul>\s*<\/p>/gi, '</ul>');
  processed = processed.replace(/<p[^>]*?>\s*<ol>/gi, '<ol>');
  processed = processed.replace(/<\/ol>\s*<\/p>/gi, '</ol>');
  
  // Clean up empty paragraphs
  processed = processed.replace(/<p[^>]*?>\s*<\/p>/gi, '');
  
  return processed || '<p>No content</p>';
};

// Export to Word (DOCX) - Native Word document with proper formatting
export const exportToWord = async (content: string, filename: string = 'document'): Promise<void> => {
  try {
    console.log('Starting native Word export with content:', content.substring(0, 100) + '...');
    
    // Get the actual contentEditable element from the page
    const originalEditor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    
    if (!originalEditor) {
      throw new Error('Could not find contentEditable element');
    }
    
    console.log('Found original editor, parsing content for Word...');
    console.log('=== FULL HTML STRUCTURE ===');
    console.log(originalEditor.innerHTML);
    console.log('=== END HTML STRUCTURE ===');
    
    // Let's also inspect each element individually
    const allSpans = originalEditor.querySelectorAll('span');
    console.log(`\n=== FOUND ${allSpans.length} SPAN ELEMENTS ===`);
    allSpans.forEach((span, index) => {
      const element = span as HTMLElement;
      console.log(`Span ${index}:`);
      console.log(`  Text: "${element.textContent}"`);
      console.log(`  Style: ${element.getAttribute('style')}`);
      console.log(`  Computed color: ${getComputedStyle(element).color}`);
      console.log(`  Computed background: ${getComputedStyle(element).backgroundColor}`);
      console.log('---');
    });
    
    // Parse the HTML content and convert to Word document structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalEditor.innerHTML;
    
    // Convert HTML to Word paragraphs
    const paragraphs: Paragraph[] = [];
    
    // Process the content node by node
    const processNode = (node: Node): TextRun[] => {
      const textRuns: TextRun[] = [];
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim()) {
          textRuns.push(new TextRun({
            text: text,
            size: 24, // 12pt default
            font: "Arial",
          }));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'span') {
          // Process span with formatting
          const style = element.getAttribute('style') || '';
          const text = element.textContent || '';
          
          if (text.trim()) {
            console.log(`\n=== Processing span: "${text}" ===`);
            console.log(`Full style: ${style}`);
            
            // Let's check what the browser actually computed for this element
            const computedStyle = getComputedStyle(element);
            console.log(`🖥️ BROWSER COMPUTED STYLES:`);
            console.log(`   Color: ${computedStyle.color}`);
            console.log(`   Background: ${computedStyle.backgroundColor}`);
            
            // Extract formatting from style attribute
            let fontSize = 24; // 12pt default
            let color = '000000'; // black default
            let highlightColor: string | undefined;
            let bold = false;
            let italic = false;
            let underline = false;
            
            // Parse font-size
            const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
            if (fontSizeMatch) {
              const px = parseInt(fontSizeMatch[1]);
              fontSize = px * 1.5; // Convert px to half-points (Word uses half-points)
              console.log(`Converting font-size: ${px}px -> ${fontSize/2}pt`);
            }
            
            // Step 1: Check for background-color (CUSTOM HIGHLIGHT) - RGB format only
            const bgColorMatch = style.match(/background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (bgColorMatch) {
              const bgColor = bgColorMatch[0]; // Full match
              console.log(`🎨 BACKGROUND COLOR detected: ${bgColor}`);
              
              // Convert RGB background color to hex format for Word highlighting
              const r = parseInt(bgColorMatch[1]).toString(16).padStart(2, '0');
              const g = parseInt(bgColorMatch[2]).toString(16).padStart(2, '0');
              const b = parseInt(bgColorMatch[3]).toString(16).padStart(2, '0');
              const hexColor = r + g + b;
              console.log(`🎨 RGB background color: ${bgColor} -> #${hexColor}`);
              
              highlightColor = hexColor;
              console.log(`✅ Applied background highlight color: #${hexColor}`);
            } else {
              console.log(`❌ No background color found in: ${style}`);
            }
            
            // Step 2: Check for text color (TEXT only) - completely separate from background
            // This runs ALWAYS, regardless of background color
            const colorRgbMatch = style.match(/(?<!background-)color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (colorRgbMatch) {
              const r = parseInt(colorRgbMatch[1]).toString(16).padStart(2, '0');
              const g = parseInt(colorRgbMatch[2]).toString(16).padStart(2, '0');
              const b = parseInt(colorRgbMatch[3]).toString(16).padStart(2, '0');
              color = r + g + b;
              console.log(`Text color RGB: rgb(${colorRgbMatch[1]}, ${colorRgbMatch[2]}, ${colorRgbMatch[3]}) -> #${color}`);
            } else {
              const colorHexMatch = style.match(/(?<!background-)color:\s*(#[0-9a-fA-F]{6})/);
              if (colorHexMatch) {
                color = colorHexMatch[1].substring(1);
                console.log(`Text color HEX: ${colorHexMatch[1]} -> ${color}`);
              }
            }
            
            // Check for bold, italic, underline
            if (style.includes('font-weight: bold') || element.closest('strong, b')) {
              bold = true;
            }
            if (style.includes('font-style: italic') || element.closest('em, i')) {
              italic = true;
            }
            if (style.includes('text-decoration: underline') || element.closest('u')) {
              underline = true;
            }
            
            // Create TextRun with RADICAL color separation approach
            // First: Create base TextRun with ONLY text properties
            const baseTextRun = {
              text: text,
              size: fontSize,
              color: color, // ONLY text color, no background interference
              bold: bold,
              italics: italic,
              underline: underline ? {} : undefined,
              font: "Arial",
            };
            
            console.log(`BASE TextRun created with text color: #${color}`);
            
            // Second: If there's a background, create it with proper highlight handling
            if (highlightColor) {
              console.log(`🎨 CREATING BACKGROUND: #${highlightColor} for text: "${text}"`);
              console.log(`📝 TEXT COLOR SHOULD BE: #${color}`);
              
              // Map custom colors to predefined highlights where possible
              const predefinedHighlights: Record<string, string> = {
                'ffff00': 'yellow',
                '00ff00': 'green',
                '0000ff': 'blue',
                'ff0000': 'red',
                '00ffff': 'cyan',
                'ff00ff': 'magenta',
                '000000': 'black',
                'ffffff': 'white',
                '808080': 'lightGray',
                '404040': 'darkGray'
              };
              
              const textRunWithBackground = {
                ...baseTextRun,
                color: color, // Text color
              };
              
              // Use predefined highlight if available, otherwise use shading
              if (predefinedHighlights[highlightColor]) {
                (textRunWithBackground as any).highlight = predefinedHighlights[highlightColor];
                console.log(`✅ Using predefined highlight: ${predefinedHighlights[highlightColor]}`);
              } else {
                // For custom colors, use shading with proper format
                (textRunWithBackground as any).shading = {
                  fill: highlightColor
                };
                console.log(`✅ Using custom shading: #${highlightColor}`);
              }
              
              console.log(`🔧 FINAL CONFIG:`, {
                text: textRunWithBackground.text,
                color: textRunWithBackground.color,
                highlight: (textRunWithBackground as any).highlight,
                shading: (textRunWithBackground as any).shading
              });
              
              textRuns.push(new TextRun(textRunWithBackground));
              console.log(`✅ Created TextRun WITH background`);
            } else {
              // No background, just create normal text run
              textRuns.push(new TextRun(baseTextRun));
              console.log(`Created TextRun WITHOUT background: text=#${color}`);
            }
            
            console.log(`=== END PROCESSING "${text}" ===\n`);
          }
        } else {
          // Process child nodes normally
          for (const child of Array.from(element.childNodes)) {
            textRuns.push(...processNode(child));
          }
        }
      }
      
      return textRuns;
    };
    
    // Process all child nodes of the editor - create simple paragraphs (no list handling)
    console.log('Processing main content...');
    for (const child of Array.from(tempDiv.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text.trim()) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: text, size: 24, font: "Arial" })],
          }));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        
        // Process all elements as regular paragraphs (no special list handling)
        const textRuns = processNode(element);
        if (textRuns.length > 0) {
          paragraphs.push(new Paragraph({
            children: textRuns,
          }));
        }
      }
    }
    
    console.log(`Generated ${paragraphs.length} paragraphs for Word document`);
    
    // Create the Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    
    console.log('Creating Word document blob...');
    
    // Generate and save the document
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    saveAs(blob, `${filename}.docx`);
    
    console.log('Native Word export completed successfully');
  } catch (error) {
    console.error('Word export failed:', error);
    throw new Error(`Failed to export Word document: ${error}`);
  }
};

// Export to TXT
export const exportToTXT = (content: string, filename: string = 'document'): void => {
  try {
    const textContent = htmlToText(content);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  } catch (error) {
    console.error('TXT export failed:', error);
    throw new Error('Failed to export text file');
  }
};

// Main export function
export const exportDocument = async (options: ExportOptions): Promise<void> => {
  const { content, filename = 'document', format } = options;
  
  if (!content.trim()) {
    throw new Error('No content to export');
  }
  
  switch (format) {
    case 'pdf':
      await exportToPDF(content, filename);
      break;
    case 'docx':
      await exportToWord(content, filename);
      break;
    case 'txt':
      exportToTXT(content, filename);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
