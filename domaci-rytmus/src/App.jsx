import { useEffect, useState } from 'react'
import { CheckSquare, Leaf, ShoppingCart, Home, Grid3x3, ChevronLeft, Cloud, CloudOff, Loader } from 'lucide-react'
import Tasks from './components/Tasks'
import Plants from './components/Plants'
import Shopping from './components/Shopping'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import Pets from './components/Pets'
import Energy from './components/Energy'
import Contacts from './components/Contacts'
import History from './components/History'
import Family from './components/Family'
import More from './components/More'
import { ThemeProvider, THEMES } from './context/ThemeContext'
import { SyncProvider, useSync } from './context/SyncContext'
import { useLocalStorage } from './hooks/useLocalStorage'

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const MAIN_TABS = [
  { id: 'home',     label: 'Domov',    icon: Home,         color: 'primary' },
  { id: 'tasks',    label: 'Úlohy',    icon: CheckSquare,  color: 'indigo'  },
  { id: 'plants',   label: 'Rastliny', icon: Leaf,         color: 'cyan'    },
  { id: 'shopping', label: 'Nákup',    icon: ShoppingCart, color: 'violet'  },
  { id: 'more',     label: 'Viac',     icon: Grid3x3,      color: 'slate'   },
]

const SUB_PAGES = {
  pets:      { label: 'Zvieratá',   component: Pets      },
  energy:    { label: 'Energie',    component: Energy    },
  contacts:  { label: 'Kontakty',   component: Contacts  },
  history:   { label: 'História',   component: History   },
  family:    { label: 'Rodina',     component: Family    },
  settings:  { label: 'Nastavenia', component: Settings  },
}

const TAB_COLORS = {
  primary: (theme) => ({
    active: `text-[var(--color-primary)]`,
    bg: `bg-[var(--color-primary-bg)]`,
    indicator: `bg-[var(--color-primary)]`,
  }),
  indigo: { active: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/40', indicator: 'bg-indigo-600' },
  cyan:   { active: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-900/40',     indicator: 'bg-cyan-500' },
  violet: { active: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/40', indicator: 'bg-violet-600' },
  slate:  { active: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-700',     indicator: 'bg-slate-500' },
}

function getTabColors(colorKey) {
  if (colorKey === 'primary') return { active: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-bg)]', indicator: 'bg-[var(--color-primary)]' }
  return TAB_COLORS[colorKey] || TAB_COLORS.slate
}

function SyncIndicator() {
  const { syncStatus, householdCode } = useSync()
  if (!householdCode) return null
  if (syncStatus === 'synced') return (
    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl px-2 py-1" title="Synchronizované">
      <Cloud size={13} />
      <span className="text-[10px] font-semibold hidden sm:inline">Sync</span>
    </div>
  )
  if (syncStatus === 'connecting') return (
    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl px-2 py-1" title="Pripájam sa…">
      <Loader size={13} className="animate-spin" />
    </div>
  )
  if (syncStatus === 'error') return (
    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl px-2 py-1" title="Chyba syncu">
      <CloudOff size={13} />
    </div>
  )
  return null
}

function AppInner() {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'home')
  const [subPage, setSubPage] = useState(null)
  const [darkMode] = useLocalStorage('dark-mode', false)
  const [colorTheme] = useLocalStorage('color-theme', 'indigo')
  const { isConnected, householdData } = useSync()
  const [localTasks] = useLocalStorage('tasks', [])
  const [localPlants] = useLocalStorage('plants', [])
  const [localShopping] = useLocalStorage('shopping', [])
  const tasks    = (isConnected && householdData?.tasks)    ? householdData.tasks    : localTasks
  const plants   = (isConnected && householdData?.plants)   ? householdData.plants   : localPlants
  const shopping = (isConnected && householdData?.shopping) ? householdData.shopping : localShopping

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Apply theme CSS variables
  useEffect(() => {
    const t = THEMES[colorTheme] || THEMES.indigo
    const root = document.documentElement
    root.style.setProperty('--color-primary', t.primary)
    root.style.setProperty('--color-primary-bg', t.bg)
    root.style.setProperty('--color-primary-ring', t.ring)
  }, [colorTheme])

  const taskBadge = tasks.filter(t => { const d = getDaysSince(t.lastDone); return d === null || t.intervalDays - d <= 0 }).length
  const plantBadge = plants.filter(p => { const d = getDaysSince(p.lastWatered); return d === null || p.intervalDays - d <= 0 }).length
  const shoppingBadge = shopping.filter(i => !i.done).length
  const badges = { home: 0, tasks: taskBadge, plants: plantBadge, shopping: shoppingBadge, more: 0 }

  const navigate = (target) => {
    if (SUB_PAGES[target]) {
      setActiveTab('more')
      setSubPage(target)
    } else {
      setActiveTab(target)
      setSubPage(null)
    }
  }

  const goBack = () => setSubPage(null)

  const currentSubPage = subPage ? SUB_PAGES[subPage] : null
  const SubComponent = currentSubPage?.component

  const headerTitle = currentSubPage ? currentSubPage.label : MAIN_TABS.find(t => t.id === activeTab)?.label || 'Domáci Rytmus'

  const renderContent = () => {
    if (subPage && SubComponent) return <SubComponent />
    switch (activeTab) {
      case 'home':     return <Dashboard onNavigate={navigate} />
      case 'tasks':    return <Tasks />
      case 'plants':   return <Plants />
      case 'shopping': return <Shopping />
      case 'more':     return <More onNavigate={navigate} />
      default:         return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            {subPage ? (
              <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Home size={16} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              {!subPage && <div className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">Domáci Rytmus</div>}
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{headerTitle}</h1>
            </div>
            <SyncIndicator />
            {taskBadge + plantBadge > 0 && activeTab === 'home' && !subPage && (
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

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="w-full max-w-lg mx-auto flex">
            {MAIN_TABS.map(tab => {
              const isActive = activeTab === tab.id && !subPage
              const c = getTabColors(tab.color)
              const badge = badges[tab.id]
              return (
                <button key={tab.id} onClick={() => navigate(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-5 transition-colors relative ${isActive ? c.active : 'text-slate-400 dark:text-slate-500'}`}>
                  {isActive && <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full ${c.indicator}`} />}
                  <div className={`p-1.5 rounded-xl transition-colors relative ${isActive ? c.bg : ''}`}>
                    <tab.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SyncProvider>
        <AppInner />
      </SyncProvider>
    </ThemeProvider>
  )
}
