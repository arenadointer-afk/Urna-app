import React, { useState } from 'react';
import { BannerSettings } from '../types';
import { Sparkles, Edit3 } from 'lucide-react';

interface InteractiveBannerProps {
  settings: BannerSettings;
  onOpenSettings?: () => void;
  isLiveOnly?: boolean;
}

export const InteractiveBanner: React.FC<InteractiveBannerProps> = ({
  settings,
  onOpenSettings,
  isLiveOnly = false,
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [settings.url]);

  if (!settings.enabled || !settings.url) {
    return null;
  }

  // Altura responsiva customizável
  const heightClasses = {
    compact: 'h-14 sm:h-16',
    normal: 'h-20 sm:h-24',
    tall: 'h-28 sm:h-32',
  }[settings.height || 'normal'];

  return (
    <div className="w-full max-w-md px-1 sm:px-2 my-1 shrink-0 z-20">
      <div
        onClick={!isLiveOnly ? onOpenSettings : undefined}
        className={`group relative w-full ${heightClasses} rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900/80 shadow-lg shadow-black/50 transition-all ${
          !isLiveOnly ? 'cursor-pointer hover:border-amber-400/70 hover:shadow-amber-500/10' : ''
        }`}
        title={!isLiveOnly ? 'Clique para trocar a imagem do banner no painel' : undefined}
      >
        {!hasError ? (
          <img
            src={settings.url}
            alt="Banner da Batalha"
            onError={() => setHasError(true)}
            className={`w-full h-full ${
              settings.fit === 'contain' ? 'object-contain' : 'object-cover'
            } transition-transform duration-500 group-hover:scale-[1.01]`}
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 text-white font-bold text-xs p-2 text-center">
            <span>🗳️ ELEIÇÕES 2026 • MANDE PRESENTES PARA VOTAR!</span>
          </div>
        )}

        {/* Hover / Admin Hint */}
        {!isLiveOnly && (
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow">
            <Edit3 className="w-3 h-3" />
            <span>Editar Banner</span>
          </div>
        )}
      </div>
    </div>
  );
};
