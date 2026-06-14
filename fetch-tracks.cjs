const axios = require('axios');
const fs = require('fs');

async function main() {
  console.log("Fetching tracks...");
  const terms = ['pop', 'rock', 'hiphop', 'jazz', 'lo-fi', 'classical', 'edm'];
  let tracks = [];
  let id = 41;
  for (const term of terms) {
    try {
        const res = await axios.get(`https://itunes.apple.com/search?term=${term}&entity=song&limit=40`);
        for (const item of res.data.results) {
        if (item.previewUrl) {
            tracks.push({
                id: `track-${id++}`,
                title: item.trackName?.replace(/'/g, "\\'") || 'Unknown',
                artist: item.artistName?.replace(/'/g, "\\'") || 'Unknown',
                album: item.collectionName?.replace(/'/g, "\\'") || 'Unknown',
                duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}:${((item.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}` : '0:00',
                audioUrl: item.previewUrl,
                coverUrl: item.artworkUrl100?.replace('100x100', '300x300') || ''
            });
        }
        }
    } catch(e) {}
  }
  
  // output as JS string
  let output = '';
  for (const t of tracks) {
     output += `  { id: '${t.id}', title: '${t.title}', artist: '${t.artist}', album: '${t.album}', duration: '${t.duration}', audioUrl: '${t.audioUrl}', coverUrl: '${t.coverUrl}' },\n`;
  }
  fs.writeFileSync('extra.txt', output);
  console.log(`Saved ${tracks.length} tracks.`);
}
main();
