import { useState, useEffect } from 'react';
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
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc, 
  doc 
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

  const currentFolder = folders.find(f => f.id === currentFolderId);

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

  // 3. --- HERO BANNER LOGIC (Upload & Delete) ---
  const openBannerUploadWidget = () => {
    if (!window.cloudinary) return alert('Cloudinary widget not loaded');
    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: 'banners',
        resourceType: 'image',
        multiple: false,
        cropping: true,
        croppingAspectRatio: 3, 
      },
      async (err, result) => {
        if (!err && result.event === 'success') {
          const targetLink = prompt("Load zota");
          try {
            await addDoc(collection(db, 'banners'), {
              image: result.info.secure_url,
              link: targetLink || '',
              createdAt: serverTimestamp(),
            });
            alert('Hero Banner Added!');
          } catch (e) {
            console.error("Error saving to Firestore:", e);
          }
        }
      }
    );
  };

  const deleteLatestBanner = async () => {
    if (!window.confirm("Are you sure you want to delete the most recent banner?")) return;
    try {
      const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const bannerId = querySnapshot.docs[0].id;
        await deleteDoc(doc(db, 'banners', bannerId));
        alert("Latest banner removed from archive.");
      } else {
        alert("No banners found to delete.");
      }
    } catch (e) {
      console.error("Error deleting banner:", e);
    }
  };

  // 4. Gallery Upload Widget
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
    <main className="min-h-screen bg-[#fafafa] pt-32 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-5 relative">
        
        {/* --- ADMIN CONTROLS (Top Right) --- */}
        {/* NOTE: If you can't see these, it means 'user' is null. Log in first! */}
        {user && (
          <div className="absolute -top-10 right-5 z-50 flex flex-col items-end gap-2">
            <button 
              onClick={openBannerUploadWidget}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-xl transition-all"
            >
              + Add Hero Banner
            </button>
            <button 
              onClick={deleteLatestBanner}
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md transition-all"
            >
              ✕ Delete Latest Banner
            </button>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-display mt-4 text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Nipipaak Archive
          </h1>
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
                    : 'bg-white text-zinc-400 border border-zinc-200 hover:border-ink hover:text-ink'
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

        {/* Image Grid */}
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