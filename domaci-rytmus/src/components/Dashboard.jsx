import { useState, useCallback, useRef } from 'react'
import { CheckCircle2, Droplets, ShoppingCart, ChevronRight, Zap, CreditCard, Wallet, Wind, MapPin, RefreshCw, Settings, X, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage } from '../context/SyncContext'
import { CardViewer } from './LoyaltyCards'
import { useWeather } from '../hooks/useWeather'
import { useCurrency } from '../hooks/useCurrency'

// ─── Widget registry ──────────────────────────────────────────────────────────
const WIDGET_DEFS = [
  { id: 'weather',      label: 'Počasie',           emoji: '🌤️' },
  { id: 'smart',        label: 'Denný tip',          emoji: '💡' },
  { id: 'mealtoday',    label: 'Dnešný jedálniček',  emoji: '🍽️' },
  { id: 'budget',       label: 'Rozpočet',           emoji: '💶' },
  { id: 'budgetchart',  label: 'Graf výdavkov',      emoji: '📊' },
  { id: 'loyaltycards', label: 'Rýchle karty',       emoji: '💳' },
  { id: 'quicknav',     label: 'Rýchla navigácia',   emoji: '🗂️' },
  { id: 'quote',        label: 'Citát',              emoji: '💬' },
]
const DEFAULT_WIDGETS = ['weather','smart','mealtoday','budget','budgetchart','loyaltycards','quicknav','quote']

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
function toLocalDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const SK_MONTHS_SHORT = ['jan','feb','mar','apr','máj','jún','júl','aug','sep','okt','nov','dec']
const MEAL_SLOT_LABELS = { breakfast: 'Raňajky', lunch: 'Obed', dinner: 'Večera', snack: 'Desiata' }
const MEAL_SLOT_EMOJI  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

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
  const { fmt: fmtEur } = useCurrency()
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
  // Location denied — show how to re-enable
  if (locationDenied) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">🌤️</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Počasie je vypnuté</div>
          <div className="text-xs text-slate-400 mt-0.5 leading-snug">
            Povoľ polohu v nastaveniach prehliadača (🔒 alebo ℹ️ vedľa adresy)
          </div>
        </div>
        <button onClick={refresh}
          className="flex-shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-xl active:scale-95 transition-transform">
          Skúsiť znova
        </button>
      </div>
    )
  }

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

  // Not loading, no weather yet — offer to enable
  if (!weather) {
    return (
      <button onClick={refresh}
        className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3 active:scale-95 transition-transform text-left">
        <span className="text-2xl flex-shrink-0">🌤️</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Zobraziť počasie</div>
          <div className="text-xs text-slate-400 mt-0.5">Klepni — potrebuje povolenie polohy</div>
        </div>
        <RefreshCw size={16} className={`text-slate-400 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
      </button>
    )
  }

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

// ─── Today's meal widget ──────────────────────────────────────────────────────
function TodayMealsWidget({ onNavigate }) {
  const [mealPlan] = useSyncedStorage('meal-plan', {})
  const todayKey   = toLocalDateKey()
  const todayData  = mealPlan[todayKey] || {}
  // Collect all people's meals for each slot (prefer 'adults' or first key)
  const slots = ['breakfast', 'lunch', 'dinner', 'snack']
  const personsKeys = Object.keys(todayData)
  const hasMeals = personsKeys.some(pk => slots.some(s => todayData[pk]?.[s]))

  return (
    <button onClick={() => onNavigate('mealplan')}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden active:scale-95 transition-transform text-left">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base">🍽️</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Dnešný jedálniček</span>
        </div>
        <ChevronRight size={14} className="text-slate-400" />
      </div>
      {hasMeals ? (
        <div className="p-3 grid grid-cols-2 gap-2">
          {slots.map(slot => {
            const meal = personsKeys.map(pk => todayData[pk]?.[slot]).find(Boolean)
            if (!meal) return null
            return (
              <div key={slot} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                <span className="text-sm flex-shrink-0">{MEAL_SLOT_EMOJI[slot]}</span>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">{MEAL_SLOT_LABELS[slot]}</div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate leading-tight">
                    {meal.emoji && !meal.thumb ? meal.emoji + ' ' : ''}{meal.name}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-slate-400">Žiadne jedlá naplánované na dnes</p>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">Klepni a naplánuj jedálniček</p>
        </div>
      )}
    </button>
  )
}

// ─── Spending chart widget ─────────────────────────────────────────────────────
function SpendingChartWidget({ budgetExpenses, onNavigate }) {
  const { fmt: fmtEur } = useCurrency()
  const now    = new Date()
  // Build last 6 months array (oldest → newest)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: SK_MONTHS_SHORT[d.getMonth()] }
  })
  const totals = months.map(({ year, month }) =>
    budgetExpenses
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month })
      .reduce((s, e) => s + e.amount, 0)
  )
  const maxVal = Math.max(...totals, 1)

  if (totals.every(v => v === 0)) {
    return (
      <button onClick={() => onNavigate('budget')}
        className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left active:scale-95 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📊</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Graf výdavkov</span>
        </div>
        <p className="text-xs text-slate-400 text-center py-3">Zatiaľ žiadne výdavky nezaznamenané</p>
      </button>
    )
  }

  return (
    <button onClick={() => onNavigate('budget')}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left active:scale-95 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Výdavky — posledných 6 mesiacov</span>
        </div>
        <ChevronRight size={14} className="text-slate-400" />
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {totals.map((val, i) => {
          const pct    = val / maxVal
          const isCur  = i === 5
          const color  = isCur ? '#6366f1' : '#cbd5e1'
          const dcColor = isCur ? '#818cf8' : '#475569'
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{ height: `${Math.max(pct * 100, val > 0 ? 8 : 0)}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{months[i].label}</span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-slate-400">Tento mesiac</span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{fmtEur(totals[5])}</span>
      </div>
    </button>
  )
}

// ─── Dashboard customizer modal ────────────────────────────────────────────────
function DashboardCustomizer({ widgets, onSave, onClose }) {
  const [order, setOrder] = useState(widgets)
  const allIds   = WIDGET_DEFS.map(w => w.id)
  const hidden   = allIds.filter(id => !order.includes(id))

  const move = (id, dir) => {
    const idx = order.indexOf(id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === order.length - 1) return
    const next = [...order]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setOrder(next)
  }
  const remove = id => setOrder(order.filter(x => x !== id))
  const add    = id => setOrder([...order, id])

  const def = id => WIDGET_DEFS.find(w => w.id === id)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">Prispôsobiť dashboard</div>
            <div className="text-xs text-slate-400 mt-0.5">Pridaj, odober alebo zmeň poradie</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          {/* Active widgets */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Zobrazené</div>
            <div className="flex flex-col gap-2">
              {order.map((id, i) => {
                const w = def(id)
                if (!w) return null
                return (
                  <div key={id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/60 rounded-2xl px-3 py-2.5">
                    <span className="text-lg flex-shrink-0">{w.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{w.label}</span>
                    <button onClick={() => move(id, 'up')} disabled={i === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors">
                      <ChevronUp size={15} />
                    </button>
                    <button onClick={() => move(id, 'down')} disabled={i === order.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors">
                      <ChevronDown size={15} />
                    </button>
                    <button onClick={() => remove(id)}
                      className="p-1 text-rose-400 hover:text-rose-600 transition-colors ml-1">
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hidden widgets */}
          {hidden.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dostupné</div>
              <div className="flex flex-col gap-2">
                {hidden.map(id => {
                  const w = def(id)
                  if (!w) return null
                  return (
                    <button key={id} onClick={() => add(id)}
                      className="flex items-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl px-3 py-2.5 active:scale-95 transition-transform text-left w-full">
                      <span className="text-lg flex-shrink-0">{w.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-slate-500 dark:text-slate-400">{w.label}</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+ Pridať</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => { onSave(order); onClose() }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-colors active:scale-95 text-sm">
            Uložiť
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
  const [tasks, setTasks]   = useSyncedStorage('tasks', [])
  const [plants, setPlants] = useSyncedStorage('plants', [])
  const [shopping]          = useSyncedStorage('shopping', [])
  const [userName]          = useLocalStorage('user-name', '')
  const [userEmoji]         = useLocalStorage('user-emoji', '😊')
  const [showQuotes]        = useLocalStorage('show-quotes', true)
  const [loyaltyCards]      = useSyncedStorage('loyalty-cards', [])
  const [budgetConfig]      = useSyncedStorage('budget-config', { period: 'monthly', totalBudget: 1000 })
  const [budgetExpenses]    = useSyncedStorage('budget-expenses', [])
  const [dashWidgets, setDashWidgets] = useLocalStorage('dashboard-widgets', DEFAULT_WIDGETS)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [viewCard, setViewCard] = useState(null)

  const { weather, loading: wLoading, locationDenied, refresh: wRefresh } = useWeather()
  const { fmt: fmtEur } = useCurrency()

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

  // Ensure all DEFAULT_WIDGETS are present (new widgets added later should auto-appear)
  const safeWidgets = [
    ...dashWidgets.filter(id => WIDGET_DEFS.some(w => w.id === id)),
    ...DEFAULT_WIDGETS.filter(id => !dashWidgets.includes(id)),
  ]

  const renderWidget = id => {
    switch (id) {
      case 'weather':
        return <WeatherWidget key="weather" weather={weather} loading={wLoading} locationDenied={locationDenied} refresh={wRefresh} />

      case 'smart':
        return (
          <SmartCard key="smart"
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
        )

      case 'mealtoday':
        return <TodayMealsWidget key="mealtoday" onNavigate={onNavigate} />

      case 'budget':
        return budgetOk ? (
          <button key="budget" onClick={() => onNavigate('budget')}
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
        ) : null

      case 'budgetchart':
        return <SpendingChartWidget key="budgetchart" budgetExpenses={budgetExpenses} onNavigate={onNavigate} />

      case 'loyaltycards':
        return pinnedCards.length > 0 ? (
          <div key="loyaltycards" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
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
        ) : null

      case 'quicknav':
        return (
          <div key="quicknav" className="grid grid-cols-3 gap-3">
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
        )

      case 'quote':
        return showQuotes ? (
          <div key="quote" className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-center">
            <div className="text-lg mb-2">💡</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{todayQuote}"</p>
          </div>
        ) : null

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {viewCard && <CardViewer card={viewCard} onClose={() => setViewCard(null)} />}
      {showCustomizer && (
        <DashboardCustomizer
          widgets={safeWidgets}
          onSave={setDashWidgets}
          onClose={() => setShowCustomizer(false)}
        />
      )}

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
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="text-3xl leading-none">{userEmoji}</div>
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

        {/* Customizer button */}
        <button onClick={() => setShowCustomizer(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-2xl py-2 text-xs font-semibold transition-colors">
          <Settings size={13} />
          Prispôsobiť widgety
        </button>
      </div>

      {/* ── Configurable widgets ──────────────────────────────────────────── */}
      {safeWidgets.map(id => renderWidget(id))}
    </div>
  )
}
