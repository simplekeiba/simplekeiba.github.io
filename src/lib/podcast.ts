import { XMLParser } from 'fast-xml-parser';

export interface PodcastEpisode {
  slug: string;
  episodeNumber: number | null;
  title: string;
  pubDate: Date;
  duration: string;
  description: string;
  audioUrl: string;
  link: string;
  guid: string;
}

const RSS_URL = 'https://anchor.fm/s/f1b706dc/podcast/rss';

export async function fetchEpisodes(): Promise<PodcastEpisode[]> {
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsedObj = parser.parse(xmlText);

    const items = parsedObj.rss?.channel?.item;
    if (!items) {
      return [];
    }

    const itemArray = Array.isArray(items) ? items : [items];

    const episodes = itemArray.map((item: any): PodcastEpisode => {
      // itunes:episode がある場合はそれを話数として使用
      const itunesEpisode = item['itunes:episode'];
      const epNum = itunesEpisode ? parseInt(itunesEpisode, 10) : null;
      
      // slugは ep-{話数} 形式。話数が不明な場合はフォールバック
      let slug = '';
      if (epNum) {
        slug = `ep-${epNum}`;
      } else {
        const fallbackId = (item.guid?.['#text'] || item.guid || 'id').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);
        slug = `ep-unknown-${fallbackId}`;
      }

      // guid の取得（#textの可能性がある）
      const guid = item.guid?.['#text'] || item.guid || '';

      return {
        slug,
        episodeNumber: epNum,
        title: item.title || '',
        pubDate: new Date(item.pubDate),
        duration: item['itunes:duration'] || '',
        description: item.description || '',
        audioUrl: item.enclosure?.['@_url'] || '',
        link: item.link || '',
        guid,
      };
    });

    return episodes;
  } catch (error) {
    console.error('Failed to fetch podcast episodes:', error);
    // ビルドを停止しないという要件のため、実際にはここでキャッシュJSONを読み込むことになる。
    // 現段階ではひとまず空配列を返すか、エラーを再スローする。
    // 今回はデータ取得部分の確認なので再スローしておく。
    throw error;
  }
}
