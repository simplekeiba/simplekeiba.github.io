import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPLE_EPISODES_FILE = path.resolve(__dirname, '../src/data/apple_episodes.json');
const ITUNES_API_URL = 'https://itunes.apple.com/lookup?id=1734404201&media=podcast&entity=podcastEpisode&limit=200';

async function main() {
  try {
    const res = await fetch(ITUNES_API_URL);
    if (!res.ok) {
      throw new Error(`iTunes API returned ${res.status}`);
    }
    const data = await res.json();
    
    // Validating data
    if (!data || data.resultCount === undefined || !Array.isArray(data.results)) {
      throw new Error('Invalid data format from iTunes API');
    }

    await fs.writeFile(APPLE_EPISODES_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Apple Podcasts] Successfully updated apple_episodes.json with ${data.resultCount} results.`);
  } catch (err) {
    console.warn('\n[WARN] Failed to fetch Apple Podcasts episodes from iTunes API.');
    console.warn('[WARN] ' + err.message);
    console.warn('[WARN] Continuing build with cached apple_episodes.json.\n');
    // We don't exit with code 1 because we want the build to continue
  }
}

main();
