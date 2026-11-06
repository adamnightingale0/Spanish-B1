/** Which kind of device the app is running on, so instructions can match it. */
export type Platform = 'ios' | 'android' | 'desktop';

export function platform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export const INSTALL_HINT: Record<Platform, string> = {
  ios: 'en Safari, pulsa Compartir → Añadir a pantalla de inicio.',
  android: 'en Chrome, abre el menú ⋮ → Instalar aplicación (o Añadir a pantalla de inicio).',
  desktop: 'en Chrome o Edge, pulsa el icono de instalar que aparece en la barra de direcciones.'
};

export const VOICE_HINT: Record<Platform, string> = {
  ios: 'Ajustes → Accesibilidad → Leer y hablar (en versiones anteriores, «Contenido leído») → Voces → Español → España. Si no lo encuentras, escribe «Voces» en el buscador de Ajustes.',
  android: 'Ajustes → Sistema → Idiomas → Salida de texto a voz → Motor de Google → Instalar datos de voz → Español (España). Los nombres pueden variar según el móvil.',
  desktop: 'instala una voz en español (España) en la configuración de idioma o de voz de tu sistema operativo y reinicia el navegador.'
};
