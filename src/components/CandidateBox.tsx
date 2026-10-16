import React from 'react';
import { Candidate } from '../types';

interface CandidateBoxProps {
  candidate: Candidate;
  points: number;
  giftsCount: number;
  percentage: number;
  isLeading: boolean;
  onVote: (side: 'left' | 'right', amount: number, giftName?: string, giftIcon?: string) => void;
  lastVoteUser?: string;
  lastVoteText?: string;
  side: 'left' | 'right';
}

export const CandidateBox: React.FC<CandidateBoxProps> = ({
  candidate,
  points,
  giftsCount,
  percentage,
  isLeading,
  onVote,
  lastVoteUser,
  lastVoteText,
  side,
}) => {
  const isRedTheme = side === 'left';
  const shortName = candidate.name.split(' ')[0];
  const formattedPercentage = percentage.toFixed(1).replace('.', ',');

  // Combine primary gift and bonus gifts for a full clean list
  const allGifts = [
    candidate.primaryGift,
    ...(candidate.bonusGifts || []),
  ];

  return (
    <div className="flex-1 flex flex-col items-center min-w-0 max-w-[195px] sm:max-w-[230px]">
      {/* 1. CAIXA COM FOTO E NOME DO CANDIDATO */}
      <div
        className={`w-full rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between bg-slate-950/95 border-2 shadow-2xl relative transition-all ${
          isRedTheme
            ? 'border-red-500/80 shadow-red-500/20'
            : 'border-blue-500/80 shadow-blue-500/20'
        }`}
      >
        {/* Header: Foto Nítida, Nome e Número */}
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Foto Redonda Nítida */}
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 overflow-hidden shrink-0 shadow-lg bg-zinc-800 ${
                isRedTheme ? 'border-red-400' : 'border-blue-400'
              }`}
            >
              <img
                src={candidate.photoUrl}
                alt={candidate.name}
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            </div>

            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] sm:text-xs font-black text-white truncate uppercase tracking-tight leading-tight">
                {candidate.name}
              </span>
              <span
                className={`text-[10px] font-digital font-black ${
                  isRedTheme ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                Nº {candidate.number}
              </span>
            </div>
          </div>

          {isLeading && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[7.5px] uppercase tracking-tighter shrink-0 animate-bounce shadow">
              👑 LÍDER
            </span>
          )}
        </div>

        {/* Pontuação Gigante */}
        <div className="flex flex-col items-center justify-center my-1">
          <span
            className="text-4xl sm:text-5xl font-black font-digital tracking-tight text-white leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {points}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            PONTOS
          </span>
        </div>

        {/* Porcentagem e contagem de presentes */}
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-300 pt-1 border-t border-slate-800/80">
          <span className="text-white font-black">{formattedPercentage}%</span>
          <span className="text-slate-400">🎁 {giftsCount} pres.</span>
        </div>
      </div>

      {/* 2. Ticker do último voto deste candidato */}
      <div className="w-full my-1 min-h-[20px] flex items-center justify-center">
        <div className="w-full px-1.5 py-0.5 rounded-full bg-black/85 border border-slate-800 text-[8px] sm:text-[9px] text-slate-300 truncate text-center shadow">
          {lastVoteUser ? (
            <span>
              <strong className="text-amber-300">{lastVoteUser}</strong> • {lastVoteText || 'votou'}
            </span>
          ) : (
            <span className="text-slate-400 italic">Voto no {candidate.number}</span>
          )}
        </div>
      </div>

      {/* 3. LISTA DE PRESENTES COLOCADA DIRETAMENTE ABAIXO DA CAIXA COM FOTO E NOME */}
      <div
        className={`w-full rounded-2xl p-1.5 sm:p-2 bg-slate-950/95 border-2 shadow-xl flex flex-col gap-1.5 transition-all ${
          isRedTheme ? 'border-red-500/70' : 'border-blue-500/70'
        }`}
      >
        <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-black uppercase px-0.5 text-slate-300 border-b border-slate-800/80 pb-1">
          <span className="text-amber-300 flex items-center gap-1">
            <span>🎁</span>
            <span>PRESENTES P/ {shortName.toUpperCase()}</span>
          </span>
          <span className="text-[7px] text-slate-400 font-normal">Toque p/ enviar</span>
        </div>

        {/* Grid com a lista de presentes deste candidato */}
        <div className="grid grid-cols-2 gap-1 text-center">
          {allGifts.map((gift) => (
            <button
              key={gift.id}
              type="button"
              onClick={() => onVote(side, gift.points, `${gift.name} para ${shortName}`, gift.icon)}
              title={`Enviar ${gift.name} para ${shortName} (+${gift.points} pontos)`}
              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                isRedTheme
                  ? 'bg-red-950/40 hover:bg-red-900/60 border-red-500/40 hover:border-red-400'
                  : 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-500/40 hover:border-blue-400'
              }`}
            >
              <span className="text-xl sm:text-2xl filter drop-shadow">
                {gift.icon}
              </span>
              <span className="text-[8.5px] font-black text-white uppercase tracking-tight truncate max-w-full">
                {gift.name}
              </span>
              <span
                className={`text-[8px] font-digital font-black px-1.5 py-0.2 rounded-full text-white shadow ${
                  isRedTheme ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                +{gift.points} {gift.points === 1 ? 'voto' : 'votos'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
