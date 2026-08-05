# シンプルKEIBA 公式サイト

@AGENTS.md
@docs/spec.md

## 絶対に守ること

- 日付は必ず Asia/Tokyo で整形する（GitHub Actions は UTC で動くため）
- 日付整形は `src/lib/date.ts` の関数のみを使う。ページ内で `Intl.DateTimeFormat` を直接書かない
- 開発サーバーを起動するときのみ `cmd /c "npm run dev & pause"` を使う。型チェック・ビルド等の検証コマンドには `cmd /c` を使わず、そのまま実行する
- 新規ページを作るときは `src/pages/yosouou/rules.astro` の構造・クラス命名・余白の取り方を踏襲すること。`Layout.astro` を必ず使い、独自のヘッダー・フッターを作らない

## 変更後に必ず実行する検証

1. `npx tsc --noEmit`
2. PowerShellで `$env:TZ="UTC"; npm run build; Remove-Item Env:TZ` を実行し、`dist/` 内の時刻表示が日本時間になっているか確認する

## 回答は日本語で。専門用語には短い説明を添えること

## Development

開発サーバーの起動方法は「絶対に守ること」を参照。

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
