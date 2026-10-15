import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install trigger
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-750">
                  <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">1. Tap Safari Share Icon</p>
                    <p className="text-slate-400 mt-0.5">At the bottom bar of Safari, tap the Share button.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-750">
                  <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">2. Select 'Add to Home Screen'</p>
                    <p className="text-slate-400 mt-0.5">Scroll down and tap 'Add to Home Screen' for the native app experience.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
