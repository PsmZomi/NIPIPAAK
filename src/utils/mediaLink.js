const YOUTUBE_PATH_ID = /^\/(embed|shorts|live|v|e)\/([^/?#]+)/;

export function normalizeUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/|$|\?)/.test(value)) return `https://${value}`;
  return '';
}

function youtubeId(url) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v');
    const match = url.pathname.match(YOUTUBE_PATH_ID);
    if (match) return match[2];
  }
  return null;
}

function vimeoId(url) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
  const segment = url.pathname.split('/').filter(Boolean).pop();
  return segment && /^\d+$/.test(segment) ? segment : null;
}

function isFacebookVideo(host, url) {
  if (host === 'fb.watch') return true;
  if (host !== 'facebook.com' && host !== 'm.facebook.com') return false;
  return (
    /\/videos?\//.test(url.pathname) ||
    url.pathname.startsWith('/watch') ||
    url.pathname.startsWith('/reel') ||
    Boolean(url.searchParams.get('v'))
  );
}

/**
 * Turns a pasted link into display + embed info.
 * Returns null when the input is not a usable http(s) URL.
 */
export function parseMediaLink(raw) {
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  const yt = youtubeId(url);
  if (yt) {
    return {
      url: normalized,
      provider: 'youtube',
      label: 'YouTube',
      videoId: yt,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(yt)}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(yt)}/hqdefault.jpg`,
      embeddable: true,
    };
  }

  const vimeo = vimeoId(url);
  if (vimeo) {
    return {
      url: normalized,
      provider: 'vimeo',
      label: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      thumbnailUrl: null,
      embeddable: true,
    };
  }

  if (isFacebookVideo(host, url)) {
    return {
      url: normalized,
      provider: 'facebook',
      label: 'Facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(normalized)}&show_text=false`,
      thumbnailUrl: null,
      embeddable: true,
    };
  }

  return {
    url: normalized,
    provider: 'link',
    label: host,
    embedUrl: null,
    thumbnailUrl: null,
    embeddable: false,
  };
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function fetchYouTubeDate(videoId) {
  try {
    const res = await fetch(
      `https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(videoId)}`,
    );
    if (!res.ok) return '';
    const data = await res.json();
    return formatDate(data?.dateCreated);
  } catch {
    return '';
  }
}

const metaCache = new Map();

/**
 * Looks up a link's real metadata for display: the title, the author/channel,
 * and (for YouTube) the video's publish date rather than our upload date.
 * Results are cached per link for the session. Resolves to empty strings
 * when nothing can be found.
 */
export async function fetchMediaMeta(rawLink) {
  const info = parseMediaLink(rawLink);
  if (!info) return { title: '', author: '', date: '' };
  if (metaCache.has(info.url)) return metaCache.get(info.url);

  const endpoints = [];
  if (info.provider === 'youtube') {
    endpoints.push(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(info.url)}&format=json`,
    );
  }
  endpoints.push(`https://noembed.com/embed?url=${encodeURIComponent(info.url)}`);

  let title = '';
  let author = '';
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (typeof data?.title === 'string' && data.title.trim()) {
        title = data.title.trim();
        author = typeof data?.author_name === 'string' ? data.author_name.trim() : '';
        break;
      }
    } catch {
      // try the next endpoint
    }
  }

  const date =
    info.provider === 'youtube' && info.videoId
      ? await fetchYouTubeDate(info.videoId)
      : '';

  const meta = { title, author, date };
  metaCache.set(info.url, meta);
  return meta;
}
