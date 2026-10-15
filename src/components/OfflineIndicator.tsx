import React from 'react';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-xs animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — Cached data is currently active</span>
    </div>
  );
};
