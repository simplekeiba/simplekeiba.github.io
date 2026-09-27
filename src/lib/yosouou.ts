import fs from 'node:fs';
import path from 'node:path';
import races from '../data/races.json';

export interface Participant {
  id: string;
  radioName: string;
  /**
   * 合計ポイント。締切に間に合った応募が1件も無い参加者は null。
   *
   * 公開用シートはその場合 `-` を返す（docs/spec.md §4.8.3）。
   * 0点は「指名したが当たらなかった」を意味するため、
   * 「応募が有効にならなかった」と同じ表記にはしない。
   */
  totalPoints: number | null;
  /** 順位。totalPoints が null の参加者には順位が付かないため null */
  rank: number | null;
}

export interface YosououData {
  participants: Participant[];
  updatedAt: string;
  asOfRace: string;
  fetchFailed: boolean;
}

export interface RaceInfo {
  name: string;
  date: string;
  deadline: string;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQamc6PIHXPn5Ln4xi7vW-_phWAh_wJxcQmJXQvIqpOAurfUQCGYfFsakA6NCg2SAvUuNYv7HjVqh4h/pub?gid=494369567&single=true&output=csv';
const CACHE_PATH = path.resolve(process.cwd(), 'src/data/yosouou-cache.json');

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * 公開用シートの数値セルを読む。`-`（有効な応募が無い参加者）や
 * 空欄は null にして、0点と区別できるようにする（docs/spec.md §4.8.3）。
 */
function parsePoints(raw: string | undefined): number | null {
  const value = raw?.trim() ?? '';
  if (value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * 順位の昇順に並べ替える。CSVは応募順で出力されるため、
 * ここで並べ替えないとランキングの体をなさない（docs/spec.md §4.8.3）。
 * 順位の無い参加者は最後尾。同順位内の並びは応募順のまま。
 */
function sortByRank(participants: Participant[]): Participant[] {
  return [...participants].sort((a, b) => {
    if (a.rank === b.rank) return 0;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });
}

export async function fetchYosououData(): Promise<YosououData> {
  let fetchFailed = false;
  let data: YosououData = {
    participants: [],
    updatedAt: '',
    asOfRace: '',
    fetchFailed: false
  };

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length > 0) {
      let updatedAt = '';
      let asOfRace = '';
      const participants: Participant[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        
        if (i === 1) {
          updatedAt = row[5] || '';
          asOfRace = row[6] || '';
        }

        const id = row[0]?.trim();
        if (!id) continue;

        const radioName = row[1]?.trim() || '';

        participants.push({
          id,
          radioName,
          totalPoints: parsePoints(row[2]),
          rank: parsePoints(row[3])
        });
      }

      data = {
        participants: sortByRank(participants),
        updatedAt,
        asOfRace,
        fetchFailed: false
      };

      try {
        fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
        fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('Failed to write yosouou-cache.json:', writeErr);
      }
      return data;
    }
  } catch (err) {
    console.error('Error fetching yosouou data:', err);
    fetchFailed = true;
  }

  if (fetchFailed) {
    try {
      if (fs.existsSync(CACHE_PATH)) {
        const cachedContent = fs.readFileSync(CACHE_PATH, 'utf-8');
        data = JSON.parse(cachedContent);
      }
    } catch (readErr) {
      console.error('Failed to read yosouou-cache.json:', readErr);
    }
    data.fetchFailed = true;
  }

  return data;
}

export function getNextRace(): RaceInfo | null {
  const now = new Date();
  
  for (const race of races) {
    const deadline = new Date(race.deadline);
    if (now <= deadline) {
      return race as RaceInfo;
    }
  }
  return null;
}

/**
 * 秋のGⅠ予想王決定戦の企画期間中（2026年9月〜12月末、日本時間）かどうかを判定する
 */
export function isYosououCampaignActive(now: Date = new Date()): boolean {
  const start = new Date('2026-09-01T00:00:00+09:00');
  const end = new Date('2026-12-31T23:59:59+09:00');
  return now >= start && now <= end;
}

export function getFinishedRacesCount(): number {
  const now = new Date();
  let count = 0;
  for (const race of races) {
    const deadline = new Date(race.deadline);
    if (now > deadline) {
      count++;
    }
  }
  return count;
}

/**
 * 集計がまだ始まっていない状態か。
 *
 * 公開用シートの `as_of_race` が「準備中」のままなら、レース結果は
 * 1つも反映されていない。この間は「最終更新」を表示しない。
 *
 * 理由：`updated_at` は運営が手で書き換える値であり（§6.5、ビルド時刻を
 * 自動表示すると中身が変わっていないのに更新したことになるため）、
 * 集計開始前は運営がセルを最後に触った日が出るだけになる。
 * 参加者が知りたいのは「自分の点がいつ入るか」であって、その日付ではない。
 */
export function isBeforeFirstAggregation(data: YosououData): boolean {
  const asOf = data.asOfRace.trim();
  return asOf === '' || asOf === '準備中';
}

/**
 * 初回集計の予定日。第1レースの翌日（月曜）に初回ランキングを更新する運用
 * （§12 のスケジュールに合わせる）。対象レースが無い場合は null。
 */
export function getFirstAggregationDate(): Date | null {
  const first = races[0];
  if (!first) return null;
  const raceDay = new Date(`${first.date}T00:00:00+09:00`);
  raceDay.setDate(raceDay.getDate() + 1);
  return raceDay;
}
