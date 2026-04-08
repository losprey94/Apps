import { useEffect, useState, useRef, useCallback } from 'react'
import {
  CheckSquare, Leaf, ShoppingCart, Home, Grid3x3, ChevronLeft,
  Cloud, CloudOff, Loader, UtensilsCrossed, Wallet, PawPrint,
  Zap, Users, X, ArrowUp, ArrowDown, Plus, Minus, Settings2,
} from 'lucide-react'
import Tasks from './components/Tasks'
import Plants from './components/Plants'
import Shopping from './components/Shopping'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import Pets from './components/Pets'
import Energy from './components/Energy'
import Contacts from './components/Contacts'
import History from './components/History'
import Family from './components/Family'
import Budget from './components/Budget'
import MealPlan from './components/MealPlan'
import More from './components/More'
import InstallPrompt from './components/InstallPrompt'
import LoginScreen from './components/LoginScreen'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider, useI18n } from './context/I18nContext'
import { SyncProvider, useSync, useSyncedStorage } from './context/SyncContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTaskNotifications } from './hooks/useTaskNotifications'

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// All possible nav options
const ALL_NAV_OPTIONS = [
  { id: 'home',     label: 'Domov',      icon: Home,            color: 'primary'  },
  { id: 'tasks',    label: 'Úlohy',      icon: CheckSquare,     color: 'indigo'   },
  { id: 'plants',   label: 'Rastliny',   icon: Leaf,            color: 'cyan'     },
  { id: 'shopping', label: 'Nákup',      icon: ShoppingCart,    color: 'violet'   },
  { id: 'mealplan', label: 'Jedálniček', icon: UtensilsCrossed, color: 'orange'   },
  { id: 'budget',   label: 'Rozpočet',   icon: Wallet,          color: 'emerald'  },
  { id: 'pets',     label: 'Zvieratá',   icon: PawPrint,        color: 'rose'     },
  { id: 'energy',   label: 'Energie',    icon: Zap,             color: 'amber'    },
  { id: 'contacts', label: 'Kontakty',   icon: Users,           color: 'sky'      },
  { id: 'more',     label: 'Viac',       icon: Grid3x3,         color: 'slate'    },
]

const DEFAULT_NAV = ['home', 'tasks', 'plants', 'shopping', 'more']
const MAX_NAV = 5

const SUB_PAGES = {
  pets:      { label: 'Zvieratá',   component: Pets      },
  energy:    { label: 'Energie',    component: Energy    },
  contacts:  { label: 'Kontakty',   component: Contacts  },
  history:   { label: 'História',   component: History   },
  family:    { label: 'Rodina',     component: Family    },
  budget:    { label: 'Rozpočet',   component: Budget    },
  mealplan:  { label: 'Jedálniček', component: MealPlan  },
  settings:  { label: 'Nastavenia', component: Settings  },
}

const TAB_COLORS = {
  primary: { active: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-bg)]', indicator: 'bg-[var(--color-primary)]' },
  indigo:  { active: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/40',   indicator: 'bg-indigo-600'  },
  cyan:    { active: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-50 dark:bg-cyan-900/40',       indicator: 'bg-cyan-500'    },
  violet:  { active: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/40',   indicator: 'bg-violet-600'  },
  orange:  { active: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/40',   indicator: 'bg-orange-500'  },
  emerald: { active: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/40', indicator: 'bg-emerald-600' },
  rose:    { active: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/40',       indicator: 'bg-rose-600'    },
  amber:   { active: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/40',     indicator: 'bg-amber-500'   },
  sky:     { active: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-900/40',         indicator: 'bg-sky-500'     },
  slate:   { active: 'text-slate-600 dark:text-slate-300',     bg: 'bg-slate-100 dark:bg-slate-700',       indicator: 'bg-slate-500'   },
}

function getTabColors(colorKey) {
  return TAB_COLORS[colorKey] || TAB_COLORS.slate
}

// Long press hook
function useLongPress(callback, ms = 600) {
  const timerRef = useRef(null)
  const cancelRef = useRef(false)

  const start = useCallback(() => {
    cancelRef.current = false
    timerRef.current = setTimeout(() => {
      if (!cancelRef.current) callback()
    }, ms)
  }, [callback, ms])

  const cancel = useCallback(() => {
    cancelRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  }
}

// Nav customizer modal
function NavCustomizerModal({ navIds, onChange, onClose }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(navIds)
  const selected = draft.map(id => ALL_NAV_OPTIONS.find(o => o.id === id)).filter(Boolean)
  const available = ALL_NAV_OPTIONS.filter(o => !draft.includes(o.id))

  const add = (id) => {
    if (draft.length >= MAX_NAV) return
    setDraft(prev => [...prev, id])
  }
  const remove = (id) => setDraft(prev => prev.filter(x => x !== id))
  const moveUp = (idx) => {
    if (idx === 0) return
    setDraft(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a })
  }
  const moveDown = (idx) => {
    setDraft(prev => {
      if (idx === prev.length - 1) return prev
      const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a
    })
  }
  const save = () => { onChange(draft); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl pb-10 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Prispôsobiť lištu</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Vyberte max. {MAX_NAV} položiek</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Selected items */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">V lište</span>
            <span className="text-[11px] text-slate-400">{draft.length}/{MAX_NAV}</span>
          </div>
          <div className="space-y-1.5">
            {selected.map((opt, idx) => {
              const c = getTabColors(opt.color)
              return (
                <div key={opt.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <opt.icon size={16} className={c.active} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{t(`nav.${opt.id}`, opt.label)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-500 dark:text-slate-400"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === selected.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-500 dark:text-slate-400"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => remove(opt.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Available items */}
        {available.length > 0 && (
          <div className="px-5 pt-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Dostupné</span>
            <div className="space-y-1.5">
              {available.map(opt => {
                const c = getTabColors(opt.color)
                const full = draft.length >= MAX_NAV
                return (
                  <div key={opt.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${full ? 'opacity-40' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                      <opt.icon size={16} className={c.active} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{t(`nav.${opt.id}`, opt.label)}</span>
                    <button
                      onClick={() => add(opt.id)}
                      disabled={full}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 disabled:pointer-events-none"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="px-5 pt-5">
          <button
            onClick={save}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Uložiť
          </button>
        </div>
      </div>
    </div>
  )
}

function SyncIndicator() {
  const { syncStatus, householdCode } = useSync()
  if (!householdCode) return null
  if (syncStatus === 'synced') return (
    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl px-2 py-1" title="Synchronizované">
      <Cloud size={13} />
      <span className="text-[10px] font-semibold hidden sm:inline">Synch.</span>
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
  const { user, loading: authLoading, isAuthEnabled } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'home')
  const [subPage, setSubPage] = useState(null)
  const [onboardingDone, setOnboardingDone] = useLocalStorage('onboarding-done', false)
  const [darkMode] = useLocalStorage('dark-mode', false)
  const [navIds, setNavIds] = useSyncedStorage('nav-tabs', DEFAULT_NAV)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { isConnected, householdData } = useSync()
  const [localTasks] = useLocalStorage('tasks', [])
  const [localPlants] = useLocalStorage('plants', [])
  const [localShopping] = useLocalStorage('shopping', [])
  const tasks    = (isConnected && householdData?.tasks)    ? householdData.tasks    : localTasks
  const plants   = (isConnected && householdData?.plants)   ? householdData.plants   : localPlants
  const shopping = (isConnected && householdData?.shopping) ? householdData.shopping : localShopping

  // Ensure navIds is always a valid array (guard against bad synced data)
  const safeNavIds = Array.isArray(navIds) && navIds.length > 0 ? navIds : DEFAULT_NAV
  const navTabs = safeNavIds.map(id => ALL_NAV_OPTIONS.find(o => o.id === id)).filter(Boolean)

  useTaskNotifications(tasks)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const taskBadge     = tasks.filter(t => { const d = getDaysSince(t.lastDone); return d === null || t.intervalDays - d <= 0 }).length
  const plantBadge    = plants.filter(p => { const d = getDaysSince(p.lastWatered); return d === null || p.intervalDays - d <= 0 }).length
  const shoppingBadge = shopping.filter(i => !i.done).length

  const getBadge = (id) => {
    if (id === 'tasks')    return taskBadge
    if (id === 'plants')   return plantBadge
    if (id === 'shopping') return shoppingBadge
    return 0
  }

  // Navigate: sub-pages that are directly in nav act as top-level tabs
  const navigate = useCallback((target) => {
    if (SUB_PAGES[target] && !safeNavIds.includes(target)) {
      // Not in nav → use sub-page overlay (with back button)
      setActiveTab('more')
      setSubPage(target)
    } else {
      setActiveTab(target)
      setSubPage(null)
    }
  }, [safeNavIds])

  const goBack = () => setSubPage(null)

  // Determine what's displayed
  const isInNav = safeNavIds.includes(activeTab)
  const showingSubPage = subPage && SUB_PAGES[subPage]

  const getHeaderTitle = () => {
    if (showingSubPage) return t(`nav.${subPage}`, SUB_PAGES[subPage].label)
    const opt = ALL_NAV_OPTIONS.find(o => o.id === activeTab)
    if (opt) return t(`nav.${opt.id}`, opt.label)
    return 'Domáci Rytmus'
  }

  const renderContent = () => {
    // Sub-page overlay (via internal navigation with back button)
    if (showingSubPage) {
      const SubComp = SUB_PAGES[subPage].component
      return <SubComp />
    }
    // Direct tabs (including sub-pages promoted to nav)
    if (activeTab === 'home')     return <Dashboard onNavigate={navigate} />
    if (activeTab === 'tasks')    return <Tasks />
    if (activeTab === 'plants')   return <Plants />
    if (activeTab === 'shopping') return <Shopping />
    if (activeTab === 'more')     return <More onNavigate={navigate} />
    // Sub-pages accessed directly from nav
    if (SUB_PAGES[activeTab]) {
      const SubComp = SUB_PAGES[activeTab].component
      return <SubComp />
    }
    return <Dashboard onNavigate={navigate} />
  }

  const openCustomizer = useCallback(() => setCustomizerOpen(true), [])
  const longPressProps = useLongPress(openCustomizer, 600)

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🏠</div>
          <Loader size={24} className="text-indigo-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (isAuthEnabled && !user) return <LoginScreen />
  if (!onboardingDone) return <Onboarding onFinish={() => setOnboardingDone(true)} googleUser={user} />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            {showingSubPage ? (
              <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Home size={16} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              {!showingSubPage && <div className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">Domáci Rytmus</div>}
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{getHeaderTitle()}</h1>
            </div>
            <SyncIndicator />
            {taskBadge + plantBadge > 0 && activeTab === 'home' && !showingSubPage && (
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

        {/* PWA Install Banner */}
        <div className="fixed bottom-[72px] left-0 right-0 z-20 pointer-events-none">
          <div className="w-full max-w-lg mx-auto pointer-events-auto">
            <InstallPrompt />
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="w-full max-w-lg mx-auto flex relative">
            {navTabs.map(tab => {
              const isActive = !showingSubPage && activeTab === tab.id
              const c = getTabColors(tab.color)
              const badge = getBadge(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  {...longPressProps}
                  className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-5 transition-colors relative select-none ${isActive ? c.active : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {isActive && <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full ${c.indicator}`} />}
                  <div className={`p-1.5 rounded-xl transition-colors relative ${isActive ? c.bg : ''}`}>
                    <tab.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{t(`nav.${tab.id}`, tab.label)}</span>
                </button>
              )
            })}

          </div>
        </nav>
      </div>

      {/* Nav Customizer Modal */}
      {customizerOpen && (
        <NavCustomizerModal
          navIds={safeNavIds}
          onChange={setNavIds}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
    </div>
  )
}

function SyncBridge({ children }) {
  const { user } = useAuth()
  return <SyncProvider uid={user?.uid || null}>{children}</SyncProvider>
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <SyncBridge>
            <AppInner />
          </SyncBridge>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
