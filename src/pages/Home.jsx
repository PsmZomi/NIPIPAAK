import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import { useReveal } from '../components/useReveal'
import Newsletter from './Newsletter'
import HeroBanner from '../components/HeroBanner' // 1. IMPORT ADDED HERE
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

  const allBlogs = latestBlogs;
  const categories = ['Culture', 'Technology', 'Photography', 'Essays']

  return (
    <main className="pt-[105px] lg:pt-[89px] bg-paper">

      {/* 2. BANNER PLACEMENT: Right at the top of the content */}
      <HeroBanner />

      {/* <Newsletter /> */}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SECTION 1: LATEST NEWS (Hero)              ── */}
      {/* ═══════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-10 py-8 lg:py-10">
          <div className="reveal mb-6">
            <p className="section-label text-red-600 font-mono uppercase tracking-[0.25em] text-[10px] mb-5 text-center">
              🔴 Breaking / Latest News
            </p>

            <Link to={`/news/${latestNews[0].slug}`} className="group block">
              <div className="grid lg:grid-cols-2 gap-0 border border-red-200 overflow-hidden rounded-xl hover:shadow-xl transition-all duration-500 bg-white dark:bg-gray-900">

                {/* Image Side */}
                <div className="relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-zinc-100 flex items-center justify-center">
                  {latestNews[0].image ? (
                    <img
                      src={latestNews[0].image}
                      alt={latestNews[0].title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[400px] flex items-center justify-center text-7xl bg-gradient-to-br from-red-900 to-red-700">
                      📰
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-sm">
                      {latestNews[0].category || 'News'}
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-col justify-between p-6 lg:p-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-4 h-px bg-red-600" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-600">Latest News</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-[1.15] group-hover:text-red-600 transition-colors duration-300 mb-4"
                      style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
                      {latestNews[0].title}
                    </h1>
                    <p className="text-muted leading-relaxed text-sm lg:text-base mb-6 line-clamp-3">
                      {latestNews[0].excerpt}
                    </p>
                  </div>
                  <div>
                    <div className="h-px w-full bg-border mb-4" />
                    <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider text-muted flex-wrap">
                      <span className="font-semibold text-ink">{latestNews[0].author}</span>
                      <span className="text-border">|</span>
                      <span>{latestNews[0].date}</span>
                      <span className="text-border">|</span>
                      <span>{latestNews[0].readTime || '3 min'} read</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SECTION 2: MORE NEWS (Featured News)      ── */}
      {/* ═══════════════════════════════════════════════ */}
      {latestNews.length > 1 && (
        <section className="max-w-7xl mx-auto px-5 lg:px-10 pb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-border" />
            <p className="section-label text-[10px] font-mono uppercase tracking-[0.25em] text-muted">More News</p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.slice(1, 4).map((news, i) => (
              <Link
                key={news.id}
                to={`/news/${news.slug}`}
                className={`reveal d${i + 1} group block bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-border hover:shadow-md transition-all duration-300`}
              >
                <div className="h-44 bg-zinc-100 flex items-center justify-center overflow-hidden relative">
                  {news.image ? (
                    <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-red-900 to-red-700">📰</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">{news.category || 'News'}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {news.title}
                  </h3>
                  <p className="text-xs text-muted font-mono">{news.author} · {news.date}</p>
                </div>
              </Link>
            ))}
          </div>
          {latestNews.length > 4 && (
            <div className="text-center mt-8">
              <Link to="/news" className="btn-ghost text-red-600 border-red-200 hover:border-red-400">View All News →</Link>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SECTION 3: FEATURED BLOG (Lead Story)     ── */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-8 lg:py-10">
        <div className="reveal mb-6">
          <p className="section-label text-accent font-mono uppercase tracking-[0.25em] text-[10px] mb-5 text-center">
            Featured Story
          </p>

          {allBlogs[0] && (
            <Link to={`/blog/${allBlogs[0].slug}`} className="group block">
              <div className="grid lg:grid-cols-2 gap-0 border border-border overflow-hidden rounded-xl hover:shadow-xl transition-all duration-500 bg-white dark:bg-gray-900">
                {/* Image Side */}
                <div className="relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-zinc-100 flex items-center justify-center">
                  {allBlogs[0].image ? (
                    <img src={allBlogs[0].image} alt={allBlogs[0].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className={`w-full h-full min-h-[400px] flex items-center justify-center text-7xl bg-gradient-to-br ${allBlogs[0].gradient || 'from-gray-800 to-gray-900'}`}>
                      {allBlogs[0].emoji || '📖'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-ink text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-sm">
                      {allBlogs[0].category}
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-col justify-between p-6 lg:p-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-4 h-px bg-accent" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">Featured</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-[1.15] group-hover:text-accent transition-colors duration-300 mb-4"
                      style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
                      {allBlogs[0].title}
                    </h1>
                    <p className="text-muted leading-relaxed text-sm lg:text-base mb-6 line-clamp-3">
                      {allBlogs[0].excerpt}
                    </p>
                  </div>
                  <div>
                    <div className="h-px w-full bg-border mb-4" />
                    <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider text-muted flex-wrap">
                      <span className="font-semibold text-ink">{allBlogs[0].author}</span>
                      <span className="text-border">|</span>
                      <span>{allBlogs[0].date}</span>
                      <span className="text-border">|</span>
                      <span>{allBlogs[0].readTime || '5 min'} read</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Also Featured + Category Links */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {allBlogs[1] && (
            <div className="lg:col-span-2 reveal">
              <p className="section-label text-[10px] font-mono uppercase tracking-[0.25em] text-muted mb-3">Also Featured</p>
              <Link to={`/blog/${allBlogs[1].slug}`} className="group flex gap-5 items-start border border-border p-5 bg-white dark:bg-gray-900 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center">
                  {allBlogs[1].image ? (
                    <img src={allBlogs[1].image} alt={allBlogs[1].title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br ${allBlogs[1].gradient || 'from-gray-800 to-gray-900'}`}>
                      {allBlogs[1].emoji || '📖'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="tag mb-2 inline-block">{allBlogs[1].category}</span>
                  <h2 className="text-base lg:text-lg font-bold leading-snug group-hover:text-accent transition-colors duration-200 mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {allBlogs[1].title}
                  </h2>
                  <p className="text-[11px] font-mono text-muted uppercase tracking-wider">
                    By {allBlogs[1].author} <span className="mx-1.5 opacity-40">·</span> {allBlogs[1].readTime || '5 min'}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Browse by Category */}
          <div className="reveal">
            <p className="section-label text-[10px] font-mono uppercase tracking-[0.25em] text-muted mb-3">Browse by Category</p>
            <div className="border border-border bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
              {categories.map((cat, i) => (
                <Link
                  key={cat}
                  to={`/blog?cat=${cat}`}
                  className={`flex items-center justify-between px-5 py-3 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${i < categories.length - 1 ? 'border-b border-border dark:border-gray-800' : ''}`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-ink dark:text-white group-hover:text-accent transition-colors duration-200"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {cat}
                  </span>
                  <span className="text-muted dark:text-gray-400 group-hover:text-accent transition-colors duration-200">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="divider text-muted text-[10px] font-mono tracking-[0.3em]">LATEST STORIES</div>
      </div>

      {/* ── RECENT BLOG POSTS ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {allBlogs.slice(2, 6).map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
        <div className="reveal d3 text-center mt-14">
          <Link to="/blog" className="btn-ghost">View All Stories →</Link>
        </div>
      </section>

      {/* ── ABOUT footer homepage ── */}
      <section className="bg-ink border-t border-b border-border py-20">
        <div className="max-w-2xl mx-auto px-5 lg:px-10 text-center reveal">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="w-8 h-px bg-white/20" />
            <p className="section-label text-white/40">About Nipipaak</p>
            <span className="w-8 h-px bg-white/20" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
            Stories for the curious<br />and the contemplative.
          </h2>
          <p className="text-white/50 leading-relaxed mb-10 text-base max-w-lg mx-auto">
            Nipipaak is an independent magazine publishing long-form essays, reported features, and criticism on culture, technology, and the life of the mind. No algorithms. No hot takes. Just stories worth your time.
          </p>
          <Link to="/about" className="btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Learn More About Us
          </Link>
        </div>
      </section>

    </main>
  )
}