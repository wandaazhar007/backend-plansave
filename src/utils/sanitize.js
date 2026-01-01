export function sanitizeText(input, { maxLen = 500 } = {}) {
  if (input === null || input === undefined) return null;

  let s = String(input);

  // remove null bytes
  s = s.replace(/\0/g, "");

  // very basic strip tags
  s = s.replace(/<[^>]*>/g, "");

  // trim & clamp length
  s = s.trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);

  return s;
}