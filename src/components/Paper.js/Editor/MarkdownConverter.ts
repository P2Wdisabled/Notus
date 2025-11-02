import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

export class MarkdownConverter {
  private turndownService: TurndownService;

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

    this.setupCustomRules();
  }

  private setupCustomRules() {
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

    this.turndownService.addRule('textAlign', {
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el || !el.style || !el.style.textAlign) return false;
        const tag = el.nodeName;
        // Consider common block-level elements to wrap the entire line
        return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(tag);
      },
      replacement: (content, node) => {
        const align = (node as HTMLElement).style.textAlign;
        if (align === 'center') return `<div style="text-align: center">${content}</div>`;
        if (align === 'right') return `<div style="text-align: right">${content}</div>`;
        if (align === 'justify') return `<div style="text-align: justify">${content}</div>`;
        return content;
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
        let result = content;
        let styles: string[] = [];
        
        if (element.style.fontWeight === 'bold') {
          result = `**${result}**`;
        }
        if (element.style.fontStyle === 'italic') {
          result = `*${result}*`;
        }
        if (element.style.textDecoration?.includes('underline')) {
          result = `<u>${result}</u>`;
        }
        if (element.style.textDecoration?.includes('line-through')) {
          result = `~~${result}~~`;
        }
        if (element.style.color && element.style.color !== 'rgb(0, 0, 0)') {
          // Convert rgb to hex
          let hexColor = element.style.color;
          if (element.style.color.startsWith('rgb')) {
            const rgb = element.style.color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          styles.push(`color: ${hexColor}`);
        }
        if (element.style.backgroundColor && element.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && element.style.backgroundColor !== 'transparent') {
          // Convert rgb to hex
          let hexBackground = element.style.backgroundColor;
          if (element.style.backgroundColor.startsWith('rgb')) {
            const rgb = element.style.backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexBackground = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          styles.push(`background-color: ${hexBackground}`);
        }
        
        if (styles.length > 0) {
          result = `<span style="${styles.join('; ')}">${result}</span>`;
        }
        
        return result;
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
  }

  // Convert markdown to HTML
  markdownToHtml(md: string): string {
    const html = marked(md, {
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
      .replace(/<ul>/g, '<ul style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc; display: block;">')
      .replace(/<ol>/g, '<ol style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal; display: block;">')
      .replace(/<li>/g, '<li style="margin: 0.25rem 0; display: list-item; list-style-position: outside;">')
      .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; cursor: pointer;" ')
      // Handle links with alignment in divs where content is already an <a>
      .replace(/<div style=\"text-align: center\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: center\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      .replace(/<div style=\"text-align: right\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: right\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      .replace(/<div style=\"text-align: justify\"><a href=\"([^\"]*)\">([\s\S]*?)<\/a><\/div>/g, '<div style=\"text-align: justify\"><a href=\"$1\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$2</a></div>')
      // Handle links with alignment in divs where content is a markdown link [..](..)
      .replace(/<div style=\"text-align: center\">\[([\s\S]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: center\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>')
      .replace(/<div style=\"text-align: right\">\[([\s\S]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: right\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>')
      .replace(/<div style=\"text-align: justify\">\[([\s\S]*?)\]\(([^\)]*)\)<\/div>/g, '<div style=\"text-align: justify\"><a href=\"$2\" style=\"color: #3b82f6; text-decoration: underline; cursor: pointer;\">$1</a></div>');
    
    return DOMPurify.sanitize(styledHtml, {
      ADD_ATTR: ['style'],
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span', 'hr', 'details', 'summary'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'color', 'open', 'target', 'rel']
    });
  }

  // Convert HTML to markdown
  htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }
}
