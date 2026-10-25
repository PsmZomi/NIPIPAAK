import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import MediaEmbed from '../components/MediaEmbed';
import { parseMediaLink, fetchMediaMeta } from '../utils/mediaLink';

export default function CreateMedia() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: editId } = useParams();
    const isEdit = Boolean(editId);

    const [link, setLink] = useState('');
    const [caption, setCaption] = useState('');
    const [mediaTitle, setMediaTitle] = useState('');
    const [mediaDate, setMediaDate] = useState('');
    const [titleLoading, setTitleLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingDoc, setLoadingDoc] = useState(isEdit);
    const [error, setError] = useState('');
    const [savedSlug, setSavedSlug] = useState('');

    const parsed = useMemo(() => parseMediaLink(link), [link]);
    const linkInvalid = link.trim().length > 0 && !parsed;

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!isEdit || !user) return;

        let cancelled = false;

        async function loadForEdit() {
            setLoadingDoc(true);
            setError('');

            try {
                const snap = await getDoc(doc(db, 'songs', editId));
                if (!snap.exists()) {
                    navigate('/media', { replace: true });
                    return;
                }

                const data = snap.data();
                if (data.uid !== user.uid) {
                    setError('You can only edit your own media.');
                    navigate(-1);
                    return;
                }

                if (cancelled) return;

                setLink(data.link || '');
                setCaption(data.caption || '');
                setMediaTitle(data.title || '');
                setMediaDate(data.date || '');
                setSavedSlug(data.slug || '');
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError('Failed to load media for editing.');
                }
            } finally {
                if (!cancelled) setLoadingDoc(false);
            }
        }

        loadForEdit();

        return () => {
            cancelled = true;
        };
    }, [isEdit, editId, user, navigate]);

    // Pull the real title and publish date straight from the link.
    useEffect(() => {
        if (!parsed?.url) {
            setTitleLoading(false);
            return undefined;
        }

        let cancelled = false;
        setTitleLoading(true);

        const timer = setTimeout(async () => {
            const meta = await fetchMediaMeta(parsed.url);
            if (cancelled) return;
            if (meta.title) setMediaTitle(meta.title);
            if (meta.date) setMediaDate(meta.date);
            setTitleLoading(false);
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [parsed?.url]);

    if (!user) {
        return null;
    }

    if (loadingDoc) {
        return (
            <main className="min-h-screen pt-[130px] lg:pt-[115px] bg-gray-50 pb-20 flex items-center justify-center">
                <p className="font-mono text-sm text-muted">Loading…</p>
            </main>
        );
    }

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleLinkChange = (value) => {
        setLink(value);
        setMediaTitle('');
        setMediaDate('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const parsedLink = parseMediaLink(link);
            if (!parsedLink) {
                setError('Please add a valid YouTube, Facebook, or other link.');
                setLoading(false);
                return;
            }

            const mediaFields = {
                title: mediaTitle.trim(),
                link: parsedLink.url,
                caption: caption.trim(),
                date:
                    mediaDate ||
                    new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }),
                updatedAt: serverTimestamp(),
            };

            if (isEdit) {
                await updateDoc(doc(db, 'songs', editId), mediaFields);
                navigate(savedSlug ? `/media/${savedSlug}` : '/media');
            } else {
                const slug =
                    generateSlug(mediaTitle.trim()) ||
                    `media-${Date.now().toString(36)}`;
                await addDoc(collection(db, 'songs'), {
                    ...mediaFields,
                    slug,
                    uid: user.uid,
                    createdAt: serverTimestamp(),
                    likes: 0,
                    likedBy: [],
                });
                navigate('/media');
            }
        } catch (err) {
            console.error(err);
            setError(
                `Failed to ${isEdit ? 'update' : 'create'} media. ${err.message}`,
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-[130px] lg:pt-[115px] bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-5">
                <h1
                    className="text-4xl font-bold mb-8"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {isEdit ? 'Edit Media' : 'Add Media'}
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link (required)
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => handleLinkChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {linkInvalid ? (
                            <p className="mt-2 text-sm text-amber-600">
                                Paste a valid link, e.g. a YouTube or Facebook video URL.
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-gray-400">
                                Paste a YouTube, Facebook, Vimeo, or any other link.
                                The title is taken from the link.
                            </p>
                        )}
                    </div>

                    {parsed ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preview
                            </label>
                            <MediaEmbed
                                link={link}
                                title={mediaTitle || parsed.label}
                                className="rounded-lg overflow-hidden border border-gray-200"
                            />
                            <div className="mt-3">
                                <p className="text-base font-medium text-gray-800">
                                    {titleLoading
                                        ? 'Fetching title…'
                                        : mediaTitle || 'No title found for this link.'}
                                </p>
                                {mediaDate ? (
                                    <p className="mt-1 font-mono text-xs text-gray-400">
                                        {mediaDate}
                                    </p>
                                ) : null}
                                {caption.trim() ? (
                                    <p className="mt-1 text-sm text-gray-500 whitespace-pre-line">
                                        {caption}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Caption (optional)
                        </label>
                        <textarea
                            rows={4}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Add a caption for this media..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !parsed}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? isEdit
                                    ? 'Saving...'
                                    : 'Publishing...'
                                : isEdit
                                  ? 'Save changes'
                                  : 'Publish Media'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
