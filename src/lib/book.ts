/** The user's own copy of the textbook, rendered with pdf.js (legacy build for older iOS Safari). */
import { loadBook } from './db';

type PDFDoc = { numPages: number; getPage(n: number): Promise<PDFPage>; destroy(): Promise<void> };
type PDFPage = {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; canvas?: HTMLCanvasElement }): { promise: Promise<void>; cancel(): void };
  cleanup(): void;
};

let docPromise: Promise<PDFDoc | null> | null = null;

export async function openBook(): Promise<PDFDoc | null> {
  if (!docPromise) {
    docPromise = (async () => {
      const blob = await loadBook();
      if (!blob) return null;
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const data = new Uint8Array(await blob.arrayBuffer());
      return (await pdfjs.getDocument({ data }).promise) as unknown as PDFDoc;
    })().catch((e) => {
      docPromise = null;
      throw e;
    });
  }
  return docPromise;
}

/** Call after the stored PDF changes (loaded or removed). */
export async function closeBook() {
  const p = docPromise;
  docPromise = null;
  const d = await p?.catch(() => null);
  await d?.destroy();
}

/** Keep each canvas under ~8 MP; Safari kills pages that use too much canvas memory. */
const MAX_PIXELS = 8_000_000;

export async function renderPage(doc: PDFDoc, pageNo: number, canvas: HTMLCanvasElement, cssWidth: number, zoom = 1): Promise<() => void> {
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let scale = (cssWidth / base.width) * zoom * dpr;
  const px = base.width * base.height * scale * scale;
  if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
  const vp = page.getViewport({ scale });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  canvas.style.width = `${cssWidth * zoom}px`;
  canvas.style.height = `${(cssWidth * zoom * base.height) / base.width}px`;
  const ctx = canvas.getContext('2d')!;
  const task = page.render({ canvasContext: ctx, viewport: vp, canvas });
  await task.promise;
  page.cleanup();
  return () => task.cancel();
}

/** Free a canvas's backing store (Safari counts it against the page's canvas memory). */
export function freeCanvas(c: HTMLCanvasElement | null) {
  if (!c) return;
  c.width = 0;
  c.height = 0;
}

export const UNIT_STARTS = [10, 24, 38, 52, 66, 80, 94, 108, 122, 136, 150, 164];
export const MAS_EJERCICIOS = 178;
export const MAS_GRAMATICA = 263;
