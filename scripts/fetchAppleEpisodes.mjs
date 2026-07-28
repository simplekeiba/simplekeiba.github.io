import fs from 'node:fs/promises';
import { fetchEpisodes } from '../src/lib/podcast.js';

const API_URL = 'https://itunes.apple.com/lookup?id=1734404201&entity=podcastEpisode&limit=250';
const OUT_FILE = './src/data/apple_episodes.json';

async function run() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch from Apple: ${res.status}`);
  }
  const data = await res.json();
  
  // 保存
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved API response to ${OUT_FILE}`);

  // 突き合わせ処理
  const rssEps = await fetchEpisodes();
  const appleEps = data.results.filter(r => r.wrapperType === 'podcastEpisode');
  
  // Apple側のエピソードごとに話数を抽出してマップ化
  const appleMap = new Map();
  for (const ep of appleEps) {
    const title = ep.trackName || '';
    const regex = /[#＃](\d+)/g;
    let match;
    let num = null;
    while ((match = regex.exec(title)) !== null) {
      num = parseInt(match[1], 10);
    }
    if (num !== null) {
      appleMap.set(num, ep.trackId);
    }
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedList = [];

  for (const rssEp of rssEps) {
    const num = rssEp.episodeNumber;
    if (num === null) {
      // 話数を持たない11件は照合対象外
      continue;
    }

    if (appleMap.has(num)) {
      matched++;
    } else {
      unmatched++;
      unmatchedList.push(rssEp);
    }
  }

  console.log('--- STATS ---');
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
  if (unmatched > 0) {
    console.log('Unmatched episodes:');
    unmatchedList.forEach(u => {
      console.log(`- ${u.title} (epNum: ${u.episodeNumber})`);
    });
  }
}

run().catch(console.error);
