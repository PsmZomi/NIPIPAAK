import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function HeroBanner() {
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.warn(err));
        return unsub;
    }, []);

    if (banners.length === 0) return null;
    // Determine if we need to animate (more than 1 banner)
    const shouldAnimate = banners.length > 1;

    // If animating, duplicate the banners to create a seamless loop
    const displayBanners = shouldAnimate ? [...banners, ...banners] : banners;

    return (
        /* Add margin/padding to clear the fixed global header! */
        <div className="bg-white border-b border-zinc-100 w-full relative overflow-hidden -mt-[105px] lg:-mt-[110px] pt-[105px] lg:pt-[140px]">
            <div className={`w-full ${shouldAnimate ? 'flex items-center' : ''}`}>
                <div className={`w-full flex items-center ${shouldAnimate ? 'animate-marquee min-w-[200%] gap-4' : 'justify-center'}`}>
                    {displayBanners.map((b, i) => {
                        const inner = (
                            <div className="relative flex items-center justify-center w-full max-w-[100vw] h-[100px] md:h-[150px] lg:h-[200px] overflow-hidden bg-black/5">
                                {/* Blurred Background Layer for filling empty space nicely */}
                                <div
                                    className="absolute inset-0 w-full h-full bg-cover bg-center blur-xl opacity-40 scale-110"
                                    style={{ backgroundImage: `url(${b.image})` }}
                                />

                                {/* Foreground Crisp Image */}
                                <img
                                    src={b.image}
                                    alt="Announcement Banner"
                                    className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                                />
                            </div>
                        );
                        return b.link ? (
                            <a key={`${b.id}-${i}`} href={b.link} target="_blank" rel="noopener noreferrer" className={`block ${shouldAnimate ? 'w-[80vw] md:w-[60vw] lg:w-[40vw] flex-shrink-0' : 'w-full'}`}>
                                {inner}
                            </a>
                        ) : (
                            <div key={`${b.id}-${i}`} className={`block ${shouldAnimate ? 'w-[80vw] md:w-[60vw] lg:w-[40vw] flex-shrink-0' : 'w-full'}`}>
                                {inner}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}