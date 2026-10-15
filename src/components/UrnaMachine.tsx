import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { CartoonHand } from './HandAnimation';
import { playKeyBeep, playUrnaConfirmSound } from '../utils/audio';

interface UrnaMachineProps {
  candidate: Candidate;
  points: number;
  giftsCount: number;
  percentage: number;
  commentCount: number; // progress 0 to 5
  isLeading: boolean;
  isRoundOver: boolean;
  onVote: (side: 'left' | 'right', amount: number, giftName?: string, giftIcon?: string) => void;
  lastVoteTimestamp: number;
  lastVoteUser?: string;
  lastVoteText?: string;
}

export const UrnaMachine: React.FC<UrnaMachineProps> = ({
  candidate,
  points,
  giftsCount,
  percentage,
  commentCount,
  isLeading,
  isRoundOver,
  onVote,
  lastVoteTimestamp,
  lastVoteUser,
  lastVoteText,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPressingHand, setIsPressingHand] = useState(false);
  const [handKey, setHandKey] = useState<string | null>(null);
  // Default to showing candidate digits when idle
  const [typedDigits, setTypedDigits] = useState<string[]>(candidate.number.split('').slice(0, 2));
  const [isConfirmFlashing, setIsConfirmFlashing] = useState(false);
  const [showFimScreen, setShowFimScreen] = useState(false);
  const [lastConfirmedPoints, setLastConfirmedPoints] = useState(1);

  // Sync typed digits when candidate changes
  useEffect(() => {
    setTypedDigits(candidate.number.split('').slice(0, 2));
  }, [candidate.number]);

  // Trigger vote sequence with animated finger & TSE audio
  useEffect(() => {
    if (lastVoteTimestamp > 0) {
      triggerVoteSequence(candidate.number, 1);
    }
  }, [lastVoteTimestamp]);

  const triggerVoteSequence = (numStr: string, pointsAmount = 1) => {
    const digits = numStr.split('');
    setIsPressingHand(true);
    setShowFimScreen(false);
    setLastConfirmedPoints(pointsAmount);

    // Step 0: Blank screen momentarily with blinking cursor to simulate typing
    setTypedDigits(['', '']);

    setTimeout(() => {
      // Step 1: Finger presses first digit
      setTypedDigits([digits[0] || '1', '']);
      setHandKey(digits[0] || '1');
      setActiveKey(digits[0] || '1');
      playKeyBeep();

      setTimeout(() => {
        // Step 2: Finger presses second digit -> Candidate Photo & Name illuminate on white screen!
        setTypedDigits([digits[0] || '1', digits[1] || '2']);
        setHandKey(digits[1] || '2');
        setActiveKey(digits[1] || '2');
        playKeyBeep();

        setTimeout(() => {
          // Step 3: Finger swoops to green CONFIRMA key and presses it!
          setHandKey('CONFIRMA');
          setActiveKey('CONFIRMA');
          setIsConfirmFlashing(true);
          setShowFimScreen(true); // Flashes FIM + GRAVANDO!
          playUrnaConfirmSound();

          setTimeout(() => {
            setIsPressingHand(false);
            setHandKey(null);
            setActiveKey(null);
            setIsConfirmFlashing(false);

            // After 2.2 seconds of FIM screen, return to normal display
            setTimeout(() => {
              setShowFimScreen(false);
              setTypedDigits(candidate.number.split('').slice(0, 2));
            }, 2200);
          }, 350);
        }, 220);
      }, 220);
    }, 120);
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', ''],
  ];

  const formattedPercentage = percentage.toFixed(1).replace('.', ',');
  const hasFullDigits = Boolean(typedDigits[1]);

  return (
    <div className="flex-1 flex flex-col items-center min-w-0 max-w-[215px] sm:max-w-[250px]">
      {/* 1. TOP SCORE CARD WITH CANDIDATE PHOTO & NAME */}
      <div
        className={`w-full rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between bg-slate-950/95 border shadow-xl relative transition-all ${
          candidate.id === 'left'
            ? 'border-blue-500/70 border-t-4 border-t-blue-500 shadow-blue-500/20'
            : 'border-red-500/70 border-t-4 border-t-red-500 shadow-red-500/20'
        }`}
      >
        {/* Candidate Header: Photo, Name & Number Nítidos */}
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Foto Nítida do Candidato */}
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 overflow-hidden shrink-0 shadow bg-zinc-800 ${
                candidate.id === 'left' ? 'border-blue-400' : 'border-red-400'
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
              <span className="text-[10px] sm:text-xs font-black text-white truncate uppercase tracking-tight leading-none">
                {candidate.name}
              </span>
              <span
                className={`text-[9px] font-digital font-black ${
                  candidate.id === 'left' ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                NÚMERO {candidate.number}
              </span>
            </div>
          </div>

          {isLeading && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[7.5px] uppercase tracking-tighter shrink-0 animate-bounce shadow">
              👑 LÍDER
            </span>
          )}
        </div>

        {/* Big Massive Points Number (56 / 88) */}
        <div className="flex flex-col items-center justify-center my-0.5">
          <span
            className="text-4xl sm:text-5xl font-black font-digital tracking-tight text-white leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {points}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            PONTOS
          </span>
        </div>

        {/* Footer: Percentage & Gifts Count */}
        <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-bold text-slate-300">
          <span className="text-white font-black">{formattedPercentage}%</span>
          <span className="text-slate-400">🎁 {giftsCount} pres.</span>
        </div>

        {/* Regra Exata Solicitada: "5 comentários número 22 = 1 ponto" / "5 comentários número 13 = 1 ponto" */}
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[7.5px] sm:text-[8px] leading-tight">
          <span className="text-amber-300 font-extrabold truncate">
            5 comentários número {candidate.number} = 1 ponto
          </span>
          <span
            className={`font-black font-digital px-1 py-0.2 rounded shrink-0 ml-1 shadow ${
              candidate.id === 'left'
                ? 'bg-blue-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {commentCount}/5
          </span>
        </div>
      </div>

      {/* 2. Donor Toast Ticker Badge (@Mara • Rosa x2 • +2 pontos) */}
      <div className="w-full my-1 min-h-[19px] flex items-center justify-center">
        <div className="w-full px-1.5 py-0.5 rounded-full bg-black/85 border border-slate-700/80 text-[8px] sm:text-[9px] text-slate-300 truncate text-center shadow">
          {lastVoteUser ? (
            <span>
              <strong className="text-amber-300">{lastVoteUser}</strong> • {lastVoteText || 'votou'}
            </span>
          ) : (
            <span className="text-slate-400 italic">Digite {candidate.number} no chat</span>
          )}
        </div>
      </div>

      {/* 3. PHYSICAL URNA ELETRÔNICA COM TELA BRANCA OFICIAL & TECLADO */}
      <div className="relative w-full rounded-xl p-1.5 bg-gradient-to-b from-slate-200 via-gray-300 to-slate-400 border border-slate-400 shadow-2xl flex flex-col">
        {/* Urna Face: Split Screen (Left) and Keypad (Right) */}
        <div className="grid grid-cols-12 gap-1 items-stretch">
          {/* TELA BRANCA OFICIAL COM LOGO DA JUSTIÇA ELEITORAL */}
          <div className="col-span-7 bg-white border-2 border-slate-500 rounded-md p-1.5 flex flex-col justify-between min-h-[104px] sm:min-h-[118px] text-zinc-950 shadow-inner relative overflow-hidden">
            {showFimScreen ? (
              /* FIM Confirmation Screen (Tela de finalização oficial da urna) */
              <div className="flex flex-col items-center justify-center w-full h-full text-center py-2 animate-pulse">
                <span className="text-3xl sm:text-4xl font-black font-screen tracking-widest text-zinc-950 leading-none">
                  FIM
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-700 mt-1">
                  VOTO GRAVADO
                </span>
                <span
                  className={`text-[8.5px] sm:text-[9.5px] font-black uppercase mt-1 px-1.5 py-0.2 rounded-full ${
                    candidate.id === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  +{lastConfirmedPoints} PONTO COMPUTADO!
                </span>
              </div>
            ) : (
              /* White LCD Screen Content */
              <div className="flex flex-col justify-between w-full h-full leading-tight">
                {/* Top: Logo da Justiça Eleitoral / Urna */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
                  <div className="flex items-center gap-1">
                    {/* Brasão da Justiça Eleitoral */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" fill="#009b3a" stroke="#fed100" strokeWidth="2" />
                      <circle cx="12" cy="12" r="6" fill="#002776" />
                      <path d="M7 12 C10 10 14 10 17 12" stroke="#ffffff" strokeWidth="1.2" />
                      <circle cx="12" cy="12" r="1.5" fill="#fed100" />
                    </svg>
                    <span className="text-[6px] sm:text-[6.5px] font-black tracking-tighter text-zinc-800 uppercase font-sans">
                      JUSTIÇA ELEITORAL
                    </span>
                  </div>
                  <span className="text-[5.5px] text-zinc-400 font-bold">BR</span>
                </div>

                {/* Center: President label, Number Boxes & Candidate Photo */}
                <div className="flex items-start justify-between w-full flex-1 gap-1 py-0.5">
                  <div className="flex flex-col text-left flex-1 min-w-0">
                    <span className="text-[5.5px] text-zinc-500 font-semibold uppercase leading-none">
                      SEU VOTO PARA
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] text-zinc-900 font-black uppercase tracking-tight">
                      PRESIDENTE
                    </span>

                    {/* Digit Boxes with blinking cursor */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[6px] text-zinc-600 font-bold">Nº:</span>
                      <div className="flex gap-0.5">
                        <span className="w-3.5 h-4.5 sm:w-4 sm:h-5 bg-white text-zinc-950 font-digital font-black text-xs sm:text-sm flex items-center justify-center rounded border-2 border-zinc-900 shadow-inner">
                          {typedDigits[0] || (
                            <span className="w-0.5 h-3 bg-zinc-900 animate-pulse inline-block" />
                          )}
                        </span>
                        <span className="w-3.5 h-4.5 sm:w-4 sm:h-5 bg-white text-zinc-950 font-digital font-black text-xs sm:text-sm flex items-center justify-center rounded border-2 border-zinc-900 shadow-inner">
                          {typedDigits[1] || (
                            typedDigits[0] ? <span className="w-0.5 h-3 bg-zinc-900 animate-pulse inline-block" /> : ''
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Conforme digita, aparecem nome e foto */}
                    {hasFullDigits ? (
                      <div className="mt-0.5 pt-0.5 border-t border-zinc-200 leading-tight space-y-0.2 animate-fade-in">
                        <div className="text-[6.5px] sm:text-[7px] font-black text-zinc-950 uppercase truncate">
                          {candidate.name}
                        </div>
                        <div className="text-[5.5px] sm:text-[6px] text-zinc-700 font-bold">
                          Part: {candidate.party}
                        </div>
                        <div className="text-[5px] sm:text-[5.5px] text-zinc-500 font-medium truncate">
                          Vice: {candidate.vice}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0.5 pt-0.5 border-t border-zinc-200 text-[5.5px] text-zinc-400 italic">
                        {typedDigits[0] ? 'Digitando...' : 'Aguardando voto...'}
                      </div>
                    )}
                  </div>

                  {/* Foto Oficial na Tela Branca da Urna */}
                  <div className="w-9 h-11 sm:w-10 sm:h-12 rounded border-2 border-zinc-800 overflow-hidden bg-zinc-100 shrink-0 shadow flex items-center justify-center relative mt-0.5">
                    {hasFullDigits ? (
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        className="w-full h-full object-cover object-top animate-fade-in"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-30">
                          <circle cx="12" cy="12" r="10" stroke="#18181b" strokeWidth="2" />
                          <path d="M12 7 L12 17 M7 12 L17 12" stroke="#18181b" strokeWidth="2" />
                        </svg>
                        <span className="text-[5px] text-zinc-400 font-bold uppercase mt-0.5">FOTO</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Notice */}
                <div className="text-[5px] text-zinc-400 border-t border-zinc-200 pt-0.5 uppercase tracking-tighter">
                  Aperte a tecla: <strong className="text-emerald-700">VERDE</strong> para CONFIRMAR
                </div>
              </div>
            )}
          </div>

          {/* Keypad Casing */}
          <div className="col-span-5 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-md p-1 border border-zinc-700 shadow-inner flex flex-col justify-between relative overflow-hidden">
            {/* Number grid (1-9 and 0) */}
            <div className="grid grid-cols-3 gap-0.5 mb-0.5">
              {keypadRows.map((row, rIdx) =>
                row.map((keyVal, cIdx) => {
                  if (!keyVal) {
                    return <div key={`${rIdx}-${cIdx}`} className="h-3.5 sm:h-4" />;
                  }
                  const isCurrentActive = activeKey === keyVal;
                  return (
                    <button
                      key={keyVal}
                      type="button"
                      onClick={() => {
                        playKeyBeep();
                        setActiveKey(keyVal);
                        setTimeout(() => setActiveKey(null), 120);
                      }}
                      className={`h-3.5 sm:h-4.5 rounded bg-gradient-to-b from-zinc-600 to-zinc-800 text-white font-black text-[7.5px] sm:text-[9px] flex items-center justify-center border border-zinc-500 shadow active:scale-90 ${
                        isCurrentActive ? 'bg-amber-400 text-zinc-950 ring-1 ring-amber-300' : ''
                      }`}
                    >
                      {keyVal}
                    </button>
                  );
                })
              )}
            </div>

            {/* Special Keys: BRANCO, CORRIGE, CONFIRMA */}
            <div className="grid grid-cols-3 gap-0.5 pt-0.5 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => playKeyBeep()}
                className="h-4 sm:h-5 rounded bg-white text-zinc-900 font-black text-[5px] sm:text-[6.5px] uppercase tracking-tighter flex items-center justify-center shadow"
              >
                Branco
              </button>
              <button
                type="button"
                onClick={() => {
                  playKeyBeep();
                  setTypedDigits(['', '']);
                  setTimeout(() => setTypedDigits(candidate.number.split('').slice(0, 2)), 1200);
                }}
                className="h-4 sm:h-5 rounded bg-amber-600 text-white font-black text-[5px] sm:text-[6.5px] uppercase tracking-tighter flex items-center justify-center shadow"
              >
                Corrige
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerVoteSequence(candidate.number, 1);
                  onVote(candidate.id, 1, 'Manual', '🟢');
                }}
                className={`h-4 sm:h-5 rounded bg-emerald-600 text-white font-black text-[5px] sm:text-[6.5px] uppercase tracking-tighter flex items-center justify-center shadow ${
                  isConfirmFlashing || activeKey === 'CONFIRMA'
                    ? 'ring-2 ring-emerald-300 brightness-150 scale-95'
                    : ''
                }`}
              >
                Confirma
              </button>
            </div>
          </div>
        </div>

        {/* 3D Cartoon Arm & Pointing Finger that physically presses keys */}
        <CartoonHand
          isPressing={isPressingHand}
          targetKey={handKey}
          side={candidate.id}
        />
      </div>

      {/* 4. Wooden Desk Surface */}
      <div className="w-full h-2.5 sm:h-3 bg-gradient-to-b from-[#8b5a36] via-[#6f4325] to-[#452712] rounded-b-md shadow-md border-t border-[#a66f43]" />

      {/* 5. TABELA DE PRESENTES BEM EVIDENTE ABAIXO DA URNA (INTERATIVOS & DESTAQUE MÁXIMO) */}
      <div
        className={`w-full mt-1.5 p-1 sm:p-1.5 rounded-2xl bg-slate-950/95 border-2 shadow-2xl flex flex-col gap-1 transition-all ${
          candidate.id === 'left' ? 'border-blue-500/80' : 'border-red-500/80'
        }`}
      >
        <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-black uppercase px-0.5 text-slate-300">
          <span className="text-amber-300">🎁 PRESENTES NO {candidate.number}</span>
          <span className="text-[6.5px] text-slate-400">TOQUE P/ VOTAR</span>
        </div>

        {/* Grid de presentes com +1 ao lado da rosa e +1 ao lado do sorvete */}
        <div className="grid grid-cols-3 gap-1 text-center">
          {/* Presente 1: Rosa ou Sorvete (+1 PONTO) */}
          <button
            type="button"
            onClick={() => {
              const icon = candidate.id === 'left' ? '🌹' : '🍦';
              const name = candidate.id === 'left' ? 'Rosa' : 'Sorvete';
              triggerVoteSequence(candidate.number, 1);
              onVote(candidate.id, 1, name, icon);
            }}
            className="group p-1 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-400 flex flex-col items-center justify-between transition-all active:scale-95 shadow cursor-pointer"
          >
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-lg sm:text-xl filter drop-shadow">
                {candidate.id === 'left' ? '🌹' : '🍦'}
              </span>
              <span className="px-1 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-black font-digital text-[9px] shadow">
                +1
              </span>
            </div>
            <span className="text-[7.5px] sm:text-[8px] text-slate-300 font-extrabold truncate mt-0.5">
              {candidate.id === 'left' ? 'Rosa' : 'Sorvete'}
            </span>
            <span className="text-[8px] sm:text-[8.5px] font-black text-amber-300 font-digital leading-none">
              +1 PONTO
            </span>
          </button>

          {/* Presente 2: Donut ou Coração (+10 PONTOS) */}
          <button
            type="button"
            onClick={() => {
              const icon = candidate.id === 'left' ? '🍩' : '💖';
              const name = candidate.id === 'left' ? 'Donut' : 'Coração';
              triggerVoteSequence(candidate.number, 10);
              onVote(candidate.id, 10, name, icon);
            }}
            className="group p-1 rounded-xl bg-slate-900 border border-emerald-500/60 hover:border-emerald-400 flex flex-col items-center justify-between transition-all active:scale-95 shadow cursor-pointer"
          >
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-lg sm:text-xl filter drop-shadow">
                {candidate.id === 'left' ? '🍩' : '💖'}
              </span>
              <span className="px-1 py-0.2 rounded-full bg-emerald-500 text-white font-black font-digital text-[8.5px] shadow">
                +10
              </span>
            </div>
            <span className="text-[7.5px] sm:text-[8px] text-emerald-300 font-extrabold truncate mt-0.5">
              {candidate.id === 'left' ? 'Donut' : 'Coração'}
            </span>
            <span className="text-[8px] sm:text-[8.5px] font-black text-emerald-400 font-digital leading-none">
              +10 PONTOS
            </span>
          </button>

          {/* Presente 3: Leão ou Galáxia (+100 PONTOS MEGA) */}
          <button
            type="button"
            onClick={() => {
              const icon = candidate.id === 'left' ? '🦁' : '🌌';
              const name = candidate.id === 'left' ? 'Leão' : 'Galáxia';
              triggerVoteSequence(candidate.number, 100);
              onVote(candidate.id, 100, name, icon);
            }}
            className="group p-1 rounded-xl bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-400/90 hover:border-yellow-300 flex flex-col items-center justify-between transition-all active:scale-95 shadow-md shadow-amber-500/30 cursor-pointer animate-pulse"
          >
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-lg sm:text-xl filter drop-shadow">
                {candidate.id === 'left' ? '🦁' : '🌌'}
              </span>
              <span className="px-1 py-0.2 rounded-full bg-yellow-400 text-zinc-950 font-black font-digital text-[8px] shadow">
                +100
              </span>
            </div>
            <span className="text-[7.5px] sm:text-[8px] text-yellow-300 font-black truncate mt-0.5">
              {candidate.id === 'left' ? 'Leão' : 'Galáxia'}
            </span>
            <span className="text-[8px] sm:text-[8.5px] font-black text-yellow-300 font-digital leading-none">
              +100 PONTOS
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
