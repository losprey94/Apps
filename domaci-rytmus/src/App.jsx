import { useEffect } from 'react'
import { CheckSquare, Leaf, ShoppingCart, Home, Settings as SettingsIcon } from 'lucide-react'
import Tasks from './components/Tasks'
import Plants from './components/Plants'
import Shopping from './components/Shopping'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import { useLocalStorage } from './hooks/useLocalStorage'

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const TABS = [
  { id: 'home',     label: 'Domov',    icon: Home,           color: 'indigo' },
  { id: 'tasks',    label: 'Úlohy',    icon: CheckSquare,    color: 'indigo' },
  { id: 'plants',   label: 'Rastliny', icon: Leaf,           color: 'cyan'   },
  { id: 'shopping', label: 'Nákup',    icon: ShoppingCart,   color: 'violet' },
  { id: 'settings', label: 'Nastavenia', icon: SettingsIcon, color: 'slate'  },
]

const TAB_COLORS = {
  indigo: { active: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/40', indicator: 'bg-indigo-600' },
  cyan:   { active: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-900/40',     indicator: 'bg-cyan-500'  },
  violet: { active: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/40', indicator: 'bg-violet-600'},
  slate:  { active: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-700',     indicator: 'bg-slate-500' },
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'home')
  const [darkMode] = useLocalStorage('dark-mode', false)
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const taskBadge = tasks.filter(t => {
    const days = getDaysSince(t.lastDone)
    return days === null || t.intervalDays - days <= 0
  }).length

  const plantBadge = plants.filter(p => {
    const days = getDaysSince(p.lastWatered)
    return days === null || p.intervalDays - days <= 0
  }).length

  const shoppingBadge = shopping.filter(i => !i.done).length

  const badges = { home: 0, tasks: taskBadge, plants: plantBadge, shopping: shoppingBadge, settings: 0 }

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0]
  const colors = TAB_COLORS[activeTabData.color]

  const renderContent = () => {
    switch (activeTab) {
      case 'home':     return <Dashboard onNavigate={setActiveTab} />
      case 'tasks':    return <Tasks />
      case 'plants':   return <Plants />
      case 'shopping': return <Shopping />
      case 'settings': return <Settings />
      default:         return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="bg-indigo-600 rounded-xl p-1.5">
              <Home size={17} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Domáci Rytmus</h1>
              <p className="text-xs text-slate-400 leading-tight">{activeTabData.label}</p>
            </div>
            {/* Urgent badge in header */}
            {taskBadge + plantBadge > 0 && activeTab === 'home' && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {taskBadge + plantBadge} čaká
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="w-full max-w-lg mx-auto flex">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const c = TAB_COLORS[tab.color]
              const badge = badges[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-5 transition-colors relative ${
                    isActive ? c.active : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isActive && (
                    <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full ${c.indicator}`} />
                  )}
                  <div className={`p-1.5 rounded-xl transition-colors relative ${isActive ? c.bg : ''}`}>
                    <tab.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
