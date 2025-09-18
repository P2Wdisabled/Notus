/**
 * Utility function to combine class names
 * @param {...(string|undefined|null|boolean)} classes - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ").trim();
}
