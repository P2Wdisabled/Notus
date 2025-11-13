import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

export class MarkdownConverter {
  private turndownService: TurndownService;
  
  // Helper function to normalize color formats (rgb, lab, hsl, etc.) to hex
  private normalizeColorToHex(c: string): string {
    if (!c) return c;
    
    // Handle hex format (already hex)
    if (c.startsWith('#')) {
      return c;
    }
    
    // Handle rgb/rgba formats
    if (c.startsWith('rgb')) {
      const rgb = c.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      }
    }
    
    // Handle named colors and other formats (lab(), hsl(), hwb(), etc.)
    // Convert to hex using browser's computed style
    if (typeof document !== 'undefined') {
      try {
        const tempEl = document.createElement('div');
        tempEl.style.color = c;
        const computedColor = window.getComputedStyle(tempEl).color;
        if (computedColor && computedColor.startsWith('rgb')) {
          const rgb = computedColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
          }
        }
      } catch (e) {
        // If conversion fails, return original
      }
    }
    
    return c;
  }

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Override escape method to prevent escaping of list markers (- and .)
    // This prevents \- and 1\. from appearing in markdown output
    const originalEscape = this.turndownService.escape.bind(this.turndownService);
    this.turndownService.escape = (text: string) => {
      // Don't escape dashes and dots that are list markers
      // These patterns match list markers at the start of lines
      const escaped = originalEscape(text);
      // Remove escape characters before dashes and dots that are list markers
      return escaped
        .replace(/^(\s*)\\- /gm, '$1- ')  // Fix \- at start of line (unordered list)
        .replace(/^(\s*)(\d+)\\. /gm, '$1$2. ');  // Fix 1\. at start of line (ordered list)
    };

    this.setupCustomRules();
  }

  private setupCustomRules() {
    // HIGH PRIORITY: formatting tags (strong/em/...) that contain a descendant with color/background
    // Ensure color/background is preserved when another collaborator toggles bold/italic.
    this.turndownService.addRule('formattingWithChildColor', {
      filter: (node) => {
        if (!node || node.nodeType !== 1) return false;
        const name = node.nodeName;
        if (!['STRONG','B','EM','I','U','S','DEL'].includes(name)) return false;
        const el = node as HTMLElement;
        try {
          if (el.style && (el.style.color || el.style.backgroundColor)) return true;
          return !!el.querySelector && !!el.querySelector('[style*="color"], [style*="background-color"], font[color]');
        } catch {
          return false;
        }
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const candidate = el.querySelector('[style*="color"], [style*="background-color"], font[color]') as HTMLElement | null;
        const styles: string[] = [];
        const toHex = (c: string) => this.normalizeColorToHex(c);

        if (el.style && el.style.color && el.style.color !== 'rgb(0, 0, 0)') styles.push(`color: ${toHex(el.style.color)}`);
        if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          styles.push(`background-color: ${toHex(el.style.backgroundColor)}`);
        }

        if (candidate) {
          const cc = (candidate as HTMLElement).style?.color;
          const cb = (candidate as HTMLElement).style?.backgroundColor;
          if (cc && cc !== 'rgb(0, 0, 0)') styles.push(`color: ${toHex(cc)}`);
          if (cb && cb !== 'rgba(0, 0, 0, 0)' && cb !== 'transparent') styles.push(`background-color: ${toHex(cb)}`);
          if (!styles.length && candidate.nodeName === 'FONT') {
            const fontColor = candidate.getAttribute('color');
            if (fontColor) styles.push(`color: ${fontColor}`);
          }
        }

        if (!styles.length) return content;

        const tag = node.nodeName.toLowerCase();
        // put style on the formatting tag itself (avoid outer span)
        return `<${tag} style="${styles.join('; ')}">${content}</${tag}>`;
      }
    });

    // Preserve text color on SPAN elements (patterned after working backgroundColor rule)
    this.turndownService.addRule('textColor', {
      filter: (node) => {
        const el = node as HTMLElement;
        return node.nodeName === 'SPAN' && !!el.style && !!el.style.color && el.style.color !== 'rgb(0, 0, 0)';
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        let color = element.style.color || '';
        if (!color) return content;
        // Normalize color to hex (handles rgb, lab, hsl, etc.)
        color = this.normalizeColorToHex(color);
        return `<span style="color: ${color}">${content}</span>`;
      }
    });

    // Add custom rules for better HTML to Markdown conversion
    this.turndownService.addRule('underline', {
      filter: 'u',
      replacement: (content) => `<u>${content}</u>`
    });

    this.turndownService.addRule('strikethrough', {
      filter: (node) => {
        const name = node.nodeName;
        return name === 'S' || name === 'DEL' || name === 'STRIKE';
      },
      replacement: (content) => `~~${content}~~`
    });

    // Handle strikethrough via CSS
    this.turndownService.addRule('strikethroughCSS', {
      filter: (node) => {
        return node.nodeName === 'SPAN' &&
          node.style &&
          node.style.textDecoration?.includes('line-through');
      },
      replacement: (content) => `~~${content}~~`
    });

    // Preserve lists with alignment as raw HTML to ensure proper rendering
    // This must come before textAlign rule to have priority
    this.turndownService.addRule('alignedList', {
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el || !el.style || !el.style.textAlign) return false;
        const tag = el.nodeName;
        return tag === 'UL' || tag === 'OL';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const align = el.style.textAlign;
        if (!align) return content;
        const tag = el.nodeName.toLowerCase();
        // Return as raw HTML to preserve alignment - this will be preserved in markdown
        return `<${tag} style="text-align: ${align}">${content}</${tag}>`;
      }
    });

    // Handle divs containing lists with alignment (must come before textAlign rule)
    // This rule unwraps lists from divs and applies alignment directly to the list
    this.turndownService.addRule('alignedListContainer', {
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el || el.nodeName !== 'DIV' || !el.style || !el.style.textAlign) return false;
        // Check if this div contains a single ul or ol
        const children = Array.from(el.children);
        return children.length === 1 && (children[0].nodeName === 'UL' || children[0].nodeName === 'OL');
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const align = el.style.textAlign;
        if (!align) return content;
        // The content parameter contains the HTML of the list element itself
        // We need to extract just the inner content (the <li> elements) and wrap it
        const listElement = el.children[0] as HTMLElement;
        const listTag = listElement.nodeName.toLowerCase();
        // Get the inner HTML of the list (the <li> elements)
        const listContent = listElement.innerHTML;
        // Return the list with alignment style applied directly
        return `<${listTag} style="text-align: ${align}">${listContent}</${listTag}>`;
      }
    });

    this.turndownService.addRule('textAlign', {
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el || !el.style || !el.style.textAlign) return false;
        const tag = el.nodeName;
        return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI'].includes(tag);
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const align = el.style.textAlign;
        if (!align) return content;
        const style = `text-align: ${align}`;
        const tag = el.nodeName;
        // For list items: keep the bullet outside by wrapping content in an inner div
        // with the alignment, not styling the <li> itself.
        if (tag === 'LI') {
          return `<li style="list-style-position: outside;"><div style="${style}">${content}</div></li>`;
        }
        // For list containers: apply alignment directly to the list element
        // instead of wrapping in a div to avoid markdown conversion issues
        // This rule should not match if alignedList rule already handled it
        if (tag === 'UL' || tag === 'OL') {
          return `<${tag.toLowerCase()} style="${style}">${content}</${tag.toLowerCase()}>`;
        }
        // For other block elements, wrap the whole block
        return `<div style="${style}">${content}</div>`;
      }
    });

    // Handle inline styles
    this.turndownService.addRule('inlineStyles', {
      filter: (node) => {
        const el = node as HTMLElement;
        return node.nodeName === 'SPAN' && !!el.style && (
          !!el.style.textDecoration?.includes('underline') ||
          !!el.style.textDecoration?.includes('line-through') ||
          el.style.fontWeight === 'bold' ||
          el.style.fontStyle === 'italic' ||
          !!el.style.color ||
          !!el.style.backgroundColor
        );
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        let styles: string[] = [];

        const isBold = element.style.fontWeight === 'bold' || element.style.fontWeight === '700' || (element.style.fontWeight && parseInt(element.style.fontWeight || '0') >= 600);
        const isItalic = element.style.fontStyle === 'italic';
        const isUnderline = !!element.style.textDecoration?.includes('underline');
        const isStrike = !!element.style.textDecoration?.includes('line-through');

        if (element.style.color && element.style.color !== 'rgb(0, 0, 0)') {
          let hexColor = element.style.color;
          if (hexColor.startsWith('rgb')) {
            const rgb = hexColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              hexColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`color: ${hexColor}`);
        }

        if (element.style.backgroundColor && element.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && element.style.backgroundColor !== 'transparent') {
          let hexBackground = element.style.backgroundColor;
          if (hexBackground.startsWith('rgb')) {
            const rgb = hexBackground.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              hexBackground = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`background-color: ${hexBackground}`);
        }

        // If we have color/background, put the style on the outermost formatting tag
        if (styles.length > 0) {
          const tagNames: string[] = [];
          if (isBold) tagNames.push('strong');
          if (isItalic) tagNames.push('em');
          if (isUnderline) tagNames.push('u');
          if (isStrike) tagNames.push('s');

          // no formatting tags -> keep styled span
          if (tagNames.length === 0) {
            return `<span style="${styles.join('; ')}">${content}</span>`;
          }

          // build nested tags but put styles on the outermost formatting tag
          const outer = tagNames[0];
          let opening = `<${outer} style="${styles.join('; ')}">`;
          for (let i = 1; i < tagNames.length; i++) opening += `<${tagNames[i]}>`;
          let closing = '';
          for (let i = tagNames.length - 1; i >= 0; i--) closing += `</${tagNames[i]}>`;

          return `${opening}${content}${closing}`;
        }

        // No color/background -> keep markdown markers for formatting
        if (isBold) content = `**${content}**`;
        if (isItalic) content = `*${content}*`;
        if (isUnderline) content = `<u>${content}</u>`;
        if (isStrike) content = `~~${content}~~`;
        return content;
      }
    });

    // Handle font elements with color
    this.turndownService.addRule('fontColor', {
      filter: (node) => node.nodeName === 'FONT',
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const color = element.getAttribute('color');
        if (color) {
          return `<span style="color: ${color}">${content}</span>`;
        }
        return content;
      }
    });

    // Preserve inline formatting tags that carry color/background so color isn't lost when bold/italic is used
    this.turndownService.addRule('preserveStyleOnFormattingTags', {
      filter: (node) => {
        const name = node.nodeName;
        const el = node as HTMLElement;
        return ['STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(name) && !!el && !!el.style && (!!el.style.color || !!el.style.backgroundColor);
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const styles: string[] = [];
        const toHex = (c: string) => this.normalizeColorToHex(c);
        if (el.style.color && el.style.color !== 'rgb(0, 0, 0)') styles.push(`color: ${toHex(el.style.color)}`);
        if (el.style.backgroundColor && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.style.backgroundColor !== 'transparent') {
          styles.push(`background-color: ${toHex(el.style.backgroundColor)}`);
        }
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        const mapTag = (n: string) => {
          if (n === 'STRONG' || n === 'B') return 'strong';
          if (n === 'EM' || n === 'I') return 'em';
          if (n === 'U') return 'u';
          if (n === 'S' || n === 'DEL') return 's';
          return n.toLowerCase();
        };
        const tag = mapTag(node.nodeName);
        // put style directly on the formatting tag (do not wrap with outer span)
        return `<${tag}${styleAttr}>${content}</${tag}>`;
      }
    });

    // NEW: if formatting tag (strong/b/em/...) contains a descendant with color/background,
    // preserve that color on the output formatting tag so color survives bold toggles.
    this.turndownService.addRule('preserveChildStyleOnFormatting', {
      filter: (node) => {
        const name = node.nodeName;
        if (!['STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL'].includes(name)) return false;
        const el = node as HTMLElement;
        // look for descendants that carry color/background
        try {
          return !!el.querySelector && !!el.querySelector('[style*="color"], [style*="background-color"], font[color]');
        } catch {
          return false;
        }
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const candidate = el.querySelector('[style*="color"], [style*="background-color"], font[color]') as HTMLElement | null;
        const styles: string[] = [];
        const toHex = (c: string) => this.normalizeColorToHex(c);
        if (candidate) {
          const cStyle = candidate.getAttribute('style') || '';
          const cc = (candidate as HTMLElement).style?.color;
          const cb = (candidate as HTMLElement).style?.backgroundColor;
          if (cc && cc !== 'rgb(0, 0, 0)') styles.push(`color: ${toHex(cc)}`);
          if (cb && cb !== 'rgba(0, 0, 0, 0)' && cb !== 'transparent') styles.push(`background-color: ${toHex(cb)}`);
          if (!styles.length && candidate.nodeName === 'FONT') {
            const fontColor = candidate.getAttribute('color');
            if (fontColor) styles.push(`color: ${fontColor}`);
          }
        }
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        const mapTag = (n: string) => {
          if (n === 'STRONG' || n === 'B') return 'strong';
          if (n === 'EM' || n === 'I') return 'em';
          if (n === 'U') return 'u';
          if (n === 'S' || n === 'DEL') return 's';
          return n.toLowerCase();
        };
        const tag = mapTag(node.nodeName);
        // put style directly on the formatting tag so it survives toggling
        if (styleAttr) {
          return `<${tag}${styleAttr}>${content}</${tag}>`;
        }
        return `<${tag}>${content}</${tag}>`;
      }
    });

    // CRITICAL FIX: Always preserve strong/b tags as HTML to prevent **text** syntax
    this.turndownService.addRule('preserveBold', {
      filter: (node) => {
        return node.nodeName === 'STRONG' || node.nodeName === 'B';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const styles: string[] = [];
        
        // Preserve any inline styles
        if (el.style && el.style.color && el.style.color !== 'rgb(0, 0, 0)') {
          let color = el.style.color;
          if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              color = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`color: ${color}`);
        }
        
        if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.style.backgroundColor !== 'transparent') {
          let bg = el.style.backgroundColor;
          if (bg.startsWith('rgb')) {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              bg = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`background-color: ${bg}`);
        }
        
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        return `<strong${styleAttr}>${content}</strong>`;
      }
    });

    // CRITICAL FIX: Always preserve italic/em tags as HTML to prevent *text* syntax
    this.turndownService.addRule('preserveItalic', {
      filter: (node) => {
        return node.nodeName === 'EM' || node.nodeName === 'I';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const styles: string[] = [];
        
        // Preserve any inline styles
        if (el.style && el.style.color && el.style.color !== 'rgb(0, 0, 0)') {
          let color = el.style.color;
          if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              color = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`color: ${color}`);
        }
        
        if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.style.backgroundColor !== 'transparent') {
          let bg = el.style.backgroundColor;
          if (bg.startsWith('rgb')) {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              bg = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`background-color: ${bg}`);
        }
        
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        return `<em${styleAttr}>${content}</em>`;
      }
    });

    // Handle link alignment
    this.turndownService.addRule('linkAlignment', {
      filter: (node) => {
        const el = node as HTMLElement;
        return node.nodeName === 'A' && !!el.style && !!el.style.textAlign;
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const align = element.style.textAlign;
        const href = element.getAttribute('href');
        if (align === 'center') return `<div style="text-align: center">[${content}](${href})</div>`;
        if (align === 'right') return `<div style="text-align: right">[${content}](${href})</div>`;
        if (align === 'justify') return `<div style="text-align: justify">[${content}](${href})</div>`;
        return `[${content}](${href})`;
      }
    });

    // Handle elements with background color
    this.turndownService.addRule('backgroundColor', {
      filter: (node) => {
        const el = node as HTMLElement;
        return node.nodeName === 'SPAN' && !!el.style && !!el.style.backgroundColor &&
          el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          el.style.backgroundColor !== 'transparent';
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const backgroundColor = element.style.backgroundColor;
        let hexBackground = backgroundColor;

        if (backgroundColor.startsWith('rgb')) {
          const rgb = backgroundColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0]);
            const g = parseInt(rgb[1]);
            const b = parseInt(rgb[2]);
            hexBackground = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }

        return `<span style="background-color: ${hexBackground}">${content}</span>`;
      }
    });

    // Preserve image styles and attributes by outputting raw HTML for <img>
    this.turndownService.addRule('imgWithStyle', {
      filter: (node) => node.nodeName === 'IMG',
      replacement: (_content, node) => {
        const el = node as HTMLImageElement;
        const src = el.getAttribute('src') || '';
        const alt = (el.getAttribute('alt') || '').replace(/"/g, '&quot;');
        const title = (el.getAttribute('title') || '').replace(/"/g, '&quot;');
        const style = (el.getAttribute('style') || '').replace(/"/g, '&quot;');
        let html = `<img src="${src}" alt="${alt}"`;
        if (title) html += ` title="${title}"`;
        if (style) html += ` style="${style}"`;
        html += ' />';
        return html;
      }
    });

    // CRITICAL FIX: Always preserve strong/b tags as HTML to prevent **text** syntax
    this.turndownService.addRule('preserveBold', {
      filter: (node) => {
        return node.nodeName === 'STRONG' || node.nodeName === 'B';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const styles: string[] = [];
        
        // Preserve any inline styles
        if (el.style && el.style.color && el.style.color !== 'rgb(0, 0, 0)') {
          let color = el.style.color;
          if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              color = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`color: ${color}`);
        }
        
        if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.style.backgroundColor !== 'transparent') {
          let bg = el.style.backgroundColor;
          if (bg.startsWith('rgb')) {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              bg = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`background-color: ${bg}`);
        }
        
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        return `<strong${styleAttr}>${content}</strong>`;
      }
    });

    // CRITICAL FIX: Always preserve italic/em tags as HTML to prevent *text* syntax
    this.turndownService.addRule('preserveItalic', {
      filter: (node) => {
        return node.nodeName === 'EM' || node.nodeName === 'I';
      },
      replacement: (content, node) => {
        const el = node as HTMLElement;
        const styles: string[] = [];
        
        // Preserve any inline styles
        if (el.style && el.style.color && el.style.color !== 'rgb(0, 0, 0)') {
          let color = el.style.color;
          if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              color = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`color: ${color}`);
        }
        
        if (el.style && el.style.backgroundColor && el.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.style.backgroundColor !== 'transparent') {
          let bg = el.style.backgroundColor;
          if (bg.startsWith('rgb')) {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
              bg = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            }
          }
          styles.push(`background-color: ${bg}`);
        }
        
        const styleAttr = styles.length ? ` style="${styles.join('; ')}"` : '';
        return `<em${styleAttr}>${content}</em>`;
      }
    });
  }

  // Convert markdown to HTML
  markdownToHtml(md: string): string {
    // First, clean up any markdown bold/italic that might not be parsed
    let processedMd = md
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');

    // Defensive: replace any legacy placeholder tokens saved in markdown with explicit blank lines
    const PLACEHOLDER = '[[__EMPTY_PARAGRAPH__]]';
    const cleanedMd = processedMd.split(PLACEHOLDER).join('\n\n');

    const html = marked(cleanedMd, {
      breaks: true,
      gfm: true,
    }) as string;

    // Add custom styles for headings and other elements
    const styledHtml = html
      .replace(/<h1>/g, '<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1rem 0;">')
      .replace(/<h2>/g, '<h2 style="font-size: 1.5rem; font-weight: bold; margin: 0.875rem 0;">')
      .replace(/<h3>/g, '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0;">')
      .replace(/<h4>/g, '<h4 style="font-size: 1.125rem; font-weight: bold; margin: 0.625rem 0;">')
      .replace(/<h5>/g, '<h5 style="font-size: 1rem; font-weight: bold; margin: 0.5rem 0;">')
      .replace(/<h6>/g, '<h6 style="font-size: 0.875rem; font-weight: bold; margin: 0.5rem 0;">')
      .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic;">')
      .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">')
      // FIXED: Better list styling with proper indentation and line handling
      // Handle lists with existing styles (preserve alignment and other styles)
      .replace(/<ul(\s+[^>]*)?>/g, (match, attrs = '') => {
        // Check if style attribute already exists
        if (attrs && attrs.includes('style=')) {
          // Extract existing style
          const styleMatch = attrs.match(/style=["']([^"']*)["']/);
          if (styleMatch) {
            const existingStyle = styleMatch[1];
            // Merge with our default styles, but preserve text-align
            const defaultStyles = 'margin: 1rem 0; padding-left: 2rem; list-style-type: disc; list-style-position: outside;';
            // If text-align is in existing style, preserve it
            if (existingStyle.includes('text-align:')) {
              return `<ul${attrs}>`;
            }
            // Otherwise, merge styles
            const mergedStyle = `${existingStyle}; ${defaultStyles}`;
            return `<ul style="${mergedStyle}">`;
          }
        }
        // No style attribute, add default
        return '<ul style="margin: 1rem 0; padding-left: 2rem; list-style-type: disc; list-style-position: outside;">';
      })
      .replace(/<ol(\s+[^>]*)?>/g, (match, attrs = '') => {
        // Check if style attribute already exists
        if (attrs && attrs.includes('style=')) {
          // Extract existing style
          const styleMatch = attrs.match(/style=["']([^"']*)["']/);
          if (styleMatch) {
            const existingStyle = styleMatch[1];
            // Merge with our default styles, but preserve text-align
            const defaultStyles = 'margin: 1rem 0; padding-left: 2rem; list-style-type: decimal; list-style-position: outside;';
            // If text-align is in existing style, preserve it
            if (existingStyle.includes('text-align:')) {
              return `<ol${attrs}>`;
            }
            // Otherwise, merge styles
            const mergedStyle = `${existingStyle}; ${defaultStyles}`;
            return `<ol style="${mergedStyle}">`;
          }
        }
        // No style attribute, add default
        return '<ol style="margin: 1rem 0; padding-left: 2rem; list-style-type: decimal; list-style-position: outside;">';
      })
      .replace(/<li>/g, '<li style="margin: 0.25rem 0; padding-left: 0; display: list-item; list-style-position: outside; text-indent: 0;">')
      .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; cursor: pointer;" ')
      // Handle links with alignment in divs where content is already an <a>
      .replace(/<div style=\"text-align: center\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: center\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      .replace(/<div style=\"text-align: right\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: right\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      .replace(/<div style=\"text-align: justify\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: justify\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      // Handle links with alignment in divs where content is a markdown link [..](..)
      .replace(/<div style=\"text-align: center\">\[([\s\S]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: center\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>')
      .replace(/<div style=\"text-align: right\">\[([\s\S]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: right\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>')
      .replace(/<div style=\"text-align: justify\">\[([\sS]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: justify\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>');

    return DOMPurify.sanitize(styledHtml, {
      ADD_ATTR: ['style'],
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span', 'hr', 'details', 'summary'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'color', 'open', 'target', 'rel']
    });
  }

  private normalizeHtmlForTurndown(html: string): string {
    if (typeof DOMParser === 'undefined') return html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Helper to promote styles from child spans/font to parent formatting tags
      const promoteChildStyles = (parentTags: string[]) => {
        parentTags.forEach(tag => {
          const nodes = Array.from(doc.querySelectorAll(tag));
          nodes.forEach((node) => {
            const el = node as HTMLElement;
            // find the first descendant that carries color/background or font[color]
            const candidate = el.querySelector('[style*="color"], [style*="background-color"], font[color]') as HTMLElement | null;
            if (candidate) {
              const candidateStyle = candidate.getAttribute('style') || '';
              const childColor = (candidate as HTMLElement).style?.color;
              const childBg = (candidate as HTMLElement).style?.backgroundColor;
              const styles: string[] = [];
              const toHex = (c: string | undefined) => c ? this.normalizeColorToHex(c) : '';
              if (childColor && childColor !== 'rgb(0, 0, 0)') {
                styles.push(`color: ${toHex(childColor)}`);
              }
              if (childBg && childBg !== 'rgba(0, 0, 0, 0)' && childBg !== 'transparent') {
                styles.push(`background-color: ${toHex(childBg)}`);
              }
              // If we found style values, set them on the formatting tag
              if (styles.length) {
                const prev = el.getAttribute('style') || '';
                // merge without duplicating same directives
                const merged = prev ? `${prev}; ${styles.join('; ')}` : styles.join('; ');
                el.setAttribute('style', merged);
                // remove the style from candidate if it's a span/font to avoid double styling
                if (candidate.tagName === 'SPAN' || candidate.tagName === 'FONT') {
                  candidate.removeAttribute('style');
                  if (candidate.tagName === 'FONT' && candidate.getAttribute('color')) {
                    candidate.removeAttribute('color');
                  }
                  // if candidate becomes empty element, unwrap it
                  if (!candidate.attributes.length && candidate.childNodes.length === 1) {
                    const child = candidate.childNodes[0];
                    candidate.parentNode?.replaceChild(child, candidate);
                  }
                }
              }
            }
          });
        });
      };

      // Normalize tag names: b -> strong, i -> em
      const swapTag = (oldTag: string, newTag: string) => {
        const elements = Array.from(doc.getElementsByTagName(oldTag));
        elements.forEach((el) => {
          const newEl = doc.createElement(newTag);
          // copy attributes
          Array.from(el.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));
          // move children
          while (el.firstChild) newEl.appendChild(el.firstChild);
          el.parentNode?.replaceChild(newEl, el);
        });
      };
      swapTag('b', 'strong');
      swapTag('i', 'em');

      // Promote child styles into these formatting tags so toggles operate consistently
      promoteChildStyles(['STRONG','EM','U','S','DEL','I','B']);

      // Also, for any <span> with only style and text child, keep it but ensure style has hex color for consistency (optional)
      const spans = Array.from(doc.querySelectorAll('span[style]')) as HTMLElement[];
      spans.forEach(s => {
        const style = s.getAttribute('style') || '';
        // normalize rgb(...) -> hex for color/background-color when present
        const colorMatch = style.match(/color:\s*rgb\([^\)]+\)/i);
        const bgMatch = style.match(/background-color:\s*rgb\([^\)]+\)/i);
        const normalizeRgbToHex = (m: string | null) => {
          if (!m) return null;
          const val = m.split(':')[1].trim();
          const rgb = val.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
          }
          return null;
        };
        let newStyle = style;
        if (colorMatch) {
          const hex = normalizeRgbToHex(colorMatch[0]);
          if (hex) newStyle = newStyle.replace(colorMatch[0], `color: ${hex}`);
        }
        if (bgMatch) {
          const hex = normalizeRgbToHex(bgMatch[0]);
          if (hex) newStyle = newStyle.replace(bgMatch[0], `background-color: ${hex}`);
        }
        s.setAttribute('style', newStyle);
      });

      return doc.body.innerHTML;
    } catch {
      return html;
    }
  }

  // Convert HTML to markdown
  htmlToMarkdown(html: string): string {
    // DEBUG: temporary logging to help diagnose color/format loss in collaboration.
    // This logs only when the input HTML contains inline color/background styles to reduce noise.
    try {
      const shouldLog = /style=["'][^"']*(?:color:|background-color:)|<font\s+color=/i.test(html);
      if (shouldLog) {
        try {
          console.groupCollapsed('[MarkdownConverter] htmlToMarkdown — input HTML (truncated if long)');
          console.log(html.length > 2000 ? html.slice(0, 2000) + '... [truncated]' : html);
          console.groupEnd();
        } catch {}
      }

      // normalize the HTML before turndown to ensure formatting tags carry styles consistently
      const normalizedHtml = this.normalizeHtmlForTurndown(html);

      let md = this.turndownService.turndown(normalizedHtml);

      if (shouldLog) {
        try {
          console.groupCollapsed('[MarkdownConverter] htmlToMarkdown — produced markdown (truncated if long)');
          console.log(md.length > 4000 ? md.slice(0, 4000) + '... [truncated]' : md);
          console.groupEnd();
        } catch {}
      }

      return md;
    } catch (e) {
      console.error('[MarkdownConverter] htmlToMarkdown error', e);
      return this.turndownService.turndown(html);
    }
  }
}