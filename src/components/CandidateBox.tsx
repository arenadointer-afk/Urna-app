import React from 'react';
import { Candidate } from '../types';

interface CandidateBoxProps {
  candidate: Candidate;
  points: number;
  giftsCount: number;
  percentage: number;
  isLeading: boolean;
  onVote: (
    side: 'left' | 'right',
    amount: number,
    giftName?: string,
    giftIcon?: string
  ) => void;
  lastVoteUser?: string;
  lastVoteText?: string;
  side: 'left' | 'right';
  isLiveOnly?: boolean;
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
  isLiveOnly = false,
}) => {
  const isRedTheme = side === 'left';
  const shortName = candidate.name.split(' ')[0];
  const formattedPercentage = percentage.toFixed(1).replace('.', ',');

  // Lista dos 3 presentes principais (Rosa/Sorvete 1, Coração/Donut 10, Galáxia/Leão 100)
  const primary = candidate.primaryGift;
  const bonus1 = candidate.bonusGifts?.[0] || {
    id: isRedTheme ? 'heart' : 'donut',
    name: isRedTheme ? 'Coração' : 'Donut',
    icon: isRedTheme ? '💖' : '🍩',
    points: 10,
  };
  const bonus2 =
    candidate.bonusGifts?.[2] ||
    candidate.bonusGifts?.[1] || {
      id: isRedTheme ? 'galaxy' : 'lion',
      name: isRedTheme ? 'Galáxia' : 'Leão',
      icon: isRedTheme ? '🌌' : '🦁',
      points: 100,
    };

  const giftList = [primary, bonus1, bonus2];

  return (
    <div className="flex-1 flex flex-col items-center min-w-0 max-w-[200px] sm:max-w-[215px]">
      {/* CARD PRINCIPAL UNIFICADO: FOTO, NOME, PONTUAÇÃO E PRESENTES */}
      <div
        className={`w-full rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between bg-slate-950/95 border-2 shadow-2xl relative transition-all ${
          isRedTheme
            ? 'border-red-500/80 shadow-red-500/20'
            : 'border-blue-500/80 shadow-blue-500/20'
        }`}
      >
        {/* 1. Header: Foto Nítida, Nome, Número e Líder */}
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Foto Redonda Nítida */}
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 overflow-hidden shrink-0 shadow-md bg-zinc-800 ${
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
              <span className="text-[10px] sm:text-[11px] font-black text-white truncate uppercase tracking-tight leading-tight">
                {candidate.name}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-digital font-black ${
                  isRedTheme ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                Nº {candidate.number}
              </span>
            </div>
          </div>

          {isLeading && (
            <span className="px-1 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-black text-[7px] uppercase tracking-tighter shrink-0 animate-bounce shadow">
              👑 LÍDER
            </span>
          )}
        </div>

        {/* 2. PONTUAÇÃO BEM VISÍVEL E GIGANTE */}
        <div className="flex items-center justify-between my-1 px-1">
          <div className="flex flex-col">
            <span
              className={`text-3xl sm:text-4xl font-black font-digital tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${
                isRedTheme ? 'text-red-400' : 'text-blue-400'
              }`}
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              {points}
            </span>
            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              PONTOS
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-black text-white">
              {formattedPercentage}%
            </span>
            <span className="text-[7.5px] text-slate-400 font-semibold mt-0.5">
              🎁 {giftsCount} pres.
            </span>
          </div>
        </div>

        {/* 3. TIPOS DE PRESENTE BEM VISÍVEL (Clique para votar e animar a Urna em modo ADM) */}
        <div className="pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[7px] text-amber-300 font-black uppercase mb-0.5 px-0.5">
            <span>🎁 PRESENTES ({candidate.number}):</span>
            <span className={isLiveOnly ? "text-emerald-400 text-[6.5px] font-bold" : "text-slate-400 text-[6.5px]"}>
              {isLiveOnly ? 'ENVIE NA LIVE' : 'TOQUE P/ TESTAR'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {giftList.map((gift) => (
              <button
                key={gift.id}
                type="button"
                disabled={isLiveOnly}
                onClick={
                  !isLiveOnly
                    ? () =>
                        onVote(
                          side,
                          gift.points,
                          `${gift.name} (${shortName})`,
                          gift.icon
                        )
                    : undefined
                }
                title={
                  isLiveOnly
                    ? `Envie ${gift.name} no TikTok LIVE para votar (+${gift.points} pts)`
                    : `Enviar ${gift.name} (+${gift.points} pontos)`
                }
                className={`py-1 px-0.5 rounded-xl border flex flex-col items-center justify-center transition-all shadow-sm ${
                  !isLiveOnly ? 'cursor-pointer active:scale-90 hover:brightness-110' : 'cursor-default opacity-95'
                } ${
                  gift.points >= 100
                    ? 'bg-gradient-to-b from-amber-950/70 to-slate-900 border-amber-400/80'
                    : gift.points >= 10
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : isRedTheme
                    ? 'bg-red-950/40 border-red-500/40'
                    : 'bg-blue-950/40 border-blue-500/40'
                }`}
              >
                <span className="text-base sm:text-lg filter drop-shadow leading-none">
                  {gift.icon}
                </span>
                <span className="text-[7px] sm:text-[7.5px] font-extrabold text-white truncate max-w-full leading-tight mt-0.5">
                  {gift.name}
                </span>
                <span
                  className={`text-[7px] font-digital font-black px-1 py-0.2 rounded-full text-white shadow leading-none mt-0.5 ${
                    gift.points >= 100
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : gift.points >= 10
                      ? 'bg-emerald-500'
                      : isRedTheme
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  }`}
                >
                  +{gift.points}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Ticker do último voto (Compacto e integrado no card) */}
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-center text-[7.5px] sm:text-[8px] text-slate-300 truncate">
          {lastVoteUser ? (
            <span className="truncate">
              <strong className="text-amber-300">{lastVoteUser}</strong> •{' '}
              {lastVoteText || 'votou'}
            </span>
          ) : (
            <span className="text-slate-400 italic">
              Envie presente ou digite {candidate.number}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
