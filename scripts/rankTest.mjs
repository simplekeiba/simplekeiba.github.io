const compareForRank = (a, b) =>
  (b.totalPoints ?? 0) - (a.totalPoints ?? 0) ||
  b.firstPlaceCount - a.firstPlaceCount ||
  b.secondPlaceCount - a.secondPlaceCount;

function rankParticipants(participants) {
  const scored = participants.filter(p => p.totalPoints !== null);
  const unscored = participants.filter(p => p.totalPoints === null);
  const sorted = [...scored].sort(compareForRank);
  let rank = 0;
  sorted.forEach((p, i) => {
    if (i === 0 || compareForRank(sorted[i - 1], p) !== 0) rank = i + 1;
    p.rank = rank;
  });
  unscored.forEach(p => { p.rank = null; });
  return [...sorted, ...unscored];
}

const P = (id, pt, w, s) => ({ id, totalPoints: pt, firstPlaceCount: w, secondPlaceCount: s, rank: null });
const show = rs => rs.map(r => `${r.rank ?? '-'}位 ${r.id}(${r.totalPoints ?? '-'}pt 1着${r.firstPlaceCount} 2着${r.secondPlaceCount})`).join('  ');
let ng = 0;
function check(label, result, pick, expected) {
  const actual = result.map(pick);
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) ng++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  console.log(`     ${show(result)}`);
  if (!ok) console.log(`     期待: ${JSON.stringify(expected)} / 実際: ${JSON.stringify(actual)}`);
}

console.log('ケース1：合計ポイントが異なる');
check('ポイントが高い人が上位', rankParticipants([P('A',5,1,0),P('B',8,1,1),P('C',1,0,0)]), x=>x.id, ['B','A','C']);

console.log('\nケース2：合計同点、1着的中数が異なる');
check('1着の多いBが上位', rankParticipants([P('A',10,1,1),P('B',10,2,0)]), x=>x.id, ['B','A']);

console.log('\nケース3：合計・1着が同じ、2着が異なる');
check('2着の多いBが上位', rankParticipants([P('A',8,1,0),P('B',8,1,1)]), x=>x.id, ['B','A']);

console.log('\nケース4：3項目すべて同じ（同順位・順位飛ばし）');
check('1,1,1,4 になる', rankParticipants([P('A',5,1,0),P('B',5,1,0),P('C',5,1,0),P('D',1,0,0)]), x=>x.rank, [1,1,1,4]);

console.log('\nケース5：0点・無効応募（-）の扱い');
check('無効は順位なし＆最後尾、0点には順位が付く', rankParticipants([P('invalid',null,0,0),P('zero',0,0,0),P('top',5,1,0)]), x=>[x.id,x.rank], [['top',1],['zero',2],['invalid',null]]);

console.log('\nケース6：レース結果更新後の再計算');
console.log(`     更新前: ${show(rankParticipants([P('A',5,1,0),P('B',5,1,0)]))}`);
check('1着が増えたAが上位へ', rankParticipants([P('A',10,2,0),P('B',10,1,2)]), x=>x.id, ['A','B']);

console.log('\nケース7：同順位内は応募順（CSVの並び）が保たれる');
check('入力の並びのまま', rankParticipants([P('p-003',5,1,0),P('p-001',5,1,0),P('p-002',5,1,0)]), x=>x.id, ['p-003','p-001','p-002']);

console.log('\nケース8：1位が複数名（抽選対象）');
check('1位が2名、次は3位', rankParticipants([P('A',20,3,1),P('B',20,3,1),P('C',15,2,2)]), x=>x.rank, [1,1,3]);

console.log(ng === 0 ? '\n→ 全8ケース合格' : `\n→ ${ng}件 失敗`);
process.exit(ng === 0 ? 0 : 1);
