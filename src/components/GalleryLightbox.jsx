import { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-screen gallery viewer with keyboard + swipe / drag navigation.
 */
export default function GalleryLightbox({
  images = [],
  index = 0,
  onClose,
  onIndexChange,
}) {
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  const count = images.length;
  const current = images[index] || null;

  useEffect(() => {
    if (!current) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, index, count]);

  function go(delta) {
    if (count < 2) return;
    const next = (index + delta + count) % count;
    onIndexChange?.(next);
  }

  function onPointerDown(e) {
    touchStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  }

  function onPointerMove(e) {
    if (touchStartX.current == null) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    if (x == null) return;
    touchDeltaX.current = x - touchStartX.current;
  }

  function onPointerUp() {
    if (touchStartX.current == null) return;
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) go(1);
    else go(-1);
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/92 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-white/70 text-xs font-mono tabular-nums">
          {index + 1} / {count}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-12 touch-pan-y select-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-1 sm:left-3 z-10 h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft size={28} strokeWidth={1.75} />
          </button>
        ) : null}

        {/* Full image, uncropped — uses all available viewport height */}
        <img
          src={current.fullUrl || current.url}
          alt={current.caption || ''}
          className="h-full w-auto max-w-full object-contain pointer-events-none"
          draggable={false}
        />

        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-1 sm:right-3 z-10 h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight size={28} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      {current.caption ? (
        <p className="shrink-0 text-center text-white text-sm px-4 py-3 sm:py-4 tracking-wide line-clamp-3">
          {current.caption}
        </p>
      ) : (
        <div className="h-3 sm:h-4 shrink-0" />
      )}
    </div>
  );
}
