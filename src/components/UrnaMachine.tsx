import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { CartoonHand } from './HandAnimation';
import { playKeyBeep, playUrnaConfirmSound } from '../utils/audio';

export interface UrnaMachineProps {
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  onVote: (
    side: 'left' | 'right',
    amount: number,
    giftName?: string,
    giftIcon?: string,
    username?: string
  ) => void;
  lastVoteTimestamp: number;
  lastVoteSide: 'left' | 'right' | null;
  lastVoteText?: string;
  lastVoteGiftIcon?: string;
  lastVoteAmount?: number;
  isInteractive?: boolean;
}

export const UrnaMachine: React.FC<UrnaMachineProps> = ({
  leftCandidate,
  rightCandidate,
  onVote,
  lastVoteTimestamp,
  lastVoteSide,
  lastVoteText,
  lastVoteGiftIcon,
  lastVoteAmount,
  isInteractive = true,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPressingHand, setIsPressingHand] = useState(false);
  const [handKey, setHandKey] = useState<string | null>(null);
  const [handSide, setHandSide] = useState<'left' | 'right'>('left');
  const [typedDigits, setTypedDigits] = useState<string[]>(['', '']);
  const [isConfirmFlashing, setIsConfirmFlashing] = useState(false);
  const [showFimScreen, setShowFimScreen] = useState(false);
  const [confirmedData, setConfirmedData] = useState<{
    candidate: Candidate;
    points: number;
    giftText?: string;
    giftIcon?: string;
  } | null>(null);

  const timersRef = React.useRef<any[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Trigger vote sequence with animated finger & TSE audio when vote event fires
  useEffect(() => {
    if (lastVoteTimestamp > 0) {
      const targetSide = lastVoteSide === 'right' ? 'right' : 'left';
      const target = targetSide === 'right' ? rightCandidate : leftCandidate;
      triggerVoteSequence(
        target,
        lastVoteAmount || 1,
        lastVoteText || (targetSide === 'right' ? 'Voto' : 'Voto'),
        lastVoteGiftIcon || target.primaryGift.icon
      );
    }
  }, [lastVoteTimestamp]);

  const triggerVoteSequence = (
    targetCandidate: Candidate,
    pointsAmount = 1,
    giftText?: string,
    giftIcon?: string
  ) => {
    clearAllTimers();
    const digits = targetCandidate.number.split('');
    const d1 = digits[0] || '1';
    const d2 = digits[1] || '3';

    setHandSide(targetCandidate.id);
    setIsPressingHand(true);
    setShowFimScreen(false);
    setTypedDigits(['', '']);

    // Step 1: Finger presses first digit
    const t1 = setTimeout(() => {
      setTypedDigits([d1, '']);
      setHandKey(d1);
      setActiveKey(d1);
      playKeyBeep();

      // Step 2: Finger presses second digit -> Candidate Photo & Name reveal on white screen!
      const t2 = setTimeout(() => {
        setTypedDigits([d1, d2]);
        setHandKey(d2);
        setActiveKey(d2);
        playKeyBeep();

        // Step 3: Finger swoops to green CONFIRMA key and presses it!
        const t3 = setTimeout(() => {
          setHandKey('CONFIRMA');
          setActiveKey('CONFIRMA');
          setIsConfirmFlashing(true);
          setShowFimScreen(true);
          setConfirmedData({
            candidate: targetCandidate,
            points: pointsAmount,
            giftText,
            giftIcon,
          });
          playUrnaConfirmSound();

          // Step 4: Release finger
          const t4 = setTimeout(() => {
            setIsPressingHand(false);
            setHandKey(null);
            setActiveKey(null);
            setIsConfirmFlashing(false);

            // Step 5: After FIM screen, return to clean waiting state
            const t5 = setTimeout(() => {
              setShowFimScreen(false);
              setTypedDigits(['', '']);
              setConfirmedData(null);
            }, 1200);
            timersRef.current.push(t5);
          }, 240);
          timersRef.current.push(t4);
        }, 200);
        timersRef.current.push(t3);
      }, 200);
      timersRef.current.push(t2);
    }, 60);
    timersRef.current.push(t1);
  };

  const currentEnteredNumber = typedDigits.join('');
  const matchedCandidate =
    currentEnteredNumber === leftCandidate.number
      ? leftCandidate
      : currentEnteredNumber === rightCandidate.number
      ? rightCandidate
      : null;
  const isInvalidNumber =
    Boolean(typedDigits[0] && typedDigits[1]) && !matchedCandidate;

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', ''],
  ];

  const handleKeyClick = (keyVal: string) => {
    if (!isInteractive) return;
    playKeyBeep();
    setActiveKey(keyVal);
    setTimeout(() => setActiveKey(null), 120);

    if (!typedDigits[0]) {
      setTypedDigits([keyVal, '']);
    } else if (!typedDigits[1]) {
      setTypedDigits([typedDigits[0], keyVal]);
    } else {
      setTypedDigits([keyVal, '']);
    }
  };

  const handleCorrige = () => {
    if (!isInteractive) return;
    playKeyBeep();
    setActiveKey('CORRIGE');
    setTimeout(() => setActiveKey(null), 120);
    setTypedDigits(['', '']);
    setShowFimScreen(false);
    setConfirmedData(null);
  };

  const handleBranco = () => {
    if (!isInteractive) return;
    playKeyBeep();
    setActiveKey('BRANCO');
    setTimeout(() => setActiveKey(null), 120);
    setTypedDigits(['B', 'R']);
  };

  const handleConfirma = () => {
    if (!isInteractive) return;
    setActiveKey('CONFIRMA');
    setTimeout(() => setActiveKey(null), 150);

    const target =
      matchedCandidate ||
      (currentEnteredNumber === ''
        ? lastVoteSide === 'right'
          ? rightCandidate
          : leftCandidate
        : null);

    if (target) {
      setIsConfirmFlashing(true);
      setShowFimScreen(true);
      setConfirmedData({
        candidate: target,
        points: 1,
        giftText: 'Urna Manual',
        giftIcon: '🗳️',
      });
      playUrnaConfirmSound();
      onVote(target.id, 1, 'Urna Manual', '🗳️');

      setTimeout(() => {
        setIsConfirmFlashing(false);
        setTimeout(() => {
          setShowFimScreen(false);
          setTypedDigits(['', '']);
          setConfirmedData(null);
        }, 2000);
      }, 320);
    } else {
      playKeyBeep();
    }
  };

  return (
    <div className="w-full flex flex-col items-center max-w-[390px] sm:max-w-[420px] mx-auto select-none my-0.5">
      {/* 1. PHYSICAL URNA ELETRÔNICA CASING */}
      <div className="relative w-full rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-slate-200 via-gray-300 to-slate-400 border-2 border-slate-400 shadow-2xl flex flex-col">
        {/* Urna Faceplate Header */}
        <div className="flex items-center justify-between px-1 pb-0.5 mb-1 border-b border-slate-300/80">
          <div className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 drop-shadow-sm"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="#009b3a"
                stroke="#fed100"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="6" fill="#002776" />
              <path
                d="M7 12 C10 10 14 10 17 12"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="12" r="1.5" fill="#fed100" />
            </svg>
            <span className="text-[8px] sm:text-[9px] font-black tracking-tight text-zinc-800 uppercase font-sans">
              JUSTIÇA ELEITORAL • URNA ELETRÔNICA
            </span>
          </div>
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-200/90 px-1 py-0.2 rounded border border-zinc-400">
            OFICIAL
          </span>
        </div>

        {/* Urna Split: Screen (Left 7 cols) & Keypad (Right 5 cols) */}
        <div className="grid grid-cols-12 gap-1 items-stretch relative">
          {/* TELA BRANCA OFICIAL COM LOGO DA JUSTIÇA ELEITORAL */}
          <div className="col-span-7 bg-white border-2 border-slate-500 rounded-lg p-1.5 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] text-zinc-950 shadow-inner relative overflow-hidden urna-screen-scanline">
            {showFimScreen ? (
              /* FIM Confirmation Screen */
              <div className="flex flex-col items-center justify-center w-full h-full text-center py-1 animate-pulse">
                <span className="text-3xl sm:text-4xl font-black font-screen tracking-widest text-zinc-950 leading-none">
                  FIM
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-700 mt-0.5">
                  VOTO GRAVADO
                </span>
                {confirmedData && (
                  <div
                    className={`mt-1 px-1.5 py-0.2 rounded-full flex items-center gap-1 shadow ${
                      confirmedData.candidate.id === 'left'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    <span className="text-[10px]">
                      {confirmedData.giftIcon || '🗳️'}
                    </span>
                    <span className="text-[8px] sm:text-[8.5px] font-black uppercase font-digital truncate max-w-[120px]">
                      +{confirmedData.points} P/ {confirmedData.candidate.name.split(' ')[0]}!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* White LCD Screen Content */
              <div className="flex flex-col justify-between w-full h-full leading-tight">
                {/* Header: Eleição Presidencial */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
                  <span className="text-[6.5px] sm:text-[7px] font-black text-zinc-700 uppercase">
                    ELEIÇÕES 2026
                  </span>
                  <span className="text-[6px] text-zinc-500 font-bold">BR</span>
                </div>

                {/* Center: President label, Number Boxes & Candidate Photo */}
                <div className="flex items-start justify-between w-full flex-1 gap-1 py-0.5">
                  <div className="flex flex-col text-left flex-1 min-w-0">
                    <span className="text-[6px] text-zinc-500 font-semibold uppercase leading-none">
                      SEU VOTO PARA
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-zinc-900 font-black uppercase tracking-tight">
                      PRESIDENTE
                    </span>

                    {/* Digit Boxes with blinking cursor */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[6.5px] text-zinc-600 font-bold">
                        Nº:
                      </span>
                      <div className="flex gap-0.5">
                        <span className="w-4 h-5 sm:w-5 sm:h-5.5 bg-white text-zinc-950 font-digital font-black text-xs sm:text-sm flex items-center justify-center rounded border-2 border-zinc-900 shadow-inner">
                          {typedDigits[0] || (
                            <span className="w-0.5 h-3 bg-zinc-900 animate-pulse inline-block" />
                          )}
                        </span>
                        <span className="w-4 h-5 sm:w-5 sm:h-5.5 bg-white text-zinc-950 font-digital font-black text-xs sm:text-sm flex items-center justify-center rounded border-2 border-zinc-900 shadow-inner">
                          {typedDigits[1] ||
                            (typedDigits[0] ? (
                              <span className="w-0.5 h-3 bg-zinc-900 animate-pulse inline-block" />
                            ) : (
                              ''
                            ))}
                        </span>
                      </div>
                    </div>

                    {/* Details: Aparecem quando o número corresponde ao candidato */}
                    {matchedCandidate ? (
                      <div className="mt-0.5 pt-0.5 border-t border-zinc-200 leading-tight space-y-0.2 animate-fade-in">
                        <div
                          className={`text-[7.5px] sm:text-[8px] font-black uppercase truncate ${
                            matchedCandidate.id === 'left'
                              ? 'text-red-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {matchedCandidate.name}
                        </div>
                        <div className="text-[6px] text-zinc-700 font-bold">
                          Part: {matchedCandidate.party}
                        </div>
                        <div className="text-[5.5px] text-zinc-500 font-medium truncate">
                          Vice: {matchedCandidate.vice}
                        </div>
                      </div>
                    ) : isInvalidNumber ? (
                      <div className="mt-0.5 pt-0.5 border-t border-red-200 text-red-600 text-[6.5px] font-bold">
                        NÚMERO INVÁLIDO
                      </div>
                    ) : (
                      <div className="mt-0.5 pt-0.5 border-t border-zinc-200 text-[6px] text-zinc-500">
                        <div className="flex items-center gap-1 font-semibold truncate">
                          <span className="text-red-600 font-bold">
                            {leftCandidate.number}
                          </span>{' '}
                          {leftCandidate.name.split(' ')[0]}
                          <span>•</span>
                          <span className="text-blue-600 font-bold">
                            {rightCandidate.number}
                          </span>{' '}
                          {rightCandidate.name.split(' ')[0]}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foto Oficial na Tela Branca da Urna */}
                  <div className="w-9 h-11 sm:w-10 sm:h-12 rounded border-2 border-zinc-800 overflow-hidden bg-zinc-100 shrink-0 shadow flex items-center justify-center relative mt-0.5">
                    {matchedCandidate ? (
                      <img
                        src={matchedCandidate.photoUrl}
                        alt={matchedCandidate.name}
                        className="w-full h-full object-cover object-top animate-fade-in"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-0.5">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="opacity-30"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#18181b"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 7 L12 17 M7 12 L17 12"
                            stroke="#18181b"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="text-[5px] text-zinc-400 font-bold uppercase mt-0.5">
                          FOTO
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Notice */}
                <div className="text-[5.5px] sm:text-[6px] text-zinc-500 border-t border-zinc-200 pt-0.5 uppercase tracking-tighter truncate">
                  {matchedCandidate ? (
                    <span className="text-emerald-700 font-bold animate-pulse">
                      Aperte: <strong>VERDE</strong> para CONFIRMAR
                    </span>
                  ) : (
                    <span>Digite o número na urna ou envie presentes</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keypad Casing */}
          <div className="col-span-5 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-lg p-1 border border-zinc-700 shadow-inner flex flex-col justify-between relative overflow-hidden">
            {/* Number grid (1-9 and 0) */}
            <div className="grid grid-cols-3 gap-0.5 mb-0.5">
              {keypadRows.map((row, rIdx) =>
                row.map((keyVal, cIdx) => {
                  if (!keyVal) {
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="h-3.5 sm:h-4"
                      />
                    );
                  }
                  const isCurrentActive = activeKey === keyVal;
                  return (
                    <button
                      key={keyVal}
                      type="button"
                      onClick={() => handleKeyClick(keyVal)}
                      className={`h-3.5 sm:h-4.5 rounded bg-gradient-to-b from-zinc-600 to-zinc-800 text-white font-black text-[8px] sm:text-[9.5px] flex items-center justify-center border border-zinc-500 shadow transition-transform ${
                        isInteractive ? 'cursor-pointer active:scale-90' : 'cursor-default'
                      } ${
                        isCurrentActive
                          ? 'bg-amber-400 text-zinc-950 ring-1 ring-amber-300 scale-95'
                          : ''
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
                onClick={handleBranco}
                className={`h-4.5 sm:h-5 rounded bg-white text-zinc-900 font-black text-[5px] sm:text-[6px] uppercase tracking-tighter flex items-center justify-center shadow ${
                  isInteractive ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  activeKey === 'BRANCO' ? 'ring-1 ring-zinc-300' : ''
                }`}
              >
                Branco
              </button>
              <button
                type="button"
                onClick={handleCorrige}
                className={`h-4.5 sm:h-5 rounded bg-amber-600 text-white font-black text-[5px] sm:text-[6px] uppercase tracking-tighter flex items-center justify-center shadow ${
                  isInteractive ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  activeKey === 'CORRIGE' ? 'ring-1 ring-amber-300' : ''
                }`}
              >
                Corrige
              </button>
              <button
                type="button"
                onClick={handleConfirma}
                className={`h-4.5 sm:h-5 rounded bg-emerald-600 text-white font-black text-[5px] sm:text-[6px] uppercase tracking-tighter flex items-center justify-center shadow ${
                  isInteractive ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${
                  isConfirmFlashing || activeKey === 'CONFIRMA'
                    ? 'ring-2 ring-emerald-300 brightness-150 scale-95'
                    : ''
                }`}
              >
                Confirma
              </button>
            </div>
          </div>

          {/* 3D Cartoon Arm & Pointing Finger that physically presses keys */}
          <CartoonHand
            isPressing={isPressingHand}
            targetKey={handKey}
            side={handSide}
          />
        </div>
      </div>

      {/* 2. Wooden Desk Surface */}
      <div className="w-full h-2 sm:h-2.5 bg-gradient-to-b from-[#8b5a36] via-[#6f4325] to-[#452712] rounded-b-lg shadow-md border-t border-[#a66f43] flex items-center justify-center" />

      {/* 3. Quick Action Buttons to test or vote for either candidate directly */}
      <div className="w-full flex items-center justify-between gap-1.5 mt-1 px-0.5">
        <button
          type="button"
          onClick={() => {
            triggerVoteSequence(
              leftCandidate,
              1,
              leftCandidate.primaryGift.name,
              leftCandidate.primaryGift.icon
            );
            onVote(
              'left',
              1,
              leftCandidate.primaryGift.name,
              leftCandidate.primaryGift.icon
            );
          }}
          className="flex-1 py-0.5 px-1.5 rounded-lg bg-red-950/70 border border-red-500/60 hover:border-red-400 text-white text-[8px] sm:text-[8.5px] font-bold flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
        >
          <span>{leftCandidate.primaryGift.icon}</span>
          <span className="truncate">
            Votar {leftCandidate.number} ({leftCandidate.name.split(' ')[0]})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerVoteSequence(
              rightCandidate,
              1,
              rightCandidate.primaryGift.name,
              rightCandidate.primaryGift.icon
            );
            onVote(
              'right',
              1,
              rightCandidate.primaryGift.name,
              rightCandidate.primaryGift.icon
            );
          }}
          className="flex-1 py-0.5 px-1.5 rounded-lg bg-blue-950/70 border border-blue-500/60 hover:border-blue-400 text-white text-[8px] sm:text-[8.5px] font-bold flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
        >
          <span>{rightCandidate.primaryGift.icon}</span>
          <span className="truncate">
            Votar {rightCandidate.number} ({rightCandidate.name.split(' ')[0]})
          </span>
        </button>
      </div>
    </div>
  );
};
