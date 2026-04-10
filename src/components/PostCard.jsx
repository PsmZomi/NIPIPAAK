import { Link } from 'react-router-dom';

export default function PostCard({ post, index }) {
  return (
    <Link 
      to={`/blog/${post.slug}`} 
      className={`reveal d${index + 1} group block relative bg-[#fffdfa] border-l-[10px] border-l-zinc-200 border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1`}
    >
      {/* 1. THE "SPINE" EFFECT (The left border makes it look like a book) */}
      
      <div className="p-2 flex flex-col h-full">
        {/* 2. THE TOP MARGIN (Library Card Header) */}
        <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-4 mb-6">
          <div className="space-y-1">
          </div>
        </div>

        {/* 3. THE BOOK COVER (Image) */}
        <div className="aspect-[16/10] overflow-hidden rounded-sm mb-6 grayscale-[0.6] group-hover:grayscale-0 transition-all duration-700">
          {post.image ? (
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" 
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-4xl opacity-20 italic font-serif">
              {post.emoji || '📖'}
            </div>
          )}
        </div>

        {/* 4. THE ENTRY TITLE */}
        <h3 className="font-serif text-2xl italic leading-tight mb-4 group-hover:text-green-300 transition-colors">
          {post.title}
        </h3>

        {/* 5. THE CHECKOUT TABLE (Lai Gelh & Date) */}
        <div className="mt-8 border-t border-zinc-100 pt-4">
          <table className="w-full font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            <thead>
              <tr className="text-left opacity-50 border-b border-zinc-50">
                <th className="pb-2 font-normal">Gelh Ni</th>
                <th className="pb-2 font-normal text-center"> Lai Gelh</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pt-1 italic text-zinc-400">{post.date}</td>
                <td className="pt-1 text-center font-normal text-zinc-700 group-hover:text-green-300">
                  {post.author?.split(' ')[0]} 
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SUBTLE TEXTURE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
    </Link>
  );
}