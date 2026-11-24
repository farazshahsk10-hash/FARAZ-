import React, { useState } from 'react';
import { Download, MonitorDown, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from '../ui/button';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'mobileHeader';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  async function handleClick() {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setShowGuide(true);
  }

  const label = variant === 'mobileHeader' ? 'App' : 'Install App';

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-[0.625rem] border border-[#C89B5A]/35 bg-[#C89B5A]/15 px-3 py-2 text-sm font-semibold text-[#FAF7F0] hover:bg-[#C89B5A]/25 transition-colors cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4 text-[#C89B5A] shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ) : variant === 'mobileHeader' ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install FARAZ AI App"
          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-[0.625rem] border border-[#E5D9C3] bg-[#F3ECDF] px-2.5 py-1.5 text-xs font-semibold text-[#9E2B25] hover:bg-[#E5D9C3]/60 cursor-pointer ${className}`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ) : (
        <Button
          type="button"
          variant="outlineLight"
          size="sm"
          onClick={handleClick}
          className={className}
        >
          <Download className="h-3.5 w-3.5 text-[#C89B5A]" />
          <span>{label}</span>
        </Button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E1F16]/65 p-4 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] p-6 text-[#3B2A1E] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.625rem] bg-[#2E1F16] text-[#C89B5A]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#3B2A1E]">
                    Install FARAZ AI App
                  </h3>
                  <p className="text-xs text-[#7A6A58]">
                    Run fullscreen on phone or desktop with offline support
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close install instructions"
                onClick={() => setShowGuide(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[0.5rem] text-[#7A6A58] hover:bg-[#F3ECDF] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {isIOS ? (
                <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-4 space-y-2">
                  <p className="font-semibold text-[#3B2A1E] flex items-center gap-2">
                    <Share className="h-4 w-4 text-[#9E2B25]" />
                    On iPhone or iPad (Safari)
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-[#7A6A58]">
                    <li>Open FARAZ AI in Safari (not inside an embedded preview).</li>
                    <li>Tap the <strong>Share</strong> icon in the browser bar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  </ol>
                </div>
              ) : (
                <>
                  <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-4 space-y-1.5">
                    <p className="font-semibold text-[#3B2A1E] flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#9E2B25]" />
                      On Android (Chrome / Edge)
                    </p>
                    <p className="text-xs text-[#7A6A58]">
                      Open the browser menu (three dots) and tap <strong>Install app</strong> or{' '}
                      <strong>Add to Home screen</strong>.
                    </p>
                  </div>

                  <div className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] p-4 space-y-1.5">
                    <p className="font-semibold text-[#3B2A1E] flex items-center gap-2">
                      <MonitorDown className="h-4 w-4 text-[#9E2B25]" />
                      On Desktop (Chrome / Edge)
                    </p>
                    <p className="text-xs text-[#7A6A58]">
                      Click the install icon in the right side of the address bar, or open menu and choose{' '}
                      <strong>Install FARAZ AI</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setShowGuide(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
