import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_THRESHOLD = 48;
const TRANSITION_MS = 280;

/**
 * Full-screen gallery viewer — image only, with swipe + arrow navigation.
 */
export default function GalleryLightbox({
  images = [],
  index = 0,
  onClose,
  onIndexChange,
}) {
  const touchStartX = useRef(null);
  const dragXRef = useRef(0);
  const dragging = useRef(false);
  const transitioning = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [slideDir, setSlideDir] = useState(0); // -1 prev, 1 next, 0 none
  const [visible, setVisible] = useState(false);

  const count = images.length;
  const current = images[index] || null;

  const go = useCallback(
    (delta) => {
      if (count < 2 || transitioning.current) return;
      transitioning.current = true;
      setSlideDir(delta);
      window.setTimeout(() => {
        const next = (index + delta + count) % count;
        onIndexChange?.(next);
        setSlideDir(0);
        transitioning.current = false;
      }, TRANSITION_MS);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    if (!current) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setVisible(true));

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      setVisible(false);
    };
  }, [current, go, onClose]);

  function onPointerDown(e) {
    if (e.target.closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging.current = true;
    touchStartX.current = e.clientX;
    setDragX(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging.current || touchStartX.current == null) return;
    const dx = e.clientX - touchStartX.current;
    dragXRef.current = dx;
    setDragX(dx);
  }

  function finishDrag(dx) {
    dragging.current = false;
    touchStartX.current = null;
    dragXRef.current = 0;
    setDragX(0);
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) go(1);
    else go(-1);
  }

  function onPointerUp(e) {
    if (!dragging.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    finishDrag(dragXRef.current);
  }

  function onPointerCancel() {
    if (!dragging.current) return;
    dragging.current = false;
    touchStartX.current = null;
    dragXRef.current = 0;
    setDragX(0);
  }

  if (!current) return null;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const slideOffset = slideDir === 0 ? dragX : -slideDir * viewportW;
  const imageTransition =
    slideDir !== 0 || dragX === 0
      ? `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 200ms ease`
      : 'none';

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 h-11 w-11 inline-flex items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors"
        aria-label="Close"
      >
        <X size={24} strokeWidth={1.75} />
      </button>

      <div
        className="absolute inset-0 flex items-center justify-center touch-pan-y select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {count > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-start pl-1 sm:pl-2 text-white/70 hover:text-white active:text-white active:scale-95 transition-all duration-200"
            aria-label="Previous photo"
          >
            <span className="h-12 w-12 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <ChevronLeft size={30} strokeWidth={1.5} />
            </span>
          </button>
        ) : null}

        <img
          key={current.fullUrl || current.url}
          src={current.fullUrl || current.url}
          alt=""
          className="max-h-full max-w-full object-contain pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(${slideOffset}px, 0, 0)`,
            transition: imageTransition,
            opacity: slideDir !== 0 ? 0.85 : 1,
          }}
          draggable={false}
        />

        {count > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-end pr-1 sm:pr-2 text-white/70 hover:text-white active:text-white active:scale-95 transition-all duration-200"
            aria-label="Next photo"
          >
            <span className="h-12 w-12 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <ChevronRight size={30} strokeWidth={1.5} />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
