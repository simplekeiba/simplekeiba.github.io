import fs from 'node:fs';
import path from 'node:path';
import races from '../data/races.json';
import { fetchTextWithRetry } from './fetchWithRetry';

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
  /**
   * 1着を当てた回数。同点時の第2基準（docs/spec.md §4.8.3）。
   * 公開用シートの `first_place` 列。
   */
  firstPlaceCount: number;
  /** 2着を当てた回数。同点時の第3基準。公開用シートの `second_place` 列 */
  secondPlaceCount: number;
  /**
   * 順位。totalPoints が null の参加者には順位が付かないため null。
   *
   * **公開用シートの `rank` 列は読まず、`rankParticipants()` で計算する。**
   * 同点時の判定（1着的中数 → 2着的中数）の実装を1か所に集めるため。
   */
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

/** 公開用シートの回数セル。空や非数値は0として扱う */
function parseCount(raw: string | undefined): number {
  const parsed = Number.parseInt((raw ?? '').trim(), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * 順位決定の比較関数（docs/spec.md §4.8.3）。
 * 合計ポイント → 1着的中数 → 2着的中数 の順に比較し、
 * 3つとも同じなら 0 を返す（＝同順位）。
 *
 * **participant_id を比較に含めないこと。** 含めると同順位が発生しなくなる。
 */
function compareForRank(a: Participant, b: Participant): number {
  return (
    (b.totalPoints ?? 0) - (a.totalPoints ?? 0) ||
    b.firstPlaceCount - a.firstPlaceCount ||
    b.secondPlaceCount - a.secondPlaceCount
  );
}

/**
 * 順位を付けて並べ替える（docs/spec.md §4.8.3）。
 *
 * 同順位が出たら次の順位を飛ばす（例：1位, 2位, 2位, 4位）。
 * 有効な応募が無い参加者（得点が `-`）は順位を付けず、常に最後尾へ置く。
 *
 * 並べ替えは安定ソートなので、3項目すべてが同じ参加者どうしは
 * CSVの並び（＝participant_id順＝応募順）のまま残る。
 */
function rankParticipants(participants: Participant[]): Participant[] {
  const scored = participants.filter((p) => p.totalPoints !== null);
  const unscored = participants.filter((p) => p.totalPoints === null);

  const sorted = [...scored].sort(compareForRank);

  let rank = 0;
  sorted.forEach((participant, index) => {
    if (index === 0 || compareForRank(sorted[index - 1], participant) !== 0) {
      rank = index + 1;
    }
    participant.rank = rank;
  });
  unscored.forEach((participant) => {
    participant.rank = null;
  });

  return [...sorted, ...unscored];
}

/** 公開用シートのCSV。ヘッダー行があるかどうかで中身を確かめる */
function fetchRankingCsv(): Promise<string> {
  return fetchTextWithRetry(CSV_URL, {
    label: 'ランキングCSV',
    validate: (text) => text.includes('participant_id')
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
    const csvText = await fetchRankingCsv();
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
          firstPlaceCount: parseCount(row[7]),
          secondPlaceCount: parseCount(row[8]),
          rank: null
        });
      }

      data = {
        participants: rankParticipants(participants),
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
    // ここに来るとページに赤い警告が出てキャッシュが表示される。
    // ビルドログで原因を追えるよう、理由を残す
    console.error('[yosouou] CSVを取得できなかったため、キャッシュJSONで継続します:', err);
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
