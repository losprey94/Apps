import { useState } from 'react'
import { ChevronRight, Check, Home } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHaptic } from '../hooks/useHaptic'

const AVATARS = ['😊','🧑','👨','👩','🧔','👴','👵','🧒','🧑‍💻','🧑‍🍳','🧑‍🌾','🧑‍🔧','🦸','🧙','🧜','🐱','🐶','🦊','🐼','🦁']

const STEPS = [
  { id: 'welcome' },
  { id: 'profile' },
  { id: 'first_task' },
  { id: 'done' },
]

export default function Onboarding({ onFinish }) {
  const haptic = useHaptic()
  const [step, setStep] = useState(0)
  const [name, setName] = useLocalStorage('user-name', '')
  const [emoji, setEmoji] = useLocalStorage('user-emoji', '😊')
  const [tasks, setTasks] = useLocalStorage('tasks', [])
  const [taskName, setTaskName] = useState('')
  const [taskInterval, setTaskInterval] = useState('7')
  const [animating, setAnimating] = useState(false)

  const next = () => {
    haptic.tap()
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 180)
  }

  const skip = () => {
    haptic.light()
    setStep(3)
  }

  const addTaskAndNext = () => {
    if (taskName.trim()) {
      setTasks(prev => [...prev, {
        id: Date.now(),
        name: taskName.trim(),
        intervalDays: parseInt(taskInterval) || 7,
        lastDone: null,
        deadline: null,
        assignedTo: null,
      }])
    }
    haptic.success()
    setStep(3)
  }

  const finish = () => {
    haptic.done()
    onFinish()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {STEPS.map((_, i) => (
          <div key={i}
            className={`rounded-full transition-all duration-300 ${i === step ? 'w-6 h-2 bg-white' : i < step ? 'w-2 h-2 bg-white/40' : 'w-2 h-2 bg-white/20'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-sm transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              🏠
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">Domáci Rytmus</h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Tvoja rodinná appka pre domácnosť. Úlohy, rastliny, nákup, rozpočet — všetko na jednom mieste.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-4 text-left">
              {['✅ Úlohy s termínmi a pripomienkami','🌿 Rastliny a zalievanie','🛒 Nákupný zoznam','💶 Rozpočet a výdavky','👨‍👩‍👧 Zdieľanie s rodinou'].map(f => (
                <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="flex flex-col items-center w-full gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">{emoji}</div>
              <h2 className="text-2xl font-bold text-white">Ako sa voláš?</h2>
              <p className="text-slate-400 text-sm mt-1">Appka ťa bude personálne pozdravovať</p>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Tvoje meno..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white text-lg text-center placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <div>
              <div className="text-xs text-slate-500 mb-3 text-center uppercase tracking-wide">Vyber si avatara</div>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map(e => (
                  <button key={e} onClick={() => { setEmoji(e); haptic.light() }}
                    className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-indigo-600 scale-110 shadow-lg shadow-indigo-900' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — First task */}
        {step === 2 && (
          <div className="flex flex-col items-center w-full gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-white">Prvá úloha</h2>
              <p className="text-slate-400 text-sm mt-1">Pridaj prvú domácu úlohu — alebo preskočiť</p>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Napr. Vysávanie, Umytie okien..."
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <div className="w-full">
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Ako často?</div>
              <div className="flex gap-2 flex-wrap">
                {[['Denne','1'],['Týždenne','7'],['2 týždne','14'],['Mesačne','30']].map(([l, v]) => (
                  <button key={v} onClick={() => setTaskInterval(v)}
                    className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${taskInterval === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-900/50 animate-pop">
                <Check size={52} className="text-white" strokeWidth={3} />
              </div>
              <div className="absolute -top-1 -right-1 text-3xl animate-bounce">🎉</div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                {name ? `Vitaj, ${name}!` : 'Vitaj!'}
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Domáci Rytmus je pripravený. Začni pridávať úlohy, rastliny a zdieľaj s rodinou.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-4">
        {step === 0 && (
          <button onClick={next}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-95">
            Začíname <ChevronRight size={20} />
          </button>
        )}
        {step === 1 && (
          <button onClick={next} disabled={!name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-95">
            Pokračovať <ChevronRight size={20} />
          </button>
        )}
        {step === 2 && (
          <>
            <button onClick={addTaskAndNext}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-95">
              {taskName.trim() ? 'Pridať a pokračovať' : 'Preskočiť'} <ChevronRight size={20} />
            </button>
          </>
        )}
        {step === 3 && (
          <button onClick={finish}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-95">
            <Home size={20} /> Otvoriť appku
          </button>
        )}
      </div>
    </div>
  )
}
