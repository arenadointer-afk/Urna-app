import React from 'react';

export interface FloatingItem {
  id: number;
  emoji: string;
  leftPercent: number;
  size: number;
  color: string;
}

interface FloatingReactionsProps {
  items: FloatingItem[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ items }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(100vh) scale(0.6) rotate(0deg);
          }
          15% {
            opacity: 0.9;
            transform: translateY(80vh) scale(1.1) rotate(10deg);
          }
          85% {
            opacity: 0.8;
            transform: translateY(15vh) scale(1) rotate(-15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(0vh) scale(0.8) rotate(20deg);
          }
        }
      `}</style>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.leftPercent}%`,
            fontSize: `${item.size}px`,
            animation: 'floatUp 2.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};
