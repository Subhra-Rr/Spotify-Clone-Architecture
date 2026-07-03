// MelodyStream Offline Database (IndexedDB Wrapper)
// Provides a production-grade, secure, offline-first audio caching and playback system

export interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioBlob: Blob;
  audioUrl: string; // Object URL
  coverBlob?: Blob;
  coverUrl: string; // Object URL
  duration?: string;
  downloadedAt: number;
}

const DB_NAME = 'MelodyStreamOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_tracks';

let dbInstance: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to initialize IndexedDB: ${(event.target as IDBOpenDBRequest).error?.message}`));
    };
  });
};

export const saveOfflineTrack = async (
  track: { id: string; title: string; artist: string; album: string; audioUrl: string; coverUrl: string; duration?: string }
): Promise<void> => {
  const db = await initOfflineDB();

  // 1. Fetch audio file as Blob
  const audioResponse = await fetch(track.audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio track: ${audioResponse.statusText}`);
  }
  const audioBlob = await audioResponse.blob();

  // 2. Fetch cover art as Blob (optional fallback)
  let coverBlob: Blob | undefined;
  if (track.coverUrl) {
    try {
      const coverResponse = await fetch(track.coverUrl);
      if (coverResponse.ok) {
        coverBlob = await coverResponse.blob();
      }
    } catch (e) {
      console.warn('Could not cache cover art offline:', e);
    }
  }

  // 3. Save into IndexedDB
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      audioBlob,
      coverBlob,
      duration: track.duration,
      downloadedAt: Date.now()
    };

    const request = store.put(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to write track to IndexedDB: ${(event.target as IDBRequest).error?.message}`));
    };
  });
};

export const deleteOfflineTrack = async (id: string): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to delete track from IndexedDB: ${(event.target as IDBRequest).error?.message}`));
    };
  });
};

export const getOfflineTracks = async (): Promise<OfflineTrack[]> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      const offlineTracks = results.map((record: any) => {
        const audioUrl = URL.createObjectURL(record.audioBlob);
        const coverUrl = record.coverBlob ? URL.createObjectURL(record.coverBlob) : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=150&auto=format&fit=crop";
        return {
          ...record,
          audioUrl,
          coverUrl
        };
      });
      resolve(offlineTracks);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to retrieve offline tracks: ${(event.target as IDBRequest).error?.message}`));
    };
  });
};

export const isTrackDownloaded = async (id: string): Promise<boolean> => {
  const db = await initOfflineDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getKey(id);

    request.onsuccess = () => {
      resolve(request.result !== undefined);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
};
