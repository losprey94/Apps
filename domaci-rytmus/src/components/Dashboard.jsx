import { useState } from 'react'
import { CheckCircle2, Droplets, ShoppingCart, ChevronRight, Zap, CreditCard, Wallet, Wind, MapPin, RefreshCw } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage } from '../context/SyncContext'
import { CardViewer } from './LoyaltyCards'
import { useWeather } from '../hooks/useWeather'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysSince(d) {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}
function getTaskStatus(t) {
  const d = getDaysSince(t.lastDone)
  if (d === null) return 'pending'
  const r = t.intervalDays - d
  if (r <= 0) return 'overdue'
  if (r <= Math.ceil(t.intervalDays * 0.2)) return 'soon'
  return 'ok'
}
function getPlantStatus(p) {
  const d = getDaysSince(p.lastWatered)
  if (d === null) return 'thirsty'
  return p.intervalDays - d <= 0 ? 'thirsty' : p.intervalDays - d <= 1 ? 'soon' : 'ok'
}
function filterPeriod(expenses, period) {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
    return d >= mon && d <= sun
  })
}
function todayISO() { return new Date().toISOString().split('T')[0] }
function fmtDate() {
  try { return new Date().toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' }) }
  catch { return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) }
}
function fmtEur(n) {
  return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ─── Time periods ─────────────────────────────────────────────────────────────
const PERIODS = [
  {
    id: 'night',      hours: [22, 24],
    icon: '🌙',
    gradient: 'linear-gradient(135deg,#1e1b4b,#312e81)',
    shadow: 'rgba(30,27,75,0.5)',
    muted: 'rgba(199,210,254,0.8)',
    greeting: n => n ? `Dobrú noc, ${n} 🌙` : 'Dobrú noc 🌙',
  },
  {
    id: 'midnight',   hours: [0, 5],
    icon: '🌟',
    gradient: 'linear-gradient(135deg,#0f172a,#1e293b)',
    shadow: 'rgba(15,23,42,0.6)',
    muted: 'rgba(148,163,184,0.9)',
    greeting: n => n ? `Ešte hore, ${n}? 🦉` : 'Ešte hore? 🦉',
  },
  {
    id: 'dawn',       hours: [5, 7],
    icon: '🌅',
    gradient: 'linear-gradient(135deg,#7c3aed,#c2410c)',
    shadow: 'rgba(194,65,12,0.3)',
    muted: 'rgba(254,215,170,0.9)',
    greeting: n => n ? `Vstávaj, ${n}! Nový deň čaká ☕` : 'Nový deň čaká ☕',
  },
  {
    id: 'morning',    hours: [7, 11],
    icon: '☀️',
    gradient: 'linear-gradient(135deg,#d97706,#b45309)',
    shadow: 'rgba(217,119,6,0.35)',
    muted: 'rgba(254,243,199,0.9)',
    greeting: n => n ? `Dobré ráno, ${n}! ☕` : 'Dobré ráno! ☕',
  },
  {
    id: 'noon',       hours: [11, 14],
    icon: '🍽️',
    gradient: 'linear-gradient(135deg,#ea580c,#dc2626)',
    shadow: 'rgba(234,88,12,0.3)',
    muted: 'rgba(254,215,170,0.9)',
    greeting: n => n ? `Dobrú chuť, ${n}! 🍽️` : 'Dobrú chuť! 🍽️',
  },
  {
    id: 'afternoon',  hours: [14, 18],
    icon: '🌤️',
    gradient: 'linear-gradient(135deg,#0284c7,#0369a1)',
    shadow: 'rgba(2,132,199,0.3)',
    muted: 'rgba(186,230,253,0.9)',
    greeting: n => n ? `Ahoj, ${n}! 🌤️` : 'Dobré popoludnie! 🌤️',
  },
  {
    id: 'evening',    hours: [18, 22],
    icon: '🌆',
    gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    shadow: 'rgba(124,58,237,0.35)',
    muted: 'rgba(221,214,254,0.9)',
    greeting: n => n ? `Dobrý večer, ${n}! 🌆` : 'Dobrý večer! 🌆',
  },
]

function getPeriod() {
  const h = new Date().getHours()
  return PERIODS.find(p => h >= p.hours[0] && h < p.hours[1]) || PERIODS[0]
}

// ─── Smart context card ───────────────────────────────────────────────────────
function SmartCard({ period, urgentTasks, thirstyPlants, pendingShopping, budgetSpent, budgetTotal, budgetOk, onNavigate, onQuickDone, onQuickWater }) {
  const id      = period.id
  const todayTasks = urgentTasks.filter(t => t.deadline && t.deadline <= todayISO())

  // Night / midnight — wind-down
  if (id === 'night' || id === 'midnight') {
    const tomorrow = urgentTasks.slice(0, 2)
    return (
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌙</span>
          <span className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">
            {urgentTasks.length === 0 ? 'Skvelý deň — všetko splnené!' : 'Zajtra ťa čaká…'}
          </span>
        </div>
        {urgentTasks.length === 0 ? (
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Nič nečaká, nič netlačí. Zaslúžiš si oddych. ✨</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tomorrow.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {t.name}
              </div>
            ))}
            {urgentTasks.length > 2 && (
              <div className="text-xs text-indigo-500">+ {urgentTasks.length - 2} ďalších</div>
            )}
          </div>
        )}
        <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-3 italic">Dobrú noc 😴</p>
      </div>
    )
  }

  // Dawn / morning — tasks & plants first
  if (id === 'dawn' || id === 'morning') {
    if (urgentTasks.length === 0 && thirstyPlants.length === 0) {
      return (
        <div className="rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 p-4">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">☕ Pokojné ráno!</div>
          <p className="text-xs text-amber-600 dark:text-amber-400">Nič nečaká. Daj si kávu a uži si pokojný začiatok dňa.</p>
        </div>
      )
    }
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">☕</span>
          <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            {urgentTasks.length > 0 ? `${urgentTasks.length} ${urgentTasks.length === 1 ? 'úloha' : 'úlohy'} na dnes` : 'Rastliny ti dajú dobré ráno! 🌿'}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {urgentTasks.slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="flex-1 text-xs text-amber-800 dark:text-amber-200 truncate">{t.name}</span>
              <button onClick={() => onQuickDone(t.id)}
                className="text-[10px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-lg active:scale-95 transition-transform">
                Hotovo
              </button>
            </div>
          ))}
          {thirstyPlants.slice(0, 2).map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-sm">{p.emoji}</span>
              <span className="flex-1 text-xs text-amber-800 dark:text-amber-200 truncate">{p.name} smädná</span>
              <button onClick={() => onQuickWater(p.id)}
                className="text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 px-2 py-0.5 rounded-lg active:scale-95 transition-transform">
                Zaliať
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Noon — shopping reminder
  if (id === 'noon') {
    return (
      <div className="rounded-2xl border border-orange-100 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🍽️</span>
          <span className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Polodňajšia prestávka</span>
        </div>
        {pendingShopping.length > 0 ? (
          <>
            <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
              Ideš na obed? Máš <strong>{pendingShopping.length} položiek</strong> v nákupnom zozname!
            </p>
            <button onClick={() => onNavigate('shopping')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-xl transition-colors active:scale-95">
              🛒 Otvoriť zoznam <ChevronRight size={12} />
            </button>
          </>
        ) : (
          <p className="text-xs text-orange-600 dark:text-orange-400">Nákupný zoznam je prázdny. Daj si oddych! 🧘</p>
        )}
        {budgetOk && (
          <p className="text-xs text-orange-500 dark:text-orange-500 mt-2">
            💰 Doteraz minuto: {fmtEur(budgetSpent)} z {fmtEur(budgetTotal)}
          </p>
        )}
      </div>
    )
  }

  // Afternoon — remaining tasks
  if (id === 'afternoon') {
    const remaining = urgentTasks.length
    return (
      <div className="rounded-2xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🎯</span>
          <span className="font-semibold text-sky-800 dark:text-sky-300 text-sm">
            {remaining === 0 ? 'Deň zvládnutý! 🎉' : `Ešte ${remaining} ${remaining === 1 ? 'úloha' : 'úlohy'}`}
          </span>
        </div>
        {remaining === 0 ? (
          <p className="text-xs text-sky-600 dark:text-sky-400">Všetky úlohy splnené. Uži si popoludnie! ☕</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {urgentTasks.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                <span className="flex-1 text-xs text-sky-800 dark:text-sky-200 truncate">{t.name}</span>
                <button onClick={() => onQuickDone(t.id)}
                  className="text-[10px] font-semibold bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-lg active:scale-95">
                  Hotovo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Evening — plants + summary + tomorrow
  if (id === 'evening') {
    return (
      <div className="rounded-2xl border border-violet-100 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🌿</span>
          <span className="font-semibold text-violet-800 dark:text-violet-300 text-sm">Večerná kontrola</span>
        </div>
        <div className="flex flex-col gap-2">
          {thirstyPlants.length > 0 ? (
            <div>
              <p className="text-xs text-violet-700 dark:text-violet-300 mb-1.5">
                Večer je ideálny čas na zalievanie 🌿 — {thirstyPlants.length} {thirstyPlants.length === 1 ? 'rastlina čaká' : 'rastlín čaká'}:
              </p>
              {thirstyPlants.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{p.emoji}</span>
                  <span className="flex-1 text-xs text-violet-700 dark:text-violet-200 truncate">{p.name}</span>
                  <button onClick={() => onQuickWater(p.id)}
                    className="text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 px-2 py-0.5 rounded-lg active:scale-95">
                    Zaliať
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-violet-600 dark:text-violet-400">✓ Rastliny sú poliate, nič nečaká 🌿</p>
          )}
          {urgentTasks.length > 0 && (
            <div className="pt-1.5 border-t border-violet-100 dark:border-violet-800/50">
              <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-1">Zajtra nezabudni:</p>
              <p className="text-xs text-violet-700 dark:text-violet-300 truncate">• {urgentTasks[0].name}</p>
              {urgentTasks.length > 1 && <p className="text-xs text-violet-500">+ {urgentTasks.length - 1} ďalších</p>}
            </div>
          )}
          {budgetOk && (
            <div className="pt-1.5 border-t border-violet-100 dark:border-violet-800/50">
              <p className="text-xs text-violet-500 dark:text-violet-400">
                💰 Dnes minuto: {fmtEur(budgetSpent)} · zostatok {fmtEur(Math.max(budgetTotal - budgetSpent, 0))}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

// ─── Weather widget ───────────────────────────────────────────────────────────
function WeatherWidget({ weather, loading, locationDenied, refresh }) {
  if (locationDenied) return null

  if (loading && !weather) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-16 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const age = Math.round((Date.now() - weather.updatedAt) / 60000)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center justify-between">
        {/* Left — temp + condition */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{weather.emoji}</span>
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none">{weather.temp}°</span>
              <span className="text-sm text-slate-400 pb-0.5">/ pocit {weather.feelsLike}°</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{weather.text}</div>
          </div>
        </div>

        {/* Right — city + wind */}
        <div className="text-right flex flex-col items-end gap-1">
          {weather.city ? (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin size={11} />
              <span className="font-medium">{weather.city}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Wind size={11} />
            <span>{weather.wind} km/h</span>
          </div>
          <button onClick={refresh}
            className="flex items-center gap-1 text-[10px] text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors mt-0.5">
            <RefreshCw size={9} className={loading ? 'animate-spin' : ''} />
            {age < 2 ? 'práve teraz' : `pred ${age} min`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const QUOTES = [
  'Malé kroky každý deň vedú k veľkým zmenám.',
  'Poriadok v domácnosti = poriadok v mysli.',
  'Každá splnená úloha je dôvod na radosť.',
  'Starostlivosť o domov je starostlivosť o seba.',
  'Dobrá domácnosť začína dobrými návykmi.',
]

export default function Dashboard({ onNavigate }) {
  const [tasks, setTasks]   = useLocalStorage('tasks', [])
  const [plants, setPlants] = useLocalStorage('plants', [])
  const [shopping]          = useLocalStorage('shopping', [])
  const [userName]          = useLocalStorage('user-name', '')
  const [userEmoji]         = useLocalStorage('user-emoji', '😊')
  const [showQuotes]        = useLocalStorage('show-quotes', true)
  const [loyaltyCards]      = useSyncedStorage('loyalty-cards', [])
  const [budgetConfig]      = useSyncedStorage('budget-config', { period: 'monthly', totalBudget: 1000 })
  const [budgetExpenses]    = useSyncedStorage('budget-expenses', [])
  const [viewCard, setViewCard] = useState(null)

  const { weather, loading: wLoading, locationDenied, refresh: wRefresh } = useWeather()

  const period        = getPeriod()
  const urgentTasks   = tasks.filter(t => ['overdue','pending'].includes(getTaskStatus(t)))
  const thirstyPlants = plants.filter(p => getPlantStatus(p) === 'thirsty')
  const pendingShopping = shopping.filter(i => !i.done)
  const totalUrgent   = urgentTasks.length + thirstyPlants.length
  const pinnedCards   = loyaltyCards.filter(c => c.pinned)

  const periodExp     = filterPeriod(budgetExpenses, budgetConfig.period)
  const budgetSpent   = periodExp.reduce((s, e) => s + e.amount, 0)
  const budgetTotal   = budgetConfig.totalBudget || 1000
  const budgetPct     = Math.min(budgetSpent / budgetTotal, 1)
  const budgetOk      = budgetExpenses.length > 0
  const budgetColor   = budgetPct >= 1 ? '#ef4444' : budgetPct >= 0.8 ? '#fb923c' : budgetPct >= 0.5 ? '#fbbf24' : '#10b981'

  const quickWater  = id => setPlants(plants.map(p => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p))
  const quickDone   = id => setTasks(tasks.map(t => t.id === id ? { ...t, lastDone: new Date().toISOString() } : t))

  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length]

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {viewCard && <CardViewer card={viewCard} onClose={() => setViewCard(null)} />}

      {/* ── Dynamic hero card ─────────────────────────────────────────────── */}
      <div className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden"
        style={{ background: period.gradient, boxShadow: `0 8px 32px ${period.shadow}` }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-xs font-medium capitalize" style={{ color: period.muted }}>{fmtDate()}</div>
            <h2 className="text-xl font-bold mt-0.5 leading-tight">{period.greeting(userName)}</h2>
            <p className="text-sm mt-1.5 opacity-80">
              {totalUrgent === 0
                ? 'Všetko je v poriadku! 🎉'
                : `${totalUrgent} ${totalUrgent === 1 ? 'vec vyžaduje' : 'veci vyžadujú'} pozornosť`}
            </p>
          </div>
          {/* User emoji + weather temp */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="text-3xl">{userEmoji}</div>
            {weather && (
              <div className="flex items-center gap-1 bg-white/15 rounded-xl px-2 py-1">
                <span className="text-base">{weather.emoji}</span>
                <span className="text-sm font-bold">{weather.temp}°</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-4">
          <button onClick={() => onNavigate('tasks')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{urgentTasks.length}</div>
            <div className="text-xs opacity-70">Úlohy</div>
          </button>
          <button onClick={() => onNavigate('plants')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{thirstyPlants.length}</div>
            <div className="text-xs opacity-70">Rastliny</div>
          </button>
          <button onClick={() => onNavigate('shopping')} className="flex-1 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl p-2.5 text-center transition-colors">
            <div className="text-xl font-bold">{pendingShopping.length}</div>
            <div className="text-xs opacity-70">Nákup</div>
          </button>
        </div>
      </div>

      {/* ── Weather detail ────────────────────────────────────────────────── */}
      <WeatherWidget weather={weather} loading={wLoading} locationDenied={locationDenied} refresh={wRefresh} />

      {/* ── Smart context card ────────────────────────────────────────────── */}
      <SmartCard
        period={period}
        urgentTasks={urgentTasks}
        thirstyPlants={thirstyPlants}
        pendingShopping={pendingShopping}
        budgetSpent={budgetSpent}
        budgetTotal={budgetTotal}
        budgetOk={budgetOk}
        onNavigate={onNavigate}
        onQuickDone={quickDone}
        onQuickWater={quickWater}
      />

      {/* ── Pinned loyalty cards ──────────────────────────────────────────── */}
      {pinnedCards.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Rýchle karty</span>
            </div>
            <button onClick={() => onNavigate('shopping')} className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
              Všetky <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-3 p-4">
            {pinnedCards.map(card => (
              <button key={card.id} onClick={() => setViewCard(card)}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-95 transition-transform"
                style={{ backgroundColor: card.color + '15', border: `2px solid ${card.color}30` }}>
                <span className="text-3xl">{card.emoji}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{card.storeName}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: card.color }}>QR kód</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Budget widget ─────────────────────────────────────────────────── */}
      {budgetOk && (
        <button onClick={() => onNavigate('budget')}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left active:scale-95 transition-transform w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={15} style={{ color: budgetColor }} />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {budgetConfig.period === 'monthly' ? 'Mesačný rozpočet' : 'Týždenný rozpočet'}
              </span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {fmtEur(Math.max(budgetTotal - budgetSpent, 0))}
              </span>
              <div className="text-xs text-slate-400 mt-0.5">zostatok</div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold" style={{ color: budgetColor }}>{Math.round(budgetPct * 100)}%</span>
              <div className="text-xs text-slate-400">minuto</div>
            </div>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${budgetPct * 100}%`, backgroundColor: budgetColor }} />
          </div>
        </button>
      )}

      {/* ── Quick nav grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'tasks',    emoji: '✅', label: 'Úlohy',    count: tasks.length },
          { id: 'plants',   emoji: '🪴', label: 'Rastliny', count: plants.length },
          { id: 'shopping', emoji: '🛒', label: 'Nákup',    count: pendingShopping.length },
        ].map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
          </button>
        ))}
      </div>

      {/* ── Quote ─────────────────────────────────────────────────────────── */}
      {showQuotes && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-center">
          <div className="text-lg mb-2">💡</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{todayQuote}"</p>
        </div>
      )}
    </div>
  )
}
