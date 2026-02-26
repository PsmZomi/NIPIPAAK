import { useEffect } from "react";
import { Link } from "react-router-dom";
import { posts } from "../data/content";
import { useReveal } from "../components/useReveal";

export default function NewsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useReveal();

  return (
    <main className="pt-[82px] bg-white">

      {/* Hero */}
      <div className="border-b border-zinc-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4">
            Latest Updates
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            News & Stories
          </h1>
        </div>
      </div>

      {/* News Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {posts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className={`group reveal d${i + 1}`}
            >
              <div className="overflow-hidden bg-white border border-zinc-200 hover:shadow-lg transition-all duration-300">

                {/* Image Upload Support */}
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className={`h-56 bg-gradient-to-br ${post.gradient} flex items-center justify-center text-5xl`}
                  >
                    {post.emoji}
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {post.category}
                  </span>

                  <h2 className="mt-3 text-xl font-bold leading-snug group-hover:text-black transition-colors">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-sm text-zinc-600 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="mt-4 text-xs uppercase tracking-wider text-zinc-400">
                    {post.date} • {post.readTime}
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