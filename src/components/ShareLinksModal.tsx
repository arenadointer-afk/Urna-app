import React, { useState } from 'react';
import { X, Copy, Check, Radio, Shield, ExternalLink, HelpCircle } from 'lucide-react';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ isOpen, onClose }) => {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  if (!isOpen) return null;

  const getCleanOrigin = () => {
    if (typeof window === 'undefined') return '';
    try {
      if (window.location.origin && window.location.origin !== 'null') {
        return window.location.origin;
      }
      return window.location.href.split('?')[0].split('#')[0];
    } catch (e) {
      return '';
    }
  };

  const origin = getCleanOrigin();
  const publicLiveUrl = `${origin}?mode=live`;
  const adminUrl = `${origin}?mode=admin`;

  const copyPublic = () => {
    navigator.clipboard.writeText(publicLiveUrl);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
  };

  const copyAdmin = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-zinc-950 to-black rounded-3xl border-2 border-slate-700 shadow-2xl p-4 sm:p-5 text-white flex flex-col gap-3 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              Links de Acesso à Live
            </h2>
            <p className="text-[10px] text-slate-400">
              Separação entre Telão Público da Transmissão e Painel de Controle
            </p>
          </div>
        </div>

        {/* 1. LINK PÚBLICO (TELÃO DA LIVE - SEM LOGIN) */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border-2 border-emerald-500/60 flex flex-col gap-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                1. Link Público da Live (Telão da Transmissão)
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
              Sem Senha • 100% Limpo
            </span>
          </div>

          <p className="text-[10px] text-slate-300 leading-tight">
            Abra este link no computador da live, no OBS (Browser Source) ou no celular que vai transmitir.
            A tela roda sozinha, sem botões de ADM nem telas de configuração.
          </p>

          <div className="flex items-center gap-1.5 bg-black/80 rounded-xl p-1.5 border border-slate-800">
            <input
              type="text"
              readOnly
              value={publicLiveUrl}
              className="flex-1 bg-transparent text-[10px] text-emerald-300 font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={copyPublic}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-black text-[10px] flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow"
            >
              {copiedPublic ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPublic ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <a
              href={publicLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2. LINK PAINEL ADM (CONTROLE PESSOAL) */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border-2 border-amber-500/60 flex flex-col gap-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                2. Link Painel ADM (Controle Remoto)
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800">
              Senha: 851985
            </span>
          </div>

          <p className="text-[10px] text-slate-300 leading-tight">
            Abra este link no seu celular pessoal. Você pode alterar candidatos, trocar fotos,
            escolher músicas de fundo, ativar bot ou dar votos para sair do zero.
          </p>

          <div className="flex items-center gap-1.5 bg-black/80 rounded-xl p-1.5 border border-slate-800">
            <input
              type="text"
              readOnly
              value={adminUrl}
              className="flex-1 bg-transparent text-[10px] text-amber-300 font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={copyAdmin}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-black text-[10px] flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow"
            >
              {copiedAdmin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAdmin ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Dica de Transmissão */}
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-start gap-2 text-[9.5px] text-blue-200">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>Dica do Streamer:</strong> Você não precisa de login no TikTok para testar!
            Abra o Link Público na tela da live e use os botões de presente abaixo das urnas ou o chat
            para simular espectadores e ver os votos e pirilili em tempo real.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
        >
          Entendido / Fechar
        </button>
      </div>
    </div>
  );
};
