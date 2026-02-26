import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { posts, categories } from '../data/content'
import { useReveal } from '../components/useReveal'

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const activeCat = searchParams.get('cat') || 'All'

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useReveal()

  const filtered = posts.filter(p => {
    const matchCat = activeCat === 'All' || p.category === activeCat
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const setCat = (cat) => {
    if (cat === 'All') searchParams.delete('cat')
    else searchParams.set('cat', cat)
    setSearchParams(searchParams)
  }

  return (
    <main className="pt-[105px] mt-8 lg:pt-[89px]">

      {/* Page header */}
      <div className="bg-ink text-white py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <p className="section-label text-white/40 mb-3">The Archive</p>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.03em' }}>
            All Stories
          </h1>
          <p className="text-white/60 text-base max-w-xl">
            Every piece we've published — essays, features, and criticism on culture, technology, and the examined life.
          </p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="border-b border-border sticky top-[57px] lg:top-[89px] z-30 bg-paper/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCat(cat)}
                className={`text-xs font-mono tracking-widest uppercase px-3 py-1.5 border transition-all duration-200 ${
                  activeCat === cat
                    ? 'bg-ink text-white border-ink'
                    : 'border-border text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stories…"
            className="form-input !py-1.5 !text-xs max-w-[220px]"
          />
        </div>
      </div>

      {/* Posts grid */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              No stories found
            </h2>
            <p className="text-muted text-sm">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* First post: large */}
            <div className="lg:col-span-2">
              <Link
                to={`/blog/${filtered[0].slug}`}
                className="reveal d1 card-lift group block"
              >
                <div className={`relative aspect-[16/9] bg-gradient-to-br ${filtered[0].gradient} flex items-center justify-center overflow-hidden`}>
                  <span className="text-7xl">{filtered[0].emoji}</span>
                  <div className="absolute inset-0 img-overlay" />
                  <div className="absolute bottom-5 left-5">
                    <span className="tag border-white/50 text-white/80 text-[10px]">{filtered[0].category}</span>
                  </div>
                </div>
                <div className="pt-4">
                  <h2 className="text-2xl font-bold leading-snug group-hover:text-accent transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {filtered[0].title}
                  </h2>
                  <p className="text-muted text-sm leading-relaxed mt-2 line-clamp-2">{filtered[0].excerpt}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-mono text-muted">{filtered[0].author}</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs font-mono text-muted">{filtered[0].date}</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs font-mono text-muted">{filtered[0].readTime}</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Remaining posts sidebar */}
            <div className="flex flex-col gap-7">
              {filtered.slice(1, 4).map((p, i) => (
                <Link key={p.id} to={`/blog/${p.slug}`}
                  className={`reveal d${i+2} card-lift group flex gap-4 pb-7 ${i < 2 ? 'border-b border-border' : ''}`}>
                  <div className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                    <span className="text-3xl">{p.emoji}</span>
                  </div>
                  <div>
                    <span className="tag">{p.category}</span>
                    <h3 className="mt-1.5 text-sm font-bold leading-snug group-hover:text-accent transition-colors line-clamp-3"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      {p.title}
                    </h3>
                    <p className="text-[11px] font-mono text-muted mt-1.5">{p.author} · {p.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All remaining posts */}
        {filtered.length > 4 && (
          <div className="mt-12">
            <div className="divider mb-10">MORE STORIES</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.slice(4).map((p, i) => (
                <Link key={p.id} to={`/blog/${p.slug}`}
                  className={`reveal d${(i%6)+1} card-lift group`}>
                  <div className={`aspect-video bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-4`}>
                    <span className="text-5xl">{p.emoji}</span>
                  </div>
                  <span className="tag">{p.category}</span>
                  <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-accent transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {p.title}
                  </h3>
                  <p className="text-xs font-mono text-muted mt-2">{p.author} · {p.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
