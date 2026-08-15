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
    slug: 'ep-161',
    spotifyUrl: 'https://open.spotify.com/episode/4Ize58T7Ql8S0MwE6VYTjB',
  },
  {
    slug: 'ep-216',
    spotifyUrl: 'https://open.spotify.com/episode/55puBklyCiuzFzwPfWdsCx',
  },
  {
    slug: 'ep-220',
    spotifyUrl: 'https://open.spotify.com/episode/3dtaUD9supxjcjYIJksS3o',
  },
];
