import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useReveal } from '../components/useReveal'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80'

function createdMs(item) {
  const t = item.createdAt
  if (t?.seconds != null) return t.seconds * 1000
  if (t?._seconds != null) return t._seconds * 1000
  return 0
}

function mergeNewest(news, blogs, limit) {
  const tagged = [
    ...news.map((n) => ({ ...n, _src: 'news' })),
    ...blogs.map((b) => ({ ...b, _src: 'blog' })),
  ]
  return tagged.sort((a, b) => createdMs(b) - createdMs(a)).slice(0, limit)
}

function byLikes(news, blogs, limit) {
  const tagged = [
    ...blogs.map((b) => ({ ...b, _src: 'blog' })),
    ...news.map((n) => ({ ...n, _src: 'news' })),
  ]
  return tagged
    .filter((x) => x.slug)
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, limit)
}

export default function Home() {
  const [latestNews, setLatestNews] = useState([])
  const [latestBlogs, setLatestBlogs] = useState([])
  const [latestSongs, setLatestSongs] = useState([])
  const [galleryPreview, setGalleryPreview] = useState([])

  useReveal()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'))
    const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'))
    const qSongs = query(collection(db, 'songs'), orderBy('createdAt', 'desc'))

    const unsubNews = onSnapshot(
      qNews,
      (snapshot) => {
        setLatestNews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => console.warn(err)
    )

    const unsubBlogs = onSnapshot(
      qBlogs,
      (snapshot) => {
        setLatestBlogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => console.warn(err)
    )

    const unsubSongs = onSnapshot(
      qSongs,
      (snapshot) => {
        setLatestSongs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => console.warn(err)
    )

    return () => {
      unsubNews()
      unsubBlogs()
      unsubSongs()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = localStorage.getItem('galleryFolders')
        if (!raw || !CLOUD_NAME) {
          if (!cancelled) setGalleryPreview([])
          return
        }
        const folders = JSON.parse(raw)
        const folderName = folders[0]?.name
        if (!folderName) {
          if (!cancelled) setGalleryPreview([])
          return
        }
        const res = await fetch(
          `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${folderName}.json`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        const thumbs = (data.resources || []).slice(0, 8).map((r) => ({
          id: r.public_id,
          url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_480,h_360,c_fill,g_auto,f_auto,q_auto/${r.public_id}`,
          caption: r.context?.custom?.caption || '',
        }))
        if (!cancelled) setGalleryPreview(thumbs)
      } catch {
        if (!cancelled) setGalleryPreview([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const topStories = useMemo(
    () => mergeNewest(latestNews, latestBlogs, 4),
    [latestNews, latestBlogs]
  )

  const popularStories = useMemo(
    () => byLikes(latestNews, latestBlogs, 8),
    [latestNews, latestBlogs]
  )

  const songsSorted = useMemo(() => {
    return [...latestSongs].sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }, [latestSongs])

  const StoryLink = ({ item, children, className = '' }) => {
    if (!item?.slug) {
      return <div className={className}>{children}</div>
    }
    const to = item._src === 'blog' ? `/blog/${item.slug}` : `/news/${item.slug}`
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <main className="pt-[64px] sm:pt-[72px] lg:pt-[89px] pb-8 lg:pb-24 min-h-screen bg-paper text-ink selection:bg-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 lg:pb-24">
        {/* Masthead — snug under fixed header on mobile */}
        <header className="pt-2 pb-2 lg:pt-10 text-center">
          <p className="font-gothic text-sm sm:text-base italic text-muted">
            HuihlaK Salbu — thuthak &amp; laathaK
          </p>
        </header>

        {/* Top row — newest */}
        <section className="mt-2 mb-10" aria-labelledby="headlines-heading">
          <div className="flex items-end justify-between border-b-4 border-double border-ink mb-2 pb-2">
            <h2 id="headlines-heading" className="font-display text-xl sm:text-2xl font-bold">
              Thu Masa
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              Thu &amp; La tuamtuam
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 lg:divide-x lg:divide-ink/15 border border-ink/20 bg-white shadow-[inset_0_0_0_1px_rgba(17,16,16,0.06)]">
            {topStories.length === 0 ? (
              <div className="lg:col-span-4 p-8 text-center font-mono text-xs text-muted">
                No stories yet. Add news or a blog post from Create Post.
              </div>
            ) : (
              topStories.map((item, i) => (
                <StoryLink
                  key={`top-${item._src}-${item.id}`}
                  item={item}
                  className="reveal group block p-4 sm:p-5 border-b border-ink/10 last:border-b-0 lg:border-b-0 hover:bg-warm/40 transition-colors"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent mb-2">
                    {item._src === 'blog' ? 'Article' : 'News'} · {item.date || '—'}
                  </p>
                  <h3
                    className={`font-display font-bold text-ink leading-tight mb-2 group-hover:text-accent2 transition-colors ${
                      i === 0 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 font-sans">
                    {item.excerpt || item.summary || 'Read more on the inside pages.'}
                  </p>
                  {item.image && (
                    <div className="mt-3 aspect-[16/9] overflow-hidden border border-ink/10">
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover grayscale contrast-105 group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  )}
                </StoryLink>
              ))
            )}
          </div>
        </section>

        {/* Popular — 2 cols mobile, 4 lg */}
        <section className="mb-10" aria-labelledby="popular-heading">
          <div className="border-t-2 border-ink pt-6 mb-5">
            <h2 id="popular-heading" className="font-display text-xl sm:text-2xl font-bold">
              Na Sim in
            </h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1">
              LAigelh tuamtuam
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {popularStories.length === 0 ? (
              <div className="col-span-full py-10 text-center font-mono text-xs text-muted border border-dashed border-ink/20">
                Likes will rank stories here once readers engage.
              </div>
            ) : (
              popularStories.map((item, rank) => (
                <StoryLink
                  key={`pop-${item._src}-${item.id}`}
                  item={item}
                  className="reveal group block border border-ink/15 bg-white p-3 sm:p-4 hover:border-ink/40 hover:shadow-md transition-all"
                >
                  <span className="font-gothic text-3xl sm:text-4xl leading-none text-ink/25 group-hover:text-accent/40">
                    {rank + 1}
                  </span>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted mt-2 mb-1">
                    {item._src === 'blog' ? 'Article' : 'News'}
                  </p>
                  <h3 className="font-display font-semibold text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-accent2">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-muted">
                    <span>♥ {item.likes ?? 0}</span>
                  </div>
                  <div className="mt-3 aspect-square bg-border overflow-hidden border border-ink/10">
                    <img
                      src={item.image || PLACEHOLDER_IMG}
                      alt=""
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                </StoryLink>
              ))
            )}
          </div>
        </section>

        {/* Songs */}
        <section className="mb-10" aria-labelledby="songs-heading">
          <div className="border-t border-ink/30 pt-6 mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="songs-heading" className="font-display text-xl uppercase sm:text-2xl font-bold">
                laa buu
              </h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1">
                
              </p>
            </div>
            <Link
              to="/songs"
              className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-accent2 underline-offset-4 hover:underline"
            >
              All songs →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {latestSongs.length === 0 ? (
              <div className="col-span-full py-10 text-center font-mono text-xs text-muted border border-dashed border-ink/20">
                No songs yet.
              </div>
            ) : (
              songsSorted.slice(0, 8).map((song) => (
                <Link
                  key={song.id}
                  to={song.slug ? `/songs/${song.slug}` : '/songs'}
                  className="reveal group border border-ink/15 bg-white p-3 sm:p-4 flex flex-col hover:bg-warm/50 transition-colors"
                >
                  <span className="font-mono text-[8px] uppercase text-muted mb-1">{song.date}</span>
                  <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-accent2">
                    {song.title}
                  </h3>
                  <p className="text-xs text-muted mt-1 line-clamp-1 font-sans">{song.artist}</p>
                  <p className="mt-2 text-[9px] font-mono text-muted border-t border-border pt-2">
                    ♥ {song.likes ?? 0}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Gallery */}
        <section className="mb-10" aria-labelledby="gallery-heading">
          <div className="border-t-2 border-ink pt-6 mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="gallery-heading" className="font-display text-xl sm:text-2xl uppercase font-bold">
                LIm lui
              </h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1">
                From TCSA archive
              </p>
            </div>
            <Link
              to="/gallery"
              className="font-mono text-[10px] uppercase tracking-widest text-accent hover:text-accent2 underline-offset-4 hover:underline"
            >
              Full gallery →
            </Link>
          </div>

          {galleryPreview.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-white/50 py-12 text-center font-mono text-xs text-muted">
              Open Gallery to add albums; previews appear here from your first Cloudinary folder.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {galleryPreview.map((img) => (
                <Link
                  key={img.id}
                  to="/gallery"
                  className="reveal group relative aspect-[4/3] overflow-hidden border border-ink/15 bg-border"
                >
                  <img
                    src={img.url}
                    alt={img.caption || ''}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                  {img.caption && (
                    <span className="absolute bottom-0 left-0 right-0 bg-ink/75 text-paper text-[8px] font-mono uppercase tracking-wider px-2 py-1 line-clamp-1">
                      {img.caption}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footnote */}
        <aside
          className="reveal border-t-4 border-double border-ink pt-6 mt-4"
          aria-label="Editor’s footnote"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
            Editor&apos;s note
          </p>
          <p className="font-display text-base sm:text-lg italic leading-relaxed text-ink max-w-3xl">
            This edition gathers fresh reporting, long reads, verse set to music, and images from
            the field. For corrections or tips, we welcome a line via{' '}
            <Link to="/contact" className="text-accent underline-offset-2 hover:underline not-italic">
              Contact
            </Link>
            .
          </p>
          <p className="mt-4 font-mono text-[9px] text-muted">
            * Salbuu is published in the spirit of the reading room — take your time with each page.
          </p>
        </aside>
      </div>
    </main>
  )
}
