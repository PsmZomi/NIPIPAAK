import { Link } from 'react-router-dom'

export default function PostCard({ post, index = 0, size = 'default' }) {
  const delayClass = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'][index % 6]

  // Fallback image in case post.image fails to load
  const fallbackImage = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&fit=crop&q=80'

  if (size === 'large') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className={`reveal ${delayClass} card-lift group block`}
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-md">
          {post.image ? (
            <img
              src={post.image || fallbackImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.src = fallbackImage
                e.target.alt = 'Fallback image'
              }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br ${post.gradient || 'from-gray-800 to-gray-900'} transition-transform duration-700 group-hover:scale-105`}>
              {post.emoji || '📰'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <span className="tag border-white/50 text-white/90 text-[10px] bg-black/40 backdrop-blur-sm px-3 py-1 rounded">
              {post.category}
            </span>
            <h2
              className="text-white text-2xl lg:text-3xl font-bold mt-3 leading-tight group-hover:text-blue-300 transition-colors"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {post.title}
            </h2>
          </div>
        </div>
        <div className="pt-5">
          <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-muted">
            <span className="font-medium text-ink dark:text-gray-200">{post.author}</span>
            <span className="text-muted/50">·</span>
            <span>{post.date}</span>
          </div>
        </div>
      </Link>
    )
  }

  // Default (smaller card) size
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`reveal ${delayClass} card-lift group flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors`}
    >
      {/* Thumbnail - now real image or gradient fallback */}
      <div className="flex-shrink-0 w-24 h-24 lg:w-28 lg:h-28 rounded-md overflow-hidden shadow-sm bg-zinc-100 flex items-center justify-center">
        {post.image ? (
          <img
            src={post.image || fallbackImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = fallbackImage
              e.target.alt = 'Fallback image'
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br ${post.gradient || 'from-gray-800 to-gray-900'} transition-transform duration-500 group-hover:scale-105`}>
            {post.emoji || '📰'}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="tag inline-block mb-1.5">{post.category}</span>
        <h3
          className="text-base font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-muted">
          <span>{post.author}</span>
          <span className="opacity-50">·</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  )
}