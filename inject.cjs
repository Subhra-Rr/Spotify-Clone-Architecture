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
  const h = await getSongs('yo yo honey singh', 'honey');
  const k = await getSongs('kr$na', 'krsna');
  const newTracks = h + '\n' + k;
  
  let content = fs.readFileSync('server.ts', 'utf-8');
  content = content.replace('];\n\n// Provide Mock Data API', newTracks + '\n];\n\n// Provide Mock Data API');
  fs.writeFileSync('server.ts', content, 'utf-8');
  console.log('Appended tracks');
}
run();
