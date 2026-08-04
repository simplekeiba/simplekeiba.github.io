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

    // まずパースして必要な値を確定する
    const parsedItems = itemArray.map((item: any) => {
      const title = item.title || '';
      // titleから最後の #数字 を抽出 (小数点を含む場合は除外)
      const matches = [...title.matchAll(/[#＃](\d+)(?!\d|\.)/g)];
      const epNum = matches.length > 0 ? parseInt(matches[matches.length - 1][1], 10) : null;
      const pubDate = new Date(item.pubDate);
      return { item, title, epNum, pubDate };
    });

    // 配信日時の古い順にソートする（重複解消のため）
    parsedItems.sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime());

    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const dateSlugCount: Record<string, number> = {};
    const epSlugSet = new Set<string>();

    const episodes = parsedItems.map(({ item, title, epNum, pubDate }): PodcastEpisode => {
      let slug = '';
      if (epNum !== null) {
        slug = `ep-${epNum}`;
        if (epSlugSet.has(slug)) {
          throw new Error(`重複する話数が検出されました: ${slug} (${title})`);
        }
        epSlugSet.add(slug);
      } else {
        // 日本時間 YYYY-MM-DD
        const baseSlug = formatter.format(pubDate).replace(/\//g, '-');
        if (!dateSlugCount[baseSlug]) {
          dateSlugCount[baseSlug] = 1;
          slug = baseSlug;
        } else {
          dateSlugCount[baseSlug]++;
          slug = `${baseSlug}-${dateSlugCount[baseSlug]}`;
        }
      }

      // guid の取得
      const guid = item.guid?.['#text'] || item.guid || '';

      return {
        slug,
        episodeNumber: epNum,
        title,
        pubDate,
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
    throw error;
  }
}
