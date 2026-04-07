import { useState, useCallback, useRef } from 'react'
import { Plus, X, Search, ShoppingCart, ChevronDown, ChevronRight, Trash2, Loader, ChevronLeft, Calendar } from 'lucide-react'
import { useSyncedStorage } from '../context/SyncContext'
import { useHaptic } from '../hooks/useHaptic'

// ─── Constants ────────────────────────────────────────────────────────────────
const SK_DAYS    = ['Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota','Nedeľa']
const SK_MONTHS  = ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra']

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Raňajky',  emoji: '🌅' },
  { id: 'snack1',    label: 'Desiata',  emoji: '🍎' },
  { id: 'lunch',     label: 'Obed',     emoji: '🍽️' },
  { id: 'snack2',    label: 'Olovrant', emoji: '🧁' },
  { id: 'dinner',    label: 'Večera',   emoji: '🌙' },
]

const API_CATEGORIES = ['Chicken','Beef','Pork','Lamb','Seafood','Pasta','Vegetarian','Vegan','Breakfast','Dessert','Side','Starter','Miscellaneous']
const SK_CATEGORIES  = { Chicken:'Kura', Beef:'Hovädzie', Pork:'Bravčové', Lamb:'Jahňacie', Seafood:'Ryby', Pasta:'Cestoviny', Vegetarian:'Vegetariánske', Vegan:'Vegánske', Breakfast:'Raňajky', Dessert:'Dezerty', Side:'Prílohy', Starter:'Predjedlá', Miscellaneous:'Ostatné' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekStart(offset = 0) {
  const d = new Date()
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - dow + 1 + offset * 7)
  d.setHours(0,0,0,0)
  return d
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function fmtDayHeader(dateStr, idx) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${SK_DAYS[idx]}, ${d.getDate()}. ${SK_MONTHS[d.getMonth()]}`
}

function todayStr() { return new Date().toISOString().split('T')[0] }

function parseIngredients(meal) {
  const out = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim()
    const measure = meal[`strMeasure${i}`]?.trim()
    if (name) out.push({ name, measure: measure || '' })
  }
  return out
}

// ─── TheMealDB API ────────────────────────────────────────────────────────────
const BASE = 'https://www.themealdb.com/api/json/v1/1'

async function apiSearch(query) {
  const r = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`)
  const d = await r.json()
  return d.meals || []
}

async function apiByCategory(cat) {
  const r = await fetch(`${BASE}/filter.php?c=${cat}`)
  const d = await r.json()
  return d.meals || []
}

async function apiFull(id) {
  const r = await fetch(`${BASE}/lookup.php?i=${id}`)
  const d = await r.json()
  return d.meals?.[0] || null
}

async function apiRandom() {
  const r = await fetch(`${BASE}/random.php`)
  const d = await r.json()
  return d.meals?.[0] || null
}

// ─── Recipe picker modal ──────────────────────────────────────────────────────
function RecipePicker({ onPick, onClose, savedRecipes }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cat, setCat]         = useState(null)
  const [picking, setPicking] = useState(null)
  const debounce = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try { setResults(await apiSearch(q)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    setCat(null)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(q), 400)
  }

  const loadCat = async (c) => {
    setCat(c); setQuery(''); setLoading(true)
    try { setResults(await apiByCategory(c)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }

  const pick = async (meal) => {
    setPicking(meal.idMeal)
    try {
      // Fetch full details for ingredients if not already available
      const full = meal.strIngredient1 ? meal : await apiFull(meal.idMeal)
      if (!full) return
      onPick({
        id:          full.idMeal,
        name:        full.strMeal,
        thumb:       full.strMealThumb,
        category:    full.strCategory || '',
        ingredients: parseIngredients(full),
      })
    } finally { setPicking(null) }
  }

  const showList = results.length > 0
  const showSaved = !showList && !loading && savedRecipes.length > 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" onClick={onClose}>
      <div className="flex flex-col flex-1 max-w-lg mx-auto w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            <X size={18} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-2xl px-4 py-2.5">
            <Search size={16} className="text-slate-500 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Hľadaj recept..."
              value={query}
              onChange={handleInput}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            {loading && <Loader size={14} className="text-slate-500 animate-spin flex-shrink-0" />}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {API_CATEGORIES.map(c => (
            <button key={c} onClick={() => loadCat(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${cat === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {SK_CATEGORIES[c]}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {/* Saved favorites */}
          {showSaved && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Uložené recepty</div>
              {savedRecipes.map(r => (
                <button key={r.id} onClick={() => onPick(r)}
                  className="flex items-center gap-3 bg-slate-800 rounded-2xl p-3 active:scale-95 transition-transform text-left">
                  <img src={r.thumb} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                  <div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{r.category}</div>
                  </div>
                </button>
              ))}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2 mb-1">Alebo vyhľadaj recept vyššie</div>
            </>
          )}

          {/* Search/category results */}
          {showList && results.map(meal => (
            <button key={meal.idMeal} onClick={() => pick(meal)}
              disabled={picking === meal.idMeal}
              className="flex items-center gap-3 bg-slate-800 rounded-2xl p-3 active:scale-95 transition-transform text-left disabled:opacity-60">
              <img src={meal.strMealThumb + '/preview'} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{meal.strMeal}</div>
                <div className="text-xs text-slate-400 mt-0.5">{meal.strCategory || SK_CATEGORIES[cat] || ''}</div>
              </div>
              {picking === meal.idMeal && <Loader size={16} className="text-indigo-400 animate-spin flex-shrink-0" />}
            </button>
          ))}

          {!showList && !showSaved && !loading && (
            <div className="text-center py-16 text-slate-500">
              <Search size={36} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Zadaj názov jedla alebo vyber kategóriu</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({ dateStr, dayIdx, group, mealPlan, onSetMeal, onClearMeal, savedRecipes, today }) {
  const [open, setOpen]       = useState(dateStr === today)
  const [picking, setPicking] = useState(null) // slot id being picked
  const dayPlan = mealPlan[dateStr]?.[group] || {}
  const filledCount = MEAL_SLOTS.filter(s => dayPlan[s.id]).length
  const isToday = dateStr === today

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden ${isToday ? 'border-indigo-200 dark:border-indigo-700' : 'border-slate-100 dark:border-slate-700'}`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {isToday && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
          <div className="text-left">
            <div className={`text-sm font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {fmtDayHeader(dateStr, dayIdx)}
              {isToday && <span className="ml-2 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">Dnes</span>}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {filledCount === 0 ? 'Nič naplánované' : `${filledCount} z 5 jedál`}
            </div>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50">
          {MEAL_SLOTS.map(slot => {
            const meal = dayPlan[slot.id]
            return (
              <div key={slot.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-lg flex-shrink-0 w-7 text-center">{slot.emoji}</span>
                <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">{slot.label}</span>
                {meal ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img src={meal.thumb + '/preview'} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{meal.name}</span>
                    <button onClick={() => onClearMeal(dateStr, group, slot.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPicking(slot.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors active:scale-95 flex-1">
                    <Plus size={13} /> Pridať
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {picking && (
        <RecipePicker
          savedRecipes={savedRecipes}
          onPick={meal => { onSetMeal(dateStr, group, picking, meal); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

// ─── Main MealPlan component ──────────────────────────────────────────────────
export default function MealPlan() {
  const [mealPlan, setMealPlan]     = useSyncedStorage('meal-plan', {})
  const [shopping, setShopping]     = useSyncedStorage('shopping', [])
  const [savedRecipes, setSaved]    = useSyncedStorage('saved-recipes', [])
  const [weekOffset, setWeekOffset] = useState(0)   // 0 = this week, 1 = next week
  const [group, setGroup]           = useState('adults') // 'adults' | 'kids'
  const [genDone, setGenDone]       = useState(false)
  const haptic = useHaptic()

  const weekStart = getWeekStart(weekOffset)
  const weekDays  = getWeekDays(weekStart)
  const today     = todayStr()

  const setMeal = useCallback((date, grp, slot, meal) => {
    haptic.success()
    setMealPlan(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [grp]: {
          ...(prev[date]?.[grp] || {}),
          [slot]: meal,
        },
      },
    }))
    // Auto-save to favorites if not already there
    setSaved(prev => prev.some(r => r.id === meal.id) ? prev : [meal, ...prev].slice(0, 50))
  }, [haptic, setMealPlan, setSaved])

  const clearMeal = useCallback((date, grp, slot) => {
    haptic.tap()
    setMealPlan(prev => {
      const updated = { ...prev[date], [grp]: { ...(prev[date]?.[grp] || {}), [slot]: null } }
      return { ...prev, [date]: updated }
    })
  }, [haptic, setMealPlan])

  const generateShoppingList = () => {
    haptic.done()
    const ingredientMap = {}
    for (const date of weekDays) {
      for (const grp of ['adults', 'kids']) {
        const dayPlan = mealPlan[date]?.[grp] || {}
        for (const slot of MEAL_SLOTS) {
          const meal = dayPlan[slot.id]
          if (!meal?.ingredients) continue
          for (const ing of meal.ingredients) {
            const key = ing.name.toLowerCase()
            if (!ingredientMap[key]) ingredientMap[key] = { name: ing.name, measures: [] }
            if (ing.measure) ingredientMap[key].measures.push(ing.measure)
          }
        }
      }
    }

    const existingNames = new Set(shopping.map(i => i.name.toLowerCase()))
    const newItems = Object.values(ingredientMap)
      .filter(i => !existingNames.has(i.name.toLowerCase()))
      .map(i => ({
        id: Date.now() + Math.random(),
        name: i.name + (i.measures.length ? ` (${[...new Set(i.measures)].join(', ')})` : ''),
        category: 'ostatne',
        quantity: 1,
        done: false,
      }))

    if (newItems.length > 0) setShopping(prev => [...newItems, ...prev])
    setGenDone(true)
    setTimeout(() => setGenDone(false), 2500)
  }

  const weekLabel = weekOffset === 0 ? 'Tento týždeň' : 'Budúci týždeň'
  const weekRange = (() => {
    const mon = weekDays[0]; const sun = weekDays[6]
    const f = s => { const d = new Date(s + 'T00:00:00'); return `${d.getDate()}. ${SK_MONTHS[d.getMonth()]}` }
    return `${f(mon)} — ${f(sun)}`
  })()

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">

      {/* Week navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-1 flex gap-1">
        <button onClick={() => setWeekOffset(0)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${weekOffset === 0 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
          Tento týždeň
        </button>
        <button onClick={() => setWeekOffset(1)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${weekOffset === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
          Budúci týždeň
        </button>
      </div>

      {/* Week range + group switcher */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{weekLabel}</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{weekRange}</div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 gap-0.5">
          <button onClick={() => setGroup('adults')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${group === 'adults' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400'}`}>
            👨‍👩‍👧 Dospelí
          </button>
          <button onClick={() => setGroup('kids')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${group === 'kids' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400'}`}>
            🧒 Deti
          </button>
        </div>
      </div>

      {/* Day cards */}
      {weekDays.map((date, idx) => (
        <DayCard
          key={date}
          dateStr={date}
          dayIdx={idx}
          group={group}
          mealPlan={mealPlan}
          onSetMeal={setMeal}
          onClearMeal={clearMeal}
          savedRecipes={savedRecipes}
          today={today}
        />
      ))}

      {/* Generate shopping list */}
      <button
        onClick={generateShoppingList}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
          genDone
            ? 'bg-emerald-500 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40'
        }`}
      >
        <ShoppingCart size={18} />
        {genDone ? '✓ Pridané do nákupného zoznamu!' : `Generovať nákupný zoznam — ${weekLabel.toLowerCase()}`}
      </button>
    </div>
  )
}
