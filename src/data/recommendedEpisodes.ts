/**
 * トップページ「初めての方におすすめ」に表示するエピソードを、
 * 表示したい順に最大3件指定する。
 *
 * slug: エピソード個別ページのURL（/episodes/{slug}/）と同じもの。
 * spotifyUrl: そのエピソードのSpotify個別ページURL。「エピソードを聴く」リンク先として使う。
 *
 * 空配列のままにしておくと、サイト上ではセクション自体が
 * 「選定待ち」の表示になる（架空のおすすめを自動生成しない）。
 */
export interface RecommendedEpisode {
  slug: string;
  spotifyUrl: string;
}

export const RECOMMENDED_EPISODES: RecommendedEpisode[] = [
  {
    slug: 'ep-242',
    spotifyUrl: 'https://open.spotify.com/episode/5KLc3fceHqQ2ATvAbxKmxl',
  },
  {
    slug: 'ep-236',
    spotifyUrl: 'https://open.spotify.com/episode/16t1jyGTSxSr628KJEI2Zc',
  },
  {
    slug: 'ep-231',
    spotifyUrl: 'https://open.spotify.com/episode/6nFtOfrhp8M6TMoC9VTRkF',
  },
];
