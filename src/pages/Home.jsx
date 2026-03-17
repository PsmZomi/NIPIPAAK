import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import { useReveal } from '../components/useReveal'
import HeroBanner from '../components/HeroBanner'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function Home() {
  const [latestNews, setLatestNews] = useState([])
  const [latestBlogs, setLatestBlogs] = useState([])
  useReveal()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));

    const unsubNews = onSnapshot(qNews, (snapshot) => {
      setLatestNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err));

    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      setLatestBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err));

    return () => { unsubNews(); unsubBlogs(); };
  }, []);

  const categories = ['Culture', 'Technology', 'Photography', 'Essays']

  return (
    <main className="pt-[105px] lg:pt-[89px] bg-[#fdfaf6] text-[#1a1a1a] min-h-screen selection:bg-[#eaddca]">
      
      {/* ── THE EXHIBITION HALL (Banner) ── */}
      {/* Framed like a gallery display case */}
      {/* <section className="max-w-7xl mx-auto px-5 lg:px-10 pt-8">
        <div className="rounded-sm overflow-hidden shadow-2xl border-[1px] border-zinc-200 p-2 bg-white">
           <HeroBanner />
        </div>
      </section> */}

      {/* ── CATALOG HEADER ── */}
      <header className="max-w-7xl mx-auto mt-4 mb-12">
        <div className="flex flex-col items-center text-center">
            <div className="h-px w-24 bg-zinc-300 mb-6" />
            {/* <h2 className="text-[10px] font-mono uppercase tracking-[0.5em] text-zinc-400 mb-2">
                Public Archive & Reading Room
            </h2> */}
            <p className="font-serif italic text-2xl text-zinc-800">Nipipaak Salbuu</p>
        </div>
      </header>

      {/* ── MAIN LIBRARY FLOOR ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20">
        
        {/* LEFT: THE MAIN SHELVES (Primary Content) */}
        <div className="lg:col-span-8 space-y-20">
          
          {/* Featured Volume (Latest News Hero) */}
          {latestNews.length > 0 && (
            <article className="reveal group">
              <Link to={`/news/${latestNews[0].slug}`} className="block">
                <div className="relative aspect-[21/9] overflow-hidden rounded-sm bg-zinc-100 mb-8 border border-zinc-200">
                  <img 
                    src={latestNews[0].image} 
                    className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
                    alt={latestNews[0].title}
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="max-w-2xl">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-4 block">
                    Latest Entry · {latestNews[0].date}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-serif italic leading-tight mb-5 decoration-zinc-200 underline-offset-8 group-hover:underline">
                    {latestNews[0].title}
                  </h1>
                  <p className="text-zinc-600 font-serif text-lg leading-relaxed opacity-90 line-clamp-3">
                    {latestNews[0].excerpt}
                  </p>
                </div>
              </Link>
            </article>
          )}

          {/* The Stacks (Grid of Blog Posts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 pt-2 border-t border-zinc-200">
            {latestBlogs.slice(0, 4).map((post, i) => (
              <div key={post.id} className="reveal">
                <PostCard post={post} index={i} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: THE LIBRARIAN'S DESK (Sidebar) */}
        <aside className="lg:col-span-4 space-y-16">
          
          {/* Catalog Index (Categories) */}
          <div className="bg-white border border-zinc-200 p-8 shadow-sm">
            <h3 className="font-serif text-xl italic mb-8 text-zinc-800">Subject Index</h3>
            <nav className="space-y-5">
              {categories.map((cat) => (
                <Link 
                  key={cat} 
                  to={`/blog?cat=${cat}`} 
                  className="flex items-center group"
                >
                  <span className="font-mono text-[11px] uppercase tracking-tighter text-zinc-500 group-hover:text-black transition-colors">
                    {cat}
                  </span>
                  <div className="flex-1 border-b border-dotted border-zinc-300 mx-3 mb-1" />
                  <span className="font-serif italic text-xs text-zinc-300 group-hover:text-zinc-500">Ref.</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Short Works (Side News) */}
          <div className="px-2">
            <h3 className="font-serif text-lg italic mb-8 border-b border-zinc-100 pb-2">Recent Notes</h3>
            <div className="space-y-10">
              {latestNews.slice(1, 4).map((news) => (
                <Link key={news.id} to={`/news/${news.slug}`} className="block group">
                  <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-2">
                    {news.category || 'Archived'}
                  </p>
                  <h4 className="font-serif text-[15px] leading-snug text-zinc-800 group-hover:text-zinc-500 transition-colors italic">
                    {news.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Subtle Library Decoration */}
          <div className="pt-10 opacity-20 grayscale flex justify-center">
             <span className="text-4xl">❧</span>
          </div>
        </aside>

      </section>

      {/* ── THE STUDY (Footer Section) ── */}
      <section className="bg-zinc-900 text-[#f4f1ea] py-28 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
        <div className="max-w-2xl mx-auto px-5 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-serif italic mb-8 text-white">
            Quietude & Contemplation
          </h2>
          <p className="font-serif text-lg opacity-60 italic leading-relaxed mb-12 px-4">
            "A collection of thoughts, bound by digital ink, curated for those who still find magic in the turning of a page."
          </p>
          <Link 
            to="/about" 
            className="inline-block border border-white/20 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500"
          >
            The Librarian's Mandate
          </Link>
        </div>
      </section>

    </main>
  )
}