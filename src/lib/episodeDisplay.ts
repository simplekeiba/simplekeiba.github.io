/**
 * 尺 (HH:MM:SS または MM:SS) を簡潔な表記にする
 */
export function formatEpisodeDuration(duration: string): string {
  if (!duration) return '--:--';
  const parts = duration.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const s = parts[2];
    if (h > 0) {
      return `${h}:${m}:${s}`;
    } else {
      return `${parseInt(m, 10)}:${s}`;
    }
  }
  return duration;
}

/**
 * タイトル末尾の「#219」のような話数表記を削除する
 */
export function cleanEpisodeTitle(title: string): string {
  if (!title) return '';
  return title.replace(/[#＃]\d+\s*$/, '').trim();
}
