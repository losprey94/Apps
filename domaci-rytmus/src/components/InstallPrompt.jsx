import { useState } from 'react'
import { X, Download, Share, Plus, Smartphone } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHaptic } from '../hooks/useHaptic'

// ─── iOS step-by-step instructions ────────────────────────────────────────────
function IOSGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Smartphone size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Pridaj na plochu</div>
              <div className="text-xs text-slate-400">iPhone / iPad návod</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="p-5 flex flex-col gap-4">
          {[
            {
              n: '1',
              icon: <Share size={20} className="text-blue-500" />,
              title: 'Klepni na Zdieľať',
              desc: 'V Safari dole (alebo hore) nájdi ikonu štvorca so šípkou nahor',
              visual: (
                <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-4 py-3 gap-2">
                  <Share size={24} className="text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Zdieľať</span>
                </div>
              ),
            },
            {
              n: '2',
              icon: <Plus size={20} className="text-emerald-500" />,
              title: 'Zvoľ „Pridať na plochu"',
              desc: 'Posuň zoznam nižšie a nájdi túto možnosť',
              visual: (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 flex items-center justify-center shadow-sm">
                    <Plus size={20} className="text-slate-700 dark:text-slate-300" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pridať na plochu</span>
                </div>
              ),
            },
            {
              n: '3',
              icon: <Download size={20} className="text-indigo-500" />,
              title: 'Klepni „Pridať"',
              desc: 'Vpravo hore potvrď "Pridať" — ikona appky sa objaví na ploche',
              visual: (
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3">
                  <span className="text-sm text-indigo-600 dark:text-indigo-300">Domáci Rytmus</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">Pridať</span>
                </div>
              ),
            },
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                {step.n}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{step.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{step.desc}</div>
                {step.visual}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors active:scale-95 text-sm"
          >
            Rozumiem, ďakujem!
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main install banner ───────────────────────────────────────────────────────
export default function InstallPrompt() {
  const { canInstall, isIOS, hasPrompt, triggerInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useLocalStorage('pwa-banner-dismissed', false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const haptic = useHaptic()

  if (!canInstall || dismissed) return null

  const handleInstall = async () => {
    haptic.tap()
    if (isIOS) {
      setShowIOSGuide(true)
    } else {
      const accepted = await triggerInstall()
      if (accepted) haptic.done()
    }
  }

  const handleDismiss = () => {
    haptic.light()
    setDismissed(true)
  }

  return (
    <>
      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}

      <div className="mx-4 mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex-shrink-0 flex items-center justify-center">
            <Download size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-tight">Inštalovať appku</div>
            <div className="text-indigo-200 text-xs mt-0.5 leading-snug">
              {isIOS
                ? 'Pridaj na plochu cez Safari → Zdieľať → Pridať na plochu'
                : 'Rýchly prístup bez prehliadača, funguje aj offline'}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <button
          onClick={handleInstall}
          className="mt-3 w-full bg-white text-indigo-700 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isIOS ? (
            <><Share size={15} /> Zobraziť návod</>
          ) : (
            <><Download size={15} /> Inštalovať teraz</>
          )}
        </button>
      </div>
    </>
  )
}
