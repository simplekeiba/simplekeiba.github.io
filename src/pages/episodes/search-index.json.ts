import type { APIRoute } from 'astro';
import { fetchEpisodes } from '../../lib/podcast';

// 検索対象のショーノート文字列から HTML タグを除去する
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const episodes = await fetchEpisodes();
  const sorted = [...episodes].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const data = sorted.map((ep) => ({
    slug: ep.slug,
    episodeNumber: ep.episodeNumber,
    title: ep.title,
    pubDate: ep.pubDate.toISOString(),
    duration: ep.duration,
    description: stripHtml(ep.description).slice(0, 300),
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
