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
 * 日付を日本時間 (Asia/Tokyo) 基準の「M月D日 H:mm」形式でフォーマットする
 */
export function formatDateTimeJa(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  return formatter.format(d);
}
