import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const getOptimizedUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
};

export default function HeroBanner() {
    const [banners, setBanners] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const [current, setCurrent] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const fetchedBanners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBanners(fetchedBanners);
        }, (err) => console.warn("Firestore Error:", err));
        
        return () => unsub();
    }, []);

    useEffect(() => {
        if (banners.length <= 1 || isPaused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000); // Slightly longer duration for better readability
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [banners.length, isPaused]);

    if (banners.length === 0) return null;

    const isSingle = banners.length === 1;

    return (
        <div className="bg-white border-b border-zinc-100 w-full relative overflow-hidden -mt-[105px] lg:-mt-[110px] pt-[105px] lg:pt-[140px]">
            <div
                className="relative w-full h-[120px] md:h-[180px] lg:h-[240px] overflow-hidden group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {banners.map((b, i) => {
                    const isActive = i === current;
                    const optimizedImage = getOptimizedUrl(b.image);

                    return (
                        <div 
                            key={b.id} 
                            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out ${
                                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-110'
                            }`}
                        >
                            {/* The Link/Slide Wrapper */}
                            <div className="relative w-full h-full bg-zinc-900">
                                {b.link ? (
                                    <a href={b.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                        <BannerContent b={b} img={optimizedImage} />
                                    </a>
                                ) : (
                                    <BannerContent b={b} img={optimizedImage} />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Bottom Shadow Gradient (Makes dots/labels pop) */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent z-20 pointer-events-none" />

                {/* Navigation Dots */}
                {!isSingle && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setCurrent(i); setIsPaused(true); }}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    i === current 
                                    ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Status Indicator */}
                {isPaused && !isSingle && (
                    <div className="absolute top-4 right-4 z-30 text-[10px] bg-white/10 text-white border border-white/20 px-2 py-1 rounded-md backdrop-blur-md uppercase tracking-widest font-bold">
                        Hold
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component to keep the map clean
function BannerContent({ b, img }) {
    return (
        <>
            {/* Blurry Ambient Background */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-center blur-2xl opacity-50 scale-125"
                style={{ backgroundImage: `url(${img})` }}
            />
            {/* Sharp Main Image */}
            <img
                src={img}
                alt={b.alt || 'Banner'}
                className="relative z-10 w-full h-full object-contain"
                loading="lazy"
            />
            {b.label && (
                <div className="absolute bottom-6 left-6 z-30">
                    <span className="bg-white/10 border border-white/20 text-white text-[10px] md:text-xs px-3 py-1 rounded-full backdrop-blur-xl shadow-2xl font-semibold tracking-wide uppercase">
                        {b.label}
                    </span>
                </div>
            )}
        </>
    );
}