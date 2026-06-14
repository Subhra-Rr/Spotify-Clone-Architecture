const fetch = require('node-fetch');

async function test() {
  const params = 'brown rang honey singh';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(params)}&entity=song&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.results[0]?.previewUrl);
}

test();
