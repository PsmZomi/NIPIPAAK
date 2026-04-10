import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { useAuth } from '../context/AuthContext';

// Firebase Imports
import { 
  collection, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// --- CONFIGURATION ---
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const cld = new Cloudinary({
  cloud: { cloudName: CLOUD_NAME },
});

export default function Gallery() {
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [caption, setCaption] = useState('');
  const { user } = useAuth(); // If this is null, buttons won't show!

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('galleryFolders');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFolders(parsed);
      if (parsed.length > 0) setCurrentFolderId(parsed[0].id);
    } else {
      const defaults = [{ id: uuidv4(), name: 'Archive', images: [] }];
      setFolders(defaults);
      localStorage.setItem('galleryFolders', JSON.stringify(defaults));
      setCurrentFolderId(defaults[0].id);
    }
  }, []);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isLarge = windowWidth >= 1024;

  // On large screen, remove /gallery from actual routing and redirect to /photo.
  useEffect(() => {
    if (isLarge && pathname === '/gallery') {
      navigate('/photo', { replace: true });
    }
  }, [isLarge, pathname, navigate]);

  const currentFolder = folders.find(f => f.id === currentFolderId);

  const navLinks = [
    { path: '/blog', label: 'Blog' },
    { path: '/news', label: 'News' },
    { path: '/songs', label: 'Songs' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/photo', label: 'Photo' },
  ];

  const navLinksToShow = isLarge
    ? navLinks.filter(link => link.path !== '/gallery')
    : navLinks;

  const prefetchRoute = (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);
  };

  // 2. Fetch Gallery Images from Cloudinary
  const fetchImages = async (folderName) => {
    if (!folderName) return;
    setLoading(true);
    try {
      const listUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${folderName}.json`;
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error('No images');
      const data = await res.json();
      const loadedImages = data.resources.map((res) => ({
        public_id: res.public_id,
        url: cld.image(res.public_id)
          .resize(fill().width(600).height(600).gravity('auto'))
          .delivery(format(auto()))
          .toURL(),
        caption: res.context?.custom?.caption || "Nipipaak Moment",
      }));
      setImages(loadedImages);
    } catch (err) {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentFolder?.name) fetchImages(currentFolder.name);
  }, [currentFolder?.name]);

  // 3. Gallery Upload Widget
  const openUploadWidget = () => {
    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: currentFolder.name,
        tags: [currentFolder.name],
        context: { caption: caption },
        resourceType: 'image',
        cropping: true,
      },
      (err, result) => {
        if (!err && result.event === 'success') {
          fetchImages(currentFolder.name);
          setCaption('');
        }
      }
    );
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    if (folders.some(f => f.name === name)) return alert('Folder already exists');
    const newF = { id: uuidv4(), name, images: [] };
    const updated = [...folders, newF];
    setFolders(updated);
    localStorage.setItem('galleryFolders', JSON.stringify(updated));
    setNewFolderName('');
    setCurrentFolderId(newF.id);
  };

  return (
    <main className="min-h-screen bg-[#fafafa] pt-36 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-5 relative">

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-display mt-4 text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Nipipaak Archive
          </h1>
          <div className="sticky top-24 z-20 bg-white/95 backdrop-blur-md rounded-xl border border-zinc-200 p-3 shadow-sm mb-4">
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {navLinksToShow.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => prefetchRoute(link.path)}
                  className="px-3 py-2 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-zinc-400 uppercase tracking-[0.4em] text-[10px] pt-4 font-bold">
            Melmuh Tongsaan ni mo
          </p>
        </header>

        {/* Folder Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12 border-y border-zinc-100 py-6">
          <div className="flex flex-wrap justify-center gap-3">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setCurrentFolderId(f.id)}
                className={`px-5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all rounded-full ${
                  currentFolderId === f.id
                    ? 'bg-ink text-white shadow-lg'
                    : 'bg-white text-zinc-400 border border-zinc-200 hover:border-green-400 hover:text-green-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {user && (
            <div className="flex items-center bg-white border border-zinc-200 rounded-full px-4 py-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New Album..."
                className="bg-transparent text-xs py-2 focus:outline-none w-28"
              />
              <button onClick={addFolder} className="text-green-600 font-bold px-2 text-lg">+</button>
            </div>
          )} 
        </div>

        {/* Gallery Upload Section */}
        {user && (
          <div className="max-w-xl mx-auto mb-16 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Adding to <span className="text-ink">{currentFolder?.name}</span>
              </p>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption for this photo..."
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 text-sm mb-4 outline-none"
              />
              <button
                onClick={openUploadWidget}
                className="w-full bg-green-500 hover:bg-ink text-white font-bold py-4 rounded-xl transition-all text-xs uppercase tracking-widest"
              >
                Upload to {currentFolder?.name} →
              </button>
            </div>
          </div>
        )} 

        {/* Image Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => <div key={n} className="aspect-square bg-zinc-200 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div key={img.public_id} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white text-[10px] uppercase font-bold tracking-widest">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}