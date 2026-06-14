async function run() {
  const q1 = await fetch('https://itunes.apple.com/search?term=Krsna&entity=musicArtist&limit=5').then(r => r.json());
  console.log("Artists:", q1.results.map((r: any) => r.artistName));
}
run();
