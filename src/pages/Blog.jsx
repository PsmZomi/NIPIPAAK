import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { categories } from '../data/content'
import { useReveal } from '../components/useReveal'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [dbPosts, setDbPosts] = useState([])
  const { user } = useAuth()

  const activeCat = searchParams.get('cat') || 'All'

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useReveal()

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbPosts(fetched);
    }, (error) => {
      console.warn("Firestore might not be configured yet:", error.message);
    });
    return () => unsubscribe();
  }, [])

  // All posts come from Firestore now
  const allPosts = dbPosts;

  const filtered = allPosts.filter(p => {
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
    <main className="pt-[130px] lg:pt-[115px] min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Page header - kept elegant but slightly refined */}
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


      {/* Main content - more balanced spacing */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-12 lg:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-6xl mb-6">🔍</p>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              No stories found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Try a different category or search term.
            </p>
          </div>
        ) : (
          <>
            {/* Featured + sidebar - image left, content right for featured */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 mb-16">
              {/* Featured post: balanced left image + right text */}
              <div className="lg:col-span-2">
                <Link
                  to={`/blog/${filtered[0].slug}`}
                  className="group block reveal d1 overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 bg-white dark:bg-gray-900"
                >
                  <div className="lg:flex">
                    {/* Image on left - reduced size */}
                    <div className="lg:w-1/2 flex-shrink-0 bg-gray-100 flex items-center justify-center relative">
                      {filtered[0].image ? (
                        <div className="relative aspect-video lg:aspect-[4/3] w-full overflow-hidden">
                          <img
                            src={filtered[0].image}
                            alt={filtered[0].title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:from-transparent lg:via-transparent lg:to-transparent" />
                        </div>
                      ) : (
                        <div className={`h-full w-full min-h-[250px] bg-gradient-to-br ${filtered[0].gradient || 'from-gray-800 to-gray-900'} flex items-center justify-center text-5xl`}>
                          {filtered[0].emoji || '📝'}
                        </div>
                      )}
                    </div>

                    {/* Text content on right */}
                    <div className="p-6 lg:p-8 lg:w-1/2 flex flex-col justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-600/90 text-white rounded-full mb-4">
                          {filtered[0].category}
                        </span>
                        <h2
                          className="text-3xl lg:text-4xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-4"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {filtered[0].title}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed line-clamp-4 mb-6">
                          {filtered[0].excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-mono mt-auto">
                        <span>{filtered[0].author}</span>
                        <span>·</span>
                        <span>{filtered[0].date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Sidebar: compact recent posts */}
              <div className="flex flex-col gap-8">
                {filtered.slice(1, 4).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    className={`group flex gap-4 reveal d${i + 2} pb-6 ${i < 2 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${p.gradient || 'from-gray-800 to-gray-900'} flex items-center justify-center text-xl`}>
                          {p.emoji || '📝'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full mb-2">
                        {p.category}
                      </span>
                      <h3
                        className="text-base font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {p.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                        {p.author} · {p.readTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Remaining posts - cleaner grid */}
            {filtered.length > 4 && (
              <div className="mt-16">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    More Stories
                  </h2>
                  <div className="w-12 h-1 bg-blue-600 mx-auto mt-4 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.slice(4).map((p, i) => (
                    <Link
                      key={p.id}
                      to={`/blog/${p.slug}`}
                      className={`group reveal d${(i % 6) + 1} block bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100 flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${p.gradient || 'from-gray-800 to-gray-900'} flex items-center justify-center text-4xl`}>
                            {p.emoji || '📝'}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full mb-3">
                          {p.category}
                        </span>
                        <h3
                          className="text-xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {p.author} · {p.date}
                        </p>
                      </div>
                    </Link>
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