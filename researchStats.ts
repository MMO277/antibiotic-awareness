import { QUESTIONS } from './quizData';

export type Level = 'know' | 'partial' | 'dont';

/** One saved survey response, as read from Firestore. */
export interface Resp {
  id: string;
  name: string; // older responses (before name/age) fall back to their random code
  age: number | null;
  phase: string;
  answers: (number | null)[];
  lang: string;
}
export interface Row extends Resp {
  score: number;
  total: number;
  pct: number;
  level: Level;
}

/** Knowledge level from the percentage of correct answers: 75%+ = know, 50-74% = partial, below 50% = don't. */
export const levelOf = (pct: number): Level => (pct >= 75 ? 'know' : pct >= 50 ? 'partial' : 'dont');

export function toRow(r: Resp): Row {
  const total = QUESTIONS.length;
  const score = r.answers.filter((a, i) => QUESTIONS[i] && a === QUESTIONS[i].answer).length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  return { ...r, score, total, pct, level: levelOf(pct) };
}

export interface Dist { n: number; know: number; partial: number; dont: number; avg: number } // know/partial/dont are percentages

export function distribution(rows: Row[]): Dist {
  const n = rows.length;
  if (!n) return { n: 0, know: 0, partial: 0, dont: 0, avg: 0 };
  const c = { know: 0, partial: 0, dont: 0 };
  rows.forEach((r) => c[r.level]++);
  const p = (x: number) => Math.round((x / n) * 100);
  return {
    n,
    know: p(c.know),
    partial: p(c.partial),
    dont: p(c.dont),
    avg: Math.round(rows.reduce((s, r) => s + r.pct, 0) / n),
  };
}

export const AGE_GROUPS = [
  { key: 'u18', ar: 'أقل من 18', en: 'Under 18', fr: 'Moins de 18 ans', es: 'Menores de 18', de: 'Unter 18 Jahren', min: 0, max: 17 },
  { key: '18-29', ar: '18–29', en: '18–29', fr: '18–29 ans', es: '18–29 años', de: '18–29 Jahre', min: 18, max: 29 },
  { key: '30-44', ar: '30–44', en: '30–44', fr: '30–44 ans', es: '30–44 años', de: '30–44 Jahre', min: 30, max: 44 },
  { key: '45+', ar: '45 فأكثر', en: '45+', fr: '45 ans et plus', es: '45+ años', de: 'Ab 45 Jahren', min: 45, max: 200 },
];

export function byAge(rows: Row[]) {
  return AGE_GROUPS.map((g) => ({
    g,
    d: distribution(rows.filter((r) => r.age !== null && r.age >= g.min && r.age <= g.max)),
  })).filter((x) => x.d.n > 0);
}

/** Percentage of respondents who answered each question correctly. */
export function perQuestion(rows: Row[]): number[] {
  return QUESTIONS.map((q, i) =>
    rows.length ? Math.round((rows.filter((r) => r.answers[i] === q.answer).length / rows.length) * 100) : 0,
  );
}
