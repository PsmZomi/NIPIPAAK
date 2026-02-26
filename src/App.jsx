import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home    from './pages/Home'
import Blog    from './pages/Blog'
import Article from './pages/Article'
import About   from './pages/About'
import News    from './pages/News'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import NewsArticlePage from './pages/Newsletter'


export default function App() {
  const { pathname } = useLocation()

  // Re-run reveal on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/blog"      element={<Blog />} />
          <Route path="/blog/:slug" element={<Article />} />
          <Route path="/about"     element={<About />} />
          <Route path="/news"      element={<News />} />
          <Route path="/contact"   element={<Contact />} />
          <Route path="/newsletter/:slug" element={<NewsArticlePage />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
