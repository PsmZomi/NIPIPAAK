import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { usePawlpiSession } from "../context/PawlpiSessionContext";
import { findPawlpiAccount } from "../utils/pawlpiSession";

const NIPIPAAK_LOGO_URL =
  "https://res.cloudinary.com/dpgqehxeh/image/upload/e_background_removal/f_png/v1772016903/clmwampvntxosiidecar.png";

function PawlpiLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!accessDenied || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setAccessDenied(false);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [accessDenied, countdown]);

  function handleSubmit(e) {
    e.preventDefault();
    if (accessDenied) return;

    setError("");

    const match = findPawlpiAccount(username, password);

    if (!match) {
      setError("Admin access only.");
      setAccessDenied(true);
      setCountdown(5);
      return;
    }

    onSuccess(match.username);
  }

  return (
    <div className="w-full max-w-lg lg:max-w-none">
      <div className="text-center lg:text-left mb-2">
        <h1
          className="text-3xl lg:text-4xl font-bold"
          style={{
            fontFamily: "'Playfair Display', serif",
            letterSpacing: "-0.03em",
          }}
        >
          Admin Login
        </h1>
      </div>

      <div className="p-6 lg:p-8 rounded-xl border border-border shadow-sm bg-paper backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-green-600 transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-1 min-h-[42px] items-center">
            {accessDenied ? (
              <p className="text-center text-red-600 text-sm font-bold">
                {error} ({countdown}s)
              </p>
            ) : (
              <button
                type="submit"
                className="w-fit font-bold py-2 px-4 transition-colors border-2 rounded-lg text-ink hover:bg-zinc-50"
              >
                thru keidia leh
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function PawlpiLoginLayout({ children }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="order-2 lg:order-1 flex-1 min-w-0 lg:max-5xl xl:max-w-lg">
        {children}
      </div>
      <div className="order-1 lg:order-2 flex shrink-0 justify-center lg:justify-end lg:flex-1">
        <img
          src={NIPIPAAK_LOGO_URL}
          alt="NIPIPAAK"
          className="w-40 h-40 sm:w-48 sm:h-48 lg:w-72 lg:h-72 xl:w-80 xl:h-80 object-contain"
        />
      </div>
    </div>
  );
}

function PawlpiContent({ username }) {
  return (
    <div className="max-w-3xl w-full mx-auto text-center">
      <div className="mb-8 text-left pt-6">
        <p className="section-label mb-2">Pawlpi</p>
      </div>
    </div>
  );
}

export default function Pawlpi() {
  const { isAuthed, username, setAuthed } = usePawlpiSession();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleLoginSuccess(name) {
    setAuthed(name);
  }

  return (
    <main
      className={`relative min-h-screen pt-[10px] lg:pt-[55px] bg-zinc-50 ${isAuthed ? "pb-10" : "pb-20"}`}
    >
      <div
        className={`relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-10 lg:py-14 ${!isAuthed ? "flex min-h-[calc(100vh-8rem)] items-center justify-center" : ""}`}
      >
        {isAuthed && username ? (
          <PawlpiContent username={username} />
        ) : (
          <PawlpiLoginLayout>
            <PawlpiLogin onSuccess={handleLoginSuccess} />
          </PawlpiLoginLayout>
        )}
      </div>
    </main>
  );
}
