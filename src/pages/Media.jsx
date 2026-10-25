import { useState, useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import MediaEmbed from '../components/MediaEmbed'
import { parseMediaLink, fetchMediaMeta } from '../utils/mediaLink'
import { collection, query, orderBy, onSnapshot, where, getDocs, addDoc, updateDoc, increment, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import 'react-quill/dist/quill.snow.css'

const LOGIN_TO_CONTRIBUTE_MSG = 'Please log in to contribute.'

export default function Media() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [dbMedia, setDbMedia] = useState([])
  const { user } = useAuth()

  // Detail view states
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(slug ? true : false)
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [metaById, setMetaById] = useState({})
  const [detailMeta, setDetailMeta] = useState(null)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  useReveal()

  // Fetch media detail if slug exists
  useEffect(() => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setItem(null)

    const searchFirestore = async () => {
      try {
        const mediaQ = query(collection(db, 'songs'), where('slug', '==', slug))
        const mediaSnap = await getDocs(mediaQ)
        if (!mediaSnap.empty) {
          const found = { id: mediaSnap.docs[0].id, ...mediaSnap.docs[0].data() }
          setItem(found)
          setLoading(false)
          return
        }

        setItem(null)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching media:', err)
        setItem(null)
        setLoading(false)
      }
    }

    searchFirestore()
  }, [slug])

  // Load comments and likes
  useEffect(() => {
    if (!item?.id) return
    loadComments()
  }, [item?.id])

  // Older link entries saved without a title get their real title/date resolved on the fly.
  useEffect(() => {
    const targets = dbMedia.filter((m) => m.link && !String(m.title || '').trim())
    if (!targets.length) return undefined

    let cancelled = false
    Promise.all(
      targets.map(async (m) => [m.id, await fetchMediaMeta(m.link)]),
    ).then((resolved) => {
      if (cancelled) return
      setMetaById((prev) => {
        const next = { ...prev }
        for (const [id, meta] of resolved) next[id] = meta
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [dbMedia])

  // Same resolution for the entry currently being viewed.
  useEffect(() => {
    if (!item?.link || String(item.title || '').trim()) {
      setDetailMeta(null)
      return undefined
    }

    let cancelled = false
    fetchMediaMeta(item.link).then((meta) => {
      if (!cancelled) setDetailMeta(meta)
    })

    return () => {
      cancelled = true
    }
  }, [item?.id, item?.link, item?.title])

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, 'songs', item.id, 'comments')
      const q = query(commentsRef)
      const snapshot = await getDocs(q)
      const loadedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setComments(loadedComments)
      setLikes(item.likes || 0)
      setIsLiked(user && item.likedBy?.includes(user.uid))
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like media')
      return
    }
    try {
      const mediaRef = doc(db, 'songs', item.id)
      if (isLiked) {
        const newLikedBy = (item.likedBy || []).filter(id => id !== user.uid)
        await updateDoc(mediaRef, {
          likes: increment(-1),
          likedBy: newLikedBy
        })
        setLikes(prev => Math.max(0, prev - 1))
        setIsLiked(false)
      } else {
        await updateDoc(mediaRef, {
          likes: increment(1),
          likedBy: [...(item.likedBy || []), user.uid]
        })
        setLikes(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to comment')
      return
    }
    if (!newComment.trim()) return

    setCommentsLoading(true)
    try {
      const commentsRef = collection(db, 'songs', item.id, 'comments')
      const comment = {
        author: user.displayName || user.email || 'Anonymous',
        text: newComment,
        timestamp: new Date(),
        uid: user.uid
      }
      await addDoc(commentsRef, comment)
      setComments([...comments, { id: Date.now().toString(), ...comment }])
      setNewComment('')
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Failed to add comment')
    } finally {
      setCommentsLoading(false)
    }
  }

  // Fetch media list
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbMedia(fetched);
      setListLoading(false)
    }, (error) => {
      console.warn("Firestore might not be configured yet:", error.message);
      setListLoading(false)
    });
    return () => unsubscribe();
  }, [])

  // Detail view rendering
  if (slug && loading) {
    return (
      <main className="pt-[64px] sm:pt-[72px] lg:pt-[89px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm font-mono">Loading media...</p>
        </div>
      </main>
    )
  }

  if (slug && !loading && !item) return <Navigate to="/media" replace />

  // Show detail view if slug exists
  if (slug && item) {
    const info = item.link ? parseMediaLink(item.link) : null
    const metaLabel = item.artist ? 'Lai Gelh' : 'Source'
    const metaValue = item.artist || detailMeta?.author || info?.label || ''
    const displayTitle =
      item.title?.trim() || detailMeta?.title?.trim() || 'Untitled media'
    const displayDate = detailMeta?.date || item.date

    return (
      <main className="pt-[24px] sm:pt-[72px] lg:pt-[105px]">
        {/* Media content — embedded video/link when present, lyrics for legacy entries */}
        <article className={`mx-auto px-5 lg:px-0 py-4 lg:py-5 ${item.link ? 'max-w-5xl' : 'max-w-2xl'}`}>
          {item.link ? (
            <>
              <MediaEmbed
                link={item.link}
                title={displayTitle}
                className="rounded-lg overflow-hidden shadow-lg border border-gray-200"
              />
              <h1
                className="mt-6 text-md lg:text-3xl font-bold leading-tight text-ink"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}
              >
                {displayTitle}
              </h1>
              {item.caption ? (
                <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-line">
                  {item.caption}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h1
                className="mb-6 text-2xl sm:text-3xl font-bold leading-tight text-ink"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}
              >
                {displayTitle}
              </h1>
              <div className="prose-article">
                <div className="article-quill-readonly ql-song-lyrics ql-snow">
                  <div className="ql-container ql-snow rounded-lg bg-white">
                    <div className="ql-editor">
                      {Array.isArray(item.lyrics)
                        ? item.lyrics.join('\n')
                        : String(item.lyrics ?? '')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Source & Released + back link — below the title/caption */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 mt-6 pt-4 border-t border-ink/15">
            <div className="flex items-center gap-3 sm:gap-10 text-muted text-xs font-mono">
              {metaValue ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-muted">{metaLabel}</span>
                    <span className="text-ink font-bold tracking-tight text-sm">
                      {metaValue}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-ink/15" />
                </>
              ) : null}

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted">Released</span>
                <span className="text-ink/80 text-sm font-medium">
                  {displayDate}
                </span>
              </div>
            </div>

            <Link
              to="/media"
              className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-200 text-ink hover:border-green-400 hover:text-green-600 transition-colors"
            >
              ← All Media
            </Link>
          </div>

          {(item.artist || (user?.uid && item.uid === user.uid)) ? (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mt-8 pt-6 border-t border-gray-200">
              {item.artist ? (
                <div className="text-left min-w-0">
                  <p className="section-label mb-2">Lai Gelh</p>
                  <h4 className="font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {item.artist}
                  </h4>
                </div>
              ) : (
                <div />
              )}
              <div className="flex justify-end sm:justify-end shrink-0 self-end sm:self-auto items-center gap-3">
                {user?.uid && item.uid === user.uid ? (
                  <Link
                    to={`/create-media/edit/${item.id}`}
                    className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border border-zinc-200 text-ink hover:border-green-400 hover:text-green-600 transition-colors"
                  >
                    Edit
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Likes and Comments Section */}
          <div className="mt-12 pt-8">
            {/* Like Button */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
              </button>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Comments ({comments.length})
              </h3>

              {/* Add Comment Form */}
              {user ? (
                <form onSubmit={handleAddComment} className="mb-8">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={commentsLoading || !newComment.trim()}
                    className="mt-3 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {commentsLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <p className="mb-8 text-gray-600">
                  <Link to="/login" className="text-green-600 hover:text-green-300 hover:underline transition-colors">Log in</Link> to comment
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Back link */}
        <section className="border-t border-border py-10">
          <div className="text-center">
            <Link to="/media" className="btn-ghost">
              ← Back to All Media
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const allMedia = dbMedia;

  const filtered = allMedia.filter(m => {
    const term = search.toLowerCase()
    return (
      String(m.title || '').toLowerCase().includes(term) ||
      String(m.artist || '').toLowerCase().includes(term) ||
      String(m.caption || '').toLowerCase().includes(term)
    )
  })

  return (
    <main className="pt-[64px] sm:pt-[72px] lg:pt-[89px] min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-gradient-to-br from-green-900 to-black text-white py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
            <div className="min-w-0">
              {/* <h1
                className="text-5xl lg:text-6xl font-extrabold leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}
              >
                All Media
              </h1> */}
              <p className="text-white/60 mb-4 uppercase tracking-widest text-sm font-medium">
                Huihlak Melmuh Tongsaan
              </p>
              <p className="text-lg text-white/70 max-w-3xl">
                Videos, performances, and shared links from our community.
              </p>
            </div>

            {user ? (
              <Link
                to="/create-media"
                className="self-start lg:self-auto shrink-0 bg-white text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 hover:text-green-300 transition-colors"
              >
                + Add Media
              </Link>
            ) : (
              <button
                type="button"
                className="self-start lg:self-auto shrink-0 hidden lg:inline-flex items-center justify-center bg-white text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 hover:text-green-300 transition-colors"
                onClick={() => {
                  window.alert(LOGIN_TO_CONTRIBUTE_MSG)
                  navigate('/login')
                }}
              >
                + Add Media
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-4">
        <input
          type="text"
          placeholder="Search media by title, source, or caption..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-4 lg:px-10 py-2 lg:py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-6xl mb-6">🎬</p>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              No media found
            </h2>
            <p className="text-gray-600 text-lg">
              Try a different search term or add the first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filtered.map((m) => {
              const info = m.link ? parseMediaLink(m.link) : null
              const meta = metaById[m.id]
              const cardTitle =
                m.title?.trim() || meta?.title?.trim() || 'Untitled media'
              const cardDate = meta?.date || m.date
              const subtitle = info
                ? (m.caption || meta?.author || info.label)
                : (m.artist || '')
              return (
                <Link key={m.id} to={m.slug ? `/media/${m.slug}` : '/media'} className="reveal group">
                  <article className="bg-white border hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                    <div className="relative overflow-hidden aspect-video flex items-center justify-center border-b border-gray-200">
                      {info?.thumbnailUrl ? (
                        <img
                          src={info.thumbnailUrl}
                          alt={cardTitle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-green-600 to-black w-full h-full flex items-center justify-center p-6">
                          {info ? (
                            <span className="text-6xl">▶</span>
                          ) : (
                            <div className="text-center">
                              <span className="text-6xl block mb-3">🎵</span>
                              <p className="text-xs font-mono text-green-200 line-clamp-2">
                                {m.artist || ''}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {info ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white text-xl pl-1">
                            ▶
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="p-2 flex flex-col flex-1">
                      <p className="font-mono text-[10px] text-gray-400 mb-2">{cardDate}</p>
                      <h3 className="font-serif text-md lg:text-xl italic text-gray-800 mb-2 group-hover:text-green-300 transition-colors line-clamp-2">
                        {cardTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">{subtitle}</p>

                      {/* Engagement Stats */}
                      <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono pt-3 border-t border-gray-100">
                        <span>❤️ {m.likes || 0}</span>
                        <span>💬 {m.comments?.length || 0}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
