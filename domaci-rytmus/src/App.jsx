import { useEffect } from 'react'
import { CheckSquare, Leaf, ShoppingCart, Home, Moon, Sun } from 'lucide-react'
import Tasks from './components/Tasks'
import Plants from './components/Plants'
import Shopping from './components/Shopping'
import Dashboard from './components/Dashboard'
import { useLocalStorage } from './hooks/useLocalStorage'

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function useTaskBadge(tasks) {
  return tasks.filter(t => {
    const days = getDaysSince(t.lastDone)
    if (days === null) return true
    return t.intervalDays - days <= 0
  }).length
}

function usePlantBadge(plants) {
  return plants.filter(p => {
    const days = getDaysSince(p.lastWatered)
    if (days === null) return true
    return p.intervalDays - days <= 0
  }).length
}

const TAB_COLORS = {
  home:     { active: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/40', indicator: 'bg-indigo-600' },
  tasks:    { active: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/40', indicator: 'bg-indigo-600' },
  plants:   { active: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-900/40',    indicator: 'bg-cyan-500' },
  shopping: { active: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/40', indicator: 'bg-violet-600' },
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'home')
  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false)
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])

  const taskBadge = useTaskBadge(tasks)
  const plantBadge = usePlantBadge(plants)
  const shoppingBadge = shopping.filter(i => !i.done).length

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const TABS = [
    { id: 'home',     label: 'Domov',   icon: Home,         component: Dashboard,  badge: 0 },
    { id: 'tasks',    label: 'Úlohy',   icon: CheckSquare,  component: Tasks,      badge: taskBadge },
    { id: 'plants',   label: 'Rastliny',icon: Leaf,         component: Plants,     badge: plantBadge },
    { id: 'shopping', label: 'Nákup',   icon: ShoppingCart, component: Shopping,   badge: shoppingBadge },
  ]

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0]
  const ActiveComponent = activeTabData.component
  const colors = TAB_COLORS[activeTab] || TAB_COLORS.home

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col max-w-lg mx-auto transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="bg-indigo-600 rounded-xl p-1.5">
            <Home size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">Domáci Rytmus</h1>
            <p className="text-xs text-slate-400 leading-tight">{activeTabData.label}</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {activeTab === 'home'
          ? <Dashboard onNavigate={setActiveTab} />
          : <ActiveComponent />
        }
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const c = TAB_COLORS[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-5 transition-colors relative ${
                  isActive ? c.active : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {isActive && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-b-full ${c.indicator}`} />
                )}
                <div className={`p-1.5 rounded-xl transition-colors relative ${isActive ? c.bg : ''}`}>
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
