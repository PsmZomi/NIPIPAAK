import { Link } from "react-router-dom";

export default function Newsletter() {
  const newsItems = [
    {
      id: 1,
      headline: "Pi Network Sets Urgent March 1 Deadline for Node Upgrade to v19.9",
      category: "Blockchain Upgrade",
      date: "2026-02-26",
      displayDate: "Feb 26, 2026",
      source: "Pi Core Team / CryptoPotato / Phemex",
      image: "https://blog.pintu.co.id/wp-content/uploads/2025/06/pi-network.jpg", // Pi Network upgrade / blockchain visual
      teaser: "All Mainnet nodes must upgrade from v19.6 to v19.9 by March 1, 2026 (extended from Feb 27 for stability), or risk disconnection. This is Step 2 in phased protocol improvements for better sync, stability, and prep for v20+. Node operators: upgrade immediately via minepi.com/pi-node.",
      urgent: true,
    },
    {
      id: 2,
      headline: "Sidra Chain Transitions to Faster Off-Chain Mining System",
      category: "Altcoin Update",
      date: "2026-02-26",
      displayDate: "Feb 26, 2026",
      source: "Sidra Official / Community Channels",
      image: "https://asicmarketplace.com/wp-content/uploads/2024/02/Working-Mechanism-of-Bitcoin-Mining.webp", // Crypto mining upgrade abstract
      teaser: "Legacy Alpha Chain mining fully replaced with efficient off-chain model. Temporary missing SDA tokens in wallets (from transition) will be restored in upcoming update. Aims to boost efficiency ahead of Mainnet, DEX, and Q1 2026 features.",
      urgent: false,
    },
  ];

  return (
    <section className="border-b border-gray-200 dark:border-gray-800 py-2 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Featured News
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Updated {new Date().toLocaleDateString()} • Pi & Sidra Highlights
          </p>
        </header>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {newsItems.map((item) => (
            <article
              key={item.id}
              className={`group relative bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border ${item.urgent ? 'border-red-500/50' : 'border-gray-200 dark:border-gray-800'} overflow-hidden flex flex-col h-full`}
            >
              <div className="md:flex flex-col h-full">
                {/* Image on top/left (stacks on mobile, left on md+) */}
                <div className="md:w-full flex-shrink-0">
                  <Link to={`/news/${item.id}`} className="block h-full">
                    <img
                      src={item.image}
                      alt={item.headline}
                      className="w-full h-56 md:h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col flex-grow relative">
                  {item.urgent && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 animate-pulse">
                      URGENT
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • <time dateTime={item.date}>{item.displayDate}</time> • {item.source}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link to={`/news/${item.id}`}>{item.headline}</Link>
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6 flex-grow">
                    {item.teaser}
                  </p>

                  <Link
                    to={`/news/${item.id}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center mt-auto"
                  >
                    Read full update →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}