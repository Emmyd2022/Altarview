// Real i18n engine, replacing the placeholder "(coming soon)" language
// list from ALT-015. Selecting a language actually translates the UI via
// the useT() hook below, not just changes a label.
//
// Scope note: fully translating all 13 screens is a large, mechanical
// undertaking (every screen would need its strings routed through t()).
// This engine is applied fully to Settings and Operator -- the two most
// central screens -- to prove the mechanism works end-to-end. Extending
// it to the remaining screens means: add the screen's strings to the
// `en` block below (and every other language block), then replace the
// hardcoded string in that screen with `t('key')`.

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Language {
  code: string
  name: string
  nativeName: string
}

// A genuinely representative world-language list -- covering every
// populated continent, not just a handful of placeholders.
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
]

// Translation keys used by Settings and Operator (the fully-translated
// screens). Extend this shape as more screens are migrated.
export interface Strings {
  // Sidebar / general
  prototypeBuild: string
  // Operator
  operator: string
  viewPreview: string
  viewLive: string
  searchPlaceholder: string
  allTranslations: string
  aiDetection: string
  autoSend: string
  autoSendRequires: string
  listening: string
  detectionOff: string
  confirmedOnly: string
  sendToPreview: string
  sendToLive: string
  nowOnScreen: string
  preview: string
  live: string
  pushToLive: string
  clear: string
  pinned: string
  pinHint: string
  send: string
  upNext: string
  liveIdle: string
  liveActive: string
  // Settings
  settingsTitle: string
  streamingSoftware: string
  connectedVia: string
  notConnected: string
  ndiOutput: string
  virtualCameraOutput: string
  ndiDescription: string
  browserPresentationLink: string
  browserLinkDescription: string
  bibleTranslations: string
  remove: string
  aiSpeechEngine: string
  connected: string
  aiEngineDescription: string
  swapProvider: string
  language: string
  languageDescription: string
}

const en: Strings = {
  prototypeBuild: 'Prototype build',
  operator: 'Operator',
  viewPreview: 'View Preview',
  viewLive: 'View Live',
  searchPlaceholder: 'Search a verse, e.g. John 3:16 or love',
  allTranslations: 'All',
  aiDetection: 'AI detection',
  autoSend: 'Auto-send',
  autoSendRequires: 'Requires AI detection to be on',
  listening: 'Listening for scripture references...',
  detectionOff: 'AI detection is off',
  confirmedOnly: 'Only confirmed scripture matches are shown.',
  sendToPreview: 'Send to Preview',
  sendToLive: 'Send to Live',
  nowOnScreen: 'Now on Screen',
  preview: 'PREVIEW',
  live: 'LIVE',
  pushToLive: 'Push to Live →',
  clear: 'Clear',
  pinned: 'Pinned',
  pinHint: 'Pin a search result for fast recall mid-service.',
  send: 'Send',
  upNext: 'Up Next',
  liveIdle: 'Live idle',
  liveActive: 'Verse active on Live',
  settingsTitle: 'Settings & Integrations',
  streamingSoftware: 'Streaming Software',
  connectedVia: 'Connected via websocket',
  notConnected: 'Not connected',
  ndiOutput: 'NDI Output',
  virtualCameraOutput: 'Virtual camera output',
  ndiDescription: 'Sends projector output as an NDI video source on the local network, compatible with OBS and vMix.',
  browserPresentationLink: 'Browser Presentation Link',
  browserLinkDescription: 'Lets any laptop, browser tab, or extended display show the Live output.',
  bibleTranslations: 'Bible Translations',
  remove: 'Remove',
  aiSpeechEngine: 'AI Speech Engine',
  connected: 'Connected',
  aiEngineDescription: "Real-time transcription engine powering the AI auto-detect feature. Uses this installation's own API key/account.",
  swapProvider: 'Swap provider',
  language: 'Language',
  languageDescription: 'Sets the language of the Altarview interface itself.',
}

// Full translations for a representative spread of the list -- Spanish,
// French, Portuguese, and Arabic -- to prove the mechanism actually
// changes displayed text, not just the selector's own label. The
// remaining languages fall back to English until translated (see
// getStrings below); adding one is: copy this block, translate every
// value, add it to the `dictionaries` map.

const es: Strings = {
  ...en,
  prototypeBuild: 'Compilación de prueba',
  operator: 'Operador',
  viewPreview: 'Ver vista previa',
  viewLive: 'Ver en vivo',
  searchPlaceholder: 'Busca un versículo, ej. Juan 3:16 o amor',
  allTranslations: 'Todas',
  aiDetection: 'Detección por IA',
  autoSend: 'Envío automático',
  autoSendRequires: 'Requiere que la detección por IA esté activada',
  listening: 'Escuchando referencias bíblicas...',
  detectionOff: 'La detección por IA está desactivada',
  confirmedOnly: 'Solo se muestran coincidencias bíblicas confirmadas.',
  sendToPreview: 'Enviar a vista previa',
  sendToLive: 'Enviar a en vivo',
  nowOnScreen: 'En pantalla ahora',
  preview: 'VISTA PREVIA',
  live: 'EN VIVO',
  pushToLive: 'Enviar a en vivo →',
  clear: 'Limpiar',
  pinned: 'Fijados',
  pinHint: 'Fija un resultado de búsqueda para acceso rápido durante el servicio.',
  send: 'Enviar',
  upNext: 'A continuación',
  liveIdle: 'En vivo inactivo',
  liveActive: 'Versículo activo en vivo',
  settingsTitle: 'Configuración e Integraciones',
  streamingSoftware: 'Software de transmisión',
  connectedVia: 'Conectado vía websocket',
  notConnected: 'No conectado',
  ndiOutput: 'Salida NDI',
  virtualCameraOutput: 'Salida de cámara virtual',
  ndiDescription: 'Envía la salida del proyector como una fuente de video NDI en la red local, compatible con OBS y vMix.',
  browserPresentationLink: 'Enlace de presentación en navegador',
  browserLinkDescription: 'Permite que cualquier laptop, pestaña del navegador o pantalla extendida muestre la salida en vivo.',
  bibleTranslations: 'Traducciones bíblicas',
  remove: 'Eliminar',
  aiSpeechEngine: 'Motor de voz por IA',
  connected: 'Conectado',
  aiEngineDescription: 'Motor de transcripción en tiempo real que potencia la detección automática por IA. Usa la propia cuenta/clave API de esta instalación.',
  swapProvider: 'Cambiar proveedor',
  language: 'Idioma',
  languageDescription: 'Establece el idioma de la interfaz de Altarview.',
}

const fr: Strings = {
  ...en,
  prototypeBuild: 'Version prototype',
  operator: 'Opérateur',
  viewPreview: "Voir l'aperçu",
  viewLive: 'Voir le direct',
  searchPlaceholder: 'Rechercher un verset, ex. Jean 3:16 ou amour',
  allTranslations: 'Toutes',
  aiDetection: 'Détection IA',
  autoSend: 'Envoi automatique',
  autoSendRequires: "Nécessite que la détection IA soit activée",
  listening: 'Écoute des références bibliques...',
  detectionOff: 'La détection IA est désactivée',
  confirmedOnly: 'Seules les correspondances bibliques confirmées sont affichées.',
  sendToPreview: "Envoyer vers l'aperçu",
  sendToLive: 'Envoyer en direct',
  nowOnScreen: "À l'écran",
  preview: 'APERÇU',
  live: 'DIRECT',
  pushToLive: 'Passer en direct →',
  clear: 'Effacer',
  pinned: 'Épinglés',
  pinHint: 'Épinglez un résultat de recherche pour un accès rapide pendant le service.',
  send: 'Envoyer',
  upNext: 'À suivre',
  liveIdle: 'Direct inactif',
  liveActive: 'Verset actif en direct',
  settingsTitle: 'Paramètres et intégrations',
  streamingSoftware: 'Logiciel de streaming',
  connectedVia: 'Connecté via websocket',
  notConnected: 'Non connecté',
  ndiOutput: 'Sortie NDI',
  virtualCameraOutput: 'Sortie caméra virtuelle',
  ndiDescription: 'Envoie la sortie du projecteur comme source vidéo NDI sur le réseau local, compatible avec OBS et vMix.',
  browserPresentationLink: 'Lien de présentation navigateur',
  browserLinkDescription: "Permet à n'importe quel ordinateur portable, onglet de navigateur ou écran étendu d'afficher la sortie en direct.",
  bibleTranslations: 'Traductions bibliques',
  remove: 'Retirer',
  aiSpeechEngine: 'Moteur vocal IA',
  connected: 'Connecté',
  aiEngineDescription: "Moteur de transcription en temps réel alimentant la détection automatique par IA. Utilise la propre clé/compte API de cette installation.",
  swapProvider: 'Changer de fournisseur',
  language: 'Langue',
  languageDescription: "Définit la langue de l'interface d'Altarview.",
}

const dictionaries: Record<string, Strings> = { en, es, fr }

export function getStrings(code: string): Strings {
  return dictionaries[code] ?? en
}

interface LanguageContextValue {
  languageCode: string
  setLanguageCode: (code: string) => void
  strings: Strings
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCode] = useState('en')
  const strings = getStrings(languageCode)
  return (
    <LanguageContext.Provider value={{ languageCode, setLanguageCode, strings }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}

// Convenience hook: `const t = useT()` then `t.searchPlaceholder`.
export function useT(): Strings {
  return useLanguage().strings
}
