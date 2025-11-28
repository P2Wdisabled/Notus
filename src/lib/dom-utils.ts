import { normalizeColor } from './export-utils';

export const commonStyleProperties = [
  "color", "backgroundColor", "fontSize", "fontFamily", "fontWeight", "fontStyle",
  "lineHeight", "letterSpacing", "wordSpacing", "textAlign", "textTransform",
  "textDecoration", "textDecorationColor", "textIndent", "marginTop", "marginRight",
  "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom",
  "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth",
  "borderLeftWidth", "borderTopStyle", "borderRightStyle", "borderBottomStyle",
  "borderLeftStyle", "borderTopColor", "borderRightColor", "borderBottomColor",
  "borderLeftColor", "outlineStyle", "outlineWidth", "outlineColor",
  "listStyleType", "listStylePosition", "whiteSpace", "display",
  "verticalAlign", "backgroundClip"
];

export const copyComputedStyles = (
  original: HTMLElement, 
  target: HTMLElement, 
  properties: string[] = commonStyleProperties
) => {
  const origNodes = [original, ...Array.from(original.querySelectorAll("*"))] as HTMLElement[];
  const cloneNodes = [target, ...Array.from(target.querySelectorAll("*"))] as HTMLElement[];
  
  origNodes.forEach((node, index) => {
    const cloneNode = cloneNodes[index];
    if (!cloneNode) return;
    
    const styles = window.getComputedStyle(node);
    properties.forEach((prop) => {
      const val = (styles as any)[prop];
      if (!val) return;
      
      const needsColor = /color/i.test(prop) || prop.includes("Shadow") || prop.startsWith("background");
      const normalized = needsColor ? normalizeColor(val) : val;
      
      if (normalized) (cloneNode.style as any)[prop] = normalized;
    });
    
    cloneNode.style.boxShadow = "none";
    cloneNode.style.textShadow = "none";
    cloneNode.style.filter = "none";
  });
};

export const normalizeInlineDeclarations = (root: HTMLElement) => {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  elements.forEach((el) => {
    const style = el.style;
    if (!style) return;
    
    for (let i = 0; i < style.length; i += 1) {
      const prop = style.item(i);
      if (!prop) continue;
      const value = style.getPropertyValue(prop);
      if (!value) continue;
      
      if (/color|background|shadow/i.test(prop) || /lab\(|lch\(/i.test(value)) {
        const normalized = normalizeColor(value);
        if (normalized && normalized !== value) {
          const priority = style.getPropertyPriority(prop) || "";
          style.setProperty(prop, normalized, priority);
        }
      }
    }
    el.removeAttribute("class");
  });
};