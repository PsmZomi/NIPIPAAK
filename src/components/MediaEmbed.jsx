import { ExternalLink } from 'lucide-react';
import { parseMediaLink } from '../utils/mediaLink';

/**
 * Renders a media link — an embedded player when the provider supports it,
 * otherwise a simple link card.
 */
export default function MediaEmbed({ link, title, className = '' }) {
  const info = parseMediaLink(link);
  if (!info) return null;

  if (info.embeddable) {
    return (
      <div
        className={`relative mx-auto w-full max-w-[min(100%,114vh)] aspect-video bg-black overflow-hidden ${className}`}
      >
        <iframe
          src={info.embedUrl}
          title={title || info.label}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-green-400 transition-colors ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
        <ExternalLink size={20} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {info.label}
        </span>
        <span className="block truncate text-sm text-gray-700 group-hover:text-green-600">
          {info.url}
        </span>
      </span>
    </a>
  );
}
