import type { DrillItem, UnitPack, FocusPack, GrammarPoint, ExamProfile, WhyId, VocabCard } from './schema';
import gpData from '../../content/grammar-points.json';
import focusData from '../../content/focus/past-tenses.json';
import usb1 from '../../content/exam-profiles/us-b1.json';
import manifest from '../../content/manifest.json';

// All unit packs are bundled into the JS, so they are precached with the app and work offline.
const unitModules = import.meta.glob('../../content/units/*.json', { eager: true, import: 'default' });

export const CONTENT_VERSION = manifest.version;
export const grammarPoints = gpData as unknown as GrammarPoint[];
export const gpById = new Map(grammarPoints.map((g) => [g.id, g]));
export const focus = focusData as unknown as FocusPack;
export const examProfile = usb1 as unknown as ExamProfile;

export const units: UnitPack[] = Object.values(unitModules as Record<string, UnitPack>).sort(
  (a, b) => (a.unit || 99) - (b.unit || 99)
);
export const unitByNumber = new Map(units.map((u) => [u.unit, u]));

const vocabModules = import.meta.glob('../../content/vocab/*.json', { eager: true, import: 'default' });
export const vocabCards: VocabCard[] = Object.values(vocabModules as Record<string, { cards: VocabCard[] }>)
  .flatMap((p) => p.cards)
  .sort((a, b) => a.unit - b.unit);
export const cardById = new Map(vocabCards.map((c) => [c.id, c]));

export const allItems: DrillItem[] = [...focus.items, ...units.flatMap((u) => u.items)];
export const itemById = new Map(allItems.map((i) => [i.id, i]));

export const PAST_POINTS = new Set(['past-review', 'pluscuamperfecto', 'past-combined']);
export const isFocusItem = (i: DrillItem) => PAST_POINTS.has(i.grammarPoint);

export const unitLabel = (n: number) => (n === 0 ? 'Programa' : `Unidad ${n}`);

export const WHY_LABELS: Record<WhyId, { es: string; en: string }> = {
  'time-marker-open': { es: 'Periodo abierto / experiencia', en: 'hoy, este año, ya, alguna vez' },
  'time-marker-closed': { es: 'Periodo cerrado', en: 'ayer, en 2019, hace dos años' },
  'completed-action': { es: 'Acción terminada', en: 'an event that moves the story on' },
  'background-description': { es: 'Descripción / contexto', en: 'scene, circumstances, states' },
  habit: { es: 'Hábito', en: 'repeated past action' },
  'interrupted-action': { es: 'Acción en curso', en: 'in progress when something happened' },
  'prior-past': { es: 'Anterior a otro pasado', en: 'pluscuamperfecto' }
};

export const TYPE_LABELS: Record<DrillItem['type'], string> = {
  gap: 'Completar',
  choice: 'Elegir',
  conjugate: 'Conjugar',
  transform: 'Transformar',
  cloze: 'Historia (cloze)',
  error: 'Encontrar el error',
  order: 'Ordenar',
  match: 'Relacionar'
};

export function bookRefFor(item: DrillItem): { page: number; masEjercicios?: number; masGramatica?: number; ejercicios?: string } | undefined {
  return gpById.get(item.grammarPoint)?.bookRef ?? unitByNumber.get(item.unit)?.bookRef;
}
