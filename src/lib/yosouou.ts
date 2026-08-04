import fs from 'node:fs';
import path from 'node:path';
import races from '../data/races.json';

export interface Participant {
  id: string;
  radioName: string;
  totalPoints: number;
  rank: number;
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
        const totalPoints = parseInt(row[2] || '', 10);
        const rank = parseInt(row[3] || '', 10);

        participants.push({
          id,
          radioName,
          totalPoints: isNaN(totalPoints) ? 0 : totalPoints,
          rank: isNaN(rank) ? 0 : rank
        });
      }

      data = {
        participants,
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
