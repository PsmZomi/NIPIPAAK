import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useReveal } from '../components/useReveal'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const [latestNews, setLatestNews] = useState([])
  const [latestBlogs, setLatestBlogs] = useState([])
  const [latestSongs, setLatestSongs] = useState([])
  const [showAllBlogs, setShowAllBlogs] = useState(false)
  const { user } = useAuth()
  
  useReveal()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const qSongs = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));

    const unsubNews = onSnapshot(qNews, (snapshot) => {
      setLatestNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err));

    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      setLatestBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err));

    const unsubSongs = onSnapshot(qSongs, (snapshot) => {
      setLatestSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn(err));

    return () => { unsubNews(); unsubBlogs(); unsubSongs(); };
  }, []);

  // Derived Data
  const featuredPosts = latestBlogs.slice(0, 6);
  const displayedBlogs = showAllBlogs ? latestBlogs : latestBlogs.slice(0, 6);

  return (
    <main className="pt-[105px] lg:pt-[89px] bg-[#fdfaf6] text-[#1a1a1a] min-h-screen selection:bg-[#eaddca]">
      
      {/* ── LIBRARY HEADER ── */}
      <header className="max-w-7xl mx-auto mb-12 px-5 lg:px-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-px w-24 bg-zinc-300 mb-6 lg:mb-10" />
          <p className="font-serif italic text-4xl lg:text-5xl text-zinc-800">Nipipaak Salbuu</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400 mt-4">
            Huihlak laibu
          </p>
        </div>
      </header>

      {/* ── WHAT'S NEW ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-24">
        <div className="mb-8">
          <h2 className="font-serif text-2xl italic text-zinc-800">What's New</h2>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Latest songs & news</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...latestSongs.slice(0, 2), ...latestNews.slice(0, 2)].map((item, index) => (
            <Link 
              key={`${item.id}-${index}`} 
              to={item.artist ? `/songs/${item.slug}` : `/news/${item.slug}`}
              className="reveal group"
            >
              <article className="bg-white border border-zinc-200 shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                <div className={`overflow-hidden flex items-center justify-center p-4 aspect-square ${
                  item.artist 
                    ? 'bg-gradient-to-br from-green-600 to-black' 
                    : 'bg-zinc-100'
                }`}>
                  {item.artist ? (
                    <div className="text-center">
                      <span className="text-4xl block mb-2">🎵</span>
                      <p className="text-xs font-mono text-green-200 line-clamp-1">
                        {item.artist}
                      </p>
                    </div>
                  ) : (
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400'} 
                      alt={item.title}
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] text-zinc-400">{item.date}</p>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                      item.artist
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.artist ? '🎵 Song' : '📰 News'}
                    </span>
                  </div>
                  <h3 className="font-serif text-sm italic text-zinc-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 mb-3 flex-1 line-clamp-2">
                    {item.artist || item.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono pt-2 border-t border-zinc-100">
                    <span>{(item.likes || 0) > 0 ? '❤️' : '🤍'} {item.likes || 0}</span>
                    <span>💬 {item.comments?.length || 0}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── NEWS UPDATES ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-24">
        <div className="mb-10 pb-4 border-b border-zinc-200">
          <h2 className="font-serif text-2xl italic text-zinc-800">Recent News</h2>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mt-2">Thu thak</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {latestNews.slice(0, 4).map((news, index) => (
            <Link key={news.id} to={`/news/${news.slug}`} className="reveal group">
              <article className="bg-white border border-zinc-200 p-4 hover:shadow-md transition-all flex gap-4">
                {news.image && (
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-zinc-100">
                    <img src={news.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                )}
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 uppercase">{news.date}</span>
                  <h3 className="font-serif text-lg italic text-zinc-800 line-clamp-2">{news.title}</h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ARTICLES & BLOGS ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-24">
        <div className="mb-10 pb-4 border-b border-zinc-200">
          <div>
            <h2 className="font-serif text-2xl italic text-zinc-800">Articles & Blogs</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mt-2">Thu leh Laa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedBlogs.map((blog, i) => (
            <Link 
              key={blog.id} 
              to={`/blog/${blog.slug}`}
              className="reveal group"
            >
              <article className="bg-white border border-zinc-200 shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                <div className="overflow-hidden bg-zinc-100 aspect-square relative">
                  <img 
                    src={blog.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400'} 
                    alt={blog.title}
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] text-zinc-400">{blog.date}</p>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      📝 Article
                    </span>
                  </div>
                  <h3 className="font-serif text-lg italic text-zinc-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-zinc-600 mb-4 flex-1 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-mono pt-3 border-t border-zinc-100">
                    <span>{(blog.likes || 0) > 0 ? '❤️' : '🤍'} {blog.likes || 0}</span>
                    <span>💬 {blog.comments?.length || 0}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SONGS ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-24">
        <div className="mb-10 pb-4 border-b border-zinc-200">
          <div>
            <h2 className="font-serif text-2xl italic text-zinc-800">Songs</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mt-2">Popular by engagement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestSongs.slice(0, 6).sort((a, b) => (b.likes || 0) - (a.likes || 0)).map((song, i) => (
            <Link 
              key={song.id} 
              to={`/songs/${song.slug}`}
              className="reveal group"
            >
              <article className="bg-white border border-zinc-200 shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                <div className="overflow-hidden flex items-center justify-center p-6 aspect-square bg-gradient-to-br from-green-600 to-black">
                  <div className="text-center">
                    <span className="text-6xl block mb-3">🎵</span>
                    <p className="text-xs font-mono text-purple-200 line-clamp-1">
                      {song.artist}
                    </p>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] text-zinc-400">{song.date}</p>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                      🎵 Song
                    </span>
                  </div>
                  <h3 className="font-serif text-lg italic text-zinc-800 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                    {song.title}
                  </h3>
                  <p className="text-sm text-zinc-600 mb-4 flex-1 line-clamp-2">
                    {song.artist}
                  </p>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-mono pt-3 border-t border-zinc-100">
                    <span>{(song.likes || 0) > 0 ? '❤️' : '🤍'} {song.likes || 0}</span>
                    <span>💬 {song.comments?.length || 0}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TOP LIKES ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-24">
        <div className="mb-10 pb-4 border-b border-zinc-200">
          <h2 className="font-serif text-2xl italic text-zinc-800">Top Likes</h2>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mt-2">Most loved content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...displayedBlogs, ...latestSongs.slice(0, 6)]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 6)
            .map((item, i) => (
            <Link 
              key={`top-${item.type || 'blog'}-${item.id}`} 
              to={item.type === 'song' ? `/songs/${item.slug}` : `/blog/${item.slug}`}
              className="reveal group"
            >
              <article className="bg-white border border-zinc-200 shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                <div className={`overflow-hidden flex items-center justify-center p-6 aspect-square ${
                  item.type === 'song' 
                    ? 'bg-gradient-to-br from-green-600 to-black' 
                    : 'bg-zinc-100'
                }`}>
                  {item.type === 'song' ? (
                    <div className="text-center">
                      <span className="text-6xl block mb-3">🎵</span>
                      <p className="text-xs font-mono text-green-200 line-clamp-1">
                        {item.artist}
                      </p>
                    </div>
                  ) : (
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400'} 
                      alt={item.title}
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] text-zinc-400">{item.date}</p>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                      item.type === 'song'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type === 'song' ? '🎵 Song' : '📝 Article'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg italic text-zinc-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-600 mb-4 flex-1 line-clamp-2">
                    {item.type === 'song' ? item.artist : item.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-mono pt-3 border-t border-zinc-100">
                    <span>{(item.likes || 0) > 0 ? '❤️' : '🤍'} {item.likes || 0}</span>
                    <span>💬 {item.comments?.length || 0}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER STUDY SECTION ── */}
      <section className="bg-zinc-900 text-[#f4f1ea] py-24 text-center">
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="text-4xl font-serif italic mb-6">Quietude & Contemplation</h2>
          <p className="font-serif opacity-60 italic mb-10 leading-relaxed">
            "A collection of thoughts, bound by digital ink, curated for those who still find magic in the turning of a page."
          </p>
          <Link to="/about" className="inline-block border border-white/20 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500">
            The Librarian's Mandate
          </Link>
        </div>
      </section>
    </main>
  )
}