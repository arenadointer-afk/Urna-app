import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface PointNotificationItem {
  id: string;
  username: string;
  giftName?: string;
  giftIcon?: string;
  amount: number;
  side: 'left' | 'right';
  candidateNumber: string;
  candidateName: string;
  timestamp: number;
}

interface LivePointNotificationProps {
  notifications: PointNotificationItem[];
  onDismiss: (id: string) => void;
}

export const LivePointNotification: React.FC<LivePointNotificationProps> = ({
  notifications,
  onDismiss,
}) => {
  // Only show the 2 most recent notifications stacked
  const visibleItems = notifications.slice(0, 2);

  return (
    <div className="fixed top-24 sm:top-28 inset-x-0 z-40 pointer-events-none flex flex-col items-center gap-1.5 px-3">
      <AnimatePresence>
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className={`w-full max-w-sm px-3 py-1.5 rounded-2xl flex items-center justify-between shadow-2xl border-2 backdrop-blur-md ${
              item.side === 'left'
                ? 'bg-gradient-to-r from-red-950/95 via-black/90 to-red-900/90 border-red-500 shadow-red-500/30'
                : 'bg-gradient-to-r from-blue-950/95 via-black/90 to-blue-900/90 border-blue-500 shadow-blue-500/30'
            }`}
          >
            {/* Left info: Icon, user, and action */}
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-2xl sm:text-3xl filter drop-shadow animate-bounce shrink-0">
                {item.giftIcon || '🎁'}
              </span>
              <div className="flex flex-col min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-amber-300 truncate">
                    {item.username}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-200 uppercase font-bold shrink-0">
                    {item.giftName || 'Voto'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-bold truncate">
                  Votou no <strong className={item.side === 'left' ? 'text-red-400' : 'text-blue-400'}>
                    {item.candidateNumber} ({item.candidateName.split(' ')[0]})
                  </strong>
                </span>
              </div>
            </div>

            {/* Right pill: Big points badge (+1 PONTO / +10 PONTOS) */}
            <div className="shrink-0 flex items-center gap-1 pl-1">
              <div
                className={`px-2.5 py-1 rounded-xl font-digital font-black text-xs sm:text-sm tracking-wider shadow border ${
                  item.side === 'left'
                    ? 'bg-red-600 border-red-300 text-white shadow-red-500/50'
                    : 'bg-blue-600 border-blue-300 text-white shadow-blue-500/50'
                }`}
              >
                +{item.amount} {item.amount === 1 ? 'PONTO' : 'PONTOS'}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
