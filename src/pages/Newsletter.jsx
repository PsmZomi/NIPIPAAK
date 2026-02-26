import { Link } from "react-router-dom";

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "The Future of Digital Journalism in 2026",
      category: "Technology",
      date: "2026-02-26",
      displayDate: "Feb 26, 2026",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
      excerpt: "Digital journalism is evolving rapidly with AI-powered storytelling, independent media platforms, and real-time distribution reshaping how readers consume news.",
    },
    {
      id: 2,
      title: "The Rise of Media in the Digital Age",
      category: "Culture",
      date: "2026-03-15",
      displayDate: "Mar 15, 2026",
      image: "https://media-assets.hyperinvento.com/companies/3a5f1158-d966-4bf9-8fbb-11e3b361b94b/products/39fd6e0a-7ce5-4a37-baf4-df583ad20f16/featureds/images/5b39d78e7c8c4e11a23833735140ec26-product-featured-lg.jpg",
      excerpt: "Independent media outlets are gaining traction with readers seeking alternative perspectives and deeper storytelling.",
    },
  ];

  return (
    <main className="pt-[100px] bg-[#fafafa] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 pb-24">
        
        {/* <div className="mb-16 border-l-4 border-black pl-6">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Latest Articles
          </h1>
        </div> */}

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-2">
          {articles.map((article) => (
            <article key={article.id} className="group border-b border-gray-200 pb-10">
              
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                <Link to={`/blog/${article.id}`}>{article.title}</Link>
              </h2>

              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mt-3 mb-6">
                {article.category} <span className="mx-2 text-gray-300">|</span> 
                <time dateTime={article.date}>{article.displayDate}</time>
              </p>

              <div className="text-[16px] leading-relaxed text-gray-700 font-serif">
                <Link to={`/blog/${article.id}`}>
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-32 sm:w-40 aspect-square float-left mr-5 mb-2 rounded-sm object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-300 shadow-sm"
                  />
                </Link>

                <p className="line-clamp-4">
                  {article.excerpt}
                </p>

                <div className="clear-both" />

                <Link
                  to={`/blog/${article.id}`}
                  className="inline-block mt-4 text-sm font-bold text-black border-b-2 border-transparent hover:border-black transition-all"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}