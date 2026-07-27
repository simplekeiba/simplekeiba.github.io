import { fetchEpisodes } from './src/lib/podcast.ts';

async function main() {
  try {
    console.log('Fetching episodes...');
    const episodes = await fetchEpisodes();
    console.log(`Total episodes fetched: ${episodes.length}\n`);

    console.log('--- Top 5 Latest Episodes ---');
    const top5 = episodes.slice(0, 5);
    top5.forEach((ep, index) => {
      console.log(`[${index + 1}]`);
      console.log(`Title    : ${ep.title}`);
      console.log(`Episode #: ${ep.episodeNumber}`);
      console.log(`Date     : ${ep.pubDate}`);
      console.log(`Slug     : ${ep.slug}`);
      console.log('-----------------------------');
    });
  } catch (error) {
    console.error(error);
  }
}

main();
