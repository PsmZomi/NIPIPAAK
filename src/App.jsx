import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Blog from './pages/Blog'
import About from './pages/About'
import News from './pages/News'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Gallery from './pages/Gallery'
import Login from './pages/Login'
import CreatePost from './pages/CreatePost'
import Song from './pages/Song'
import CreateSong from './pages/CreateSong'
import { AuthProvider } from './context/AuthContext'


export default function App() {
  const { pathname } = useLocation()

  // Re-run reveal on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const Breadcrumbs = () => {
    const { pathname } = useLocation();
    const pathnames = pathname.split('/').filter(Boolean);

    return (
      <nav className="bg-white px-4 py-2 border-b border-zinc-200 text-sm font-medium relative z-40">
        <ol className="flex flex-wrap gap-2 text-zinc-500">
          <li>
            {pathname === '/' ? (
              <span className="text-zinc-900">Home</span>
            ) : (
              <Link className="text-indigo-600 hover:text-indigo-700" to="/">Home</Link>
            )}
          </li>
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label = name.replace(/-/g, ' ');
            const isLast = index === pathnames.length - 1;
            return (
              <li key={routeTo} className="flex items-center gap-2">
                <span className="text-zinc-400">/</span>
                {isLast ? (
                  <span className="text-zinc-900 capitalize">{label}</span>
                ) : (
                  <Link className="text-indigo-600 hover:text-indigo-700 capitalize" to={routeTo}>
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <Breadcrumbs />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<Blog />} />
            <Route path="/news/:slug" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/photo" element={<Gallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/songs" element={<Song />} />
            <Route path="/songs/:slug" element={<Song />} />
            <Route path="/create-song" element={<CreateSong />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  )
}
