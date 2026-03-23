import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function CreatePost() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [author, setAuthor] = useState('');
    const [type, setType] = useState('blog'); // 'blog' or 'news'
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!user) {
        navigate('/login');
        return null;
    }

    const generateSlug = (text) => {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleImageUpload = () => {
        if (!window.cloudinary) return alert('Widget not loaded');

        window.cloudinary.openUploadWidget(
            {
                cloudName: CLOUD_NAME,
                uploadPreset: UPLOAD_PRESET,
                clientAllowedFormats: ['webp', 'jpg', 'png'],
                resourceType: 'image',
                multiple: false,
            },
            (err, result) => {
                if (!err && result.event === 'success') {
                    setImage(result.info.secure_url);
                }
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const slug = generateSlug(title);
            // Split content by double newline to match the existing 'body' array structure
            const bodyArray = content.split('\n\n').filter(p => p.trim() !== '');

            const postData = {
                title,
                slug,
                excerpt,
                type,
                body: bodyArray,
                image: image || null,
                author: author || user.displayName || user.email || 'Anonymous',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                readTime: `${Math.max(1, Math.ceil(content.length / 1000))} min`,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, type === 'blog' ? 'blogs' : 'news'), postData);

            // Redirect back to the active page
            navigate(type === 'blog' ? '/blog' : '/news');
        } catch (err) {
            console.error(err);
            setError('Failed to create post. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-[130px] lg:pt-[115px] bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-5">
                <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Create New Entry
                </h1>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publish As</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="blog">Blog Story</option>
                                <option value="news">News Update</option>
                            </select>
                        </div>


                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium"
                        />
                    </div>

                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt (Short Summary)</label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            required
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div> */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                        <div className="flex items-center gap-4">
                            {image && (
                                <img src={image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                            )}
                            <button
                                type="button"
                                onClick={handleImageUpload}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300"
                            >
                                {image ? 'Change Image' : 'Upload Graphic'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Body Content (Double Enter for new paragraph)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={12}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                            placeholder="Start writing..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Writer's Name</label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Your name or pen name"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-ink hover:bg-black text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70"
                        >
                            {loading ? 'Publishing...' : 'Publish Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
