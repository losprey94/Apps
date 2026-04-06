import { CheckCircle2, Droplets, ShoppingCart, AlertCircle, ChevronRight, Leaf, Zap } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const QUOTES = [
  'Malé kroky každý deň vedú k veľkým zmenám.',
  'Poriadok v domácnosti = poriadok v mysli.',
  'Dobre vedená domácnosť je základ pohody.',
  'Každá splnená úloha je dôvod na radosť.',
  'Starostlivosť o domov je starostlivosť o seba.',
]

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function getTaskStatus(task) {
  const days = getDaysSince(task.lastDone)
  if (days === null) return 'pending'
  const remaining = task.intervalDays - days
  if (remaining <= 0) return 'overdue'
  if (remaining <= Math.ceil(task.intervalDays * 0.2)) return 'soon'
  return 'ok'
}

function getPlantStatus(plant) {
  const days = getDaysSince(plant.lastWatered)
  if (days === null) return 'thirsty'
  return plant.intervalDays - days <= 0 ? 'thirsty' : plant.intervalDays - days <= 1 ? 'soon' : 'ok'
}

function formatDate() {
  try {
    return new Date().toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  }
}

function getGreeting(name) {
  const hour = new Date().getHours()
  const base = hour < 12 ? 'Dobré ráno' : hour < 18 ? 'Dobrý deň' : 'Dobrý večer'
  return name ? `${base}, ${name}` : `${base} 👋`
}

export default function Dashboard({ onNavigate, onWaterPlant, onCompleteTask }) {
  const [tasks, setTasks] = useLocalStorage('tasks', [])
  const [plants, setPlants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])
  const [userName] = useLocalStorage('user-name', '')
  const [userEmoji] = useLocalStorage('user-emoji', '😊')
  const [showQuotes] = useLocalStorage('show-quotes', true)

  const urgentTasks = tasks.filter(t => ['overdue', 'pending'].includes(getTaskStatus(t)))
  const thirstyPlants = plants.filter(p => getPlantStatus(p) === 'thirsty')
  const pendingShopping = shopping.filter(i => !i.done)
  const totalUrgent = urgentTasks.length + thirstyPlants.length
  const allGood = totalUrgent === 0

  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length]

  const quickWater = (plantId) => {
    setPlants(plants.map(p => p.id === plantId ? { ...p, lastWatered: new Date().toISOString() } : p))
  }

  const quickDone = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, lastDone: new Date().toISOString() } : t))
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-indigo-200 capitalize">{formatDate()}</div>
            <h2 className="text-xl font-bold mt-0.5">{getGreeting(userName)}</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {allGood
                ? 'Všetko je v poriadku! 🎉'
                : `${totalUrgent} ${totalUrgent === 1 ? 'vec vyžaduje' : 'veci vyžadujú'} pozornosť`
              }
            </p>
          </div>
          <div className="text-3xl">{userEmoji}</div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => onNavigate('tasks')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{urgentTasks.length}</div>
            <div className="text-xs text-indigo-200">Úlohy</div>
          </button>
          <button onClick={() => onNavigate('plants')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{thirstyPlants.length}</div>
            <div className="text-xs text-indigo-200">Rastliny</div>
          </button>
          <button onClick={() => onNavigate('shopping')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{pendingShopping.length}</div>
            <div className="text-xs text-indigo-200">Nákup</div>
          </button>
        </div>
      </div>

      {/* All good */}
      {allGood && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="text-2xl">🎉</div>
          <div>
            <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Skvelá práca!</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Všetky úlohy a rastliny sú v poriadku.</div>
          </div>
        </div>
      )}

      {/* Quick actions — urgent tasks */}
      {urgentTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Rýchle akcie</span>
            </div>
            <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
              Všetky <ChevronRight size={13} />
            </button>
          </div>
          {urgentTasks.slice(0, 3).map(task => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTaskStatus(task) === 'overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{task.name}</span>
              <button
                onClick={() => quickDone(task.id)}
                className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors active:scale-95"
              >
                Hotovo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions — thirsty plants */}
      {thirstyPlants.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Droplets size={15} className="text-cyan-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Smädné rastliny</span>
            </div>
            <button onClick={() => onNavigate('plants')} className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-0.5">
              Všetky <ChevronRight size={13} />
            </button>
          </div>
          {thirstyPlants.slice(0, 3).map(plant => (
            <div key={plant.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <span className="text-lg">{plant.emoji}</span>
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{plant.name}</span>
              <button
                onClick={() => quickWater(plant.id)}
                className="flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors active:scale-95"
              >
                Zaliať
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shopping preview */}
      {pendingShopping.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-violet-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Nákupný zoznam</span>
            </div>
            <button onClick={() => onNavigate('shopping')} className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-0.5">
              Zobraziť <ChevronRight size={13} />
            </button>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2">
            {pendingShopping.slice(0, 6).map(item => (
              <span key={item.id} className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800 px-2.5 py-1 rounded-full">
                {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
              </span>
            ))}
            {pendingShopping.length > 6 && (
              <span className="text-xs text-slate-400 px-1 py-1">+{pendingShopping.length - 6} ďalších</span>
            )}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'tasks',    emoji: '✅', label: 'Úlohy',    count: tasks.length,              color: 'indigo' },
          { id: 'plants',   emoji: '🪴', label: 'Rastliny', count: plants.length,             color: 'cyan' },
          { id: 'shopping', emoji: '🛒', label: 'Nákup',    count: pendingShopping.length,    color: 'violet' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Quote */}
      {showQuotes && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-center">
          <div className="text-lg mb-2">💡</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{todayQuote}"</p>
        </div>
      )}
    </div>
  )
}
