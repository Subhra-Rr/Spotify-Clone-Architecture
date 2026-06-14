import { useState, useCallback } from 'react';

export interface AudioDBTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
  uri?: string;
}

export const useAudioDB = () => {
    const [cache, setCache] = useState<Record<string, Partial<AudioDBTrack>>>({});

    const enhanceTrack = useCallback(async <T extends AudioDBTrack>(track: T): Promise<T> => {
        // If it's your own upload or without strong yt:track context, maybe still try
        const cacheKey = `${track.artist}-${track.title}`.toLowerCase();
        if (cache[cacheKey]) {
            return { ...track, ...cache[cacheKey] };
        }

        try {
            const artist = encodeURIComponent(track.artist.split(',')[0].trim());
            const title = encodeURIComponent(track.title.replace(/\(.*\)/g, '').trim());
            const res = await fetch(`https://www.theaudiodb.com/api/v1/json/2/searchtrack.php?s=${artist}&t=${title}`);
            const data = await res.json();
            
            let enhancements: Partial<AudioDBTrack> = {};
            let strAlbumName = "";
            let albumThumb = "";
            
            if (data && data.track && data.track.length > 0) {
                const trackData = data.track[0];
                if (trackData.strTrackThumb) {
                    enhancements.coverUrl = trackData.strTrackThumb;
                }
                if (trackData.strAlbum) {
                    enhancements.album = trackData.strAlbum;
                    strAlbumName = trackData.strAlbum;
                }
                
                if (!enhancements.coverUrl && strAlbumName) {
                   const albumSearch = await fetch(`https://www.theaudiodb.com/api/v1/json/2/searchalbum.php?s=${artist}&a=${encodeURIComponent(strAlbumName)}`);
                   const albumData = await albumSearch.json();
                   if (albumData && albumData.album && albumData.album.length > 0 && albumData.album[0].strAlbumThumb) {
                       enhancements.coverUrl = albumData.album[0].strAlbumThumb;
                   }
                }
            } else {
               // Fallback: search album by artist directly if no track found? 
            }

            // Only update track with non-empty replacements, prefer audiodb images over unsplash mock
            if (enhancements.coverUrl || enhancements.album) {
                setCache(prev => ({ ...prev, [cacheKey]: enhancements }));
                return { ...track, ...enhancements };
            }
        } catch (e) {
            // Silently swallow AudioDB fetch errors (e.g. CORS/rate limiting) to prevent cluttering the dashboard console
        }
        
        return track;
    }, [cache]);

    const enhanceTracks = useCallback(async <T extends AudioDBTrack>(tracks: T[]): Promise<T[]> => {
        const enhanced = await Promise.all(tracks.map(t => enhanceTrack(t)));
        return enhanced;
    }, [enhanceTrack]);

    return { enhanceTrack, enhanceTracks };
};
