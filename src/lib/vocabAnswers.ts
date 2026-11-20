/**
 * Typed answers accepted for a flashcard (EN → ES recall). The card shows notation such as
 * "acabar de + infinitivo", "pasar (una llamada)", "el / la director/a" or "obligatorio, obligatoria";
 * the learner only has to type the expression itself.
 */
const ARTICLE = /^(el|la|los|las) /;

function fem(word: string): string {
  if (/[oe]$/.test(word)) return word.slice(0, -1) + 'a';
  return word + 'a';
}
/** "director/a" → ["director", "directora"]; leaves other words alone. */
function genderForms(phrase: string): string[] {
  if (!/\S\/a\b/.test(phrase)) return [phrase];
  const masc = phrase.replace(/(\S+)\/a\b/g, (_, w) => w);
  const f = phrase.replace(/(\S+)\/a\b/g, (_, w) => fem(w));
  return [masc, f];
}

export function acceptedAnswers(es: string): string[] {
  const out = new Set<string>([es]);
  // 1. Drop "+ infinitivo", "+ tiempo + gerundio"… and keep both versions of bracketed parts.
  let s = es.split(' + ')[0].trim();
  const bases = new Set<string>();
  if (/\(.*\)/.test(s)) {
    bases.add(s.replace(/\s*\([^)]*\)/g, '').trim());
    bases.add(s.replace(/[()]/g, '').replace(/\s+/g, ' ').trim());
  } else bases.add(s);

  for (const b of bases) {
    let variants: string[] = [];
    const elLa = b.match(/^el \/ la (.+)$/);
    if (elLa) {
      // "el / la compañero/a de trabajo" → el compañero de trabajo / la compañera de trabajo
      const [m, f] = genderForms(elLa[1]).length === 2 ? genderForms(elLa[1]) : [elLa[1], elLa[1]];
      variants = [`el ${m}`, `la ${f}`, m, f];
    } else if (b.includes(' / ')) {
      const [left, right] = b.split(' / ').map((x) => x.trim());
      const lw = left.split(' ');
      const rw = right.split(' ');
      if (rw.length === 1 && lw.length > 1) variants = [left, [...lw.slice(0, -1), right].join(' ')];
      else variants = [left, right];
    } else {
      const comma = b.match(/^(\S+), (\S+)$/);
      variants = comma && comma[1].slice(0, 3) === comma[2].slice(0, 3) ? [comma[1], comma[2]] : [b];
    }
    for (const v of variants) for (const g of genderForms(v)) out.add(g);
  }
  // 2. The article is optional.
  for (const a of [...out]) if (ARTICLE.test(a) && !a.includes(' / ')) out.add(a.replace(ARTICLE, ''));
  return [...out].filter(Boolean);
}
