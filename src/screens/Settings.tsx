import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../state';
import { units, grammarPoints, unitLabel, CONTENT_VERSION } from '../lib/content';
import { exportBackup, importBackup, resetAll, requestPersistence, saveBook, removeBook, loadBook } from '../lib/db';
import { closeBook } from '../lib/book';
import { spanishVoices, speak, ttsSupported } from '../lib/tts';
import { Header } from '../components/common';

export function SettingsScreen() {
  const app = useApp();
  const { settings: s, updateSettings } = app;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(spanishVoices());
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ttsSupported) return;
    const on = () => setVoices(spanishVoices());
    speechSynthesis.addEventListener('voiceschanged', on);
    return () => speechSynthesis.removeEventListener('voiceschanged', on);
  }, []);
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  async function doExport() {
    const data = await exportBackup();
    const json = JSON.stringify(data);
    const name = `spanish-b1-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Spanish B1 Practice backup' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
      updateSettings({ lastBackup: Date.now() });
      setMsg(`Copia exportada: ${data.attempts.length} respuestas.`);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsg('No se pudo exportar: ' + (e as Error).message);
    }
  }

  async function doImport(f: File) {
    try {
      const n = await importBackup(JSON.parse(await f.text()));
      await app.reload();
      setMsg(`Importadas ${n} respuestas.`);
    } catch (e) {
      setMsg('Error: ' + (e as Error).message);
    }
  }

  async function doReset() {
    if (!confirm('¿Borrar todo tu progreso? Esto no se puede deshacer.')) return;
    if (!confirm('¿Seguro? Exporta una copia antes si la quieres guardar.')) return;
    await resetAll();
    await app.reload();
    setMsg('Progreso borrado.');
  }

  return (
    <div class="screen">
      <Header title="Ajustes" back="progress" />

      <label class="field">
        <span>Fecha del examen escrito</span>
        <input type="date" value={s.examDate} onChange={(e) => updateSettings({ examDate: e.currentTarget.value || '2027-01-18' })} />
      </label>
      <label class="field">
        <span>Unidad de tu clase («tu clase está aquí»)</span>
        <select value={String(s.classUnit)} onChange={(e) => updateSettings({ classUnit: Number(e.currentTarget.value) })}>
          {units
            .filter((u) => u.unit > 0)
            .map((u) => (
              <option value={String(u.unit)}>
                {unitLabel(u.unit)} · {u.title}
              </option>
            ))}
        </select>
      </label>
      <label class="field">
        <span>Foco</span>
        <select value={s.focus} onChange={(e) => updateSettings({ focus: e.currentTarget.value })}>
          <option value="past-tenses">Los pasados (recomendado)</option>
          <option value="none">Sin foco</option>
          {grammarPoints.map((g) => (
            <option value={g.id}>
              {g.unit ? `U${g.unit}` : 'Prog.'} · {g.title}
            </option>
          ))}
        </select>
      </label>
      <label class="field">
        <span>Tildes</span>
        <select value={s.accent} onChange={(e) => updateSettings({ accent: e.currentTarget.value as 'strict' | 'lenient' })}>
          <option value="lenient">Flexible: acepta sin tilde, pero avisa</option>
          <option value="strict">Estricto: sin tilde = error</option>
        </select>
      </label>
      <label class="field">
        <span>Duración de la sesión diaria</span>
        <select value={String(s.sessionMinutes)} onChange={(e) => updateSettings({ sessionMinutes: Number(e.currentTarget.value) })}>
          {[5, 10, 15, 20, 30, 45].map((m) => (
            <option value={String(m)}>{m} minutos</option>
          ))}
        </select>
      </label>
      <label class="field">
        <span>Voz (texto a voz)</span>
        {voices.length ? (
          <div class="row">
            <select value={s.voiceURI ?? ''} onChange={(e) => updateSettings({ voiceURI: e.currentTarget.value || null })}>
              <option value="">Automática (es-ES)</option>
              {voices.map((v) => (
                <option value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button onClick={() => speak('Esta mañana he perdido el autobús.', s.voiceURI, s.ttsRate)}>🔊</button>
          </div>
        ) : (
          <p class="small muted">No hay voces en español. En el iPhone: Ajustes → Accesibilidad → Leer y hablar (en versiones anteriores, «Contenido leído») → Voces → Español → España. Si no lo encuentras, escribe «Voces» en el buscador de Ajustes.</p>
        )}
      </label>
      <label class="field">
        <span>Velocidad de la voz</span>
        <select value={String(s.ttsRate)} onChange={(e) => updateSettings({ ttsRate: Number(e.currentTarget.value) })}>
          <option value="0.8">0,8×</option>
          <option value="1">1×</option>
        </select>
      </label>

      <h2>Copia de seguridad</h2>
      <p class="small muted">
        Tu progreso solo está en este iPhone. Exporta una copia cada 14 días.
        {s.lastBackup ? ` Última: ${new Date(s.lastBackup).toLocaleDateString('es-ES')}.` : ' Aún no has hecho ninguna.'}
      </p>
      <div class="row">
        <button class="btn-primary grow" onClick={doExport}>
          Exportar progreso
        </button>
        <label class="btn grow">
          Importar
          <input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => e.currentTarget.files?.[0] && doImport(e.currentTarget.files[0])} />
        </label>
      </div>
      {msg && <p class="small">{msg}</p>}
      <p class="small muted">
        Almacenamiento persistente: {persisted === null ? 'desconocido' : persisted ? 'sí ✓' : 'no'}{' '}
        {!persisted && (
          <button class="btn-small" onClick={async () => setPersisted(await requestPersistence())}>
            Solicitar
          </button>
        )}
      </p>

      <BookSettings />

      <h2>Zona peligrosa</h2>
      <button class="btn-block" style={{ color: 'var(--bad)' }} onClick={doReset}>
        Borrar todo el progreso
      </button>
      <p class="tiny muted" style={{ marginTop: 16 }}>
        Spanish B1 Practice · contenido {CONTENT_VERSION} · {app.attempts.length} respuestas guardadas
      </p>
    </div>
  );
}

function BookSettings() {
  const app = useApp();
  const [size, setSize] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadBook().then((b) => setSize(b ? b.size : null));
  }, [app.hasBook]);

  async function load(f: File) {
    if (f.type && f.type !== 'application/pdf') return setMsg('Elige un archivo PDF.');
    setLoading(true);
    setMsg('');
    try {
      await saveBook(f);
      await closeBook();
      await requestPersistence();
      app.setHasBook(true);
      setSize(f.size);
      setMsg('Libro guardado en este iPhone.');
    } catch (e) {
      setMsg('No se pudo guardar: ' + (e as Error).message + '. Prueba con una versión comprimida (30–50 MB).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Mi libro (PDF)</h2>
      <p class="small muted">
        Tu copia del libro se guarda solo en este iPhone. Nunca se sube a internet ni se incluye en las copias de seguridad. Comprímelo antes en el
        ordenador (30–50 MB) para que cargue rápido.
      </p>
      {size !== null ? (
        <>
          <p class="small">
            ✓ Libro cargado · {(size / 1048576).toFixed(1)} MB
          </p>
          <div class="row wrap">
            <button class="grow" onClick={() => app.openBook(10)}>
              ¿La página 10 muestra la Unidad 1?
            </button>
            <button
              class="grow"
              style={{ color: 'var(--bad)' }}
              onClick={async () => {
                if (!confirm('¿Quitar el libro de este iPhone?')) return;
                await removeBook();
                await closeBook();
                app.setHasBook(false);
                setSize(null);
              }}
            >
              Quitar libro
            </button>
          </div>
          <p class="tiny muted">
            Si la página 10 no es el inicio de la Unidad 1, abre ☰ en el visor y ajusta el desfase (ahora {app.settings.pageOffset}: página impresa +{' '}
            {app.settings.pageOffset} = página del PDF).
          </p>
        </>
      ) : (
        <label class="btn btn-block">
          {loading ? 'Guardando…' : 'Cargar mi libro (PDF)'}
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={(e) => e.currentTarget.files?.[0] && load(e.currentTarget.files[0])} />
        </label>
      )}
      {msg && <p class="small">{msg}</p>}
    </>
  );
}
