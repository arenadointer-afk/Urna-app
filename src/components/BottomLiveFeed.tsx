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
      <div className="w-full mb-1 py-1 px-2 rounded-xl bg-gradient-to-r from-red-950/90 via-slate-900/95 to-blue-950/90 border border-slate-700/80 text-[8px] sm:text-[9px] flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-1 font-bold truncate">
          <span className="text-amber-300">📢 REGRAS:</span>
          <span className="truncate">
            5 comentários número <strong className="text-red-400">{leftCandidate.number}</strong> = 1 ponto • 5 comentários número <strong className="text-blue-400">{rightCandidate.number}</strong> = 1 ponto
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-digital font-black text-[9px] ml-1">
          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white shadow">
            {leftCandidate.number}: {leftCommentProgress}/5
          </span>
          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white shadow">
            {rightCandidate.number}: {rightCommentProgress}/5
          </span>
        </div>
      </div>

      {/* 2. Clean Live Chat Feed (fits inside screen without pushing down) */}
      <div className="w-full h-18 sm:h-20 bg-black/65 backdrop-blur-md rounded-xl p-1.5 border border-slate-800/80 flex flex-col justify-between overflow-hidden shadow-lg">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 text-[10px] sm:text-[11px] scrollbar-none">
          {messages.slice(-8).map((msg) => (
            <div key={msg.id} className="flex items-center gap-1 leading-tight animate-fade-in">
              <span className="font-bold text-slate-400 truncate max-w-[80px]">
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
                <span className="text-[8.5px] px-1 rounded bg-amber-400/20 text-amber-300 font-black ml-auto shrink-0">
                  🎁 {msg.giftIcon} +{msg.points}
                </span>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar & Discreet Controls */}
        <form onSubmit={handleSubmit} className="pt-1 flex items-center gap-1 border-t border-slate-800/70">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Digite ${leftCandidate.number} ou ${rightCandidate.number} no chat...`}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-black text-[10px] flex items-center gap-0.5 cursor-pointer active:scale-95"
          >
            <Send className="w-3 h-3" />
            <span>Enviar</span>
          </button>

          {/* Discreet Fullscreen button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Tela Cheia"
            className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          {/* Discreet Lock Icon for Password Protected Admin (hidden in live only mode) */}
          {!isLiveOnlyMode && (
            <button
              type="button"
              onClick={onRequestAdmin}
              title="Acessar ADM (Protegido por Senha)"
              className="p-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 text-slate-500 hover:text-amber-400 cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </footer>
  );
};
