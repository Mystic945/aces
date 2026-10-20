// Measures how often the AI model picks the right risk level, on labelled
// sentences it has never seen (backend/ml/risk_test.jsonl).
//
//   npm run eval:risk
//   npm run eval:risk -- --model qwen3.5:4b
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const flag = process.argv.indexOf('--model');
if (flag !== -1) process.env.OLLAMA_MODEL = process.argv[flag + 1];
// Imported after the flag is read, so the model name takes effect.
const { MODEL, RISK_LEVELS, classifyRiskAppetite } = await import('../src/riskModel.js');

const file = fileURLToPath(new URL('../ml/risk_test.jsonl', import.meta.url));
const cases = readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

const matrix = Object.fromEntries(
  RISK_LEVELS.map((level) => [level, { Low: 0, Medium: 0, High: 0, none: 0 }]),
);
const wrong = [];
let correct = 0;
const started = Date.now();

console.log(`Testing ${MODEL} on ${cases.length} sentences…`);
for (const [i, { text, label }] of cases.entries()) {
  const ai = await classifyRiskAppetite(text);
  const got = ai?.riskLevel ?? 'none';
  matrix[label][got] += 1;
  if (got === label) correct += 1;
  else wrong.push({ expected: label, got, text });
  process.stdout.write(`\r${i + 1}/${cases.length}`);
}

const seconds = (Date.now() - started) / 1000;
console.log(`\n\nAccuracy: ${correct}/${cases.length} = ${((100 * correct) / cases.length).toFixed(1)}%`);
console.log(`Average time per sentence: ${(seconds / cases.length).toFixed(2)} s\n`);

console.log('Rows are the right answer, columns what the model said:');
console.table(matrix);

for (const level of RISK_LEVELS) {
  const row = matrix[level];
  const total = Object.values(row).reduce((sum, n) => sum + n, 0);
  console.log(`${level.padEnd(6)} right ${row[level]}/${total}`);
}

if (wrong.length > 0) {
  console.log('\nMistakes:');
  for (const { expected, got, text } of wrong) {
    console.log(`  expected ${expected.padEnd(6)} got ${got.padEnd(6)} ${text}`);
  }
}
