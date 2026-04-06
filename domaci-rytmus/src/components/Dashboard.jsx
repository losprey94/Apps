import { CheckCircle2, Droplets, ShoppingCart, AlertCircle, ChevronRight, Leaf } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

function getDaysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Dobré ráno'
  if (hour < 18) return 'Dobrý deň'
  return 'Dobrý večer'
}

function formatDate() {
  try {
    return new Date().toLocaleDateString('sk-SK', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }
}

export default function Dashboard({ onNavigate }) {
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])

  const urgentTasks = tasks.filter(t => ['overdue', 'pending'].includes(getTaskStatus(t)))
  const thirstyPlants = plants.filter(p => getPlantStatus(p) === 'thirsty')
  const pendingShopping = shopping.filter(i => !i.done)
  const totalUrgent = urgentTasks.length + thirstyPlants.length

  const allGood = totalUrgent === 0

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Greeting card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
        <div className="text-xs font-medium text-indigo-200 capitalize">{formatDate()}</div>
        <h2 className="text-2xl font-bold mt-1">{getGreeting()} 👋</h2>
        <p className="text-indigo-200 text-sm mt-1">
          {allGood
            ? 'Všetko je v poriadku, super!'
            : `Máš ${totalUrgent} ${totalUrgent === 1 ? 'vec' : totalUrgent < 5 ? 'veci' : 'vecí'} na pozornosť.`
          }
        </p>

        {/* Mini stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <div className="text-xl font-bold">{urgentTasks.length}</div>
            <div className="text-xs text-indigo-200">Úlohy</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <div className="text-xl font-bold">{thirstyPlants.length}</div>
            <div className="text-xs text-indigo-200">Rastliny</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <div className="text-xl font-bold">{pendingShopping.length}</div>
            <div className="text-xs text-indigo-200">Nákup</div>
          </div>
        </div>
      </div>

      {/* All good state */}
      {allGood && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-3xl">🎉</div>
          <div>
            <div className="font-semibold text-emerald-800 dark:text-emerald-300">Skvelá práca!</div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">Všetky úlohy a rastliny sú v poriadku.</div>
          </div>
        </div>
      )}

      {/* Urgent tasks */}
      {urgentTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Čakajúce úlohy</span>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5"
            >
              Zobraziť všetky <ChevronRight size={14} />
            </button>
          </div>
          {urgentTasks.slice(0, 3).map(task => {
            const days = getDaysSince(task.lastDone)
            const status = getTaskStatus(task)
            return (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{task.name}</span>
                <span className="text-xs text-slate-400">
                  {days === null ? 'Nesplnené' : `${days}d`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Thirsty plants */}
      {thirstyPlants.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-cyan-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Smädné rastliny</span>
            </div>
            <button
              onClick={() => onNavigate('plants')}
              className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-0.5"
            >
              Zobraziť všetky <ChevronRight size={14} />
            </button>
          </div>
          {thirstyPlants.slice(0, 3).map(plant => (
            <div key={plant.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <span className="text-lg">{plant.emoji}</span>
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{plant.name}</span>
              <span className="text-xs text-cyan-500 font-medium">Treba zaliať</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick nav cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('tasks')}
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-xl p-2">
            <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Úlohy</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{tasks.length}</span>
        </button>
        <button
          onClick={() => onNavigate('plants')}
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <div className="bg-cyan-100 dark:bg-cyan-900/50 rounded-xl p-2">
            <Leaf size={20} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rastliny</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{plants.length}</span>
        </button>
        <button
          onClick={() => onNavigate('shopping')}
          className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <div className="bg-violet-100 dark:bg-violet-900/50 rounded-xl p-2">
            <ShoppingCart size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nákup</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{pendingShopping.length}</span>
        </button>
      </div>
    </div>
  )
}
