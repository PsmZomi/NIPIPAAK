import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { usePawlpiSession } from "../context/PawlpiSessionContext";
import { fetchPawlpiRole } from "../utils/pawlpiSession";
import Pawlpisum from "./Pawlpisum";

const NIPIPAAK_LOGO_URL =
  "https://res.cloudinary.com/dpgqehxeh/image/upload/e_background_removal/f_png/v1772016903/clmwampvntxosiidecar.png";

function GateLayout({ children }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="order-2 lg:order-1 flex-1 min-w-0 lg:max-w-lg">{children}</div>
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

function PawlpiLogin({ onUnlocked }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (accessDenied || loading) return;

    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const role = await fetchPawlpiRole(cred.user.uid);
      if (!role) {
        setError("This account has no Pawlpi role.");
        setAccessDenied(true);
        setCountdown(5);
        return;
      }
      onUnlocked(cred.user.uid);
    } catch {
      setError("Invalid email or password.");
      setAccessDenied(true);
      setCountdown(5);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GateLayout>
      <div className="w-full">
        <div className="text-center lg:text-left mb-2">
          <h1
            className="text-3xl lg:text-4xl font-bold"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "-0.03em",
            }}
          >
            Pawlpi Login
          </h1>
        </div>

        <div className="p-6 lg:p-8 rounded-xl border border-border shadow-sm bg-paper backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                ID
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Nambat Genziau O
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
                  disabled={loading}
                  className="w-fit font-bold py-2 px-4 transition-colors border-2 rounded-lg text-ink hover:bg-zinc-50 disabled:opacity-50"
                >
                  {loading ? "…" : "Thru vele"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </GateLayout>
  );
}

export default function Pawlpi() {
  const { loading, isAuthed, canEdit, role, unlockGate, refreshRole } =
    usePawlpiSession();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function handleUnlocked(uid) {
    unlockGate(uid);
    await refreshRole();
  }

  if (loading && isAuthed) {
    return (
      <main className="relative min-h-screen pt-[10px] lg:pt-[55px] bg-zinc-50 flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main
      className={`relative min-h-screen pt-[10px] lg:pt-[55px] bg-zinc-50 ${isAuthed ? "pb-10" : "pb-20"}`}
    >
      <div
        className={`relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-10 lg:py-14 ${!isAuthed ? "flex min-h-[calc(100vh-8rem)] items-center justify-center" : ""}`}
      >
        {isAuthed ? (
          <Pawlpisum canEdit={canEdit} role={role} />
        ) : (
          <PawlpiLogin onUnlocked={handleUnlocked} />
        )}
      </div>
    </main>
  );
}
