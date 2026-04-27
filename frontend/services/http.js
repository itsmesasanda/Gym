const DEFAULT_TIMEOUT_MS = 8000;

const timeoutMessage = (baseUrl) =>
  `Could not reach server (${baseUrl}). Check backend is running and API URL is correct.`;

export const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      let parsedUrl = null;
      if (typeof url === "string") {
        try {
          parsedUrl = new URL(url);
        } catch {
          parsedUrl = null;
        }
      }
      const baseUrl = parsedUrl ? `${parsedUrl.protocol}//${parsedUrl.host}` : "API";
      throw new Error(timeoutMessage(baseUrl));
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
