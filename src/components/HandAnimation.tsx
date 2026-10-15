import React from 'react';

interface HandAnimationProps {
  isPressing: boolean;
  targetKey: string | null;
  side: 'left' | 'right';
}

export const CartoonHand: React.FC<HandAnimationProps> = ({ isPressing, targetKey, side }) => {
  if (!isPressing) return null;

  // Calculate coordinates relative to keypad based on targetKey
  let offsetX = 0;
  let offsetY = 0;

  switch (targetKey) {
    case '1':
      offsetX = -16;
      offsetY = -42;
      break;
    case '2':
      offsetX = 0;
      offsetY = -42;
      break;
    case '3':
      offsetX = 16;
      offsetY = -42;
      break;
    case '4':
      offsetX = -16;
      offsetY = -28;
      break;
    case '5':
      offsetX = 0;
      offsetY = -28;
      break;
    case '6':
      offsetX = 16;
      offsetY = -28;
      break;
    case '7':
      offsetX = -16;
      offsetY = -14;
      break;
    case '8':
      offsetX = 0;
      offsetY = -14;
      break;
    case '9':
      offsetX = 16;
      offsetY = -14;
      break;
    case '0':
      offsetX = 0;
      offsetY = 0;
      break;
    case 'CONFIRMA':
      offsetX = 18;
      offsetY = 16;
      break;
    case 'CORRIGE':
      offsetX = 0;
      offsetY = 16;
      break;
    case 'BRANCO':
      offsetX = -18;
      offsetY = 16;
      break;
    default:
      offsetX = 0;
      offsetY = -20;
  }

  return (
    <div
      className="absolute z-40 pointer-events-none transition-all duration-150 ease-out"
      style={{
        right: '18%',
        bottom: '8px',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      <div
        className="transform origin-bottom"
        style={{
          animation: 'fingerPressDown 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards',
        }}
      >
        <style>{`
          @keyframes fingerPressDown {
            0% {
              transform: translateY(18px) scale(0.92);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-4px) scale(1.04);
              opacity: 1;
            }
            100% {
              transform: translateY(0px) scale(1);
              opacity: 1;
            }
          }
        `}</style>

        {/* 3D Cartoon Arm & Pointing Finger pressing down */}
        <svg
          width="58"
          height="92"
          viewBox="0 0 70 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.8)]"
        >
          <defs>
            <linearGradient id={`armSkin-${side}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f7caa4" />
              <stop offset="50%" stopColor="#e59866" />
              <stop offset="100%" stopColor="#c97a47" />
            </linearGradient>
            <linearGradient id={`sleeveGrad-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={side === 'left' ? '#2563eb' : '#dc2626'} />
              <stop offset="100%" stopColor={side === 'left' ? '#1e40af' : '#991b1b'} />
            </linearGradient>
          </defs>

          {/* Sleeve Cuff */}
          <path
            d="M16 120 L54 120 L51 92 L19 92 Z"
            fill={`url(#sleeveGrad-${side})`}
            stroke="#111827"
            strokeWidth="2.5"
          />
          <ellipse cx="35" cy="92" rx="16" ry="4" fill="#ffffff" stroke="#111827" strokeWidth="2" />

          {/* Forearm skin */}
          <path
            d="M21 92 C21 76 23 60 26 48 C28 48 42 48 44 48 C47 60 49 76 49 92 Z"
            fill={`url(#armSkin-${side})`}
            stroke="#8c4820"
            strokeWidth="1.5"
          />

          {/* Hand Palm */}
          <path
            d="M23 50 C21 42 26 34 35 34 C44 34 49 42 47 50 C45 56 25 56 23 50 Z"
            fill={`url(#armSkin-${side})`}
            stroke="#8c4820"
            strokeWidth="1.5"
          />

          {/* Pointing Index Finger */}
          <path
            d="M32 36 L32 4 C32 1 38 1 38 4 L38 36 Z"
            fill={`url(#armSkin-${side})`}
            stroke="#78350f"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Fingernail */}
          <ellipse cx="35" cy="6" rx="2.2" ry="2.8" fill="#ffe3d1" />

          {/* Curled fingers (Middle, Ring, Pinky) */}
          <path d="M38 36 C43 34 47 37 46 42 C45 46 40 46 38 44" fill="#da8655" stroke="#783914" strokeWidth="1.2" />
          <path d="M38 43 C43 41 46 44 45 48 C44 52 39 51 38 49" fill="#da8655" stroke="#783914" strokeWidth="1.2" />

          {/* Thumb */}
          <path d="M25 44 C21 40 22 34 26 36 C30 38 29 46 25 44" fill="#da8655" stroke="#783914" strokeWidth="1.2" />

          {/* Impact Click Star on Key */}
          <g className="animate-ping origin-center">
            <circle cx="35" cy="2" r="3.5" fill="#fef08a" />
            <path d="M35 -3 L35 7 M30 2 L40 2" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
};
