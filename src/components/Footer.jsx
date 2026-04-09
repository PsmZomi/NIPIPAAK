import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

const LOGIN_TO_CONTRIBUTE_MSG = 'Please log in to contribute.';

const mobileMenu = [
  { label: "Home", to: "/", icon: "🏠" },
  { label: "Write", to: "/create-post", icon: "✍️" },
  { label: "Gallery", to: "/gallery", icon: "✨" },
  { label: "Contact", to: "/contact", icon: "✉️" },
];

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const confirmLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      auth.signOut();
    }
  };

  return (
    <>
      {/* 📱 MOBILE BOTTOM DOCK */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 z-50 pb-safe">
        <div className="flex justify-between items-start px-3 py-2">
          {mobileMenu.map((item) => {
            const isWrite = item.to === '/create-post';
            const linkClass = ({ isActive }) => `
                flex flex-col items-center gap-1 py-2 transition-all duration-200 flex-1
                ${isActive ? "text-green-600 scale-105" : "text-zinc-400 hover:text-zinc-600"}
              `;

            if (isWrite && !user) {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    window.alert(LOGIN_TO_CONTRIBUTE_MSG);
                    navigate('/login');
                  }}
                  className="flex flex-col items-center gap-1 py-2 transition-all duration-200 flex-1 text-zinc-400 hover:text-zinc-600 w-full"
                >
                  <div className="text-xl">{item.icon}</div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <div className="text-xl">{item.icon}</div>
                <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Login/Logout Button */}
          <div className="flex-1 flex flex-col items-center">
            {user ? (
              <button
                type="button"
                onClick={confirmLogout}
                className="flex flex-col items-center gap-1 py-2 text-red-500 hover:text-red-700 transition-all w-full"
              >
                <div className="text-xl">🚪</div>
                <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">Logout</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => `
                  flex flex-col items-center gap-1 py-2 transition-all duration-200 w-full
                  ${isActive ? "text-blue-600 scale-105" : "text-zinc-400 hover:text-zinc-600"}
                `}
              >
                <div className="text-xl">🔐</div>
                <span className="text-[9px] font-bold uppercase tracking-tighter">Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* 💻 DESKTOP FOOTER */}
      <footer className="bg-[#1a1a1a] text-white pt-16 pb-10 hidden lg:block">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-4 gap-12">
            <div className="col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 bg-green-500 flex items-center justify-center text-white font-bold text-sm">N</span>
                <span className="text-2xl font-bold tracking-tight font-serif">Nipipaak</span>
              </Link>
              <p className="text-sm text-white/60">A magazine for the curious.</p>
            </div>
            <div className="col-span-3 flex justify-end gap-20">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase text-white/30 tracking-widest">Explore</p>
                <Link to="/blog" className="text-sm hover:text-green-400 transition-colors">Blog</Link>
                <Link to="/news" className="text-sm hover:text-green-400 transition-colors">News</Link>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase text-white/30 tracking-widest">Company</p>
                <Link to="/about" className="text-sm hover:text-green-400 transition-colors">About</Link>
                <Link to="/contact" className="text-sm hover:text-green-400 transition-colors">Contact</Link>
                {user ? (
                  <button
                    type="button"
                    onClick={confirmLogout}
                    className="text-sm text-left text-red-300/90 hover:text-red-200 transition-colors"
                  >
                    Log out
                  </button>
                ) : (
                  <Link to="/login" className="text-sm hover:text-green-400 transition-colors">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="mt-14 pt-6 border-t border-white/10 flex justify-between items-center text-xs font-mono text-white/30">
            <p>© {new Date().getFullYear()} Nipipaak Magazine.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}