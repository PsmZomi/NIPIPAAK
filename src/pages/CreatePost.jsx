import { useState, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    sanitizeArticleHtml,
    isQuillContentEmpty,
    htmlToBodyParagraphs,
    stripHtmlToPlain,
} from '../utils/sanitizeHtml';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const LOGIN_TO_CONTRIBUTE_MSG = 'Please log in to contribute.';
const GUEST_CREATE_ALERT_KEY = 'nipipaak-create-post-guest-alert';

export default function CreatePost() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [author, setAuthor] = useState('');
    const [type, setType] = useState('blog');
    const [lyricsText, setLyricsText] = useState('');
    const [articleHtml, setArticleHtml] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const quillModules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean'],
            ],
        }),
        []
    );

    const quillFormats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'code-block',
        'list',
        'bullet',
        'link',
    ];

    useEffect(() => {
        if (user) {
            try {
                sessionStorage.removeItem(GUEST_CREATE_ALERT_KEY);
            } catch {
                /* ignore */
            }
            return;
        }
        try {
            if (!sessionStorage.getItem(GUEST_CREATE_ALERT_KEY)) {
                sessionStorage.setItem(GUEST_CREATE_ALERT_KEY, '1');
                window.alert(LOGIN_TO_CONTRIBUTE_MSG);
            }
        } catch {
            window.alert(LOGIN_TO_CONTRIBUTE_MSG);
        }
        navigate('/login', { replace: true });
    }, [user, navigate]);

    if (!user) {
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

            if (type === 'song') {
                const lyricsArray = lyricsText.split(/\r?\n/);
                if (!lyricsArray.some((l) => l.trim().length > 0)) {
                    setError('Please add lyrics.');
                    setLoading(false);
                    return;
                }

                const songData = {
                    title,
                    slug,
                    artist: author.trim() || user.displayName || user.email || 'Anonymous',
                    lyrics: lyricsArray,
                    date: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }),
                    createdAt: serverTimestamp(),
                    likes: 0,
                    likedBy: [],
                };

                await addDoc(collection(db, 'songs'), songData);
                navigate('/songs');
            } else {
                if (isQuillContentEmpty(articleHtml)) {
                    setError('Please write the article body.');
                    setLoading(false);
                    return;
                }

                const safeHtml = sanitizeArticleHtml(articleHtml);
                let bodyFromHtml = htmlToBodyParagraphs(safeHtml);
                if (!bodyFromHtml.length) {
                    const plain = stripHtmlToPlain(safeHtml);
                    if (plain) bodyFromHtml = [plain];
                }

                const plainForRead = stripHtmlToPlain(safeHtml);
                const postData = {
                    title,
                    slug,
                    excerpt: excerpt || title.substring(0, 100),
                    type,
                    bodyHtml: safeHtml,
                    body: bodyFromHtml,
                    image: image || null,
                    author: author || user.displayName || user.email || 'Anonymous',
                    date: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }),
                    readTime: `${Math.max(1, Math.ceil(plainForRead.length / 1000))} min`,
                    createdAt: serverTimestamp(),
                };

                await addDoc(collection(db, type === 'blog' ? 'blogs' : 'news'), postData);
                navigate(type === 'blog' ? '/blog' : '/news');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to create entry. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-[80px] lg:pt-[115px] bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-5">
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Create & Publish
                </h1>
                {/* <p className="text-gray-600 mb-8">Choose your content type and share with the world</p> */}

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

                <form
                    onSubmit={handleSubmit}
                    className=" p-2 rounded-2xl shadow-sm flex flex-col gap-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publish As</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="blog">Blogs/Articles</option>
                                <option value="news">News Update</option>
                                <option value="song">Laa</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {type === 'song' ? 'Song Title' : 'Title'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium"
                            placeholder={type === 'song' ? '...' : '... '}
                        />
                    </div>

                    {type !== 'song' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Limlak</label>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {image ? (
                                    <div className="w-full sm:w-72 h-44 sm:h-48 rounded-lg border border-gray-200 bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                                        <img
                                            src={image}
                                            alt="Preview"
                                            className="max-w-full max-h-full w-auto h-full object-contain"
                                        />
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleImageUpload}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300 w-fit"
                                >
                                    {image ? 'Change Image' : 'Lim upload na'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {type === 'song'
                                ? 'Lyrics'
                                : 'Body'}
                        </label>
                        {type === 'song' ? (
                            <textarea
                                value={lyricsText}
                                onChange={(e) => setLyricsText(e.target.value)}
                                required
                                rows={16}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                                placeholder=".."
                            />
                        ) : (
                            <div className="rich-editor border border-gray-300 rounded-lg overflow-hidden bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={articleHtml}
                                    onChange={setArticleHtml}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write your story..."
                                    className="bg-white"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lai Gelh <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder={type === 'song' ? '' : ''}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t items-center justify-center border-gray-100 flex border">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`text-white font-bold py-2 px-6 rounded-lg border border-inkshadow-md transition-all duration-300 disabled:opacity-70 ${
                                type === 'song'
                                    ? 'bg-green-300 hover:bg-green-700'
                                    : 'bg-ink hover:bg-black'
                            }`}
                        >
                            {loading ? 'Publishing...' : `Publish`}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
