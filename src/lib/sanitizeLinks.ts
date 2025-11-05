export function sanitizeLinks(link: string) {
  if (!link) return link;
  return link.replace(/\\?\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (match, text, url) => {
    try {
      const normalize = (s: string) => (s || "").toString().replace(/\/+$/, "");
      if (!text || text.trim() === "") return url;
      if (
        text === url ||
        decodeURIComponent(text) === url ||
        normalize(text) === normalize(url)
      ) {
        return url;
      }
    } catch {
    }
    return match;
  });
}

export default sanitizeLinks;
