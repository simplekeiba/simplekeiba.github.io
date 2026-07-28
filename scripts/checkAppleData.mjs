import fs from 'node:fs/promises';
import { fetchEpisodes } from '../src/lib/podcast.js';

async function run() {
  const data = JSON.parse(await fs.readFile('./src/data/apple_episodes.json', 'utf-8'));
  const eps = data.results.filter(r => r.wrapperType === 'podcastEpisode');
  
  console.log(`1. resultCount: ${data.resultCount} (Episodes: ${eps.length})`);
  
  console.log(`2. 5 trackNames:`);
  eps.slice(0, 5).forEach(e => console.log(`  - ${e.trackName}`));
  
  let withHash = 0;
  let withoutHash = 0;
  for (const ep of eps) {
    if (/[#＃](\d+)/.test(ep.trackName)) {
      withHash++;
    } else {
      withoutHash++;
    }
  }
  console.log(`3. With #number: ${withHash}, Without: ${withoutHash}`);
  
  const appleMap = new Map();
  for (const ep of eps) {
    const regex = /[#＃](\d+)/g;
    let match;
    let num = null;
    while ((match = regex.exec(ep.trackName || '')) !== null) {
      num = parseInt(match[1], 10);
    }
    if (num !== null) {
      appleMap.set(num, ep.trackId);
    }
  }

  const rssEps = await fetchEpisodes();
  let matched = 0;
  const unmatchedNums = [];
  
  for (const rssEp of rssEps) {
    const num = rssEp.episodeNumber;
    if (num !== null) {
      if (appleMap.has(num)) {
        matched++;
      } else {
        unmatchedNums.push(num);
      }
    }
  }
  console.log(`4. Matched count: ${matched}`);
  
  unmatchedNums.sort((a, b) => b - a); // 降順
  console.log(`5. Missing in Apple - Newest 3: ${unmatchedNums.slice(0, 3).join(', ')}`);
  console.log(`   Missing in Apple - Oldest 3: ${unmatchedNums.slice(-3).reverse().join(', ')}`);
}

run().catch(console.error);
