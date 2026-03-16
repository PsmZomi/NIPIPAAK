import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function Article() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState([])
  useReveal()
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  useEffect(() => {
    // Search Firestore (blogs then news)
    const searchFirestore = async () => {
      try {
        // Search in blogs collection
        const blogsQ = query(collection(db, 'blogs'), where('slug', '==', slug))
        const blogsSnap = await getDocs(blogsQ)
        if (!blogsSnap.empty) {
          const found = { id: blogsSnap.docs[0].id, type: 'blog', ...blogsSnap.docs[0].data() }
          setPost(found)
          setLoading(false)
          return
        }

        // Search in news collection
        const newsQ = query(collection(db, 'news'), where('slug', '==', slug))
        const newsSnap = await getDocs(newsQ)
        if (!newsSnap.empty) {
          const found = { id: newsSnap.docs[0].id, type: 'news', ...newsSnap.docs[0].data() }
          setPost(found)
          setLoading(false)
          return
        }

        // Not found anywhere
        setPost(null)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching post:', err)
        setPost(null)
        setLoading(false)
      }
    }

    searchFirestore()
  }, [slug])

  if (loading) {
    return (
      <main className="pt-[130px] lg:pt-[115px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm font-mono">Loading story...</p>
        </div>
      </main>
    )
  }

  if (!post) return <Navigate to="/blog" replace />

  return (
    <main className="pt-[130px] lg:pt-[115px]">

      {/* Article Hero - Side by Side Layout */}
      <div className={`bg-gradient-to-br ${post.gradient || 'from-gray-900 to-black'} py-4 lg:py-4`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side: Image */}
            <div className="w-full order-1 lg:order-1">
              {post.image ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video lg:aspect-[16/10] relative">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover absolute inset-0" />
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-white/10 aspect-video lg:aspect-[16/10] flex items-center justify-center text-8xl">
                  {post.emoji || '📝'}
                </div>
              )}
            </div>

            {/* Right side: Headers and Meta */}
            <div className="text-left order-2 lg:order-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/20 text-white rounded-full mb-6">
                {post.category}
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-sm"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.025em' }}>
                {post.title}
              </h1>
              {/* <p className="text-white/80 text-lg lg:text-xl leading-relaxed mb-8">
                {post.excerpt}
              </p> */}
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm font-mono mt-auto pt-6 border-t border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shadow-inner">👤</div>
                  <span className="text-white font-semibold">{post.author}</span>
                </div>
                <span className="opacity-50 hidden sm:inline">·</span>
                <span>{post.date}</span>
                <span className="opacity-50 hidden sm:inline">·</span>
                <span>{post.readTime || '5 min'} read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-2xl mx-auto px-5 lg:px-0 py-14">
        <div className="prose-article">
          {(post.body || []).map((para, i) => (
            <p key={i} className={i === 0 ? 'drop-cap' : ''}>{para}</p>
          ))}
        </div>

        {/* Author card */}
        <div className="mt-14 pt-8 border-t border-border flex gap-5 items-start">
          <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${post.gradient || 'from-gray-900 to-black'} rounded-full flex items-center justify-center text-2xl`}>
            👤
          </div>
          <div>
            <p className="section-label mb-1">Written by</p>
            <h4 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {post.author}
            </h4>
          </div>
        </div>
      </article>

      {/* Related (only for static posts that have related content) */}
      {related.length > 0 && (
        <section className="border-t border-border bg-warm py-14">
          <div className="max-w-3xl mx-auto px-5 lg:px-10">
            <div className="divider mb-8">MORE IN {post.category.toUpperCase()}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="reveal card-lift group">
                  <div className={`aspect-video bg-gradient-to-br ${p.gradient || 'from-gray-900 to-black'} flex items-center justify-center mb-3 rounded-lg overflow-hidden`}>
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{p.emoji || '📖'}</span>
                    )}
                  </div>
                  <span className="tag">{p.category}</span>
                  <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-accent transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {p.title}
                  </h3>
                  <p className="text-xs font-mono text-muted mt-1">{p.author} · {p.readTime}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/blog" className="btn-ghost">← Back to All Stories</Link>
            </div>
          </div>
        </section>
      )}

      {/* Back link for dynamic posts (which don't have related content) */}
      {related.length === 0 && (
        <section className="border-t border-border py-10">
          <div className="text-center">
            <Link to={post.type === 'news' ? '/news' : '/blog'} className="btn-ghost">
              ← Back to {post.type === 'news' ? 'News' : 'All Stories'}
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
