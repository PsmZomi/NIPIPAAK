import { Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom'
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
import Media from './pages/Media'
import CreateMedia from './pages/CreateMedia'
import Worldcup from './pages/WorldCup'
import Result from './pages/Result'
import { AuthProvider } from './context/AuthContext'
import { PawlpiSessionProvider, usePawlpiSession } from './context/PawlpiSessionContext'
import Pawlpi from './components/PawlpiLogin'

function MediaPage() {
  const { pathname } = useLocation()
  return <Media key={pathname} />
}

function LegacySongRedirect() {
  const { slug } = useParams()
  return <Navigate to={slug ? `/media/${slug}` : '/media'} replace />
}

function LegacyCreateSongRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/create-media/edit/${id}` : '/create-media'} replace />
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const pathnames = pathname.split('/').filter(Boolean);

  return (
    <nav className="bg-white px-4 py-1.5 sm:py-2 border-b border-zinc-200 text-xs sm:text-sm font-medium relative z-40">
      <ol className="flex flex-wrap gap-2 text-zinc-500">
        <li>
          {pathname === '/' ? (
            <span className="text-zinc-900">Home</span>
          ) : (
            <Link className="text-green-300 transition-colors" to="/">Home</Link>
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
                <Link className="text-green-300 capitalize transition-colors" to={routeTo}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AppShell() {
  const { pathname } = useLocation()
  const { isAuthed, clearGate } = usePawlpiSession()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/pawlpi') {
      clearGate()
    }
  }, [pathname, clearGate])

  const hideFooter = pathname === '/pawlpi' && isAuthed
  const hideBreadcrumbs = pathname === '/pawlpi' && isAuthed

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {!hideBreadcrumbs ? <Breadcrumbs /> : null}
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
          <Route path="/create-post/edit/:type/:id" element={<CreatePost />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/media/:slug" element={<MediaPage />} />
          <Route path="/create-media/edit/:id" element={<CreateMedia />} />
          <Route path="/create-media" element={<CreateMedia />} />
          <Route path="/songs" element={<LegacySongRedirect />} />
          <Route path="/songs/:slug" element={<LegacySongRedirect />} />
          <Route path="/create-song/edit/:id" element={<LegacyCreateSongRedirect />} />
          <Route path="/create-song" element={<LegacyCreateSongRedirect />} />
          <Route path="/worldcup" element={<Worldcup />} />
          <Route path="/result" element={<Result />} />
          <Route path="/pawlpi" element={<Pawlpi />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PawlpiSessionProvider>
        <AppShell />
      </PawlpiSessionProvider>
    </AuthProvider>
  )
}
