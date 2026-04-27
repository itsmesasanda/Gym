const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp|svg)$/i;

const parseHttpUrl = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeHost = (host) => host.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

export const extractYouTubeVideoId = (value) => {
  const parsed = parseHttpUrl(value);
  if (!parsed) return null;

  const host = normalizeHost(parsed.hostname);
  let id = null;

  if (host === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0];
  } else if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com") {
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else if (["shorts", "embed", "live", "v"].includes(pathParts[0])) {
      id = pathParts[1];
    }
  }

  return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
};

export const isValidYouTubeUrl = (value) => Boolean(extractYouTubeVideoId(value));

export const isDirectImageUrl = (value) => {
  const parsed = parseHttpUrl(value);
  return Boolean(parsed && IMAGE_EXTENSION_PATTERN.test(parsed.pathname));
};

export const isValidThumbnailUrl = (value) => {
  const trimmed = (value || "").trim();
  return !trimmed || isValidYouTubeUrl(trimmed) || isDirectImageUrl(trimmed);
};

export const resolveThumbnailUri = (video) => {
  const thumbnail = (video?.thumbnail || "").trim();
  if (thumbnail) {
    const thumbnailVideoId = extractYouTubeVideoId(thumbnail);
    if (thumbnailVideoId) return `https://img.youtube.com/vi/${thumbnailVideoId}/hqdefault.jpg`;
    if (isDirectImageUrl(thumbnail)) return thumbnail;
  }

  const youtubeVideoId = extractYouTubeVideoId(video?.youtubeUrl || "");
  return youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` : null;
};

