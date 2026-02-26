import { Link } from 'react-router-dom'

export default function PostCard({ post, index = 0, size = 'default' }) {
  const delayClass = ['d1','d2','d3','d4','d5','d6'][index % 6]

  if (size === 'large') {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className={`reveal ${delayClass} card-lift group block`}
      >
        <div className={`relative aspect-[16/9] bg-gradient-to-br ${post.gradient} overflow-hidden flex items-center justify-center`}>
          <span className="text-7xl">{post.emoji}</span>
          <div className="absolute inset-0 img-overlay" />
          <div className="absolute bottom-5 left-5 right-5">
            <span className="tag border-white/50 text-white/80 text-[10px]">{post.category}</span>
            <h2 className="text-white text-2xl lg:text-3xl font-bold mt-2 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {post.title}
            </h2>
          </div>
        </div>
        <div className="pt-4">
          <p className="text-muted text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-mono text-muted">{post.author}</span>
            <span className="text-muted/40">·</span>
            <span className="text-xs font-mono text-muted">{post.date}</span>
            <span className="text-muted/40">·</span>
            <span className="text-xs font-mono text-muted">{post.readTime}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`reveal ${delayClass} card-lift group flex gap-4`}
    >
      {/* Thumbnail */}
      <div className={`flex-shrink-0 w-24 h-24 lg:w-28 lg:h-28 bg-gradient-to-br ${post.gradient} flex items-center justify-center overflow-hidden`}>
        <span className="text-4xl">{post.emoji}</span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="tag">{post.category}</span>
        <h3 className="mt-1.5 text-base font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-mono text-muted">{post.author}</span>
          <span className="text-muted/40 text-xs">·</span>
          <span className="text-[11px] font-mono text-muted">{post.readTime}</span>
        </div>
      </div>
    </Link>
  )
}
