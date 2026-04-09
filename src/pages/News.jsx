import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { posts as staticPosts } from "../data/content";
import { useReveal } from "../components/useReveal";
import PostCard from "../components/PostCard";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const LOGIN_TO_CONTRIBUTE_MSG = 'Please log in to contribute.'

export default function NewsPage() {
  const [dbNews, setDbNews] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

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
    <main className="pt-[146px] lg:pt-[101px] bg-paper min-h-screen">

      {/* Hero */}
      <div className="border-b border-zinc-200 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-6 relative z-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500 mb-4">
              Latest Updates
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              News & Stories
            </h1>
          </div>
          {user ? (
            <Link
              to="/create-post"
              className="inline-flex items-center justify-center bg-black text-white font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors relative z-10"
            >
              + Thuthak
            </Link>
          ) : (
            <button
              type="button"
              className="hidden lg:inline-flex items-center justify-center bg-black text-white font-bold py-3 px-6 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors cursor-pointer relative z-10"
              onClick={() => {
                window.alert(LOGIN_TO_CONTRIBUTE_MSG)
                navigate('/login')
              }}
            >
              + Thuthak
            </button>
          )}
        </div>
      </div>

      {/* News Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {allPosts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i % 6} />
          ))}
        </div>
      </section>

    </main>
  );
}