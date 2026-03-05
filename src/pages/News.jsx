import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { posts as staticPosts } from "../data/content";
import { useReveal } from "../components/useReveal";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function NewsPage() {
  const [dbNews, setDbNews] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useReveal();

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbNews(fetched);
    }, (error) => {
      console.warn("Firestore might not be configured yet:", error.message);
    });
    return () => unsubscribe();
  }, [])

  // Combine DB news with static posts (or filter static if they hold specific news category)
  // Currently, the static content doesn't have a strict 'news' property, we'll just use all static for demo
  const allPosts = [...dbNews, ...staticPosts]

  return (
    <main className="pt-[130px] lg:pt-[85px] bg-white min-h-screen">

      {/* Hero */}
      <div className="border-b border-zinc-200 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4">
              Latest Updates
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              News & Stories
            </h1>
          </div>
          {user && (
            <Link
              to="/create-post"
              className="bg-black text-white font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
            >
              + Create News Update
            </Link>
          )}
        </div>
      </div>

      {/* News Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {allPosts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className={`group reveal d${(i % 6) + 1}`}
            >
              <div className="overflow-hidden bg-white border border-zinc-200 hover:shadow-lg transition-all duration-300 rounded-xl h-full flex flex-col">

                {/* Image Upload Support */}
                <div className="h-56 bg-zinc-100 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${post.gradient || 'from-gray-800 to-gray-900'} flex items-center justify-center text-5xl`}
                    >
                      {post.emoji || '📰'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {post.category}
                  </span>

                  <h2 className="mt-3 text-xl font-bold leading-snug group-hover:text-black transition-colors">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-sm text-zinc-600 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto pt-4 text-xs uppercase tracking-wider text-zinc-400">
                    {post.date} • {post.author}
                  </div>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </section>

    </main>
  );
}