import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill, limitFit } from '@cloudinary/url-gen/actions/resize';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import GalleryLightbox from '../components/GalleryLightbox';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const ALBUMS_COL = 'gallery_albums';
const PHOTOS_COL = 'gallery_photos';
const LOCAL_KEY = 'galleryFolders';
const MIGRATED_KEY = 'galleryFoldersMigrated';

const cld = new Cloudinary({
  cloud: { cloudName: CLOUD_NAME },
});

function thumbUrl(publicId) {
  return cld
    .image(publicId)
    .resize(fill().width(600).height(600).gravity('auto'))
    .delivery(format(auto()))
    .toURL();
}

function fullUrl(publicId) {
  return cld
    .image(publicId)
    .resize(limitFit().width(2400).height(3200))
    .delivery(format(auto()))
    .toURL();
}

function isArchiveName(name) {
  return String(name || '').trim().toLowerCase() === 'archive';
}

async function migrateLocalAlbums(existingAlbums) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATED_KEY) === '1') return;

  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, '1');
    return;
  }

  let local = [];
  try {
    local = JSON.parse(raw) || [];
  } catch {
    localStorage.setItem(MIGRATED_KEY, '1');
    return;
  }

  const existingNames = new Set(
    existingAlbums.map((a) => a.name.toLowerCase()),
  );

  for (const folder of local) {
    const name = String(folder?.name || '').trim();
    if (!name || isArchiveName(name)) continue;
    if (existingNames.has(name.toLowerCase())) continue;
    try {
      await addDoc(collection(db, ALBUMS_COL), {
        name,
        createdAt: serverTimestamp(),
      });
      existingNames.add(name.toLowerCase());
    } catch (err) {
      console.warn('Album migrate failed', err);
    }
  }

  localStorage.setItem(MIGRATED_KEY, '1');
}

async function seedPhotosFromCloudinary(album) {
  if (!CLOUD_NAME || !album?.name || !album?.id) return [];

  const listUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${encodeURIComponent(album.name)}.json`;
  let resources = [];
  try {
    const res = await fetch(listUrl);
    if (!res.ok) return [];
    const data = await res.json();
    resources = data.resources || [];
  } catch {
    return [];
  }

  const existingSnap = await getDocs(
    query(collection(db, PHOTOS_COL), where('albumId', '==', album.id)),
  );
  const existingIds = new Set(
    existingSnap.docs.map((d) => d.data().publicId).filter(Boolean),
  );

  const seeded = [];
  for (const r of resources) {
    const publicId = r.public_id;
    if (!publicId || existingIds.has(publicId)) continue;
    const caption = r.context?.custom?.caption || 'Nipipaak Moment';
    const url = thumbUrl(publicId);
    try {
      await addDoc(collection(db, PHOTOS_COL), {
        albumId: album.id,
        albumName: album.name,
        publicId,
        url,
        caption,
        createdAt: serverTimestamp(),
      });
      existingIds.add(publicId);
      seeded.push({
        publicId,
        url,
        fullUrl: fullUrl(publicId),
        caption,
      });
    } catch (err) {
      console.warn('Photo seed failed', err);
    }
  }
  return seeded;
}

export default function Gallery() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [currentAlbumId, setCurrentAlbumId] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [caption, setCaption] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const seedingRef = useRef(new Set());

  const currentAlbum = albums.find((a) => a.id === currentAlbumId);

  // Shared albums from Firestore
  useEffect(() => {
    const qAlbums = query(
      collection(db, ALBUMS_COL),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      qAlbums,
      async (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.name && !isArchiveName(a.name));
        setAlbums(list);

        // Migrate local albums only when signed in (create requires auth)
        if (user) await migrateLocalAlbums(list);

        setCurrentAlbumId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          return list[0]?.id || '';
        });
      },
      (err) => console.warn(err),
    );
    return () => unsub();
  }, [user]);

  // Photos for selected album
  useEffect(() => {
    if (!currentAlbumId || !currentAlbum?.name) {
      setImages([]);
      return undefined;
    }

    const album = { id: currentAlbum.id, name: currentAlbum.name };
    setLoading(true);
    const qPhotos = query(
      collection(db, PHOTOS_COL),
      where('albumId', '==', album.id),
    );

    const unsub = onSnapshot(
      qPhotos,
      async (snap) => {
        let list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            publicId: data.publicId,
            url: data.url || thumbUrl(data.publicId),
            fullUrl: fullUrl(data.publicId),
            caption: data.caption || 'Nipipaak Moment',
            createdAt: data.createdAt,
          };
        });

        list.sort((a, b) => {
          const am = a.createdAt?.seconds ?? a.createdAt?._seconds ?? 0;
          const bm = b.createdAt?.seconds ?? b.createdAt?._seconds ?? 0;
          return bm - am;
        });

        setImages(list);
        setLoading(false);

        if (list.length === 0 && user && !seedingRef.current.has(album.id)) {
          seedingRef.current.add(album.id);
          try {
            await seedPhotosFromCloudinary(album);
          } catch (err) {
            console.warn(err);
          }
        }
      },
      (err) => {
        console.warn(err);
        setLoading(false);
        setImages([]);
      },
    );

    return () => unsub();
  }, [currentAlbumId, currentAlbum?.id, currentAlbum?.name, user]);

  const addFolder = async () => {
    if (!user) {
      return alert('Login to create an album.');
    }
    const name = newFolderName.trim();
    if (!name) return;
    if (isArchiveName(name)) {
      return alert('Choose a different album name.');
    }
    if (albums.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      return alert('Album already exists');
    }
    try {
      const ref = await addDoc(collection(db, ALBUMS_COL), {
        name,
        createdAt: serverTimestamp(),
      });
      setNewFolderName('');
      setCurrentAlbumId(ref.id);
    } catch (err) {
      console.warn(err);
      alert(err?.message || 'Could not create album');
    }
  };

  const openUploadWidget = useCallback(() => {
    if (!user) {
      return alert('Login to upload photos.');
    }
    if (!currentAlbum?.name || !currentAlbum?.id) {
      return alert('Create an album first, then upload.');
    }
    if (!window.cloudinary?.openUploadWidget) {
      return alert('Upload widget is not ready. Refresh and try again.');
    }

    const albumId = currentAlbum.id;
    const albumName = currentAlbum.name;
    const photoCaption = caption.trim() || 'Nipipaak Moment';

    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: albumName,
        tags: [albumName],
        context: { caption: photoCaption },
        resourceType: 'image',
        cropping: false,
        multiple: false,
      },
      async (err, result) => {
        if (err || result.event !== 'success') return;
        const publicId = result.info?.public_id;
        if (!publicId) return;
        try {
          await addDoc(collection(db, PHOTOS_COL), {
            albumId,
            albumName,
            publicId,
            url: thumbUrl(publicId),
            caption: photoCaption,
            createdAt: serverTimestamp(),
          });
          setCaption('');
        } catch (writeErr) {
          console.warn(writeErr);
          alert(writeErr?.message || 'Uploaded, but could not save to gallery');
        }
      },
    );
  }, [user, currentAlbum, caption]);

  return (
    <main className="min-h-screen bg-[#fafafa] pt-[64px] sm:pt-[72px] lg:pt-[89px] pb-24 lg:pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <header className="text-center pt-3 sm:pt-5 lg:pt-7 pb-3 sm:pb-4">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-display text-ink leading-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Gallery
          </h1>
          <p className="mt-2 text-zinc-400 uppercase tracking-[0.28em] sm:tracking-[0.35em] text-[9px] sm:text-[10px] font-bold">
            Huihlak Melmuh Tongsaan
          </p>
        </header>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-3 lg:gap-5 mb-5 sm:mb-7 lg:mb-8 border-y border-zinc-200/90 py-3 sm:py-4 lg:py-5">
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 lg:flex-wrap lg:justify-center lg:overflow-visible">
            {albums.length === 0 ? (
              <p className="text-[11px] sm:text-xs font-mono text-zinc-400 py-1.5 w-full text-center lg:w-auto">
                {user
                  ? 'Create an album to start uploading.'
                  : 'No albums yet. Login to add photos.'}
              </p>
            ) : (
              albums.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setCurrentAlbumId(a.id)}
                  className={`shrink-0 px-3.5 sm:px-4 lg:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all rounded-full ${
                    currentAlbumId === a.id
                      ? 'bg-ink text-white shadow-md'
                      : 'bg-white text-zinc-400 border border-zinc-200 hover:border-green-400 hover:text-green-300'
                  }`}
                >
                  {a.name}
                </button>
              ))
            )}
          </div>

          {user ? (
            <div className="flex items-center bg-white border border-zinc-200 rounded-full px-3 sm:px-4 self-center w-full max-w-[16rem] sm:max-w-xs lg:w-auto">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addFolder();
                }}
                placeholder="New Album..."
                className="bg-transparent text-xs py-2 focus:outline-none min-w-0 flex-1 lg:w-28 lg:flex-none"
              />
              <button
                type="button"
                onClick={addFolder}
                className="text-green-600 font-bold px-2 text-lg shrink-0 leading-none"
                aria-label="Add album"
              >
                +
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-green-600 hover:text-ink text-center self-center py-1"
            >
              Login to upload →
            </Link>
          )}
        </div>

        {user && currentAlbum ? (
          <div className="max-w-md sm:max-w-lg mx-auto mb-5 sm:mb-7 lg:mb-8">
            <div className="bg-white px-3 py-3 sm:px-4 sm:py-4 rounded-xl border border-zinc-100 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2.5 text-center">
                Adding to <span className="text-ink">{currentAlbum.name}</span>
              </p>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption for this photo..."
                className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5 text-sm mb-2.5 outline-none focus:border-zinc-200"
              />
              <button
                type="button"
                onClick={openUploadWidget}
                className="w-full bg-green-500 hover:bg-ink text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-[10px] sm:text-xs uppercase tracking-widest"
              >
                Upload to {currentAlbum.name} →
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-square bg-zinc-200 rounded-md sm:rounded-lg"
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-center font-mono text-[11px] sm:text-xs text-zinc-400 py-10 sm:py-14">
            {currentAlbum ? 'Limlak om nailo.' : 'Lim koih na.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {images.map((img, i) => (
              <button
                key={img.id || img.publicId}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-md sm:rounded-lg bg-zinc-100 text-left"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent pt-8 pb-2 px-2 sm:px-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-widest line-clamp-2">
                    {img.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex != null ? (
        <GalleryLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </main>
  );
}
