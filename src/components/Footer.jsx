// import { Link } from 'react-router-dom'

// const navCols = [
//   {
//     heading: 'Navigate',
//     links: [
//       { label: 'Home',    to: '/' },
//       { label: 'Blog',    to: '/blog' },
//       { label: 'About',   to: '/about' },
//       { label: 'Team',    to: '/team' },
//       { label: 'Contact', to: '/contact' },
//     ],
//   },
//   {
//     heading: 'Categories',
//     links: [
//       { label: 'Culture',     to: '/blog?cat=Culture' },
//       { label: 'Technology',  to: '/blog?cat=Technology' },
//       { label: 'Photography', to: '/blog?cat=Photography' },
//       { label: 'Essays',      to: '/blog?cat=Essays' },
//     ],
//   },
//   {
//     heading: 'Company',
//     links: [
//       { label: 'About Us',       to: '/about' },
//       { label: 'Our Team',       to: '/team' },
//       { label: 'Write For Us',   to: '/contact' },
//       { label: 'Privacy Policy', to: '#' },
//       { label: 'Terms',          to: '#' },
//     ],
//   },
// ]

// export default function Footer() {
//   return (
//     <footer className="bg-ink text-white">
//       {/* Main footer grid */}
//       <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-16 pb-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
//           {/* Brand col */}
//           <div className="lg:col-span-1">
//             <Link to="/" className="flex items-center gap-2 mb-5">
//               <span className="w-8 h-8 bg-green-500 flex items-center justify-center text-white font-bold text-sm"
//                 style={{ fontFamily: "'Playfair Display', serif" }}>I</span>
//               <span className="text-2xl font-bold tracking-tight"
//                 style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.04em' }}>
//                 Nipipaak
//               </span>
//             </Link>
//             <p className="text-sm leading-relaxed text-white/60 mb-6">
//               A magazine for the curious. Stories about culture, technology, and what it means to pay attention in a distracted world.
//             </p>
//             {/* Newsletter mini */}
//             <div>
//               <p className="section-label text-white/40 mb-3">Weekly newsletter</p>
//               <div className="flex gap-2">
//                 <input
//                   type="email"
//                   placeholder="your@email.com"
//                   className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
//                 />
//                 <button className="btn-red px-4 py-2 text-xs">Go</button>
//               </div>
//             </div>
//           </div>

//           {/* Link cols */}
//           {navCols.map(col => (
//             <div key={col.heading}>
//               <p className="section-label text-white/40 mb-5">{col.heading}</p>
//               <ul className="space-y-3">
//                 {col.links.map(link => (
//                   <li key={link.label}>
//                     <Link
//                       to={link.to}
//                       className="text-sm text-white/60 hover:text-white transition-colors duration-200"
//                     >
//                       {link.label}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         {/* Bottom bar */}
//         <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
//           <p className="text-xs font-mono text-white/30">
//             © {new Date().getFullYear()} Nipipaak Magazine. All rights reserved.
//           </p>
//           <div className="flex items-center gap-6">
//             {['Twitter', 'Instagram', 'RSS'].map(s => (
//               <a key={s} href="#" className="text-xs font-mono text-white/30 hover:text-white transition-colors">
//                 {s}
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>
//     </footer>
//   )
// }
import { Link, NavLink } from 'react-router-dom';

const mobileMenu = [
  // Ensure the file is EXACTLY named 'huticon.png' in your /public folder
  { label: "Home", to: "/", icon: "/hut.ico" },
  { label: "Blog", to: "/blog", icon: "📖" },
  { label: "News", to: "/news", icon: "🗞️" },
  { label: "Gallery", to: "/gallery", icon: "✨" },
  { label: "Contact", to: "/contact", icon: "✉️" },
];

export default function Footer() {
  return (
    <>
      {/* 📱 MOBILE BOTTOM DOCK */}
      <nav className="flex lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-6 py-3 justify-between items-center z-50 pb-safe">
        {mobileMenu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all duration-200
              ${isActive ? "text-green-600 scale-110" : "text-zinc-400 hover:text-zinc-600"}
            `}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {item.icon.includes('.') ? (
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-full h-full object-contain"
                  // Use inline styles to handle the active color via CSS filters
                  style={{
                    filter: "none" // Removed the grayscale that was hiding it
                  }}
                  // If it still fails, this alert will tell you exactly what path it tried
                  onError={(e) => console.error(`Failed to load icon: ${item.icon}`)}
                />
              ) : (
                <span className="text-xl">{item.icon}</span>
              )}
            </div>

            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {item.label}
            </span>
          </NavLink>
        ))}
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
                <Link to="/login" className="text-sm text-white/40 hover:text-green-400 transition-colors mt-4">Admin Login</Link>
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