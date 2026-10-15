import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Candidate } from '../types';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

interface LiveChatFeedProps {
  messages: ChatMessage[];
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  onSendChatMessage: (text: string) => void;
  showInput?: boolean;
}

export const LiveChatFeed: React.FC<LiveChatFeedProps> = ({
  messages,
  leftCandidate,
  rightCandidate,
  onSendChatMessage,
  showInput = true,
}) => {
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendChatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-3 shadow-xl flex flex-col h-48 sm:h-56">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
          <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
          <span>CHAT DA LIVE & PRESENTES EM TEMPO REAL</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-600/40 font-bold">
            Digite {leftCandidate.number}
          </span>
          <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-600/40 font-bold">
            Digite {rightCandidate.number}
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 scroll-smooth text-xs"
      >
        {messages.map((msg) => {
          if (msg.isGift) {
            // Gift Card in Feed
            return (
              <div
                key={msg.id}
                className={`p-1.5 rounded-lg flex items-center justify-between border animate-fade-in ${
                  msg.side === 'left'
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-100'
                    : 'bg-red-950/60 border-red-500/50 text-red-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg animate-bounce">
                    {msg.giftIcon}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-extrabold text-amber-300 text-[11px]">
                      {msg.username}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      enviou {msg.text}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    msg.side === 'left'
                      ? 'bg-blue-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  +{msg.points} {msg.side === 'left' ? leftCandidate.number : rightCandidate.number}
                </span>
              </div>
            );
          }

          // Regular Comment
          return (
            <div
              key={msg.id}
              className="flex items-center gap-2 py-0.5 px-1.5 rounded hover:bg-slate-800/40 transition-colors"
            >
              <img
                src={msg.avatar}
                alt={msg.username}
                className="w-5 h-5 rounded-full border border-slate-700 object-cover"
                loading="lazy"
              />
              <span className="font-bold text-slate-400 text-[11px] truncate max-w-[100px]">
                {msg.username}:
              </span>
              <span
                className={`font-semibold ${
                  msg.side === 'left'
                    ? 'text-blue-300 font-extrabold'
                    : msg.side === 'right'
                    ? 'text-red-300 font-extrabold'
                    : 'text-slate-200'
                }`}
              >
                {msg.text}
              </span>
              {msg.side !== 'neutral' && (
                <span
                  className={`text-[8px] font-black px-1 rounded uppercase ml-auto ${
                    msg.side === 'left'
                      ? 'bg-blue-900/80 text-blue-300'
                      : 'bg-red-900/80 text-red-300'
                  }`}
                >
                  +1 {msg.side === 'left' ? leftCandidate.number : rightCandidate.number}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Input for Live Simulation or Viewer Interaction */}
      {showInput && (
        <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Digite ${leftCandidate.number}, ${rightCandidate.number} ou uma mensagem de torcida...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      )}
    </div>
  );
};
