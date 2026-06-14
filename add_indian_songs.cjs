const fs = require('fs');
const https = require('https');

async function getSongs(term, artistNamePrefix) {
  return new Promise((resolve) => {
    https.get(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const results = JSON.parse(data).results;
        let lines = [];
        if(!results) { resolve(''); return; }
        results.forEach((song, i) => {
          if(!song.previewUrl) return;
          const coverUrl = song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '300x300bb') : '';
          const dur = new Date(song.trackTimeMillis).toISOString().substr(14, 5);
          lines.push(`  { id: 'track-${artistNamePrefix}-${i}', title: '${song.trackName.replace(/'/g, "\\'")}', artist: '${song.artistName.replace(/'/g, "\\'")}', album: '${song.collectionName ? song.collectionName.replace(/'/g, "\\'") : ''}', duration: '${dur}', audioUrl: '${song.previewUrl}', coverUrl: '${coverUrl}' },`);
        });
        resolve(lines.join('\n'));
      });
    });
  });
}

async function run() {
  const a = await getSongs('Arijit Singh', 'arijit');
  const b = await getSongs('Shreya Ghoshal', 'shreya');
  const c = await getSongs('Ar Rahman', 'arrahman');
  const d = await getSongs('Diljit Dosanjh', 'diljit');
  const e = await getSongs('Kishore Kumar', 'kishore');

  const newTracks = [a, b, c, d, e].filter(x => x).join('\n');
  
  let content = fs.readFileSync('server.ts', 'utf-8');
  content = content.replace('];\n\n// Provide Preview Data API', newTracks + '\n];\n\n// Provide Preview Data API');
  fs.writeFileSync('server.ts', content, 'utf-8');
  console.log('Appended Indian tracks');
}
run();
