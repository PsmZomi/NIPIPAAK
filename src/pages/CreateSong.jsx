import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function CreateSong() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const titleRef = useRef(null);
    const lyricsRef = useRef(null);
    const artistRef = useRef(null);

    if (!user) {
        navigate('/login');
        return null;
    }

    const generateSlug = (text) => {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const slug = generateSlug(title);
            const lyricsArray = lyrics.split(/\r?\n/);
            if (!lyricsArray.some((l) => l.trim().length > 0)) {
                setError('Please add lyrics.');
                setLoading(false);
                return;
            }

            const songData = {
                title,
                slug,
                artist: artist || user.displayName || user.email || 'Anonymous',
                lyrics: lyricsArray,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                createdAt: serverTimestamp(),
                likes: 0,
                likedBy: []
            };

            await addDoc(collection(db, 'songs'), songData);

            // Redirect back to songs page
            navigate('/songs');
        } catch (err) {
            console.error(err);
            setError('Failed to create song. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-[130px] lg:pt-[115px] bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-5">
                <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Create New Song
                </h1>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Song Title</label>
                        <textarea
                            rows={2}
                            value={title}
                            ref={titleRef}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-medium"
                            placeholder="Enter title (Enter for newline)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lyrics (Enter for new line)
                        </label>
                        <textarea
                            value={lyrics}
                            ref={lyricsRef}
                            onChange={(e) => setLyrics(e.target.value)}
                            required
                            rows={16}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm leading-relaxed"
                            placeholder="Write your lyrics here..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Artist Name</label>
                        <textarea
                            rows={2}
                            value={artist}
                            ref={artistRef}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="Your name or artist name (Enter for newline)"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70"
                        >
                            {loading ? 'Publishing...' : 'Publish Song'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
