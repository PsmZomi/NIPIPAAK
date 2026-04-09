import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link, Navigate } from 'react-router-dom'
import { categories } from '../data/content'
import { useReveal } from '../components/useReveal'
import PostCard from '../components/PostCard'
import ShareButton from '../components/ShareButton'
import { collection, query, orderBy, onSnapshot, where, getDocs, addDoc, updateDoc, increment, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function Blog() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [dbPosts, setDbPosts] = useState([])
  const { user } = useAuth()

  // Detail view states
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(slug ? true : false)
  const [related, setRelated] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  const activeCat = searchParams.get('cat') || 'All'

  useEffect(() => { window.scrollTo(0, 0) }, [slug])
  useReveal()

  // Fetch post detail if slug exists
  useEffect(() => {
    if (!slug) return
    
    const searchFirestore = async () => {
      try {
        const blogsQ = query(collection(db, 'blogs'), where('slug', '==', slug))
        const blogsSnap = await getDocs(blogsQ)
        if (!blogsSnap.empty) {
          const found = { id: blogsSnap.docs[0].id, type: 'blog', ...blogsSnap.docs[0].data() }
          setPost(found)
          setLoading(false)
          return
        }

        const newsQ = query(collection(db, 'news'), where('slug', '==', slug))
        const newsSnap = await getDocs(newsQ)
        if (!newsSnap.empty) {
          const found = { id: newsSnap.docs[0].id, type: 'news', ...newsSnap.docs[0].data() }
          setPost(found)
          setLoading(false)
          return
        }

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

  // Load comments and likes
  useEffect(() => {
    if (!post?.id || !post?.type) return
    loadComments()
  }, [post?.id, post?.type])

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, post.type === 'blog' ? 'blogs' : 'news', post.id, 'comments')
      const q = query(commentsRef)
      const snapshot = await getDocs(q)
      const loadedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setComments(loadedComments)
      setLikes(post.likes || 0)
      setIsLiked(user && post.likedBy?.includes(user.uid))
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like posts')
      return
    }
    try {
      const postRef = doc(db, post.type === 'blog' ? 'blogs' : 'news', post.id)
      if (isLiked) {
        const newLikedBy = (post.likedBy || []).filter(id => id !== user.uid)
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: newLikedBy
        })
        setLikes(prev => Math.max(0, prev - 1))
        setIsLiked(false)
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...(post.likedBy || []), user.uid]
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
      const commentsRef = collection(db, post.type === 'blog' ? 'blogs' : 'news', post.id, 'comments')
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

  // Fetch list posts
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbPosts(fetched);
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
          <p className="text-muted text-sm font-mono">Loading story...</p>
        </div>
      </main>
    )
  }

  if (slug && !post) return <Navigate to="/blog" replace />

  // Show detail view if slug exists
  if (slug && post) {
    return (
      <main className="pt-[146px] lg:pt-[131px]">
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
                <h1 
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-10 drop-shadow-lg"
                  style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.025em' }}
                >
                  {post.title}
                </h1>

                {/* Simplified Metadata: Writer & Date Only */}
                <div className="flex items-center gap-10 text-white/80 text-xs font-mono mt-auto pt-2 border-t border-white/10">
                  
                  {/* Column 1: The Writer */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">Writer</span>
                    <span className="text-white font-bold tracking-tight text-sm">
                      {post.authorData?.name || post.author || "Anonymous"}
                    </span>
                  </div>

                  {/* Elegant Vertical Divider */}
                  <div className="h-8 w-px bg-white/10" />

                  {/* Column 2: The Date */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">Dated</span>
                    <span className="text-white/90 text-sm font-medium">
                      {post.date}
                    </span>
                  </div>

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

          {/* Share button positioned at bottom right after article content */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <ShareButton />
          </div>

          {/* Author card */}
          <div className="mt-14 pt-8 border-t border-border flex gap-5 items-start">
            <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${post.gradient || 'from-gray-900 to-black'} rounded-full flex items-center justify-center text-2xl`}>
              👤
            </div>
            <div>
              <p className="section-label mb-1">Lai Gelh</p>
              <h4 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                {post.author}
              </h4>
            </div>
          </div>

          {/* Likes and Comments Section */}
          <div className="mt-12 pt-8 border-t border-border">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={commentsLoading || !newComment.trim()}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {commentsLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <p className="mb-8 text-gray-600">
                  <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to comment
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
            <Link to="/blog" className="btn-ghost">
              ← Back to All Stories
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const allPosts = dbPosts;

  const filtered = allPosts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <main className="pt-[146px] lg:pt-[131px] min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <p className="text-white/60 mb-4 uppercase tracking-widest text-sm font-medium">
            The Archive
          </p>
          <div className="flex flex-wrap items-center justify-between gap-6 mb-5">
            <h1
              className="text-5xl lg:text-6xl font-extrabold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}
            >
              All Stories
            </h1>
            {user && (
              <Link
                to="/create-post"
                className="bg-white text-black font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 transition-colors"
              >
                + Create New Post
              </Link>
            )}
          </div>
          <p className="text-lg text-white/70 max-w-3xl">
            Thoughtful essays, features, and reflections on culture, technology, photography, and living intentionally.
          </p>
        </div>
      </div>


      {/* Main content */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12 lg:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-6xl mb-6">🔍</p>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              No stories found
            </h2>
            <p className="text-gray-600 text-lg">
              Try a different category or search term.
            </p>
          </div>
        ) : (
          <>
            {/* Featured + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 mb-16">
              <div className="lg:col-span-2">
                <Link
                  to={`/blog/${filtered[0].slug}`}
                  className="group block reveal d1 overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 bg-white"
                >
                  <div className="lg:flex">
                    <div className="lg:w-1/2 flex-shrink-0 bg-gray-100 flex items-center justify-center relative">
                      {filtered[0].image ? (
                        <div className="relative aspect-video lg:aspect-[4/3] w-full overflow-hidden">
                          <img
                            src={filtered[0].image}
                            alt={filtered[0].title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className={`h-full w-full min-h-[250px] bg-gradient-to-br ${filtered[0].gradient } flex items-center justify-center text-5xl`}>
                          {filtered[0].emoji || '📝'}
                        </div>
                      )}
                    </div>

                    <div className="p-6 lg:p-8 lg:w-1/2 flex flex-col justify-between">
                      <div>
                        <h2
                          className="text-3xl lg:text-4xl font-bold leading-tight group-hover:text-blue-600 transition-colors mb-4"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {filtered[0].title}
                        </h2>
                        <p className="text-gray-700 text-base leading-relaxed line-clamp-4 mb-6">
                          {filtered[0].excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-mono mt-auto">
                        <span>{filtered[0].author}</span>
                        <span>·</span>
                        <span>{filtered[0].date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-8">
                {filtered.slice(1, 4).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    className={`group flex gap-4 reveal d${i + 2} pb-6 ${i < 2 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${p.gradient || 'from-gray-200 to-gray-300'} flex items-center justify-center text-xl`}>
                          {p.emoji || '📝'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {p.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {p.author} · {p.readTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Remaining posts */}
            {filtered.length > 4 && (
              <div className="mt-16">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                    More Stories
                  </h2>
                  <div className="w-12 h-1 bg-blue-600 mx-auto mt-4 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.slice(4).map((p, i) => (
                    <PostCard key={p.id} post={p} index={i % 6} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}