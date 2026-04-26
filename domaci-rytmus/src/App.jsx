import { CheckSquare, Leaf, ShoppingCart, Home } from 'lucide-react'
import Tasks from './components/Tasks'
import Plants from './components/Plants'
import Shopping from './components/Shopping'
import { useLocalStorage } from './hooks/useLocalStorage'

const TABS = [
  { id: 'tasks', label: 'Úlohy', icon: CheckSquare, component: Tasks, color: 'indigo' },
  { id: 'plants', label: 'Rastliny', icon: Leaf, component: Plants, color: 'cyan' },
  { id: 'shopping', label: 'Nákup', icon: ShoppingCart, component: Shopping, color: 'violet' },
]

const TAB_COLORS = {
  indigo: { active: 'text-indigo-600', bg: 'bg-indigo-50', indicator: 'bg-indigo-600' },
  cyan: { active: 'text-cyan-600', bg: 'bg-cyan-50', indicator: 'bg-cyan-500' },
  violet: { active: 'text-violet-600', bg: 'bg-violet-50', indicator: 'bg-violet-600' },
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'tasks')
  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0]
  const ActiveComponent = activeTabData.component

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="bg-indigo-600 rounded-xl p-1.5">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Domáci Rytmus</h1>
            <p className="text-xs text-slate-400 leading-tight">{activeTabData.label}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <ActiveComponent />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const c = TAB_COLORS[tab.color]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-5 transition-colors relative ${
                  isActive ? c.active : 'text-slate-400'
                }`}
              >
                {isActive && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-b-full ${c.indicator}`} />
                )}
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? c.bg : ''}`}>
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
