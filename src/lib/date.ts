/**
 * 日付を日本時間 (Asia/Tokyo) 基準の YYYY.MM.DD 形式でフォーマットする
 */
export function formatDateJa(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // ja-JP のデフォルトは YYYY/MM/DD なのでスラッシュをドットに置換
  return formatter.format(d).replace(/\//g, '.');
}

/**
 * 締切日時を日本時間 (Asia/Tokyo) 基準の「M月D日（曜）HH:mm」形式で
 * フォーマットする（例: 10月17日（土）23:59）。
 *
 * 曜日を入れているのは、締切が土曜の夜という「気づいたときには過ぎている」
 * タイミングに集中しているため。日付だけでは何曜日か分からない。
 * `formatDeadlineJa` は同じ情報を英字の詰まった形（10.17 SAT 23:59）で返す。
 * 読ませたい場所ではこちら、データ的に並べる場所では向こうを使う。
 */
export function formatDeadlineDateTimeJa(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  // ja-JP は「10月17日(土) 23:59」を返すため、括弧を全角に揃えて余白を詰める
  return formatter.format(d).replace('(', '（').replace(') ', '）');
}

/**
 * 日付を日本時間 (Asia/Tokyo) 基準の「MM.DD DOW」形式でフォーマットする（例: 09.27 SUN）
 */
export function formatDateShortJa(date: Date | string | number): string {
  const d = new Date(date);
  const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit'
  });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short'
  });
  return `${dateFormatter.format(d).replace(/\//g, '.')} ${weekdayFormatter.format(d).toUpperCase()}`;
}

/**
 * 締切日時を日本時間 (Asia/Tokyo) 基準の「MM.DD DOW HH:mm」形式でフォーマットする（例: 09.26 SAT 23:59）
 */
export function formatDeadlineJa(date: Date | string | number): string {
  const d = new Date(date);
  const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${formatDateShortJa(d)} ${timeFormatter.format(d)}`;
}

/**
 * レースの発走日を日本時間 (Asia/Tokyo) 基準の「M月D日（曜）」形式でフォーマットする（例: 9月13日（日））
 */
export function formatRaceDateJa(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
  // ja-JP は「9月13日(日)」を返すため、半角括弧を全角に揃える
  return formatter.format(d).replace('(', '（').replace(')', '）');
}

/**
 * レースの発走時刻を日本時間 (Asia/Tokyo) 基準の「HH:mm」形式でフォーマットする（例: 15:45）
 */
export function formatRaceTimeJa(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(d);
}
