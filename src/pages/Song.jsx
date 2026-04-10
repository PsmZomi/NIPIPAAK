import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useReveal } from '../components/useReveal'
import ShareButton from '../components/ShareButton'
import { collection, query, orderBy, onSnapshot, where, getDocs, addDoc, updateDoc, increment, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import 'react-quill/dist/quill.snow.css'

const LOGIN_TO_CONTRIBUTE_MSG = 'Please log in to contribute.'

export default function Song() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [dbSongs, setDbSongs] = useState([])
  const { user } = useAuth()

  // Detail view states
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(slug ? true : false)
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  useReveal()

  // Fetch song detail if slug exists
  useEffect(() => {
    if (!slug) {
      setSong(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setSong(null)

    const searchFirestore = async () => {
      try {
        const songsQ = query(collection(db, 'songs'), where('slug', '==', slug))
        const songsSnap = await getDocs(songsQ)
        if (!songsSnap.empty) {
          const found = { id: songsSnap.docs[0].id, ...songsSnap.docs[0].data() }
          setSong(found)
          setLoading(false)
          return
        }

        setSong(null)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching song:', err)
        setSong(null)
        setLoading(false)
      }
    }

    searchFirestore()
  }, [slug])

  // Load comments and likes
  useEffect(() => {
    if (!song?.id) return
    loadComments()
  }, [song?.id])

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, 'songs', song.id, 'comments')
      const q = query(commentsRef)
      const snapshot = await getDocs(q)
      const loadedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setComments(loadedComments)
      setLikes(song.likes || 0)
      setIsLiked(user && song.likedBy?.includes(user.uid))
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like songs')
      return
    }
    try {
      const songRef = doc(db, 'songs', song.id)
      if (isLiked) {
        const newLikedBy = (song.likedBy || []).filter(id => id !== user.uid)
        await updateDoc(songRef, {
          likes: increment(-1),
          likedBy: newLikedBy
        })
        setLikes(prev => Math.max(0, prev - 1))
        setIsLiked(false)
      } else {
        await updateDoc(songRef, {
          likes: increment(1),
          likedBy: [...(song.likedBy || []), user.uid]
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
      const commentsRef = collection(db, 'songs', song.id, 'comments')
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

  // Fetch list songs
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbSongs(fetched);
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
      <main className="pt-[146px] lg:pt-[131px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm font-mono">Loading song...</p>
        </div>
      </main>
    )
  }

  if (slug && !loading && !song) return <Navigate to="/songs" replace />

  // Show detail view if slug exists
  if (slug && song) {
    return (
      <main className="pt-[146px] lg:pt-[131px]">
        {/* Song Hero */}
        <div className="bg-gradient-to-br from-green-900 to-black py-4 lg:py-4">
          <div className="max-w-7xl mx-auto px-5 lg:px-10">
            <div className="text-center">
              <h1 
                className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-6 drop-shadow-lg"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.025em' }}
              >
                {song.title}
              </h1>
              
              {/* Metadata: Lai Gelh & Date */}
              <div className="flex items-center justify-center gap-10 text-white/80 text-xs font-mono">
                <div className="flex flex-col gap-1 text-center">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">Lai Gelh</span>
                  <span className="text-white font-bold tracking-tight text-sm">
                    {song.artist || "Anonymous"}
                  </span>
                </div>

                <div className="h-8 w-px bg-white/10" />

                <div className="flex flex-col gap-1 text-center">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">Released</span>
                  <span className="text-white/90 text-sm font-medium">
                    {song.date}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Song Lyrics/Content — same Quill snow shell as articles (plain text, line breaks preserved) */}
        <article className="max-w-2xl mx-auto px-5 lg:px-0 py-14">
          <div className="prose-article">
            <div className="article-quill-readonly ql-song-lyrics ql-snow">
              <div className="ql-container ql-snow rounded-lg bg-white">
                <div className="ql-editor">
                  {Array.isArray(song.lyrics)
                    ? song.lyrics.join('\n')
                    : String(song.lyrics ?? '')}
                </div>
              </div>
            </div>
          </div>

          {/* Lai Gelh (left) + Share (right) */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mt-8 pt-6 border-t border-gray-200">
            <div className="text-left min-w-0">
              <p className="section-label mb-2">Lai Gelh</p>
              <h4 className="font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                {song.artist || "Anonymous"}
              </h4>
            </div>
            <div className="flex justify-end sm:justify-end shrink-0 self-end sm:self-auto">
              <ShareButton />
            </div>
          </div>

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
            <Link to="/songs" className="btn-ghost">
              ← Back to All Songs
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const allSongs = dbSongs;

  const filtered = allSongs.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <main className="pt-[146px] lg:pt-[131px] min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-gradient-to-br from-green-900 to-black text-white py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <p className="text-white/60 mb-4 uppercase tracking-widest text-sm font-medium">
            The Songbook
          </p>
          <div className="flex flex-wrap items-center justify-between gap-6 mb-5">
            <h1
              className="text-5xl lg:text-6xl font-extrabold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}
            >
              All Songs
            </h1>
            {user ? (
              <Link
                to="/create-song"
                className="bg-white text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 hover:text-green-300 transition-colors"
              >
                + Laa Thak
              </Link>
            ) : (
              <button
                type="button"
                className="hidden lg:inline-flex items-center justify-center bg-white text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 hover:text-green-300 transition-colors"
                onClick={() => {
                  window.alert(LOGIN_TO_CONTRIBUTE_MSG)
                  navigate('/login')
                }}
              >
                + Laa Thak
              </button>
            )}
          </div>
          <p className="text-lg text-white/70 max-w-3xl">
            A collection of melodies, lyrics, and musical expressions from our community.
          </p>
        </div>
      </div>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-8">
        <input
          type="text"
          placeholder="Search songs by title or artist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12 lg:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-6xl mb-6">🎵</p>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              No songs found
            </h2>
            <p className="text-gray-600 text-lg">
              Try a different search term or create the first song!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((s, i) => (
              <Link key={s.id} to={`/songs/${s.slug}`} className="reveal group">
                <article className="bg-white border  hover:shadow-lg transition-all duration-500 h-full flex flex-col rounded-lg overflow-hidden">
                  <div className="overflow-hidden bg-gradient-to-br from-green-600 to-black aspect-square flex items-center justify-center p-6">
                    <div className="text-center">
                      <span className="text-6xl block mb-3">🎵</span>
                      <p className="text-xs font-mono text-green-200 line-clamp-2">
                        {s.artist}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="font-mono text-[10px] text-gray-400 mb-2">{s.date}</p>
                    <h3 className="font-serif text-xl italic text-gray-800 mb-2 group-hover:text-green-300 transition-colors line-clamp-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{s.artist}</p>
                    
                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono pt-3 border-t border-gray-100">
                      <span>❤️ {s.likes || 0}</span>
                      <span>💬 {s.comments?.length || 0}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
