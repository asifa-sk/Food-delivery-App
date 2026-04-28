export function readStoredJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`invalid stored payload for ${key}`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}
