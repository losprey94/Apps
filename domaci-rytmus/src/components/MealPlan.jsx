import { useState, useCallback, useRef } from 'react'
import { Plus, X, Search, ShoppingCart, Trash2, Loader, ChevronLeft, Calendar } from 'lucide-react'
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

// Slovak ingredient dictionary (TheMealDB ingredient names → Slovak)
const SK_INGREDIENTS = {
  // Mäso & hydina
  'chicken': 'kura', 'chicken breast': 'kuracie prsia', 'chicken thighs': 'kuracie stehná',
  'chicken legs': 'kuracie nožičky', 'chicken wings': 'kuracie krídla', 'chicken stock': 'kurací vývar',
  'beef': 'hovädzie mäso', 'beef mince': 'mleté hovädzie', 'ground beef': 'mleté hovädzie',
  'beef stock': 'hovädzí vývar', 'steak': 'steak', 'pork': 'bravčové mäso',
  'pork chops': 'bravčové kotlety', 'pork belly': 'bravčový bôčik', 'bacon': 'slanina',
  'ham': 'šunka', 'lamb': 'jahňacie mäso', 'lamb mince': 'mleté jahňacie',
  'turkey': 'morka', 'duck': 'kačica', 'sausage': 'klobása', 'chorizo': 'chorizo',
  'salami': 'saláma', 'mince': 'mleté mäso', 'veal': 'teľacie mäso',
  // Ryby & morské plody
  'salmon': 'losos', 'tuna': 'tuniak', 'cod': 'treska', 'shrimp': 'krevety',
  'prawns': 'krevety', 'crab': 'krab', 'lobster': 'homár', 'squid': 'kalamár',
  'anchovies': 'ančovičky', 'sardines': 'sardinky', 'mussels': 'mušle',
  'clams': 'lastúry', 'fish': 'ryba', 'fish sauce': 'rybacia omáčka',
  'fish stock': 'rybí vývar', 'sea bass': 'morský vlk', 'tilapia': 'tilapia',
  // Zelenina
  'onion': 'cibuľa', 'onions': 'cibuľa', 'garlic': 'cesnak', 'garlic cloves': 'strúčiky cesnaku',
  'tomato': 'paradajka', 'tomatoes': 'paradajky', 'tomato paste': 'paradajkový pretlak',
  'tomato sauce': 'paradajková omáčka', 'tomato puree': 'paradajkové pyré',
  'potato': 'zemiak', 'potatoes': 'zemiaky', 'sweet potato': 'batát',
  'carrot': 'mrkva', 'carrots': 'mrkva', 'celery': 'zeler', 'leek': 'pór',
  'pepper': 'paprika', 'red pepper': 'červená paprika', 'green pepper': 'zelená paprika',
  'yellow pepper': 'žltá paprika', 'bell pepper': 'paprika', 'chilli': 'chili',
  'chilli pepper': 'chili paprička', 'jalapeno': 'jalapeño',
  'spinach': 'špenát', 'lettuce': 'šalát', 'cabbage': 'kapusta',
  'red cabbage': 'červená kapusta', 'broccoli': 'brokolica', 'cauliflower': 'karfiol',
  'zucchini': 'cuketa', 'courgette': 'cuketa', 'eggplant': 'baklažán',
  'aubergine': 'baklažán', 'cucumber': 'uhorka', 'mushrooms': 'huby',
  'mushroom': 'huba', 'peas': 'hrášok', 'corn': 'kukurica', 'sweetcorn': 'kukurica',
  'asparagus': 'špargľa', 'artichoke': 'artičok', 'fennel': 'fenikel',
  'pumpkin': 'tekvica', 'squash': 'tekvica', 'beetroot': 'červená repa',
  'radish': 'reďkovka', 'spring onion': 'jarná cibuľka', 'scallions': 'jarná cibuľka',
  'shallots': 'šalotka', 'kale': 'kaderavý kel', 'pak choi': 'pak choi',
  'bok choy': 'pak choi', 'bean sprouts': 'klíčky mungo',
  // Ovocie
  'lemon': 'citrón', 'lime': 'limetka', 'orange': 'pomaranč',
  'lemon juice': 'citrónová šťava', 'lime juice': 'limetková šťava',
  'apple': 'jablko', 'pear': 'hruška', 'banana': 'banán', 'mango': 'mango',
  'pineapple': 'ananás', 'coconut': 'kokos', 'coconut milk': 'kokosové mlieko',
  'coconut cream': 'kokosový krém', 'avocado': 'avokádo', 'strawberry': 'jahoda',
  'blueberry': 'čučoriedka', 'raspberry': 'malina', 'cherry': 'čerešňa',
  'grape': 'hrozno', 'raisin': 'hrozienka', 'raisins': 'hrozienka',
  'cranberries': 'brusnice', 'apricot': 'marhuľa', 'peach': 'broskyňa',
  'plum': 'slivka', 'fig': 'figa', 'date': 'datle', 'dates': 'datle',
  // Mliečne výrobky & vajcia
  'milk': 'mlieko', 'butter': 'maslo', 'cream': 'smotana',
  'double cream': 'šľahačková smotana', 'sour cream': 'kyslá smotana',
  'cheese': 'syr', 'cheddar': 'cheddar', 'parmesan': 'parmezán',
  'mozzarella': 'mozzarella', 'feta': 'feta', 'ricotta': 'ricotta',
  'cream cheese': 'krémový syr', 'yogurt': 'jogurt', 'yoghurt': 'jogurt',
  'eggs': 'vajcia', 'egg': 'vajce', 'egg yolk': 'žĺtok', 'egg yolks': 'žĺtky',
  'egg white': 'bielok', 'egg whites': 'bielky',
  // Strukoviny
  'chickpeas': 'cícer', 'lentils': 'šošovica', 'kidney beans': 'fazuľa kidney',
  'black beans': 'čierna fazuľa', 'cannellini beans': 'cannellini fazuľa',
  'lentil': 'šošovica', 'beans': 'fazuľa', 'tofu': 'tofu',
  'edamame': 'edamame', 'hummus': 'hummus',
  // Obilniny, ryža, cestoviny
  'rice': 'ryža', 'white rice': 'biela ryža', 'brown rice': 'hnedá ryža',
  'basmati rice': 'basmati ryža', 'jasmine rice': 'jazmínová ryža',
  'pasta': 'cestoviny', 'spaghetti': 'špagety', 'penne': 'penne',
  'tagliatelle': 'tagliatelle', 'lasagne sheets': 'lasagne plátky',
  'noodles': 'rezance', 'rice noodles': 'ryžové rezance', 'bread': 'chlieb',
  'breadcrumbs': 'strúhanka', 'flour': 'múka', 'plain flour': 'hladká múka',
  'self-raising flour': 'prášková múka', 'cornflour': 'kukuričný škrob',
  'oats': 'ovsené vločky', 'rolled oats': 'ovsené vločky',
  'couscous': 'kuskus', 'quinoa': 'quinoa', 'polenta': 'polenta',
  'tortillas': 'tortilly', 'pita bread': 'pita chlieb', 'naan bread': 'naan',
  // Omáčky, pasty, konzervy
  'soy sauce': 'sójová omáčka', 'olive oil': 'olivový olej',
  'vegetable oil': 'rastlinný olej', 'sunflower oil': 'slnečnicový olej',
  'sesame oil': 'sezamový olej', 'oil': 'olej', 'vinegar': 'ocot',
  'balsamic vinegar': 'balzamikový ocot', 'red wine vinegar': 'červený vinný ocot',
  'white wine vinegar': 'biely vinný ocot', 'worcestershire sauce': 'worcestershire omáčka',
  'oyster sauce': 'ustricová omáčka', 'hoisin sauce': 'hoisin omáčka',
  'hot sauce': 'pálivá omáčka', 'tabasco': 'tabasco', 'ketchup': 'kečup',
  'mayonnaise': 'majonéza', 'mustard': 'horčica', 'dijon mustard': 'dijonská horčica',
  'honey': 'med', 'maple syrup': 'javorový sirup', 'tahini': 'tahini',
  'pesto': 'pesto', 'miso paste': 'miso pasta', 'curry paste': 'curry pasta',
  'harissa': 'harissa', 'stock': 'vývar', 'vegetable stock': 'zeleninový vývar',
  'stock cube': 'bujón', 'broth': 'vývar',
  // Koreniny & bylinky
  'salt': 'soľ', 'pepper': 'korenie', 'black pepper': 'čierne korenie',
  'white pepper': 'biele korenie', 'cumin': 'rasca', 'coriander': 'koriander',
  'paprika': 'paprika', 'smoked paprika': 'údená paprika', 'turmeric': 'kurkuma',
  'ginger': 'zázvor', 'cinnamon': 'škorica', 'nutmeg': 'muškátový oriešok',
  'cloves': 'klinčeky', 'cardamom': 'kardamón', 'star anise': 'badián',
  'bay leaves': 'bobkový list', 'bay leaf': 'bobkový list', 'thyme': 'tymian',
  'rosemary': 'rozmarín', 'oregano': 'oregano', 'basil': 'bazalka',
  'parsley': 'petržlen', 'mint': 'mäta', 'dill': 'kôpor', 'chives': 'pažítka',
  'tarragon': 'estragon', 'sage': 'šalvia', 'curry powder': 'kari',
  'garam masala': 'garam masala', 'allspice': 'nové korenie', 'chili powder': 'chili prášok',
  'cayenne pepper': 'kajenské korenie', 'dried thyme': 'sušený tymian',
  'mixed herbs': 'zmes byliniek', 'vanilla': 'vanilka', 'vanilla extract': 'vanilkový extrakt',
  // Orechy & semienka
  'almonds': 'mandle', 'cashews': 'kešu', 'walnuts': 'vlašské orechy',
  'peanuts': 'arašidy', 'pine nuts': 'pínové oriešky', 'sesame seeds': 'sezamové semienka',
  'sunflower seeds': 'slnečnicové semienka', 'pumpkin seeds': 'tekvicové semienka',
  'flaked almonds': 'mandľové lupienky', 'peanut butter': 'arašidové maslo',
  'almond flour': 'mandľová múka', 'hazelnuts': 'lieskové orechy',
  'pistachios': 'pistácie', 'macadamia': 'makadamia',
  // Sladkosti & pečenie
  'sugar': 'cukor', 'brown sugar': 'hnedý cukor', 'caster sugar': 'jemný cukor',
  'icing sugar': 'práškový cukor', 'baking powder': 'prášok do pečiva',
  'baking soda': 'jedlá sóda', 'cocoa powder': 'kakao', 'chocolate': 'čokoláda',
  'dark chocolate': 'horká čokoláda', 'white chocolate': 'biela čokoláda',
  'milk chocolate': 'mliečna čokoláda', 'condensed milk': 'kondenzované mlieko',
  'golden syrup': 'zlatý sirup', 'treacle': 'melasa',
  // Víno & ostatné tekutiny
  'red wine': 'červené víno', 'white wine': 'biele víno', 'beer': 'pivo',
  'water': 'voda', 'orange juice': 'pomarančový džús',
  'apple juice': 'jablčný džús',
}

function translateIngredient(name) {
  if (!name) return name
  const lower = name.toLowerCase().trim()
  return SK_INGREDIENTS[lower] || name
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekStart(offset = 0) {
  const d = new Date()
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - dow + 1 + offset * 7)
  d.setHours(0,0,0,0)
  return d
}

// Use local timezone to avoid UTC date shift (e.g. at 23:00 CET toISOString gives tomorrow UTC)
function toLocalDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return toLocalDateKey(d)
  })
}

function fmtDayHeader(dateStr, idx) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${SK_DAYS[idx]}, ${d.getDate()}. ${SK_MONTHS[d.getMonth()]}`
}

function todayStr() { return toLocalDateKey(new Date()) }

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

// ─── Custom recipe form ───────────────────────────────────────────────────────
const CUSTOM_FOOD_EMOJIS = ['🍽️','🥘','🍲','🥗','🍝','🍛','🍜','🥩','🍗','🐟','🥚','🥙','🌮','🫕','🥞','🍕']

function CustomRecipeForm({ onSave, onClose }) {
  const [name, setName]         = useState('')
  const [emoji, setEmoji]       = useState('🍽️')
  const [category, setCategory] = useState('Ostatné')
  const [ings, setIngs]         = useState([{ name: '', measure: '' }])

  const updateIng = (i, field, val) =>
    setIngs(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing))
  const addIng    = () => setIngs(prev => [...prev, { name: '', measure: '' }])
  const removeIng = (i) => setIngs(prev => prev.filter((_, idx) => idx !== i))

  const save = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      id:          'custom_' + Date.now(),
      name:        name.trim(),
      thumb:       null,
      emoji,
      category,
      ingredients: ings.filter(i => i.name.trim()).map(i => ({ name: i.name.trim(), measure: i.measure.trim() })),
      isCustom:    true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 overflow-y-auto" onClick={onClose}>
      <div className="flex flex-col max-w-lg mx-auto w-full min-h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-slate-700">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            <X size={18} />
          </button>
          <div className="text-base font-bold text-white">Nový vlastný recept</div>
        </div>

        <form onSubmit={save} className="flex flex-col gap-5 p-4 pb-10">
          {/* Emoji picker */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ikona</div>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_FOOD_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`text-2xl p-1.5 rounded-xl transition-all ${emoji === e ? 'bg-indigo-600 scale-110' : 'bg-slate-800'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Názov jedla</div>
            <input
              autoFocus type="text"
              placeholder="napr. Grilované kura s ryžou..."
              value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Kategória</div>
            <div className="flex flex-wrap gap-2">
              {Object.values(SK_CATEGORIES).filter((v,i,a) => a.indexOf(v) === i).map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${category === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ingrediencie</div>
            <div className="flex flex-col gap-2">
              {ings.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text" placeholder="Surovina..."
                    value={ing.name} onChange={e => updateIng(i, 'name', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text" placeholder="Množstvo"
                    value={ing.measure} onChange={e => updateIng(i, 'measure', e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {ings.length > 1 && (
                    <button type="button" onClick={() => removeIng(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addIng}
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1">
                <Plus size={14} /> Pridať ingredienciu
              </button>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors active:scale-95">
            Uložiť recept
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Recipe picker modal ──────────────────────────────────────────────────────
function RecipePicker({ onPick, onClose, savedRecipes, customRecipes, onSaveCustomRecipe }) {
  const [query, setQuery]          = useState('')
  const [results, setResults]      = useState([])
  const [loading, setLoading]      = useState(false)
  const [cat, setCat]              = useState(null)
  const [picking, setPicking]      = useState(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
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

  // Filter custom recipes by query
  const filteredCustom = query.trim()
    ? customRecipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : customRecipes

  const showList   = results.length > 0
  const showCustom = filteredCustom.length > 0
  const showSaved  = !showList && !showCustom && !loading && savedRecipes.length > 0

  return (
    <>
      {showCustomForm && (
        <CustomRecipeForm
          onSave={(recipe) => { onSaveCustomRecipe(recipe); setShowCustomForm(false) }}
          onClose={() => setShowCustomForm(false)}
        />
      )}
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" onClick={onClose}>
        <div className="flex flex-col flex-1 max-w-lg mx-auto w-full" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-5 pb-3">
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <X size={18} />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-2xl px-4 py-2.5">
              <Search size={16} className="text-slate-500 flex-shrink-0" />
              <input
                autoFocus type="text"
                placeholder="Hľadaj recept..."
                value={query} onChange={handleInput}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              {loading && <Loader size={14} className="text-slate-500 animate-spin flex-shrink-0" />}
            </div>
            <button onClick={() => setShowCustomForm(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white flex-shrink-0" title="Nový vlastný recept">
              <Plus size={18} />
            </button>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            <button onClick={() => { setCat('custom'); setQuery('') }}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${cat === 'custom' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              ⭐ Vlastné
            </button>
            {API_CATEGORIES.map(c => (
              <button key={c} onClick={() => loadCat(c)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${cat === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {SK_CATEGORIES[c]}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">

            {/* Custom recipes (own) */}
            {(showCustom || cat === 'custom') && (
              <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Vlastné recepty</div>
                {filteredCustom.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">
                    Zatiaľ žiadne vlastné recepty.<br />
                    <button onClick={() => setShowCustomForm(true)} className="text-emerald-400 font-semibold mt-1">+ Pridať recept</button>
                  </div>
                )}
                {filteredCustom.map(r => (
                  <button key={r.id} onClick={() => onPick(r)}
                    className="flex items-center gap-3 bg-slate-800 border border-emerald-800/40 rounded-2xl p-3 active:scale-95 transition-transform text-left">
                    <div className="w-14 h-14 rounded-xl bg-emerald-900/40 flex items-center justify-center text-3xl flex-shrink-0">
                      {r.emoji || '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold bg-emerald-700/60 text-emerald-300 px-1.5 py-0.5 rounded">Vlastný</span>
                        <span className="text-xs text-slate-400">{r.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {cat === 'custom' && <div className="mt-1" />}
              </>
            )}

            {/* TheMealDB results */}
            {showList && !showCustom && results.map(meal => (
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

            {/* Saved favorites */}
            {showSaved && (
              <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Naposledy použité</div>
                {savedRecipes.map(r => (
                  <button key={r.id} onClick={() => onPick(r)}
                    className="flex items-center gap-3 bg-slate-800 rounded-2xl p-3 active:scale-95 transition-transform text-left">
                    {r.thumb
                      ? <img src={r.thumb + '/preview'} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                      : <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-3xl flex-shrink-0">{r.emoji || '🍽️'}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.category}</div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {!showList && !showCustom && !showSaved && !loading && cat !== 'custom' && (
              <div className="text-center py-12 text-slate-500">
                <Search size={36} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">Zadaj názov jedla alebo vyber kategóriu</div>
                <div className="text-xs mt-2 text-slate-600">Hľadanie v angličtine (TheMealDB) alebo po slovensky vo vlastných receptoch</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({ dateStr, dayIdx, group, mealPlan, onSetMeal, onClearMeal, savedRecipes, customRecipes, onSaveCustomRecipe, today }) {
  const [picking, setPicking] = useState(null)
  const [confirmClear, setConfirmClear] = useState(null) // slot id pending delete
  const dayPlan = mealPlan[dateStr]?.[group] || {}
  const filledCount = MEAL_SLOTS.filter(s => dayPlan[s.id]).length
  const isToday = dateStr === today

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden ${isToday ? 'border-indigo-200 dark:border-indigo-700' : 'border-slate-100 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {isToday && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
          <div>
            <div className={`text-sm font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {fmtDayHeader(dateStr, dayIdx)}
              {isToday && <span className="ml-2 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">Dnes</span>}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {filledCount === 0 ? 'Nič naplánované' : `${filledCount} z 5 jedál`}
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
        {MEAL_SLOTS.map(slot => {
          const meal = dayPlan[slot.id]
          return (
            <div key={slot.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-lg flex-shrink-0 w-7 text-center">{slot.emoji}</span>
              <span className="text-xs font-semibold text-slate-400 w-16 flex-shrink-0">{slot.label}</span>
              {meal ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {meal.thumb
                    ? <img src={meal.thumb + '/preview'} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    : <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-base flex-shrink-0">{meal.emoji || '🍽️'}</span>
                  }
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0 break-words leading-tight">{meal.name}</span>
                  {confirmClear === slot.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      <button onClick={() => { onClearMeal(dateStr, group, slot.id); setConfirmClear(null) }} className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-lg">Zmazať</button>
                      <button onClick={() => setConfirmClear(null)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={13} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmClear(slot.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 ml-1">
                      <Trash2 size={16} />
                    </button>
                  )}
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

      {picking && (
        <RecipePicker
          savedRecipes={savedRecipes}
          customRecipes={customRecipes}
          onSaveCustomRecipe={onSaveCustomRecipe}
          onPick={meal => { onSetMeal(dateStr, group, picking, meal); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

// ─── Main MealPlan component ──────────────────────────────────────────────────
export default function MealPlan() {
  const [mealPlan, setMealPlan]         = useSyncedStorage('meal-plan', {})
  const [shopping, setShopping]         = useSyncedStorage('shopping', [])
  const [savedRecipes, setSaved]        = useSyncedStorage('saved-recipes', [])
  const [customRecipes, setCustomRecipes] = useSyncedStorage('custom-recipes', [])
  const [weekOffset, setWeekOffset]     = useState(0)   // 0 = this week, 1 = next week
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
    // Auto-save to recents if not already there (skip custom — those are in customRecipes)
    if (!meal.isCustom) {
      setSaved(prev => prev.some(r => r.id === meal.id) ? prev : [meal, ...prev].slice(0, 50))
    }
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
        name: translateIngredient(i.name) + (i.measures.length ? ` (${[...new Set(i.measures)].join(', ')})` : ''),
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
          customRecipes={customRecipes}
          onSaveCustomRecipe={recipe => setCustomRecipes(prev => [recipe, ...prev])}
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
