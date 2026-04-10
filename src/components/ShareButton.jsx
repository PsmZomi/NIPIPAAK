import { useState } from 'react';

const ShareButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = window.location.href;
  const currentTitle = document.title;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: '📋',
      action: async () => {
        try {
          await navigator.clipboard.writeText(currentUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(currentTitle)}`
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(`${currentTitle} ${currentUrl}`)}`
    }
  ];

  const handleShare = (option) => {
    if (option.action) {
      option.action();
    } else if (option.url) {
      window.open(option.url, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <div className="relative">
        {/* Share Options Dropdown */}
        {isOpen && (
          <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-lg border border-zinc-200 p-2 min-w-48 z-10">
            {shareOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleShare(option)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-green-300 rounded-md transition-colors"
              >
                <span className="text-lg">{option.icon}</span>
                <span>{option.name}</span>
                {option.name === 'Copy Link' && copied && (
                  <span className="text-green-600 text-xs ml-auto">Copied!</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Share Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm font-medium"
          aria-label="Share this page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
};

export default ShareButton;