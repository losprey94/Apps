import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, X, Settings2, TrendingDown, TrendingUp, ChevronDown, ChevronRight, Wallet, Check, Repeat } from 'lucide-react'
import { useSyncedStorage } from '../context/SyncContext'
import { useCurrency } from '../hooks/useCurrency'

// ─── Default categories ───────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'groceries',     name: 'Potraviny',     emoji: '🛒', budget: 300, color: '#10b981' },
  { id: 'housing',       name: 'Bývanie',       emoji: '🏠', budget: 500, color: '#6366f1' },
  { id: 'transport',     name: 'Doprava',       emoji: '🚗', budget: 100, color: '#f59e0b' },
  { id: 'restaurants',   name: 'Jedlo vonku',   emoji: '🍽️', budget: 80,  color: '#ef4444' },
  { id: 'clothing',      name: 'Oblečenie',     emoji: '👕', budget: 60,  color: '#8b5cf6' },
  { id: 'health',        name: 'Zdravie',       emoji: '💊', budget: 50,  color: '#ec4899' },
  { id: 'entertainment', name: 'Zábava',        emoji: '🎮', budget: 60,  color: '#3b82f6' },
  { id: 'phone',         name: 'Telefón',       emoji: '📱', budget: 30,  color: '#06b6d4' },
  { id: 'other',         name: 'Ostatné',       emoji: '💰', budget: 120, color: '#64748b' },
]

const CATEGORY_EMOJIS = ['🛒','🏠','🚗','🍽️','👕','💊','🎮','📱','💰','✈️','🎓','🐾','⚡','🎁','☕','🏋️','📚','🧴','🍺','🎬']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function periodLabel(period) {
  const now = new Date()
  if (period === 'monthly') {
    try { return now.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' }) }
    catch { return now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }
  }
  // weekly — show Mon to Sun
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = d => { try { return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }) } catch { return d.toLocaleDateString() } }
  return `${fmt(mon)} — ${fmt(sun)}`
}

function filterByPeriod(expenses, period) {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    if (period === 'monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
    return d >= mon && d <= sun
  })
}

function fmtDate(iso) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d >= today) return 'Dnes'
  if (d >= yesterday) return 'Včera'
  try { return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }) }
  catch { return d.toLocaleDateString() }
}

function healthColor(pct) {
  if (pct >= 1)   return { bar: 'bg-red-500',    text: 'text-red-600 dark:text-red-400',    ring: '#ef4444' }
  if (pct >= 0.8) return { bar: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400', ring: '#fb923c' }
  if (pct >= 0.5) return { bar: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400',  ring: '#fbbf24' }
  return               { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', ring: '#10b981' }
}

// ─── SVG ring progress ────────────────────────────────────────────────────────
function RingProgress({ pct, size = 130, stroke = 11, color = '#10b981', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(pct, 1))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Budget setup modal ───────────────────────────────────────────────────────
function SetupModal({ config, onSave, onClose }) {
  const safe = config || {}
  const [period, setPeriod]     = useState(safe.period || 'monthly')
  const [total, setTotal]       = useState(String(safe.totalBudget || 1000))
  const [cats, setCats]         = useState(
    Array.isArray(safe.categories) && safe.categories.length > 0
      ? safe.categories.map(c => ({ ...c }))
      : DEFAULT_CATEGORIES.map(c => ({ ...c }))
  )
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('💰')
  const { fmt: fmtEur } = useCurrency()

  const updateCatBudget = (id, val) =>
    setCats(prev => prev.map(c => c.id === id ? { ...c, budget: parseFloat(val) || 0 } : c))

  const removeCat = (id) => setCats(prev => prev.filter(c => c.id !== id))

  const addCat = () => {
    if (!newCatName.trim()) return
    setCats(prev => [...prev, {
      id: Date.now().toString(),
      name: newCatName.trim(),
      emoji: newCatEmoji,
      budget: 100,
      color: `hsl(${Math.floor(Math.random()*360)},65%,50%)`,
    }])
    setNewCatName(''); setNewCatEmoji('💰')
  }

  const save = () => {
    onSave({ period, totalBudget: parseFloat(total) || 1000, categories: cats })
    onClose()
  }

  const catTotal = cats.reduce((s, c) => s + (c.budget || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Nastavenie rozpočtu</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Period */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Obdobie</label>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
              {[['monthly','📅 Mesačný'],['weekly','📆 Týždenný']].map(([v,l]) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${period === v ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Total budget */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Celkový rozpočet
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3">
              <span className="text-slate-500 font-semibold text-lg">€</span>
              <input
                type="number" min="0" step="10"
                value={total}
                onChange={e => setTotal(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                placeholder="1000"
              />
            </div>
            <div className={`text-xs mt-1.5 ${catTotal > parseFloat(total) ? 'text-red-500' : 'text-slate-400'}`}>
              Súčet kategórií: {fmtEur(catTotal)}
              {catTotal > parseFloat(total) && ' — presahuje celkový rozpočet!'}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Kategórie</label>
            <div className="flex flex-col gap-2">
              {cats.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
                  <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-sm">€</span>
                    <input
                      type="number" min="0" step="5"
                      value={cat.budget}
                      onChange={e => updateCatBudget(cat.id, e.target.value)}
                      className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <button onClick={() => removeCat(cat.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new category */}
            <div className="mt-3 flex flex-col gap-2 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-medium">Pridať kategóriu</div>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {CATEGORY_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setNewCatEmoji(e)}
                    className={`text-lg p-1 rounded-lg transition-all ${newCatEmoji === e ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400 scale-110' : 'bg-slate-50 dark:bg-slate-700'}`}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Názov kategórie…"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCat()}
                  className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button onClick={addCat}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <button onClick={save}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors active:scale-95 text-sm">
            Uložiť rozpočet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add expense modal ────────────────────────────────────────────────────────
function AddExpenseModal({ categories, onAdd, onAddRecurring, onClose }) {
  const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES
  const [amount, setAmount]       = useState('')
  const [catId, setCatId]         = useState(safeCategories[0].id)
  const [note, setNote]           = useState('')
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])
  const [done, setDone]           = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [dayOfMonth, setDayOfMonth]   = useState(1)
  const [customDay, setCustomDay]     = useState('')

  const submit = (e) => {
    e.preventDefault()
    const val = parseFloat(amount.replace(',', '.'))
    if (!val || val <= 0) return
    if (isRecurring) {
      onAddRecurring({ id: Date.now(), amount: val, categoryId: catId, note: note.trim(), dayOfMonth, active: true, lastApplied: null })
    } else {
      onAdd({ id: Date.now(), amount: val, categoryId: catId, note: note.trim(), date })
    }
    setDone(true)
    setTimeout(() => { setAmount(''); setNote(''); setDone(false); if (isRecurring) onClose() }, 700)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Pridať výdavok</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* Amount — big and central */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-300 dark:text-slate-500">€</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-4xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-300 dark:placeholder-slate-600"
              required
            />
          </div>

          {/* Recurring toggle */}
          <button
            type="button"
            onClick={() => setIsRecurring(v => !v)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              isRecurring
                ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Repeat size={15} />
            {isRecurring ? 'Opakujúci výdavok' : 'Jednorazový výdavok'}
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${isRecurring ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>
              {isRecurring ? 'každý mesiac' : 'raz'}
            </span>
          </button>

          {/* Day of month picker (when recurring) */}
          {isRecurring && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Deň v mesiaci, kedy sa účtuje
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {[1,5,10,15,20,25,31].map(d => (
                  <button key={d} type="button" onClick={() => { setDayOfMonth(d); setCustomDay('') }}
                    className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all ${
                      dayOfMonth === d && customDay === ''
                        ? 'bg-violet-600 border-transparent text-white'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                    }`}>{d}.</button>
                ))}
                <div className={`flex items-center gap-1 px-2.5 h-10 rounded-xl border-2 transition-all ${
                  customDay !== ''
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                }`}>
                  <span className="text-xs text-slate-400 whitespace-nowrap">deň:</span>
                  <input
                    type="number" min="1" max="31"
                    value={customDay}
                    onChange={e => {
                      setCustomDay(e.target.value)
                      const n = parseInt(e.target.value)
                      if (n >= 1 && n <= 31) setDayOfMonth(n)
                    }}
                    onBlur={() => {
                      if (!customDay) return
                      const n = parseInt(customDay)
                      if (!n || n < 1 || n > 31) setCustomDay('')
                      else setDayOfMonth(Math.min(31, Math.max(1, n)))
                    }}
                    className="w-10 bg-transparent text-sm font-bold text-violet-700 dark:text-violet-300 text-center focus:outline-none placeholder-slate-300"
                    placeholder="?"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1.5">
                Vybraný deň: <span className="font-semibold text-slate-600 dark:text-slate-300">{dayOfMonth}.</span>
                {dayOfMonth > 28 && ' — v kratších mesiacoch sa použije posledný deň.'}
              </div>
            </div>
          )}

          {/* Category grid */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">Kategória</label>
            <div className="grid grid-cols-4 gap-2">
              {safeCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCatId(cat.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-center transition-all ${
                    catId === cat.id
                      ? 'border-transparent shadow-md scale-105'
                      : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                  }`}
                  style={catId === cat.id ? { backgroundColor: cat.color + '22', borderColor: cat.color } : {}}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-tight truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note + date row */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Popis (voliteľné)…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {!isRecurring && (
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}
          </div>

          <button type="submit"
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 ${done ? 'bg-emerald-500' : isRecurring ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {done ? <><Check size={18} /> {isRecurring ? 'Uložené!' : 'Pridané!'}</> : isRecurring ? <><Repeat size={18} /> Uložiť opakujúci</> : <><Plus size={18} /> Pridať výdavok</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Budget component ────────────────────────────────────────────────────
export default function Budget() {
  const { fmt } = useCurrency()
  const fmtEur = n => fmt(n, 2)
  const [config, setConfig] = useSyncedStorage('budget-config', {
    period: 'monthly',
    totalBudget: 1000,
    categories: DEFAULT_CATEGORIES,
  })
  const [expenses, setExpenses] = useSyncedStorage('budget-expenses', [])
  const [recurringExpenses, setRecurringExpenses] = useSyncedStorage('budget-recurring', [])

  const [showSetup, setShowSetup]   = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [showAllExp, setShowAllExp] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})

  // Auto-apply recurring expenses when they're due this month
  useEffect(() => {
    if (!recurringExpenses?.length) return
    const today = new Date()
    const todayDay = today.getDate()
    const periodKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const toApply = []
    let changed = false
    const updated = recurringExpenses.map(r => {
      const effectiveDay = Math.min(r.dayOfMonth, daysInMonth)
      if (!r.active || r.lastApplied === periodKey || todayDay < effectiveDay) return r
      const year  = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day   = String(effectiveDay).padStart(2, '0')
      toApply.push({
        id: Date.now() + toApply.length,
        amount: r.amount,
        categoryId: r.categoryId,
        note: r.note,
        date: `${year}-${month}-${day}`,
        recurringId: r.id,
      })
      changed = true
      return { ...r, lastApplied: periodKey }
    })

    if (changed) {
      setExpenses(prev => [...toApply, ...(prev || [])])
      setRecurringExpenses(updated)
    }
  }, [recurringExpenses]) // eslint-disable-line

  const { period, totalBudget, categories } = config || {}
  const safeCategories = Array.isArray(categories) && categories.length > 0
    ? categories
    : DEFAULT_CATEGORIES
  const safeTotalBudget = totalBudget || 1000
  const safePeriod      = period || 'monthly'

  // Current-period expenses
  const periodExpenses = useMemo(() => filterByPeriod(expenses || [], safePeriod), [expenses, safePeriod])

  const totalSpent = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const remaining  = safeTotalBudget - totalSpent
  const totalPct   = totalSpent / safeTotalBudget
  const health     = healthColor(totalPct)

  // Daily budget context
  const now = new Date()
  const daysInPeriod = safePeriod === 'monthly'
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    : 7
  const dayOfPeriod = safePeriod === 'monthly'
    ? now.getDate()
    : ((now.getDay() + 6) % 7) + 1
  const daysLeft   = Math.max(1, daysInPeriod - dayOfPeriod + 1)
  const perDay     = remaining > 0 ? remaining / daysLeft : 0
  const expectedSpent = (dayOfPeriod / daysInPeriod) * safeTotalBudget
  const onTrack    = totalSpent <= expectedSpent + 0.01

  // Per-category spending
  const catSpending = useMemo(() => {
    const map = {}
    for (const cat of safeCategories) map[cat.id] = 0
    for (const e of periodExpenses) {
      if (map[e.categoryId] !== undefined) map[e.categoryId] += e.amount
      else map['other'] = (map['other'] || 0) + e.amount
    }
    return map
  }, [periodExpenses, safeCategories])

  // Group expenses by day for the log
  const groupedExpenses = useMemo(() => {
    const all = showAllExp ? [...periodExpenses] : periodExpenses.slice(0, 10)
    all.sort((a, b) => new Date(b.date) - new Date(a.date))
    const groups = {}
    for (const e of all) {
      const key = fmtDate(e.date)
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    }
    return groups
  }, [periodExpenses, showAllExp])

  const addExpense = (expense) => setExpenses(prev => [expense, ...prev])
  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id))

  const addRecurring   = (r) => setRecurringExpenses(prev => [...(prev || []), r])
  const deleteRecurring = (id) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id))
    // also remove any auto-applied expenses from this recurring in current period
    setExpenses(prev => prev.filter(e => e.recurringId !== id))
  }
  const toggleRecurring = (id) =>
    setRecurringExpenses(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))

  const getCat = (id) => safeCategories.find(c => c.id === id) || { name: 'Ostatné', emoji: '💰', color: '#64748b' }

  return (
    <>
      {showSetup && (
        <SetupModal
          config={{ period: safePeriod, totalBudget: safeTotalBudget, categories: safeCategories }}
          onSave={setConfig}
          onClose={() => setShowSetup(false)}
        />
      )}
      {showAdd && (
        <AddExpenseModal
          categories={safeCategories}
          onAdd={addExpense}
          onAddRecurring={addRecurring}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="flex flex-col gap-4 animate-fade-in">

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-5 text-white shadow-xl relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${health.ring}cc, ${health.ring}88)` }}
        >
          {/* Period toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-white/15 rounded-xl p-0.5 gap-0.5">
              {[['monthly','Mesačný'],['weekly','Týždenný']].map(([v, l]) => (
                <button key={v} onClick={() => setConfig(prev => ({ ...prev, period: v }))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-all ${safePeriod === v ? 'bg-white text-slate-800' : 'text-white/80'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSetup(true)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
              <Settings2 size={15} />
            </button>
          </div>

          {/* Period label */}
          <div className="text-white/70 text-xs font-medium capitalize mb-4">{periodLabel(safePeriod)}</div>

          {/* Ring + numbers */}
          <div className="flex items-center gap-5">
            <RingProgress pct={totalPct} size={120} stroke={10} color="rgba(255,255,255,0.9)">
              <div className="text-center">
                <div className="text-xs text-white/60 font-medium">minuto</div>
                <div className="text-lg font-bold leading-tight">{Math.round(totalPct * 100)}%</div>
              </div>
            </RingProgress>

            <div className="flex-1">
              <div className="text-white/60 text-xs font-medium mb-0.5">Zostatok</div>
              <div className="text-3xl font-bold leading-tight">
                {fmtEur(Math.max(remaining, 0))}
              </div>
              {remaining < 0 && (
                <div className="text-xs bg-white/20 rounded-lg px-2 py-0.5 mt-1 inline-block font-semibold">
                  Prekročený o {fmtEur(Math.abs(remaining))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <div className="text-center">
                  <div className="text-xs text-white/60">Minuto</div>
                  <div className="font-bold text-sm">{fmtEur(totalSpent)}</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-xs text-white/60">Rozpočet</div>
                  <div className="font-bold text-sm">{fmtEur(safeTotalBudget)}</div>
                </div>
              </div>

              {/* Daily context */}
              {remaining > 0 && (
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-white/60">Na deň zostatok</div>
                    <div className="text-lg font-bold leading-tight">{fmtEur(perDay)}<span className="text-white/60 text-xs font-normal">/deň</span></div>
                    <div className="text-xs text-white/50 mt-0.5">zostáva {daysLeft} {daysLeft === 1 ? 'deň' : daysLeft < 5 ? 'dni' : 'dní'}</div>
                  </div>
                  <div className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl ${onTrack ? 'bg-white/20 text-white' : 'bg-red-400/40 text-red-100'}`}>
                    {onTrack ? '✓ Míňaš OK' : '⚠ Míňaš rýchlo'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── First-time hint ─────────────────────────────────────────────── */}
        {expenses.length === 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">💡</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Ako začať?</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">
                Nastav si mesačný rozpočet a pridaj prvý výdavok tlačidlom +. Appka ti ukáže, koľko ti zostáva.
              </div>
              <button onClick={() => setShowSetup(true)}
                className="mt-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                Nastaviť rozpočet
              </button>
            </div>
          </div>
        )}

        {/* ── Set limits button ────────────────────────────────────────────── */}
        <button
          onClick={() => setShowSetup(true)}
          className="w-full flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3.5 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
              <Settings2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nastaviť limity kategórií</div>
              <div className="text-xs text-slate-400 mt-0.5">Rozpočet, obdobie, kategórie</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>

        {/* ── Categories ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Kategórie</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {safeCategories.map(cat => {
              const spent  = catSpending[cat.id] || 0
              const pct    = cat.budget > 0 ? spent / cat.budget : 0
              const h      = healthColor(pct)
              const catExp = periodExpenses.filter(e => e.categoryId === cat.id)
              const open   = expandedCats[cat.id]

              return (
                <div key={cat.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left"
                    onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                  >
                    {/* Emoji */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: cat.color + '18' }}>
                      {cat.emoji}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                        <span className={`text-xs font-bold ml-2 flex-shrink-0 ${h.text}`}>
                          {fmtEur(spent)} / {fmtEur(cat.budget)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${h.bar}`}
                          style={{ width: `${Math.min(pct * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {catExp.length > 0 && (
                      open
                        ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                        : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded category transactions */}
                  {open && catExp.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700/50 px-4 py-2 flex flex-col gap-1.5">
                      {[...catExp].sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
                        <div key={e.id} className="flex items-center gap-2 py-1">
                          <span className="text-xs text-slate-400 flex-shrink-0 w-12">{fmtDate(e.date)}</span>
                          <span className="flex-1 text-xs text-slate-600 dark:text-slate-400 truncate">{e.note || cat.name}</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">{fmtEur(e.amount)}</span>
                          <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Recurring expenses ──────────────────────────────────────────── */}
        {recurringExpenses && recurringExpenses.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Repeat size={14} className="text-violet-500" />
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Pravidelné výdavky</span>
              </div>
              <span className="text-xs text-slate-400">{fmtEur(recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0))}/mes.</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {recurringExpenses.map(r => {
                const cat = getCat(r.categoryId)
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: cat.color + '18' }}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {r.note || cat.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {cat.name} · každý {r.dayOfMonth}. v mesiaci
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-shrink-0 mr-1">
                      {fmtEur(r.amount)}
                    </div>
                    <button
                      onClick={() => toggleRecurring(r.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${r.active ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                      title={r.active ? 'Vypnúť' : 'Zapnúť'}
                    >
                      <Repeat size={14} />
                    </button>
                    <button onClick={() => deleteRecurring(r.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Expense log ─────────────────────────────────────────────────── */}
        {periodExpenses.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Výdavky</span>
              <span className="text-xs text-slate-400">{periodExpenses.length} položiek</span>
            </div>

            {Object.entries(groupedExpenses).map(([day, dayExp]) => (
              <div key={day}>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{day}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {fmtEur(dayExp.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                {dayExp.map((e, idx) => {
                  const cat = getCat(e.categoryId)
                  return (
                    <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${idx < dayExp.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: cat.color + '18' }}>
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {e.note || cat.name}
                          </span>
                          {e.recurringId && <Repeat size={11} className="text-violet-400 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-400">{cat.name}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
                        {fmtEur(e.amount)}
                      </div>
                      <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}

            {periodExpenses.length > 10 && (
              <button
                onClick={() => setShowAllExp(!showAllExp)}
                className="w-full py-3 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-700"
              >
                {showAllExp ? 'Zobraziť menej' : `Zobraziť všetkých ${periodExpenses.length}`}
                {showAllExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
        )}

        {periodExpenses.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <div className="font-medium">Žiadne výdavky</div>
            <div className="text-sm mt-1">Pridaj prvý výdavok tlačidlom +</div>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900 flex items-center justify-center transition-all z-10"
        >
          <Plus size={24} />
        </button>
      </div>
    </>
  )
}
