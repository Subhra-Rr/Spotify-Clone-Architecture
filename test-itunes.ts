import https from "https";
https.get('https://itunes.apple.com/search?term=no+cap+kr%24na&entity=song&limit=5', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
