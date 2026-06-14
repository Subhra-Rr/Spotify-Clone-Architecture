const https = require('https');

function search(term, artistNamePrefix) {
  https.get(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const results = JSON.parse(data).results;
      results.forEach((song, i) => {
        if(!song.previewUrl) return;
        const coverUrl = song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '300x300bb') : '';
        const dur = new Date(song.trackTimeMillis).toISOString().substr(14, 5);
        console.log(`  { id: 'track-${artistNamePrefix}-${i}', title: '${song.trackName.replace(/'/g, "\\'")}', artist: '${song.artistName.replace(/'/g, "\\'")}', album: '${song.collectionName ? song.collectionName.replace(/'/g, "\\'") : ''}', duration: '${dur}', audioUrl: '${song.previewUrl}', coverUrl: '${coverUrl}' },`);
      });
    });
  });
}

search('krsna', 'krsna');
search('yo yo honey singh', 'honey');
