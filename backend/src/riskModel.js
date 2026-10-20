// Reads a lender's own words and decides their risk appetite with a local
// LLM (Qwen 3.5 by default) served by Ollama. When Ollama is not running, or
// the answer cannot be used, it returns null and the caller falls back to the
// lender's multiple-choice answer.

export const RISK_LEVELS = ['Low', 'Medium', 'High'];

// OLLAMA_URL= (empty) switches the model off, e.g. on hosts without Ollama.
const OLLAMA_URL = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/$/, '');
export const MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
// The first request loads the model into memory, which can take a while.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 30_000;

export const isModelConfigured = OLLAMA_URL !== '';

// Labelling rules, after the idea behind risk-tolerance questionnaires such as
// Grable & Lytton (1999): what the money is for and how a loss would feel.
const SYSTEM = `You read what a person says about the money they want to lend and decide their risk appetite.

Low: they cannot afford to lose this money, need it soon or for something essential (savings, emergency fund, fees, retirement, family), or they mainly want safety.
Medium: they accept some risk or a small loss for better returns than a bank deposit, but still care about safety.
High: they can afford to lose this money and want the highest returns, accepting large or frequent losses.

The purpose of the money matters more than age or confidence: "young but it is all my savings" is Low.
The text may be in English, Hindi or Hinglish.
Reply in JSON with a one-sentence reason first, then the level.`;

// A few worked examples. They are not in the test set used to measure accuracy.
const EXAMPLES = [
  ['This is money for my sister’s wedding next year, it has to be there.', 'Low', 'The money is needed for an essential family expense soon, so it cannot be lost.'],
  ['I want more than my FD gives me and can live with a small loss now and then.', 'Medium', 'They want better returns than a deposit and accept only small losses.'],
  ['Bonus money I do not need. Go for the biggest returns, losses do not scare me.', 'High', 'The money is spare and they explicitly accept losses for the highest returns.'],
];

const FORMAT = {
  type: 'object',
  properties: {
    reason: { type: 'string' },
    riskLevel: { type: 'string', enum: RISK_LEVELS },
  },
  required: ['reason', 'riskLevel'],
};

function messagesFor(text) {
  return [
    { role: 'system', content: SYSTEM },
    ...EXAMPLES.flatMap(([example, riskLevel, reason]) => [
      { role: 'user', content: example },
      { role: 'assistant', content: JSON.stringify({ reason, riskLevel }) },
    ]),
    { role: 'user', content: text },
  ];
}

/**
 * Asks the model for a risk level. Resolves to
 * `{ riskLevel, reason, model }`, or null when the model is unavailable or
 * its answer is unusable.
 */
export async function classifyRiskAppetite(text) {
  if (!isModelConfigured || !text) return null;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: messagesFor(text),
        stream: false,
        think: false,
        format: FORMAT,
        options: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Ollama responded ${response.status}`);
    const { message } = await response.json();
    const { riskLevel, reason } = JSON.parse(message.content);
    if (!RISK_LEVELS.includes(riskLevel)) throw new Error(`unexpected level ${riskLevel}`);
    return { riskLevel, reason: String(reason ?? '').trim().slice(0, 240), model: MODEL };
  } catch (error) {
    console.warn(`Risk model unavailable (${MODEL}): ${error.message}`);
    return null;
  }
}
