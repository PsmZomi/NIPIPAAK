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

    return (
        /* Reduced the height and added a cleaner background for better readability */
        <div className="bg-white border-b border-zinc-100 overflow-hidden sticky top-0 z-50 pt-8">
            {/* Height is set to 40px on mobile and 50px on desktop for a slim, sleek look */}
            <div className="marquee-container h-[40px] lg:h-[50px] flex items-center overflow-hidden">
                <div className="marquee-track flex items-center gap-16 animate-marquee">
                    {[...banners, ...banners].map((b, i) => {
                        const inner = (
                            <img
                                src={b.image}
                                alt="Advertisement"
                                /* object-contain ensures the image isn't cropped, 
                                   while the fixed height keeps it in a wide strip format */
                                className="h-[25px] lg:h-[30px] w-auto object-contain flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
                            />
                        );
                        return b.link ? (
                            <a key={`${b.id}-${i}`} href={b.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center justify-center">
                                {inner}
                            </a>
                        ) : (
                            <div key={`${b.id}-${i}`} className="flex-shrink-0 flex items-center justify-center">
                                {inner}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}