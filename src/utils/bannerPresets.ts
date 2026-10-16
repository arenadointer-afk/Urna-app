import { BannerSettings } from '../types';

export interface BannerPreset {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

// 1. Preset Oficial: Batalha de Votos Eleições 2026
export const BANNER_PRESET_ELEICOES = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231e1b4b"/>
      <stop offset="50%" stop-color="%230f172a"/>
      <stop offset="100%" stop-color="%23172554"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23f59e0b"/>
      <stop offset="50%" stop-color="%23fbbf24"/>
      <stop offset="100%" stop-color="%23f59e0b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="900" height="240" rx="24" fill="url(%23bg)" stroke="%2338bdf8" stroke-width="3" stroke-opacity="0.4"/>
  
  <circle cx="60" cy="120" r="140" fill="%23ef4444" opacity="0.22" filter="blur(40px)"/>
  <circle cx="840" cy="120" r="140" fill="%233b82f6" opacity="0.22" filter="blur(40px)"/>
  
  <rect x="330" y="20" width="240" height="34" rx="17" fill="%230284c7" opacity="0.3"/>
  <rect x="330" y="20" width="240" height="34" rx="17" fill="none" stroke="%2338bdf8" stroke-width="1.5"/>
  <text x="450" y="43" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">🇧🇷 ELEIÇÕES 2026 AO VIVO 🇧🇷</text>
  
  <text x="450" y="112" fill="url(%23gold)" font-family="system-ui, sans-serif" font-size="44" font-weight="900" text-anchor="middle" filter="url(%23glow)" letter-spacing="1">QUEM VAI VENCER? VOTE!</text>
  
  <rect x="60" y="142" width="780" height="60" rx="16" fill="%230f172a" fill-opacity="0.85" stroke="%23334155" stroke-width="1.5"/>
  
  <text x="120" y="180" fill="%23f87171" font-family="system-ui, sans-serif" font-size="21" font-weight="900" text-anchor="start">🌹 MANDE ROSA</text>
  <text x="450" y="180" fill="%23e2e8f0" font-family="system-ui, sans-serif" font-size="17" font-weight="800" text-anchor="middle">⚡ VOTO COMPUTADO NA URNA ⚡</text>
  <text x="780" y="180" fill="%2360a5fa" font-family="system-ui, sans-serif" font-size="21" font-weight="900" text-anchor="end">MANDE SORVETE 🍦</text>
  
  <rect x="250" y="218" width="400" height="4" rx="2" fill="url(%23gold)" opacity="0.85"/>
</svg>`;

// 2. Preset Viral TikTok Hype
export const BANNER_PRESET_TIKTOK_HYPE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgHype" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23831843"/>
      <stop offset="30%" stop-color="%231e1b4b"/>
      <stop offset="70%" stop-color="%230f172a"/>
      <stop offset="100%" stop-color="%23064e3b"/>
    </linearGradient>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23ec4899"/>
      <stop offset="100%" stop-color="%23f43f5e"/>
    </linearGradient>
  </defs>
  
  <rect width="900" height="240" rx="24" fill="url(%23bgHype)" stroke="%23ec4899" stroke-width="2.5" stroke-opacity="0.6"/>
  
  <rect x="340" y="18" width="220" height="32" rx="16" fill="%23ec4899" opacity="0.25"/>
  <text x="450" y="40" fill="%23f472b6" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">🔥 BATALHA VIRAL TIKTOK 🔥</text>
  
  <text x="450" y="112" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="42" font-weight="900" text-anchor="middle" letter-spacing="1">DISPUTA ÉPICA DE PRESENTES</text>
  
  <rect x="60" y="142" width="780" height="60" rx="16" fill="%23000000" fill-opacity="0.6" stroke="%23f43f5e" stroke-width="1.5"/>
  <text x="450" y="179" fill="%23fde047" font-family="system-ui, sans-serif" font-size="20" font-weight="900" text-anchor="middle">🎁 PRESENTES MULTIPLICAM VOTOS AO VIVO NO PLACAR! 🎁</text>
</svg>`;

// 3. Preset Meta de Presentes da Live
export const BANNER_PRESET_META = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgMeta" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23451a03"/>
      <stop offset="50%" stop-color="%2318181b"/>
      <stop offset="100%" stop-color="%231e293b"/>
    </linearGradient>
    <linearGradient id="yellowBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23eab308"/>
      <stop offset="100%" stop-color="%23facc15"/>
    </linearGradient>
  </defs>
  
  <rect width="900" height="240" rx="24" fill="url(%23bgMeta)" stroke="%23eab308" stroke-width="2.5" stroke-opacity="0.6"/>
  
  <text x="450" y="55" fill="%23fef08a" font-family="system-ui, sans-serif" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="2">🎯 META DA TRANSMISSÃO AO VIVO 🎯</text>
  <text x="450" y="115" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="38" font-weight="900" text-anchor="middle">AJUDE SEU CANDIDATO A VIRAR!</text>
  
  <rect x="80" y="146" width="740" height="52" rx="14" fill="%2327272a" stroke="%2352525b" stroke-width="1.5"/>
  <rect x="84" y="150" width="520" height="44" rx="10" fill="url(%23yellowBar)"/>
  <text x="450" y="180" fill="%2309090b" font-family="system-ui, sans-serif" font-size="19" font-weight="900" text-anchor="middle">PROGRESSO DA META: 70% ATINGIDO! 🚀</text>
</svg>`;

// 4. Preset Tutorial de Comentários no Chat
export const BANNER_PRESET_COMENTARIOS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgCom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23042f2e"/>
      <stop offset="50%" stop-color="%230f172a"/>
      <stop offset="100%" stop-color="%23134e4a"/>
    </linearGradient>
  </defs>
  
  <rect width="900" height="240" rx="24" fill="url(%23bgCom)" stroke="%2314b8a6" stroke-width="2.5" stroke-opacity="0.6"/>
  
  <text x="450" y="50" fill="%232dd4bf" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle" letter-spacing="2">💬 REGRA OFICIAL DO CHAT 💬</text>
  <text x="450" y="112" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="36" font-weight="900" text-anchor="middle">DIGITE O NÚMERO NO CHAT DA LIVE</text>
  
  <rect x="60" y="142" width="780" height="60" rx="16" fill="%230f172a" fill-opacity="0.9" stroke="%230d9488" stroke-width="1.5"/>
  <text x="450" y="179" fill="%235eead4" font-family="system-ui, sans-serif" font-size="19" font-weight="900" text-anchor="middle">A CADA 5 COMENTÁRIOS O CANDIDATO GANHA +1 PONTO! 🗳️</text>
</svg>`;

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'eleicoes_2026',
    title: 'Eleições 2026 (Oficial)',
    subtitle: 'Tema oficial com cores do Brasil, Lula e Bolsonaro',
    url: BANNER_PRESET_ELEICOES,
  },
  {
    id: 'tiktok_hype',
    title: 'Disputa Viral Hype',
    subtitle: 'Visual neon moderno estilo TikTok LIVE',
    url: BANNER_PRESET_TIKTOK_HYPE,
  },
  {
    id: 'meta_live',
    title: 'Meta de Presentes da Live',
    subtitle: 'Barra dourada de meta para incentivar doações',
    url: BANNER_PRESET_META,
  },
  {
    id: 'chat_comentarios',
    title: 'Instruções do Chat',
    subtitle: 'Explica a regra de digitar o número para pontuar',
    url: BANNER_PRESET_COMENTARIOS,
  },
];

export const DEFAULT_BANNER_SETTINGS: BannerSettings = {
  enabled: true,
  url: BANNER_PRESET_ELEICOES,
  height: 'normal',
  fit: 'cover',
  position: 'between_candidates_and_urna',
};
