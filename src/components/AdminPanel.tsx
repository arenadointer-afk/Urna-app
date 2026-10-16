import React, { useState, useRef } from 'react';
import {
  Candidate,
  BotSettings,
  StreamSettings,
  PresetDuel,
  VictoryScore,
  TikTokStatus,
  MusicTrackType,
} from '../types';
import { PRESET_DUELS } from '../utils/presets';
import {
  getCustomAudioInfo,
  setCustomAudioData,
  removeCustomAudio,
  initAudioContext,
} from '../utils/audio';
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
  Trophy,
  Wifi,
  WifiOff,
  Activity,
  Send,
  Terminal,
  Plus,
  Trash2,
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
  onAddTime?: (seconds: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestartRound: () => void;
  onInjectVotes: (side: 'left' | 'right' | 'both', amount: number, isGift?: boolean, giftName?: string) => void;
  onMakeClutch: () => void;
  botSettings: BotSettings;
  onUpdateBotSettings: (settings: Partial<BotSettings>) => void;
  streamSettings: StreamSettings;
  onUpdateStreamSettings: (settings: Partial<StreamSettings>) => void;
  musicTrack: MusicTrackType;
  onChangeMusicTrack: (track: MusicTrackType, customUrl?: string) => void;
  musicVolume: number;
  onChangeMusicVolume: (volume: number) => void;
  initialTab?: 'first-live' | 'boosters' | 'candidates' | 'bot' | 'presets' | 'round' | 'cloud' | 'stream' | 'music';
  victoryScore: VictoryScore;
  onUpdateVictoryScore: (score: VictoryScore) => void;
  onResetVictoryScore: () => void;
  tiktokStatus: TikTokStatus;
  tiktokUsername: string;
  onChangeTikTokUsername: (username: string) => void;
  onConnectTikTok: (username: string) => Promise<void>;
  onDisconnectTikTok: () => Promise<void>;
  onSendTestTikTokEvent: (type: 'gift' | 'chat', data: any) => Promise<void>;
  tiktokLogs: Array<{ id: string; timestamp: number; type: 'gift' | 'chat' | 'status' | 'like'; text: string; user?: string }>;
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
  onAddTime,
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
  victoryScore,
  onUpdateVictoryScore,
  onResetVictoryScore,
  tiktokStatus,
  tiktokUsername,
  onChangeTikTokUsername,
  onConnectTikTok,
  onDisconnectTikTok,
  onSendTestTikTokEvent,
  tiktokLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'first-live' | 'boosters' | 'music' | 'candidates' | 'bot' | 'presets' | 'round' | 'cloud' | 'stream'>(
    initialTab || 'first-live'
  );
  const [editingSide, setEditingSide] = useState<'left' | 'right'>('left');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);
  const [copiedAdminUrl, setCopiedAdminUrl] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState(String(roundDuration));
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState('');
  const [customAudioInfo, setCustomAudioInfo] = useState(() => getCustomAudioInfo());
  const [audioUploadError, setAudioUploadError] = useState('');

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      setAudioUploadError('Selecione um arquivo de áudio válido (.mp3, .wav, .m4a, etc)');
      return;
    }

    setAudioUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomAudioData(dataUrl, file.name);
        setCustomAudioInfo({
          hasCustom: true,
          name: file.name,
          src: dataUrl,
        });
        initAudioContext();
        onChangeMusicTrack('custom', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    removeCustomAudio();
    setCustomAudioInfo(getCustomAudioInfo());
    if (musicTrack === 'custom') {
      onChangeMusicTrack('off');
    }
  };

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

  const [formCandidate, setFormCandidate] = useState<Candidate>(
    editingSide === 'left' ? leftCandidate : rightCandidate
  );
  const [candidateSavedFeedback, setCandidateSavedFeedback] = useState(false);
  const debounceSaveTimerRef = useRef<any>(null);
  const isEditingRef = useRef(false);

  // Quando trocar de lado, atualiza os dados no formulário para o lado selecionado
  React.useEffect(() => {
    isEditingRef.current = false;
    setFormCandidate(editingSide === 'left' ? leftCandidate : rightCandidate);
  }, [editingSide]);

  // Se trocar presets externamente quando não estiver digitando, sincroniza
  React.useEffect(() => {
    if (!isEditingRef.current) {
      setFormCandidate(editingSide === 'left' ? leftCandidate : rightCandidate);
    }
  }, [leftCandidate, rightCandidate, editingSide]);

  const currentEditingCandidate = formCandidate;

  const handleCandidateFieldChange = (field: keyof Candidate, value: any) => {
    isEditingRef.current = true;
    const updated = {
      ...formCandidate,
      [field]: value,
    };
    setFormCandidate(updated);

    // Auto-save com debounce de 450ms sem travar o teclado ou pular o cursor
    if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
    debounceSaveTimerRef.current = setTimeout(() => {
      onUpdateCandidate(editingSide, updated);
      isEditingRef.current = false;
    }, 450);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Compress and resize image to 240x240 max with 0.78 quality so it transfers in <50ms and fits in Firestore
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          handleCandidateFieldChange('photoUrl', compressedDataUrl);
        } else {
          handleCandidateFieldChange('photoUrl', rawDataUrl);
        }
      };
      img.onerror = () => {
        handleCandidateFieldChange('photoUrl', rawDataUrl);
      };
      img.src = rawDataUrl;
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

  if (!isOpen) return null;

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
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sincronizado ao vivo com a tela pública (0ms)
                </span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold font-digital">
                  Série: {victoryScore.left} ✕ {victoryScore.right}
                </span>
              </div>
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
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sair do Zero & Votos</span>
          </button>

          {/* TikTok LIVE Ao Vivo & Testes Nuvem */}
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : tiktokStatus.status === 'connected'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>🔴 TikTok LIVE & Nuvem</span>
            {tiktokStatus.status === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Placar e Tempo */}
          <button
            type="button"
            onClick={() => setActiveTab('round')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'round'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Placar da Série & Tempo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'candidates'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mudar Fotos & Nomes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'bot'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Robô Automático</span>
            {botSettings.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
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
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-zinc-950 font-black'
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
                  className="p-3 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 hover:brightness-110 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer transition-all active:scale-95"
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
                {/* Lado Esquerdo (Vermelho) */}
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-red-400 text-xs truncate">
                      URNA {leftCandidate.number} ({leftCandidate.name})
                    </span>
                    <span className="text-xs">🟥</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 1)}
                      className="py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 Voto
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 5)}
                      className="py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +5 Votos
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('left', 20)}
                      className="py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +20 Votos
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInjectVotes('left', 100, true, 'Leão Lendário')}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
                  >
                    <span>🦁</span>
                    <span>Simular Baleia (+100 Votos)</span>
                  </button>
                </div>

                {/* Lado Direito (Azul) */}
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-400 text-xs truncate">
                      URNA {rightCandidate.number} ({rightCandidate.name})
                    </span>
                    <span className="text-xs">🟦</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 1)}
                      className="py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 Voto
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 5)}
                      className="py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +5 Votos
                    </button>
                    <button
                      type="button"
                      onClick={() => onInjectVotes('right', 20)}
                      className="py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +20 Votos
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInjectVotes('right', 100, true, 'Galáxia Épica')}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
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
              {/* Selector: Lado Esquerdo (Vermelho) ou Lado Direito (Azul) */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSide('left')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    editingSide === 'left'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟥</span>
                  <span>Candidato Esquerda ({leftCandidate.number})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSide('right')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    editingSide === 'right'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟦</span>
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
                      <button
                        type="button"
                        onClick={() => {
                          const defaultUrl = editingSide === 'left'
                            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=300&auto=format&fit=crop&q=80';
                          handleCandidateFieldChange('photoUrl', defaultUrl);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
                        title="Restaurar foto padrão"
                      >
                        Resetar Foto
                      </button>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Nome do Candidato:
                      </label>
                      {currentEditingCandidate.name && (
                        <button
                          type="button"
                          onClick={() => handleCandidateFieldChange('name', '')}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                        >
                          Apagar Nome
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentEditingCandidate.name}
                        onChange={(e) => handleCandidateFieldChange('name', e.target.value.toUpperCase())}
                        placeholder="Digite o nome do candidato..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 pr-8"
                      />
                      {currentEditingCandidate.name && (
                        <button
                          type="button"
                          onClick={() => handleCandidateFieldChange('name', '')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer text-xs"
                          title="Apagar campo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
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

                {/* Botão de Salvar e Feedback */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    {candidateSavedFeedback ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                        <Check className="w-4 h-4 stroke-[3]" /> Salvo e Sincronizado na Nuvem!
                      </span>
                    ) : (
                      <span className="text-slate-400">As alterações salvam automaticamente na nuvem Firebase.</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCandidate(editingSide, formCandidate);
                      setCandidateSavedFeedback(true);
                      setTimeout(() => setCandidateSavedFeedback(false), 2500);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>SALVAR CANDIDATO</span>
                  </button>
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
              {/* Placar Geral de Vitórias (Série Histórica - Nunca Zera) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/60 border-2 border-yellow-500/60 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-300">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Placar Geral de Vitórias (Série)</h4>
                      <p className="text-[11px] text-yellow-200">
                        Fica gravado na memória do app e nunca zera ao atualizar a página!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-digital font-black text-lg sm:text-xl">
                    <span className="px-3 py-1 rounded-xl bg-red-600 text-white shadow border border-red-400">
                      {victoryScore.left}
                    </span>
                    <span className="text-yellow-400 font-sans">✕</span>
                    <span className="px-3 py-1 rounded-xl bg-blue-600 text-white shadow border border-blue-400">
                      {victoryScore.right}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateVictoryScore({ ...victoryScore, left: victoryScore.left + 1 })}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 {leftCandidate.name.split(' ')[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateVictoryScore({ ...victoryScore, left: Math.max(0, victoryScore.left - 1) })}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95"
                    >
                      -1
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateVictoryScore({ ...victoryScore, right: victoryScore.right + 1 })}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      +1 {rightCandidate.name.split(' ')[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateVictoryScore({ ...victoryScore, right: Math.max(0, victoryScore.right - 1) })}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95"
                    >
                      -1
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetVictoryScore}
                  className="w-full py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zerar Placar Geral (Iniciar Nova Série do Zero)</span>
                </button>
              </div>
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

              {/* Explicação Importante: Rodadas vs Batalha Fixa Acumulativa */}
              <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/50 text-blue-200 text-xs space-y-1.5 shadow">
                <div className="flex items-center gap-1.5 font-black text-blue-300">
                  <span className="text-sm">💡</span>
                  <span>COMO FUNCIONA O PLACAR & POR QUE OS PONTOS ATUALIZAM:</span>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  • <strong>Com Cronômetro Ligado:</strong> O jogo funciona no <em>Sistema Oficial de Rodadas</em>. Quando o tempo ({roundDuration}s) zera, o vencedor da rodada é anunciado, o Placar de Séries soma a vitória e os pontos da rodada zeram para iniciar a próxima disputa.<br />
                  • <strong>Quer pontos acumulativos FIXOS sem zerar?</strong> Basta clicar no botão verde <strong>"PAUSAR CRONÔMETRO"</strong> acima! Com o cronômetro pausado, os presentes acumulam sem parar durante toda a sua transmissão sem nunca sumir até você decidir reiniciar manualmente.
                </p>
              </div>

              {/* Botões Rápidos para AUMENTAR TEMPO no Cronômetro em Andamento */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>AUMENTAR TEMPO AGORA (Durante a Rodada):</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-bold">Adiciona no relógio na hora</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '+15s', sec: 15 },
                    { label: '+30s', sec: 30 },
                    { label: '+60s (1m)', sec: 60 },
                    { label: '+120s (2m)', sec: 120 },
                  ].map((btn) => (
                    <button
                      key={btn.sec}
                      type="button"
                      onClick={() => onAddTime && onAddTime(btn.sec)}
                      className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-950/40 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
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

          {/* TAB 4: TIKTOK AO VIVO & TESTES DE LIVE NUVEM */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Status da Conexão ao Vivo */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-2 border-indigo-500/50 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-2xl ${
                      tiktokStatus.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tiktokStatus.status === 'connecting'
                        ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tiktokStatus.status === 'connected' ? (
                        <Wifi className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <WifiOff className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-sm sm:text-base">
                          Conexão TikTok LIVE Ao Vivo
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          tiktokStatus.status === 'connected'
                            ? 'bg-emerald-500 text-zinc-950 animate-pulse'
                            : tiktokStatus.status === 'connecting'
                            ? 'bg-amber-500 text-zinc-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tiktokStatus.status === 'connected'
                            ? '🟢 AO VIVO E CONECTADO'
                            : tiktokStatus.status === 'connecting'
                            ? '🟡 CONECTANDO...'
                            : '🔴 DESCONECTADO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {tiktokStatus.status === 'connected'
                          ? `Capturando presentes e comentários em tempo real da live de @${tiktokStatus.username || tiktokUsername}`
                          : 'Perfil fixo oficial definido: @leonardosutello. O sistema se conecta automaticamente assim que a live começar!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status do Firebase Firestore */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <span className="font-black text-emerald-400 uppercase tracking-wide block text-[11px]">
                        ☁️ Firebase Firestore em Nuvem Ativo
                      </span>
                      <span className="text-[10px] text-emerald-200/80">
                        Fotos, nomes, tempo, rodadas e presentes sincronizados em tempo real entre todos os aparelhos e links públicos (sem login).
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-bold border border-emerald-700 shrink-0">
                    Sincronizado
                  </span>
                </div>

                {/* Form de Conexão com Perfil Fixo @leonardosutello */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                  <div className="relative flex-1 flex gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">@</span>
                      <input
                        type="text"
                        value={tiktokUsername}
                        onChange={(e) => onChangeTikTokUsername(e.target.value.replace(/^@/, ''))}
                        placeholder="leonardosutello"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    {tiktokUsername !== 'leonardosutello' && (
                      <button
                        type="button"
                        onClick={() => onChangeTikTokUsername('leonardosutello')}
                        className="px-2.5 py-1 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        Restaurar @leonardosutello
                      </button>
                    )}
                  </div>

                  {tiktokStatus.status === 'connected' ? (
                    <button
                      type="button"
                      onClick={() => onDisconnectTikTok()}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <WifiOff className="w-4 h-4" />
                      <span>Desconectar Live</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isConnectingTikTok || !tiktokUsername.trim()}
                      onClick={async () => {
                        setIsConnectingTikTok(true);
                        try {
                          await onConnectTikTok(tiktokUsername);
                        } finally {
                          setIsConnectingTikTok(false);
                        }
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>{isConnectingTikTok ? 'Conectando...' : '🔴 CONECTAR NA LIVE'}</span>
                    </button>
                  )}
                </div>

                {tiktokStatus.lastError && (
                  <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                    ⚠️ {tiktokStatus.lastError}
                  </div>
                )}

                {/* Estatísticas da Live */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Espectadores</span>
                    <span className="text-base font-digital font-black text-emerald-400">
                      {tiktokStatus.viewers || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Curtidas na Live</span>
                    <span className="text-base font-digital font-black text-pink-400">
                      {tiktokStatus.totalLikes || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block uppercase">Canal Alvo</span>
                    <span className="text-xs font-bold text-amber-300 truncate block">
                      @{tiktokStatus.username || tiktokUsername || 'nenhum'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TESTES DE LIVE NUVEM */}
              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">
                        Ambiente de Testes de Live Nuvem
                      </h4>
                      <p className="text-[11px] text-amber-200/80">
                        Dispare eventos de teste para validar a nuvem antes de abrir a live:
                      </p>
                    </div>
                  </div>
                  {testSuccessMessage && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950 font-black animate-fade-in">
                      {testSuccessMessage}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestTikTokEvent('gift', {
                        giftName: leftCandidate.primaryGift.name || 'Rosa',
                        repeatCount: 1,
                        diamondCount: 1,
                        uniqueId: '@fa_da_live',
                      });
                      setTestSuccessMessage('🌹 Rosa de teste enviada!');
                      setTimeout(() => setTestSuccessMessage(''), 2500);
                    }}
                    className="p-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>{leftCandidate.primaryGift.icon || '🌹'}</span>
                    <span>Testar {leftCandidate.primaryGift.name} (+1 Esquerda)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestTikTokEvent('gift', {
                        giftName: rightCandidate.primaryGift.name || 'Sorvete',
                        repeatCount: 1,
                        diamondCount: 1,
                        uniqueId: '@fa_da_live',
                      });
                      setTestSuccessMessage('🍦 Sorvete de teste enviado!');
                      setTimeout(() => setTestSuccessMessage(''), 2500);
                    }}
                    className="p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>{rightCandidate.primaryGift.icon || '🍦'}</span>
                    <span>Testar {rightCandidate.primaryGift.name} (+1 Direita)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestTikTokEvent('chat', {
                        comment: leftCandidate.number,
                        uniqueId: '@comentarista_22',
                      });
                      setTestSuccessMessage(`💬 Comentário "${leftCandidate.number}" enviado!`);
                      setTimeout(() => setTestSuccessMessage(''), 2500);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>💬</span>
                    <span>Comentar "{leftCandidate.number}"</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestTikTokEvent('chat', {
                        comment: rightCandidate.number,
                        uniqueId: '@comentarista_13',
                      });
                      setTestSuccessMessage(`💬 Comentário "${rightCandidate.number}" enviado!`);
                      setTimeout(() => setTestSuccessMessage(''), 2500);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>💬</span>
                    <span>Comentar "{rightCandidate.number}"</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onSendTestTikTokEvent('gift', {
                        giftName: 'Leão Lendário',
                        repeatCount: 1,
                        diamondCount: 100,
                        uniqueId: '@baleia_lendaria',
                      });
                      setTestSuccessMessage('🦁 Super Presente Leão enviado!');
                      setTimeout(() => setTestSuccessMessage(''), 2500);
                    }}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all col-span-2 sm:col-span-2 shadow"
                  >
                    <span>🦁</span>
                    <span>Simular Mega Presente (Leão Lendário +100 Pontos)</span>
                  </button>
                </div>
              </div>

              {/* TERMINAL DE LOGS DA NUVEM EM TEMPO REAL */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Terminal className="w-4 h-4" />
                    <span>Terminal de Eventos da Nuvem (Logs em Tempo Real)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tiktokLogs.length} eventos registrados
                  </span>
                </div>

                <div className="h-36 overflow-y-auto bg-black p-2.5 rounded-xl font-mono text-[11px] text-slate-300 border border-zinc-900 space-y-1">
                  {tiktokLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-6">
                      Aguardando eventos da live... (clique nos botões de teste acima para testar)
                    </div>
                  ) : (
                    tiktokLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-tight">
                        <span className="text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`px-1 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                          log.type === 'gift' ? 'bg-pink-500/20 text-pink-300' :
                          log.type === 'chat' ? 'bg-blue-500/20 text-blue-300' :
                          log.type === 'like' ? 'bg-red-500/20 text-red-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {log.type}
                        </span>
                        <span className="truncate">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Guia Completo Passo a Passo: Hospedar na Nuvem & Vincular ao TikTok */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border-2 border-indigo-500/50 space-y-3.5 shadow-2xl">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-500/40">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-white">
                      GUIA PASSO A PASSO: HOSPEDAR NA NUVEM & VINCULAR AO TIKTOK
                    </h4>
                    <p className="text-[11px] text-indigo-200">
                      Tudo o que você precisa para colocar a Urna no ar 24h e capturar presentes e chat ao vivo.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-200">
                  {/* Passo 1 */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-xs flex items-center justify-center font-black">1</span>
                      <span>Hospedar a Urna Gratuitamente na Nuvem (Render ou Railway)</span>
                    </div>
                    <p className="text-[11.5px] text-slate-300 leading-relaxed">
                      Este projeto é <strong>Full-Stack Node.js</strong> (possui o servidor <code className="text-emerald-400">server.ts</code> que faz a ponte com o TikTok). Para hospedar grátis com link público 24h:
                    </p>
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[11px] space-y-1 font-mono text-slate-300">
                      <div>1. Crie uma conta gratuita em <strong className="text-white">render.com</strong> ou <strong className="text-white">railway.app</strong>.</div>
                      <div>2. Clique em <strong>New +</strong> &rarr; <strong>Web Service</strong> e conecte seu repositório GitHub <strong className="text-amber-300">arenadointer-afk/Urna-app</strong>.</div>
                      <div>3. Defina os comandos:</div>
                      <div className="text-emerald-400 pl-3">• Build Command: <code className="text-white bg-black/60 px-1 rounded">npm install && npm run build</code></div>
                      <div className="text-emerald-400 pl-3">• Start Command: <code className="text-white bg-black/60 px-1 rounded">npm start</code></div>
                      <div>4. Clique em <strong>Deploy</strong>. Em 2 minutos você terá seu link permanente na nuvem!</div>
                    </div>
                  </div>

                  {/* Passo 2 */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 text-xs flex items-center justify-center font-black">2</span>
                      <span>Vincular ao TikTok (Como o App Puxa os Dados Sem Senha)</span>
                    </div>
                    <p className="text-[11.5px] text-slate-300 leading-relaxed">
                      O TikTok transmite os eventos da LIVE (comentários, presentes, curtidas) publicamente via protocolo WebSocket. Você não precisa colocar senha nem autorização da conta:
                    </p>
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[11px] space-y-1 text-slate-300">
                      <div>• <strong>1. Inicie sua Live no TikTok:</strong> abra a live no seu celular ou pelo TikTok Live Studio no PC.</div>
                      <div>• <strong>2. Conecte na Urna:</strong> aqui no Painel ADM, na caixa acima, digite o seu <code className="text-emerald-400 font-bold">@usuario</code> e clique no botão verde <strong className="text-white">"CONECTAR NA LIVE"</strong>.</div>
                      <div>• <strong>3. Pronto!</strong> O indicador mudará para <span className="text-emerald-400 font-bold">🟢 AO VIVO E CONECTADO</span> e qualquer pessoa que comentar ou enviar presente fará a urna pontuar imediatamente!</div>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-blue-400">
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-black">3</span>
                      <span>Regras Automáticas de Pontuação da Live</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                      <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/40">
                        <strong className="text-blue-300 block mb-0.5">🌹 Presente 1 (Esquerda):</strong>
                        Mandar <strong>Rosa</strong> soma +1 voto imediato na Urna da Esquerda ({leftCandidate.number} - {leftCandidate.name}). Se mandar combo 5x, soma +5 votos!
                      </div>
                      <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40">
                        <strong className="text-red-300 block mb-0.5">🍦 Presente 2 (Direita):</strong>
                        Mandar <strong>Sorvete</strong> soma +1 voto imediato na Urna da Direita ({rightCandidate.number} - {rightCandidate.name}).
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 sm:col-span-2">
                        <strong className="text-amber-300 block mb-0.5">💬 Regra dos Comentários do Chat:</strong>
                        Quando os espectadores comentam o número <strong>"{leftCandidate.number}"</strong> ou <strong>"{rightCandidate.number}"</strong> no chat do TikTok, o contador soma. A cada <strong>5 comentários</strong>, o candidato ganha +1 ponto!
                      </div>
                    </div>
                  </div>

                  {/* Passo 4 */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-purple-400">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-black">4</span>
                      <span>Como Fazer Live 24 Horas sem Celular nem PC Ligado</span>
                    </div>
                    <p className="text-[11.5px] text-slate-300 leading-relaxed">
                      Se você quer deixar a live gerando presentes 24h por dia continuamente:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-amber-400 block text-[11px] mb-1">Opção A: Plataforma Nuvem (Zero Código)</strong>
                        <span className="text-[10.5px] text-slate-400 leading-normal block">
                          Serviços como <strong>Live24.pro</strong> ou <strong>GoStream</strong> permitem colar o link da Urna (<code className="text-white">seu-app.com?mode=live</code>) e a chave RTMP do TikTok. Eles geram a live 24/7 na nuvem.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-emerald-400 block text-[11px] mb-1">Opção B: Servidor VPS Linux (R$ 20/mês)</strong>
                        <span className="text-[10.5px] text-slate-400 leading-normal block">
                          Alugue uma VPS Linux na Contabo, Hetzner ou DigitalOcean (ou use Oracle Cloud Always Free). Roda um FFmpeg ou navegador headless transmitindo para sua Chave de Live sem gastar luz de casa.
                        </span>
                      </div>
                    </div>
                  </div>
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
                      <h4 className="font-black text-sm text-white">Músicas da Live & Trilha Sonora</h4>
                      <p className="text-[11px] text-purple-200">
                        Carregue sua própria música em MP3 ou use nossas trilhas energéticas de batalha!
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase ${
                      musicTrack !== 'off'
                        ? 'bg-purple-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {musicTrack !== 'off'
                      ? musicTrack === 'custom'
                        ? `Tocando: ${customAudioInfo.name}`
                        : `Tocando: ${musicTrack}`
                      : 'Mudo'}
                  </span>
                </div>
              </div>

              {/* CARD DE UPLOAD DE MÚSICA PERSONALIZADA (MP3 / WAV / ÁUDIO DO CELULAR OU PC) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-950 to-purple-950/90 border-2 border-indigo-400/60 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                        <span>UPLOAD DE MÚSICA DO CELULAR / PC</span>
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-indigo-500 text-white font-bold">
                          MP3 / WAV
                        </span>
                      </h4>
                      <p className="text-[11px] text-indigo-200">
                        Toque qualquer música da sua preferência repetindo em loop durante a live!
                      </p>
                    </div>
                  </div>
                </div>

                {audioUploadError && (
                  <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                    ⚠️ {audioUploadError}
                  </div>
                )}

                {/* Upload Button + File Input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Carregar Música do Celular / Computador</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomAudioUpload}
                      className="hidden"
                    />
                  </label>

                  {customAudioInfo.hasCustom && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomAudio}
                      className="px-3 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      title="Excluir música personalizada"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                {/* Custom Audio Status Card */}
                {customAudioInfo.hasCustom ? (
                  <div
                    onClick={() => {
                      initAudioContext();
                      onChangeMusicTrack('custom');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      musicTrack === 'custom'
                        ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-500/50 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-700 hover:border-indigo-400 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg ${musicTrack === 'custom' ? 'bg-indigo-500 text-white animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
                        {musicTrack === 'custom' ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-xs text-white truncate">
                          {customAudioInfo.name}
                        </div>
                        <div className="text-[10px] text-indigo-300 font-medium">
                          {musicTrack === 'custom' ? '▶ Tocando agora em loop infinito' : 'Toque para reproduzir esta música'}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase shrink-0 ${
                      musicTrack === 'custom' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {musicTrack === 'custom' ? 'Ativa' : 'Tocar'}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 text-center">
                    Nenhuma música enviada ainda. Selecione um arquivo MP3 ou WAV para tocar!
                  </div>
                )}
              </div>

              {/* Volume Slider */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    Volume Geral da Música:
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
                  Ou Escolha uma das Trilhas Energéticas Prontas:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Track 1: Trap Hype */}
                  <button
                    type="button"
                    onClick={() => {
                      initAudioContext();
                      onChangeMusicTrack('hype');
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'hype'
                        ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-purple-300">⚡ Trap Hype TikTok (Batidão)</span>
                      {musicTrack === 'hype' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Beat pesado e acelerado com bumbo e hi-hats. Mantém o público acordado e votando!
                    </p>
                  </button>

                  {/* Track 2: Marchinha & Funk Brasil */}
                  <button
                    type="button"
                    onClick={() => {
                      initAudioContext();
                      onChangeMusicTrack('marchinha');
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      musicTrack === 'marchinha'
                        ? 'bg-yellow-950/60 border-yellow-400 ring-2 ring-yellow-500/50 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-yellow-300">🇧🇷 Marchinha Eleitoral Vibrante</span>
                      {musicTrack === 'marchinha' && <Check className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Ritmo festivo de eleição brasileira com melodia contagiante.
                    </p>
                  </button>

                  {/* Track 3: Suspense Épico */}
                  <button
                    type="button"
                    onClick={() => {
                      initAudioContext();
                      onChangeMusicTrack('suspense');
                    }}
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
                    onClick={() => {
                      initAudioContext();
                      onChangeMusicTrack('retro');
                    }}
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
                  <span>Desligar Música (Manter Apenas Sons da Urna "Pirilili")</span>
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
