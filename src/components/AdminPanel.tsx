import React, { useState } from 'react';
import {
  Candidate,
  BotSettings,
  StreamSettings,
  PresetDuel,
} from '../types';
import { PRESET_DUELS } from '../utils/presets';
import {
  Settings,
  Zap,
  Bot,
  Sliders,
  Palette,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  UserCheck,
  Upload,
  Link,
  Radio,
  Tv,
  Volume2,
  VolumeX,
  Code,
  Copy,
  Check,
  Flame,
  Clock,
  ShieldCheck,
  Rocket,
  Smartphone,
  Laptop,
  QrCode,
  ExternalLink,
  Music,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  onUpdateCandidate: (side: 'left' | 'right', candidate: Candidate) => void;
  onSelectPreset: (preset: PresetDuel) => void;
  roundDuration: number;
  onChangeRoundDuration: (duration: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestartRound: () => void;
  onInjectVotes: (side: 'left' | 'right' | 'both', amount: number, isGift?: boolean, giftName?: string) => void;
  onMakeClutch: () => void;
  botSettings: BotSettings;
  onUpdateBotSettings: (settings: Partial<BotSettings>) => void;
  streamSettings: StreamSettings;
  onUpdateStreamSettings: (settings: Partial<StreamSettings>) => void;
  musicTrack: 'hype' | 'suspense' | 'marchinha' | 'retro' | 'off';
  onChangeMusicTrack: (track: 'hype' | 'suspense' | 'marchinha' | 'retro' | 'off', customUrl?: string) => void;
  musicVolume: number;
  onChangeMusicVolume: (volume: number) => void;
  initialTab?: 'first-live' | 'boosters' | 'candidates' | 'bot' | 'presets' | 'round' | 'cloud' | 'stream' | 'music';
}

const QUICK_AVATARS = [
  {
    name: 'Jair Bolsonaro (22)',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=300&auto=format&fit=crop&q=80',
    number: '22',
    party: 'PL',
    vice: 'BRAGA NETTO',
  },
  {
    name: 'Luiz Inácio Lula (13)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    number: '13',
    party: 'PT',
    vice: 'GERALDO ALCKMIN',
  },
  {
    name: 'Pablo Marçal (28)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    number: '28',
    party: 'PRTB',
    vice: 'ANTÔNIA DE JESUS',
  },
  {
    name: 'Guilherme Boulos (50)',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    number: '50',
    party: 'PSOL',
    vice: 'MARTA SUPLICY',
  },
  {
    name: 'Flamengo Rubro-Negro',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&auto=format&fit=crop&q=80',
    number: '10',
    party: 'FLA',
    vice: 'GABIGOL',
  },
  {
    name: 'Corinthians Alvinegro',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80',
    number: '09',
    party: 'SCCP',
    vice: 'MEMPHIS DEPAY',
  },
  {
    name: 'Streamer Masculino',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    number: '11',
    party: 'LIVE',
    vice: 'CHAT VIP',
  },
  {
    name: 'Streamer Feminina',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    number: '22',
    party: 'VIP',
    vice: 'MODERADORES',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  leftCandidate,
  rightCandidate,
  onUpdateCandidate,
  onSelectPreset,
  roundDuration,
  onChangeRoundDuration,
  isPaused,
  onTogglePause,
  onRestartRound,
  onInjectVotes,
  onMakeClutch,
  botSettings,
  onUpdateBotSettings,
  streamSettings,
  onUpdateStreamSettings,
  musicTrack,
  onChangeMusicTrack,
  musicVolume,
  onChangeMusicVolume,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'first-live' | 'boosters' | 'music' | 'candidates' | 'bot' | 'presets' | 'round' | 'cloud' | 'stream'>(
    initialTab || 'first-live'
  );
  const [editingSide, setEditingSide] = useState<'left' | 'right'>('left');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);
  const [copiedAdminUrl, setCopiedAdminUrl] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState(String(roundDuration));

  // Sync initialTab when provided
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const appLiveUrl =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://ais-dev-jraka4om4khnpiiqp4et5n-265581544198.us-east5.run.app';

  const liveStreamUrl = `${appLiveUrl}?mode=live`;
  const adminControlUrl = `${appLiveUrl}?mode=admin`;

  const handleCopyLiveUrl = () => {
    navigator.clipboard.writeText(liveStreamUrl);
    setCopiedLiveUrl(true);
    setTimeout(() => setCopiedLiveUrl(false), 2000);
  };

  const handleCopyAdminUrl = () => {
    navigator.clipboard.writeText(adminControlUrl);
    setCopiedAdminUrl(true);
    setTimeout(() => setCopiedAdminUrl(false), 2000);
  };

  if (!isOpen) return null;

  const currentEditingCandidate = editingSide === 'left' ? leftCandidate : rightCandidate;

  const handleCandidateFieldChange = (field: keyof Candidate, value: any) => {
    const updated = {
      ...currentEditingCandidate,
      [field]: value,
    };
    onUpdateCandidate(editingSide, updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleCandidateFieldChange('photoUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customTimeInput, 10);
    if (!isNaN(val) && val >= 5 && val <= 3600) {
      onChangeRoundDuration(val);
    }
  };

  const copyConnectorScript = () => {
    const code = `// tiktok-live-bridge.js
// 1. Instale no seu PC/VPS: npm install tiktok-live-connector
const { WebcastPushConnection } = require('tiktok-live-connector');

// COLOQUE SEU USUÁRIO DO TIKTOK AQUI (SEM @):
const tiktokUsername = 'SEU_USUARIO_AQUI';

const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then(state => {
    console.log(\`Conectado com sucesso na LIVE de @\${tiktokUsername}!\`);
}).catch(err => {
    console.error('Erro ao conectar na live:', err);
});

// ESCUTA COMENTÁRIOS DO CHAT
tiktokLiveConnection.on('chat', data => {
    const comment = data.comment.trim();
    console.log(\`[\${data.uniqueId}]: \${comment}\`);
    // Se digitou 22 ou 13, envia pro jogo
    if (comment.includes('22')) {
        console.log('-> VOTO REGISTRADO PARA 22');
    } else if (comment.includes('13')) {
        console.log('-> VOTO REGISTRADO PARA 13');
    }
});

// ESCUTA PRESENTES ENVIADOS
tiktokLiveConnection.on('gift', data => {
    if (data.giftType === 1 && !data.repeatEnd) return; // ignora repetições em streak
    console.log(\`🎁 PRESENTE! \${data.uniqueId} mandou \${data.repeatCount}x \${data.giftName}\`);
});`;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 sm:gap-2">
                PAINEL DE CONTROLE ADM
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  STREAMER PRO
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Personalize fotos, nomes, tempo das rodadas e automação da live.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto scrollbar-none">
          {/* Guia Passo a Passo 1ª Live */}
          <button
            type="button"
            onClick={() => setActiveTab('first-live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === 'first-live'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 shadow-md ring-2 ring-emerald-300'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>🚀 Fazer 1ª Live (Passo a Passo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boosters')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'boosters'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sair do Zero & Votos</span>
          </button>

          {/* Nova Aba de Músicas da Live */}
          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'music'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Músicas da Live</span>
            {musicTrack !== 'off' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'candidates'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mudar Fotos & Nomes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('round')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'round'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tempo das Rodadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'bot'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Robô Automático</span>
            {botSettings.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live 24h & Presentes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Temas Prontos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'music'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>🎵 Músicas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'stream'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>OBS & Tela</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* TAB 0: GUIA PASSO A PASSO DA PRIMEIRA LIVE COM DOIS LINKS DISTINTOS */}
          {activeTab === 'first-live' && (
            <div className="space-y-4">
              {/* Card dos 2 Links: Live Pública vs Controle Remoto */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 border-2 border-emerald-500/50 shadow-xl space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                      SEUS 2 LINKS OFICIAIS PARA A LIVE
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-black">
                        100% PÚBLICOS
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-200">
                      Um link para colocar na tela da live e outro no seu celular para controlar:
                    </p>
                  </div>
                </div>

                {/* Aviso Importante: Por que o link interno pede login do Google e como rodar 100% grátis sem login */}
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/70 text-amber-200 text-xs space-y-1.5 shadow">
                  <div className="flex items-center gap-1.5 font-black text-amber-300">
                    <span className="text-base">💡</span>
                    <span>COMO ABRIR SEM LOGIN DO GOOGLE (HOSPEDAGEM 100% GRÁTIS)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-100">
                    A URL atual (<code className="font-mono bg-black/50 px-1 rounded text-amber-300">ais-dev-...</code>) pertence ao editor interno do Google AI Studio e por isso pede login da sua conta Google.
                    Para rodar na nuvem <strong>totalmente aberto ao público sem pedir login</strong>, você pode hospedar em 2 minutos na <strong>Vercel</strong> ou <strong>Render</strong> (100% gratuito):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="bg-black/60 p-2 rounded-lg border border-amber-500/40">
                      <strong className="text-white block text-[11px]">Opção 1: Vercel (Recomendado)</strong>
                      <span className="text-[10px] text-slate-300 block">
                        Crie conta grátis em <code className="text-amber-300">vercel.com</code>, importe o projeto e ganhe um link público como <code className="text-emerald-300">sua-urna.vercel.app</code> que roda 24h sem desligar!
                      </span>
                    </div>
                    <div className="bg-black/60 p-2 rounded-lg border border-amber-500/40">
                      <strong className="text-white block text-[11px]">Opção 2: Teste Direto pelo OBS / Celular</strong>
                      <span className="text-[10px] text-slate-300 block">
                        Você já pode abrir o link no seu navegador logado e capturar a janela no OBS ou celular usando a opção "Compartilhar Tela / Jogos Móveis" no TikTok!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Link 1: Modo Transmissão / Live Pública */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-blue-500/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-400 text-xs flex items-center gap-1">
                      <span>📺</span>
                      <span>LINK 1: LIVE PÚBLICA (Para transmitir no Celular ou OBS)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                      Sem dados de ADM
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300">
                    Esse link roda 100% limpo, sem botões de controle, perfeito para o público ver e capturar a tela:
                  </p>
                  <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                    <span className="flex-1 font-mono text-[10px] text-amber-300 truncate select-all">
                      {liveStreamUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLiveUrl}
                      className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {copiedLiveUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLiveUrl ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Link 2: Controle Remoto do ADM */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-400 text-xs flex items-center gap-1">
                      <span>📱</span>
                      <span>LINK 2: CONTROLE REMOTO ADM (Abra no seu celular)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                      Senha: 851985
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300">
                    Abra no seu celular particular para enviar votos, sair do zero e trocar músicas em tempo real sem ninguém na live ver:
                  </p>
                  <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                    <span className="flex-1 font-mono text-[10px] text-amber-300 truncate select-all">
                      {adminControlUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAdminUrl}
                      className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {copiedAdminUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAdminUrl ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code para Abrir no Celular na Hora */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2 border-t border-slate-800/80 bg-slate-950/50 p-2.5 rounded-xl">
                  <div className="w-20 h-20 rounded-lg bg-white p-1 shadow shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(liveStreamUrl)}`}
                      alt="QR Code da Live"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="font-extrabold text-white text-xs flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      QR Code da Live (Abra no celular de transmissão):
                    </span>
                    <p className="text-[10.5px] text-slate-300">
                      Aponte a câmera para abrir o jogo em tela cheia no celular e iniciar a live no TikTok!
                    </p>
                  </div>
                </div>
              </div>

              {/* Guia Método 1: Live pelo Celular */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-black text-sm text-white">
                      MÉTODO 1: Transmitir pelo Celular (O Mais Rápido - 2 Minutos)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Não precisa de computador. Você faz tudo usando o aplicativo oficial do TikTok.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <p>
                      Escaneie o QR Code acima ou abra o link no <strong>Chrome</strong> (Android) ou <strong>Safari</strong> (iPhone). Coloque o navegador em tela cheia.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <p>
                      Abra o app do <strong>TikTok</strong>, toque no botão <strong>+</strong> no meio da tela e deslize até a aba <strong>LIVE</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <p>
                      Embaixo do botão de iniciar, escolha a opção <strong>"Jogos para Dispositivos Móveis"</strong> (ou <strong>"Compartilhar Tela"</strong>).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <p>
                      Coloque um título chamativo para o público entrar, por exemplo:
                      <br />
                      <strong className="text-amber-300">"🔥 QUEM VENCE? 22 ou 13? MANDE ROSA PARA VOTAR!"</strong>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
                    <p>
                      Toque em <strong>"Iniciar LIVE"</strong> e volte imediatamente para o navegador onde o jogo da Urna está aberto. O jogo rodará ao vivo para todos os espectadores!
                    </p>
                  </div>
                </div>
              </div>

              {/* Guia Método 2: Live pelo PC (OBS Studio / TikTok LIVE Studio) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Laptop className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="font-black text-sm text-white">
                      MÉTODO 2: Transmitir pelo PC (OBS Studio ou TikTok LIVE Studio)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Qualidade máxima de imagem em alta definição 60 FPS com overlay.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <p>
                      Abra o <strong>TikTok LIVE Studio</strong> (software oficial do TikTok para Windows) ou o <strong>OBS Studio</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <p>
                      Adicione uma nova fonte do tipo <strong>"Navegador" (Browser Source)</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <p>
                      No campo URL, cole o link copiado acima e defina a resolução como:
                      <br />
                      <strong className="text-white">Largura: 1080 | Altura: 1920</strong> (formato vertical perfeito do TikTok).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <p>
                      No jogo, clique no ícone de <strong>Modo Limpo</strong> no rodapé para sumir com os botões e deixar a tela com visual 100% profissional de estúdio de TV.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guia Método 3: Live 24 Horas na Nuvem (Sem PC e Sem Celular) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-black text-sm text-white">
                    MÉTODO 3: Live 24 Horas sem Celular e sem PC Ligado (Nuvem Grátis)
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para deixar a live rodando 24 horas por dia gerando presentes continuamente:
                </p>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <p>
                    • <strong>Hospedagem da Urna:</strong> Já está pronta e ativa neste link que criamos!
                  </p>
                  <p>
                    • <strong>Transmissão 24h:</strong> Crie uma conta gratuita na <strong>Oracle Cloud</strong> (tem plano Always Free gratuito para sempre) ou alugue uma VPS por R$ 20/mês na <strong>Contabo/DigitalOcean</strong>.
                  </p>
                  <p>
                    • No servidor, roda-se um script FFmpeg ou OBS Virtual apontando para o link do jogo e enviando o fluxo RTMP para a sua chave de live do TikTok. A live fica 30 dias ligada sem consumir nada da sua casa!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SAIR DO ZERO & VOTOS FICTÍCIOS */}
          {activeTab === 'boosters' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-3 sm:p-3.5 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-amber-300 font-bold block mb-0.5">
                    Gatilho Psicológico do TikTok:
                  </strong>
                  Quando a live está zerada, ninguém quer mandar presente primeiro. Use{' '}
                  <span className="text-white font-bold">"Sair do Zero"</span> para dar os primeiros votos e fazer a torcida acordar!
                </div>
              </div>

              {/* Botões Rápidos Master */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => onInjectVotes('both', 1)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 hover:brightness-110 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-lg">🚀</span>
                  <span>SAIR DO ZERO (+1 cada)</span>
                  <span className="text-[10px] font-normal opacity-90">Inicia o placar em 1x1</span>
                </button>

                <button
                  type="button"
                  onClick={() => onInjectVotes('both', 5)}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-lg">🔥</span>
                  <span>AQUECER LIVE (+5 cada)</span>
                  <span className="text-[10px] font-normal opacity-90">Movimenta o placar</span>
                </button>

                <button
                  type="button"
                  onClick={onMakeClutch}
                  className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-lg">⚡</span>
                  <span>DISPUTA ACIRRADA (Dif: 1)</span>
                  <span className="text-[10px] font-normal opacity-90">Cria urgência máxima</span>
                </button>
              </div>

              {/* Injetores Individuais de Voto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Lado Esquerdo */}
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-400 text-xs truncate">
                      URNA {leftCandidate.number} ({leftCandidate.name})
                    </span>
                    <span className="text-xs">🟦</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 1)}
                      className="py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 Voto
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 5)}
                      className="py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +5 Votos
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 20)}
                      className="py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +20 Votos
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInjectVotes('left', 100, true, 'Leão Lendário')}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
                  >
                    <span>🦁</span>
                    <span>Simular Baleia (+100 Votos)</span>
                  </button>
                </div>

                {/* Lado Direito */}
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-red-400 text-xs truncate">
                      URNA {rightCandidate.number} ({rightCandidate.name})
                    </span>
                    <span className="text-xs">🟥</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 1)}
                      className="py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 Voto
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 5)}
                      className="py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +5 Votos
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 20)}
                      className="py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +20 Votos
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInjectVotes('right', 100, true, 'Galáxia Épica')}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
                  >
                    <span>🌌</span>
                    <span>Simular Baleia (+100 Votos)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MUDAR FOTOS & NOMES DOS CANDIDATOS */}
          {activeTab === 'candidates' && (
            <div className="space-y-4">
              {/* Selector: Lado Esquerdo ou Lado Direito */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSide('left')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    editingSide === 'left'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟦</span>
                  <span>Candidato Esquerda ({leftCandidate.number})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSide('right')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    editingSide === 'right'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟥</span>
                  <span>Candidato Direita ({rightCandidate.number})</span>
                </button>
              </div>

              {/* Form de Edição do Candidato Selecionado */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                {/* Visual Preview + Photo Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-slate-800">
                  <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-amber-400 overflow-hidden shadow-lg bg-zinc-800 shrink-0">
                    <img
                      src={currentEditingCandidate.photoUrl}
                      alt={currentEditingCandidate.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-white font-bold text-center py-0.5 truncate">
                      {currentEditingCandidate.number}
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Foto do Candidato:
                    </label>

                    {/* Botão de Upload Local do Celular/PC */}
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-95">
                        <Upload className="w-4 h-4" />
                        <span>Carregar Foto do Celular / PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Campo de URL da Imagem */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={currentEditingCandidate.photoUrl}
                          onChange={(e) => handleCandidateFieldChange('photoUrl', e.target.value)}
                          placeholder="Ou cole o link da foto (URL)..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campos de Nome, Número e Partido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Nome do Candidato:
                    </label>
                    <input
                      type="text"
                      value={currentEditingCandidate.name}
                      onChange={(e) => handleCandidateFieldChange('name', e.target.value.toUpperCase())}
                      placeholder="Ex: JAIR BOLSONARO"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Número na Urna:
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={currentEditingCandidate.number}
                      onChange={(e) => handleCandidateFieldChange('number', e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 22"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-digital font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Partido / Sigla:
                    </label>
                    <input
                      type="text"
                      value={currentEditingCandidate.party}
                      onChange={(e) => handleCandidateFieldChange('party', e.target.value.toUpperCase())}
                      placeholder="Ex: PL ou PT"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Vice / Subtítulo:
                    </label>
                    <input
                      type="text"
                      value={currentEditingCandidate.vice}
                      onChange={(e) => handleCandidateFieldChange('vice', e.target.value.toUpperCase())}
                      placeholder="Ex: BRAGA NETTO ou ALCKMIN"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Presente Primário do Candidato */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Presente do TikTok para votar nesse lado:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={currentEditingCandidate.primaryGift.name}
                      onChange={(e) => {
                        const updatedGift = {
                          ...currentEditingCandidate.primaryGift,
                          name: e.target.value,
                        };
                        handleCandidateFieldChange('primaryGift', updatedGift);
                      }}
                      placeholder="Nome do presente (ex: Rosa)"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={currentEditingCandidate.primaryGift.icon}
                      onChange={(e) => {
                        const updatedGift = {
                          ...currentEditingCandidate.primaryGift,
                          icon: e.target.value,
                        };
                        handleCandidateFieldChange('primaryGift', updatedGift);
                      }}
                      placeholder="Emoji do presente (ex: 🌹)"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 text-center text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Galeria de Avatars Rápidos */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Ou escolha um avatar rápido pronto:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleCandidateFieldChange('photoUrl', av.url);
                        handleCandidateFieldChange('name', av.name.split(' (')[0].toUpperCase());
                        handleCandidateFieldChange('number', av.number);
                        handleCandidateFieldChange('party', av.party);
                        handleCandidateFieldChange('vice', av.vice);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 flex items-center gap-2 cursor-pointer transition-all text-left"
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">{av.name}</div>
                        <div className="text-[9px] text-amber-400 font-digital">{av.number}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPO & RODADAS */}
          {activeTab === 'round' && (
            <div className="space-y-4">
              {/* Play / Pause / Reset */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onTogglePause}
                  className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isPaused
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                  <span>{isPaused ? 'CONTINUAR CRONÔMETRO' : 'PAUSAR CRONÔMETRO'}</span>
                </button>

                <button
                  type="button"
                  onClick={onRestartRound}
                  className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>REINICIAR RODADA ATUAL</span>
                </button>
              </div>

              {/* Duração da Rodada: Presets Rápidos */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Escolha o Tempo da Rodada (Segundos):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[20, 30, 35, 45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        onChangeRoundDuration(dur);
                        setCustomTimeInput(String(dur));
                      }}
                      className={`py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                        roundDuration === dur
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Entrada Personalizada Exata de Segundos */}
              <form onSubmit={handleCustomTimeSubmit} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Ou digite o tempo personalizado em segundos:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="5"
                    max="3600"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    placeholder="Ex: 35, 50, 120"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-digital font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Definir Tempo
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Tempo atual configurado: <strong className="text-white">{roundDuration} segundos</strong> por rodada.
                </p>
              </form>

              {/* Tempo de Espera Entre Rodadas */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Espera da Comemoração (Vitória)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tempo que a tela de vitória fica aberta antes de iniciar a próxima rodada sozinha.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[3, 5, 8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateStreamSettings({ autoRestartDelay: sec })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                        (streamSettings.autoRestartDelay || 5) === sec
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE 24H SEM PC/CELULAR & COMO LER PRESENTES */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Dúvida 1: Como rodar 24h sem PC ou Celular */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Dúvida 1: Como fazer Live 24 Horas sem Celular ou PC Ligado?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para rodar 24 horas por dia sem esquentar seu celular nem gastar energia do seu computador, o segredo da indústria de lives interativas é rodar em uma <strong>VPS Cloud (Servidor em Nuvem)</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <strong className="text-amber-400 text-xs block">Opção A: Servidor VPS Linux (R$ 20/mês)</strong>
                    <p className="text-[11px] text-slate-400">
                      Você aluga uma VPS na <em>DigitalOcean, Oracle Cloud (tem grátis), Contabo ou Hetzner</em>. Ela roda um navegador headless e envia o sinal de vídeo para o TikTok via FFmpeg ou OBS Virtual com sua Chave de Transmissão (RTMP).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 text-xs block">Opção B: Plataforma Pronta (Zero Código)</strong>
                    <p className="text-[11px] text-slate-400">
                      Serviços como <em>GoStream, Restream ou Live24.pro</em> permitem colar o link da página do jogo e a Chave de Live do seu TikTok. Eles transmitem na nuvem 24/7 automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dúvida 2: Como capturar presentes do TikTok para pontuar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <Code className="w-5 h-5" />
                    <span>Dúvida 2: Como o app interpreta os presentes do TikTok?</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyConnectorScript}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Código Copiado!' : 'Copiar Script Node'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  O TikTok utiliza conexões WebSocket via <strong>Protobuf</strong>. A biblioteca oficial da comunidade é a <code>tiktok-live-connector</code> (Node.js). Ela conecta na sua live sem precisar de senha, apenas com o seu <code>@usuario</code>:
                </p>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[10.5px] font-mono text-emerald-400 overflow-x-auto space-y-1">
                  <div>1. No terminal: <span className="text-white">npm install tiktok-live-connector</span></div>
                  <div>2. Quando alguém manda uma <span className="text-pink-400">🌹 Rosa</span>, o evento dispara:</div>
                  <div className="text-slate-400 pl-3">tiktokLive.on('gift', data =&gt; somarVoto(data.giftName));</div>
                  <div>3. Quando alguém comenta <span className="text-blue-400">"22"</span> ou <span className="text-red-400">"13"</span>:</div>
                  <div className="text-slate-400 pl-3">tiktokLive.on('chat', data =&gt; somarVoto(data.comment));</div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                  💡 <strong>Modo Piloto Automático já embutido:</strong> Enquanto você não configura o script ou quer aquecer a live, use o <strong>Robô Automático</strong> na aba ao lado, que já gera os comentários e presentes sozinho!
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ROBÔ AUTOMÁTICO DE ENGAJAMENTO */}
          {activeTab === 'bot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${botSettings.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      Piloto Automático (Ghost Bots)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gera comentários no chat, votos e presentes automaticamente. O streamer não precisa fazer nada!
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={botSettings.enabled}
                    onChange={(e) => onUpdateBotSettings({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Bot Intensity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Ritmo / Frequência de Votos do Robô:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'chill', label: 'Tranquilo', sub: 'a cada 5-7s' },
                    { id: 'normal', label: 'Normal', sub: 'a cada 2-4s' },
                    { id: 'hype', label: 'Aquecido', sub: 'a cada 1-2s' },
                    { id: 'viral', label: 'Viral Louco', sub: 'metralhadora' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onUpdateBotSettings({ intensity: lvl.id as any })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        botSettings.intensity === lvl.id
                          ? 'bg-amber-500 text-zinc-950 font-black border-amber-400'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{lvl.label}</div>
                      <div className="text-[10px] opacity-75">{lvl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Bias */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Comportamento da Disputa (Viés):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateBotSettings({ bias: 'balanced' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                      botSettings.bias === 'balanced'
                        ? 'bg-slate-800 border-amber-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-amber-300">⚖️ 50% x 50% Equilibrado</div>
                    <div className="text-[11px]">Mantém os dois lados colados para criar tensão constante</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateBotSettings({ bias: 'clutch' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                      botSettings.bias === 'clutch'
                        ? 'bg-slate-800 border-amber-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-purple-300">⚡ Alternador de Liderança</div>
                    <div className="text-[11px]">Faz um passar o outro a cada poucos segundos</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DUELOS & PRESETS PRONTOS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 block">
                Escolha um tema pronto para carregar instantaneamente:
              </span>

              <div className="space-y-2.5">
                {PRESET_DUELS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <img
                          src={preset.left.photoUrl}
                          alt={preset.left.name}
                          className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
                        />
                        <img
                          src={preset.right.photoUrl}
                          alt={preset.right.name}
                          className="w-10 h-10 rounded-full border-2 border-red-500 object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white group-hover:text-amber-300">
                          {preset.title}
                        </h4>
                        <p className="text-xs text-slate-400">{preset.description}</p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-800 text-slate-200 group-hover:bg-amber-500 group-hover:text-zinc-950">
                      Ativar
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TRILHA SONORA & MÚSICAS DA LIVE */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/50 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Trilha Sonora ao Vivo</h4>
                      <p className="text-[11px] text-purple-200">
                        Músicas sintéticas de fundo sem direitos autorais para manter a live aquecida!
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                      musicTrack !== 'off'
                        ? 'bg-purple-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {musicTrack !== 'off' ? `Tocando: ${musicTrack}` : 'Mudo'}
                  </span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    Volume da Música de Fundo:
                  </span>
                  <span className="font-black font-digital text-purple-300 text-sm">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Tracks Selection Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Escolha a Música da Batalha:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Track 1: Trap Hype */}
                  <button
                    type="button"
                    onClick={() => onChangeMusicTrack('hype')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'hype'
                        ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-purple-300">⚡ Trap Hype TikTok</span>
                      {musicTrack === 'hype' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Beat pesado e acelerado com sintetizador. Ideal para duelos acirrados!
                    </p>
                  </button>

                  {/* Track 2: Marchinha & Funk Brasil */}
                  <button
                    type="button"
                    onClick={() => onChangeMusicTrack('marchinha')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'marchinha'
                        ? 'bg-yellow-950/60 border-yellow-400 ring-2 ring-yellow-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-yellow-300">🇧🇷 Marchinha & Ritmo Brasil</span>
                      {musicTrack === 'marchinha' && <Check className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Ritmo festivo de eleição popular e carnaval. A cara do Brasil!
                    </p>
                  </button>

                  {/* Track 3: Suspense Épico */}
                  <button
                    type="button"
                    onClick={() => onChangeMusicTrack('suspense')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'suspense'
                        ? 'bg-red-950/60 border-red-400 ring-2 ring-red-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-red-400">⏳ Suspense & Reta Final</span>
                      {musicTrack === 'suspense' && <Check className="w-4 h-4 text-red-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Batimentos cardíacos e sub-bass de suspense para os últimos segundos da rodada.
                    </p>
                  </button>

                  {/* Track 4: Arcade 8-Bit */}
                  <button
                    type="button"
                    onClick={() => onChangeMusicTrack('retro')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'retro'
                        ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-cyan-300">🎮 Arcade Gamer 8-Bit</span>
                      {musicTrack === 'retro' && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Chiptune retrô vibrante para um visual de videogame competitivo.
                    </p>
                  </button>
                </div>
              </div>

              {/* Botão de Desligar Música */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onChangeMusicTrack('off')}
                  className={`w-full py-2.5 rounded-xl border font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    musicTrack === 'off'
                      ? 'bg-slate-800 border-slate-600 text-slate-300'
                      : 'bg-red-950/40 border-red-500/60 text-red-300 hover:bg-red-900/60'
                  }`}
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Desligar Trilha Sonora (Apenas Efeitos Sonoros da Urna)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: OBS, TELA & TRANSMISSÃO */}
          {activeTab === 'stream' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Formato da Tela:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateStreamSettings({ layoutMode: 'vertical_9_16' })}
                    className={`p-3 rounded-2xl border text-center cursor-pointer ${
                      streamSettings.layoutMode === 'vertical_9_16'
                        ? 'bg-amber-500 text-zinc-950 font-black border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    📱 Modo Vertical (9:16)
                    <span className="block text-[10px] font-normal opacity-80">
                      Perfeito para celular & TikTok Live
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStreamSettings({ layoutMode: 'horizontal_16_9' })}
                    className={`p-3 rounded-2xl border text-center cursor-pointer ${
                      streamSettings.layoutMode === 'horizontal_16_9'
                        ? 'bg-amber-500 text-zinc-950 font-black border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    🖥️ Modo Monitor / OBS (16:9)
                    <span className="block text-[10px] font-normal opacity-80">
                      Paisagem para captura de janela
                    </span>
                  </button>
                </div>
              </div>

              {/* Modo Transmissão Limpa */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    Modo Transmissão Limpa
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Oculta botões e menus na tela principal para captura 100% limpa.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={streamSettings.streamViewClean}
                  onChange={(e) => onUpdateStreamSettings({ streamViewClean: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500 cursor-pointer"
                />
              </div>

              {/* Sons */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white">
                    Efeitos Sonoros da Urna (Pirililili)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Bip das teclas e confirmação de voto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateStreamSettings({ soundEnabled: !streamSettings.soundEnabled })}
                  className={`p-2 rounded-xl cursor-pointer ${
                    streamSettings.soundEnabled ? 'bg-emerald-500 text-zinc-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {streamSettings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-500">
            Urna Interativa TikTok Live • v2.5
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer shadow"
          >
            Salvar & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
