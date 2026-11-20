import type { ClozeItem, DrillItem } from './schema';

/**
 * When a story (cloze) has mistakes, only the sentences with wrong gaps come back, not the whole story.
 * A sentence with one wrong gap becomes a short gap item; other gaps in it are shown filled in. A sentence
 * with several wrong gaps stays a one-sentence cloze. Attempts are still logged as `<story id>#<gap>`.
 */
export function clozeRetryItems(item: ClozeItem, wrong: number[]): DrillItem[] {
  const sentences = item.text.split(/(?<=[.!?…])\s+/);
  const out: DrillItem[] = [];
  for (const s of sentences) {
    const ns = [...s.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const missed = ns.filter((n) => wrong.includes(n));
    if (!missed.length) continue;
    // Gaps that were right are filled in with the answer.
    const text = s.replace(/\{\{(\d+)\}\}/g, (m, n) => (missed.includes(Number(n)) ? m : (item.gaps.find((g) => g.n === Number(n))?.answers[0] ?? m)));
    if (missed.length === 1) {
      const g = item.gaps.find((x) => x.n === missed[0])!;
      out.push({
        id: `${item.id}#${g.n}`,
        type: 'gap',
        unit: item.unit,
        grammarPoint: item.grammarPoint,
        subPoint: item.subPoint,
        difficulty: item.difficulty,
        prompt: text.replace(`{{${g.n}}}`, '___'),
        answers: g.answers,
        feedback: g.feedback,
        why: g.why
      });
    } else {
      out.push({ ...item, title: `${item.title} (repaso)`, text, gaps: item.gaps.filter((g) => missed.includes(g.n)) });
    }
  }
  return out;
}
