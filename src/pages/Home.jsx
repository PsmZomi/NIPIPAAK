import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { posts } from '../data/content'
import PostCard from '../components/PostCard'
import { useReveal } from '../components/useReveal'
import Newsletter from './Newsletter'


const featured = posts.filter(p => p.featured)
const recent = posts.filter(p => !p.featured).slice(0, 4)
const categories = ['Culture', 'Technology', 'Photography', 'Essays']

export default function Home() {
  useReveal()

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <main className="pt-[105px] lg:pt-[89px]">

      {/* ── TICKER ── */}
      {/* <div className="bg-accent text-white overflow-hidden py-2 border-b border-accent2">
        <div className="ticker-inner flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex items-center gap-8 px-8 text-xs font-mono tracking-widest">
              {posts.map(p => (
                <span key={p.id} className="flex items-center gap-3">
                  <span className="opacity-50">◆</span>
                  <span>{p.category.toUpperCase()}</span>
                  <span className="opacity-70">{p.title}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div> */}

      <Newsletter/>

      {/* ── HERO ── */}
    <section className="max-w-7xl mx-auto px-5 lg:py-20">
      <div className="reveal text-center">
    {/* ROW 1: Lead Story (Full Width) */}
<div className="w-full">
  <p className="fade-up fu1 section-label mb-6 text-accent font-mono uppercase tracking-[0.2em] text-xs">
    Today's Lead Story
  </p>

  <Link
    to={`/blog/${featured[0].slug}`}
    className="fade-up fu2 block group"
  >
    {/* Newspaper Layout */}
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* LEFT — Image */}
      <div
        className={`relative lg:w-1/2 aspect-[21/9] lg:aspect-auto lg:h-[350px] 
        bg-gradient-to-br ${featured[0].gradient} 
        overflow-hidden flex items-center justify-center`}
      >
        <span className="text-7xl group-hover:scale-110 duration-500">
          {featured[0].emoji}
        </span>
        <div className="absolute inset-0 group-hover:bg-ink/5 transition-colors" />
      </div>

      {/* RIGHT — Content */}
      <div className="lg:w-1/2 max-w-2xl">
        <span className="tag bg-warm text-ink px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border">
          {featured[0].category}
        </span>

        <h1 className="mt-4 text-3xl lg:text-5xl font-display font-bold leading-tight group-hover:text-accent transition-colors">
          {featured[0].title}
        </h1>

        <p className="mt-4 text-muted leading-relaxed text-lg font-sans">
          {featured[0].excerpt}
        </p>

        <div className="flex items-center gap-4 mt-8 text-muted font-mono text-[11px] uppercase tracking-wider">
          <span>{featured[0].author}</span>
          <span className="opacity-30">|</span>
          <span>{featured[0].date}</span>
          <span className="opacity-30">|</span>
          <span>{featured[0].readTime} read</span>
        </div>
      </div>
    </div>
  </Link>
</div>

    {/* Horizontal Divider Line */}
    <div className="h-px w-full bg-border" />

    {/* ROW 2: Also Featured (Horizontal Card) */}
    <div className="w-full">
      <p className="section-label mb-8 text-muted font-mono uppercase tracking-[0.2em] text-xs text-center lg:text-left">Also Featured</p>
      
      <Link to={`/blog/${featured[1].slug}`} className="group flex flex-col md:flex-row gap-8 items-center">
        {/* Story Image Square */}
        <div className={`flex-shrink-0 w-full md:w-64 h-64 bg-gradient-to-br ${featured[1].gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-7xl group-hover:rotate-12 transition-transform duration-300">{featured[1].emoji}</span>
        </div>
        
        {/* Story Content */}
        <div className="flex-1">
          <span className="text-xs font-mono text-accent uppercase tracking-bold">{featured[1].category}</span>
          <h2 className="mt-2 text-2xl lg:text-3xl font-display font-bold leading-snug group-hover:text-accent transition-colors">
            {featured[1].title}
          </h2>
          <p className="mt-3 text-muted font-sans text-base line-clamp-2">
            {featured[1].excerpt || "Explore more details about this featured story from our team."}
          </p>
          <p className="text-xs font-mono text-muted mt-4 uppercase tracking-widest">
            By {featured[1].author} <span className="mx-2 opacity-50">/</span> {featured[1].readTime}
          </p>
        </div>
      </Link>
    </div>

  </div>
</section>

      {/* ── DIVIDER ── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="divider text-muted text-[10px] font-mono tracking-[0.3em]">LATEST STORIES</div>
      </div>

      {/* ── RECENT POSTS ── */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {recent.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
        <div className="reveal d3 text-center mt-12">
          <Link to="/blog" className="btn-ghost">View All Stories →</Link>
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section className="bg-warm border-t border-b border-border py-16">
        <div className="max-w-3xl mx-auto px-5 lg:px-10 text-center reveal">
          <p className="section-label mb-4">About Nipipaak</p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Stories for the curious and the contemplative.
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            Nipipaak is an independent magazine publishing long-form essays, reported features, and criticism on culture, technology, and the life of the mind. No algorithms. No hot takes. Just stories worth your time.
          </p>
          <Link to="/about" className="btn-ghost">Learn More About Us</Link>
        </div>
        
      </section>

    </main>
  )
}
