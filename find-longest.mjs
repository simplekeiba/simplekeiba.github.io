import { fetchEpisodes } from './src/lib/podcast.js';
(async () => {
  const eps = await fetchEpisodes();
  eps.sort((a, b) => b.title.length - a.title.length);
  console.log(`Longest slug: ${eps[0].slug}, Title length: ${eps[0].title.length}, Title: ${eps[0].title}`);
})();
