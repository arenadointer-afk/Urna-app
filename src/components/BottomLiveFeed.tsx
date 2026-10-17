import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Candidate } from '../types';
import { Send, Lock, Maximize } from 'lucide-react';

interface BottomLiveFeedProps {
  messages: ChatMessage[];
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftCommentProgress: number;
  rightCommentProgress: number;
  onSendChatMessage: (text: string) => void;
  onRequestAdmin: () => void;
  onToggleFullscreen: () => void;
  isLiveOnlyMode?: boolean;
  showChat?: boolean;
  onToggleChat?: () => void;
}

export const BottomLiveFeed: React.FC<BottomLiveFeedProps> = ({
  messages,
  leftCandidate,
  rightCandidate,
  leftCommentProgress,
  rightCommentProgress,
  onSendChatMessage,
  onRequestAdmin,
  onToggleFullscreen,
  isLiveOnlyMode = false,
  showChat = true,
  onToggleChat,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendChatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <footer className="w-full max-w-md flex flex-col justify-end px-2 pb-1 pt-0.5 shrink-0 z-20">
      {/* 1. Explicit Rule Banner: 5 comentários número 13 = 1 ponto | 5 comentários número 22 = 1 ponto */}
      <div className="w-full mb-0.5 py-0.5 px-2 rounded-lg bg-gradient-to-r from-red-950/95 via-slate-900 to-blue-950/95 border border-amber-400/80 text-[7.5px] sm:text-[8.5px] flex items-center justify-between text-white shadow">
        <div className="flex items-center gap-1 font-bold truncate">
          <span className="text-amber-300 font-black">📢</span>
          <span className="truncate">
            5 comentários nº <strong className="text-red-400 font-black">{leftCandidate.number}</strong> = 1 pt • 5 comentários nº <strong className="text-blue-400 font-black">{rightCandidate.number}</strong> = 1 pt
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-digital font-black text-[8px] ml-1">
          <span className="px-1 py-0.2 rounded bg-red-600 text-white shadow border border-red-400">
            {leftCandidate.number}: {leftCommentProgress}/5
          </span>
          <span className="px-1 py-0.2 rounded bg-blue-600 text-white shadow border border-blue-400">
            {rightCandidate.number}: {rightCommentProgress}/5
          </span>
        </div>
      </div>

      {/* 2. Clean Live Chat Feed */}
      {showChat ? (
        <div className="w-full h-14 sm:h-16 bg-black/80 backdrop-blur-md rounded-xl p-1 border border-slate-800/80 flex flex-col justify-between overflow-hidden shadow animate-fade-in">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-0.2 pr-0.5 text-[9px] sm:text-[10px] scrollbar-none">
            {messages.slice(-6).map((msg) => (
              <div key={msg.id} className="flex items-center gap-1 leading-tight animate-fade-in">
                <span className="font-bold text-slate-400 truncate max-w-[70px]">
                  {msg.username}:
                </span>
                <span
                  className={`font-black ${
                    msg.side === 'left'
                      ? 'text-red-400'
                      : msg.side === 'right'
                      ? 'text-blue-400'
                      : 'text-slate-200'
                  }`}
                >
                  {msg.text}
                </span>
                {msg.isGift && (
                  <span className="text-[7.5px] px-1 rounded bg-amber-400/20 text-amber-300 font-black ml-auto shrink-0">
                    🎁 {msg.giftIcon} +{msg.points}
                  </span>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar & Discreet Controls (Oculto no Link Final da Live) */}
          {isLiveOnlyMode ? (
            <div className="pt-0.5 flex items-center justify-between text-[7.5px] sm:text-[8px] text-slate-400 font-bold px-1 border-t border-slate-800/70">
              <span className="flex items-center gap-1.5 text-emerald-400 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>TikTok LIVE Ao Vivo • Votos e presentes computados automaticamente na Urna</span>
              </span>
              <button
                type="button"
                onClick={onToggleFullscreen}
                title="Tela Cheia"
                className="p-0.5 rounded text-slate-400 hover:text-white cursor-pointer ml-1 shrink-0"
              >
                <Maximize className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-0.5 flex items-center gap-1 border-t border-slate-800/70">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Digite ${leftCandidate.number} ou ${rightCandidate.number} no chat...`}
                className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-[9px] flex items-center gap-0.5 cursor-pointer active:scale-95"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Enviar</span>
              </button>

              {onToggleChat && (
                <button
                  type="button"
                  onClick={onToggleChat}
                  title="Ocultar Chat"
                  className="px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[8px] text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  Ocultar
                </button>
              )}

              {/* Discreet Fullscreen button */}
              <button
                type="button"
                onClick={onToggleFullscreen}
                title="Tela Cheia"
                className="p-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <Maximize className="w-3 h-3" />
              </button>

              {/* Discreet Lock Icon for Password Protected Admin */}
              <button
                type="button"
                onClick={onRequestAdmin}
                title="Acessar ADM (Protegido por Senha)"
                className="p-0.5 rounded-md bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 text-slate-500 hover:text-amber-400 cursor-pointer transition-colors"
              >
                <Lock className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Modo Compacto sem Chat */
        <div className="flex items-center justify-between px-1 py-0.5">
          <button
            type="button"
            onClick={onToggleChat}
            className="text-[8.5px] text-slate-400 hover:text-amber-300 font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>💬</span>
            <span>Exibir Chat</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleFullscreen}
              title="Tela Cheia"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <Maximize className="w-3 h-3" />
            </button>

            {!isLiveOnlyMode && (
              <button
                type="button"
                onClick={onRequestAdmin}
                title="Acessar ADM"
                className="p-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-amber-400 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
