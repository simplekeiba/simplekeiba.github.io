/**
 * ビルド時に外部からテキストを取ってくるための共通処理。
 *
 * このサイトはビルドが1日1回しか走らないため、取得が1度失敗すると
 * そのまま24時間の表示不良になる（docs/spec.md §13.2 の16番）。
 * 単発の `fetch` は使わず、必ずこの関数を通すこと。
 */

/** 既定の `node` のままだとボット扱いされやすいため、ビルドだと分かる名前を送る */
const USER_AGENT = 'Mozilla/5.0 (compatible; SimpleKEIBA-SiteBuild/1.0; +https://simplekeiba.com/)';

export interface FetchTextOptions {
  /** ログに出す名前（例: 'ランキングCSV'）。失敗時にどの取得かが分かるようにする */
  label: string;
  /**
   * 応答が期待した中身かを確かめる。false ならリトライ対象にする。
   *
   * ステータス200でも中身が正しいとは限らない。Googleはエラーページや
   * 同意画面をHTMLとして200で返すことがあり、それをそのままパースすると
   * 無関係な断片がデータとして混ざる。
   */
  validate?: (text: string) => boolean;
  attempts?: number;
  timeoutMs?: number;
}

export async function fetchTextWithRetry(
  url: string,
  { label, validate, attempts = 3, timeoutMs = 15_000 }: FetchTextOptions
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': USER_AGENT }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      if (validate && !validate(text)) {
        const head = text.slice(0, 160).replace(/\s+/g, ' ');
        throw new Error(`期待した形式ではない応答が返りました（先頭: ${head}）`);
      }
      return text;
    } catch (err) {
      lastError = err;
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[${label}] 取得に失敗 (${attempt}/${attempts}): ${reason}`);
      if (attempt < attempts) {
        // 3秒 → 6秒と間隔を広げる。相手が一時的に詰まっている場合に効く
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
