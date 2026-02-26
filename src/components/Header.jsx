import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "News", to: "/news" },
  { label: "Contact", to: "/contact" },
];

// Replace this URL with your actual Cloudinary Delivery URL
const CLOUDINARY_LOGO_URL =
  "https://res.cloudinary.com/your-cloud-name/image/upload/v12345678/logo-n.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-green-300 shadow-sm border-b border-zinc-200"
          : "bg-green-400/10"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 py-3">
        {/* LINE 1: LOGO + NAME (Centered) */}
        <div className="flex items-center justify-center relative py-2">
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-3 group"
          >
            <img
              src="https://res.cloudinary.com/dpgqehxeh/image/upload/e_background_removal/f_png/v1772016903/clmwampvntxosiidecar.png"
              alt="NIPIPAAK Logo"
              className="w-12 h-12 object-contain"
            />

            {/* Apply font-gothic and adjust size as Gothic fonts often appear smaller */}
            <span className="text-4xl md:text-5xl font-display text-ink text-widest tracking-tight group-hover:text-accent transition-colors">
              NIPIPAAK
            </span>
          </Link>

          {/* Hamburger (Mobile Only) */}
          <button
            aria-label="Toggle menu"
            className="lg:hidden absolute right-0"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <div className="space-y-1.5">
              <span
                className={`block w-6 h-0.5 bg-black transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block w-6 h-0.5 bg-black ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block w-6 h-0.5 bg-black transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>
        </div>

        {/* LINE 2: MENU (Desktop) */}
        <nav className="hidden lg:flex items-center justify-center gap-16 pt-2 pb-2">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-[12px] font-bold uppercase tracking-[0.25em] transition-colors ${
                  isActive ? "text-accent" : "text-muted hover:text-ink"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 bg-white ${menuOpen ? "max-h-screen border-t" : "max-h-0"}`}
      >
        <nav className="flex flex-wrap items-center py-6 gap-6 justify-center px-4">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className="text-[11px] font-bold uppercase tracking-widest text-zinc-800"
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
