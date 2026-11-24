import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-[0.625rem] border border-[#C89B5A]/45 bg-[#2E1F16] px-3.5 py-2 text-xs font-medium text-[#FAF7F0] shadow-lg lg:bottom-4"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#C89B5A]" />
      <span>Offline Mode — Cached app shell active</span>
    </div>
  );
};
