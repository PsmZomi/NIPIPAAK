import { useEffect, useRef, useState } from "react";

function ChevronDown({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PawlpiSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  const selected =
    options.find((opt) => String(opt.value) === String(value)) ?? options[0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-1 bg-transparent px-2 py-2 text-sm font-semibold text-ink tabular-nums outline-none"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown open={open} />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-paper shadow-lg overflow-hidden"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-2 py-2 text-sm font-semibold text-center tabular-nums transition-colors ${
                    isSelected
                      ? "bg-ink text-white"
                      : "text-ink hover:bg-warm"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
