import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { posts } from '../data/content'
import { useReveal } from '../components/useReveal'

export default function Article() {
  const { slug } = useParams()
  const post = posts.find(p => p.slug === slug)
  useReveal()
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!post) return <Navigate to="/blog" replace />

  const related = posts.filter(p => p.category === post.category && p.id !== post.id).slice(0, 2)

  return (
    <main className="pt-[105px] lg:pt-[89px]">

      {/* Article header */}
      <div className={`bg-gradient-to-br ${post.gradient} py-16 lg:py-24`}>
        <div className="max-w-3xl mx-auto px-5 lg:px-10 text-center">
          <span className="inline-block tag border-white/50 text-white/80 mb-5">{post.category}</span>
          <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.025em' }}>
            {post.title}
          </h1>
          <p className="text-white/70 text-base lg:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-center gap-4 text-white/60 text-xs font-mono">
            <span>By {post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime} read</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-2xl mx-auto px-5 lg:px-0 py-14">
        <div className="prose-article">
          {post.body.map((para, i) => (
            <p key={i} className={i === 0 ? 'drop-cap' : ''}>{para}</p>
          ))}
        </div>

        {/* Author card */}
        <div className="mt-14 pt-8 border-t border-border flex gap-5 items-start">
          <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${post.gradient} flex items-center justify-center text-2xl`}>
            👤
          </div>
          <div>
            <p className="section-label mb-1">Written by</p>
            <h4 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {post.author}
            </h4>
            <Link to="/team" className="text-xs font-mono text-accent hover:underline mt-1 inline-block">
              View author profile →
            </Link>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-warm py-14">
          <div className="max-w-3xl mx-auto px-5 lg:px-10">
            <div className="divider mb-8">MORE IN {post.category.toUpperCase()}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="reveal card-lift group">
                  <div className={`aspect-video bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-3`}>
                    <span className="text-5xl">{p.emoji}</span>
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
    </main>
  )
}
