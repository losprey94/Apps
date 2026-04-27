import { useState } from 'react'
import { Plus, Trash2, Check, ShoppingCart, X, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CATEGORIES = [
  { id: 'zelenina', label: 'Zelenina & Ovocie', emoji: '🥦' },
  { id: 'mliecne', label: 'Mliečne výrobky', emoji: '🥛' },
  { id: 'pecivo', label: 'Pečivo', emoji: '🍞' },
  { id: 'maso', label: 'Mäso & Ryby', emoji: '🥩' },
  { id: 'napoje', label: 'Nápoje', emoji: '🥤' },
  { id: 'domacnost', label: 'Domácnosť', emoji: '🧹' },
  { id: 'ostatne', label: 'Ostatné', emoji: '🛒' },
]

const SUGGESTIONS = {
  zelenina: ['Jablká', 'Banány', 'Paradajky', 'Šalát', 'Mrkva', 'Cibuľa', 'Cesnak', 'Papriky', 'Uhorky', 'Zemiaky'],
  mliecne: ['Mlieko', 'Maslo', 'Syr', 'Jogurt', 'Smotana', 'Tvaroh', 'Vajcia'],
  pecivo: ['Chlieb', 'Rožky', 'Toastový chlieb', 'Bageta'],
  maso: ['Kuracie prsia', 'Bravčový bôčik', 'Mleté mäso', 'Losos', 'Klobása'],
  napoje: ['Voda', 'Džús', 'Káva', 'Čaj', 'Pivo', 'Limonáda'],
  domacnost: ['Toilet paper', 'Prací prášok', 'Jar', 'Sáčky na odpadky', 'Utierky'],
  ostatne: [],
}

export default function Shopping() {
  const [items, setItems] = useLocalStorage('shopping', [])
  const [input, setInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ostatne')
  const [quantity, setQuantity] = useState('1')
  const [showForm, setShowForm] = useState(false)
  const [expandedCategories, setExpandedCategories] = useLocalStorage('shopping-expanded', {})
  const [showDone, setShowDone] = useLocalStorage('shopping-show-done', true)
  const [priceQuery, setPriceQuery] = useState('')

  const toggleItem = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id))
  }

  const clearDone = () => {
    setItems(items.filter(i => !i.done))
  }

  const addItem = (name, cat = selectedCategory, qty = quantity) => {
    if (!name.trim()) return
    const nextId = items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1
    setItems([...items, {
      id: nextId,
      name: name.trim(),
      category: cat,
      quantity: parseInt(qty) || 1,
      done: false,
    }])
    setInput('')
    setQuantity('1')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    addItem(input)
    setShowForm(false)
  }

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const pendingItems = items.filter(i => !i.done)
  const doneItems = items.filter(i => i.done)

  const groupedPending = CATEGORIES.map(cat => ({
    ...cat,
    items: pendingItems.filter(i => i.category === cat.id),
  })).filter(cat => cat.items.length > 0)

  const suggestions = (SUGGESTIONS[selectedCategory] || []).filter(
    s => !items.some(i => i.name.toLowerCase() === s.toLowerCase())
  )

  const openPriceCompare = () => {
    const url = new URL('price-compare.html', window.location.href)
    if (priceQuery.trim()) {
      url.searchParams.set('q', priceQuery.trim())
    }
    window.location.assign(url.toString())
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 rounded-xl p-2">
              <ShoppingCart size={20} className="text-violet-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">
                {pendingItems.length} položiek
              </div>
              <div className="text-xs text-slate-400">
                {doneItems.length} hotových
              </div>
            </div>
          </div>
          {doneItems.length > 0 && (
            <button
              onClick={clearDone}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors border border-slate-200 hover:border-red-200 rounded-xl px-3 py-1.5"
            >
              Vymazať hotové
            </button>
          )}
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${(doneItems.length / items.length) * 100}%` }}
              />
            </div>
            <div className="text-right mt-1 text-xs text-slate-400">
              {Math.round((doneItems.length / items.length) * 100)}% hotovo
            </div>
          </div>
        )}
      </div>

      {/* Price comparison quick action */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-800 mb-2">Porovnanie cien</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Produkt na porovnanie (napr. mlieko)"
            value={priceQuery}
            onChange={e => setPriceQuery(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
          <button
            type="button"
            onClick={openPriceCompare}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors"
          >
            <Search size={15} />
            Porovnať
          </button>
        </div>
      </div>

      {/* Grouped pending items */}
      {groupedPending.length > 0 && (
        <div className="flex flex-col gap-2">
          {groupedPending.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-semibold text-slate-700 text-sm">{cat.label}</span>
                  <span className="bg-violet-100 text-violet-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {cat.items.length}
                  </span>
                </div>
                {expandedCategories[cat.id] === false
                  ? <ChevronRight size={16} className="text-slate-400" />
                  : <ChevronDown size={16} className="text-slate-400" />
                }
              </button>

              {expandedCategories[cat.id] !== false && (
                <div className="border-t border-slate-100">
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 ${idx < cat.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-violet-400 flex-shrink-0 flex items-center justify-center transition-colors"
                      />
                      <span className="flex-1 text-sm text-slate-700">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-400 font-medium">×{item.quantity}</span>
                      )}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Done items */}
      {doneItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-emerald-500" />
              <span className="font-semibold text-slate-500 text-sm">Hotové</span>
              <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {doneItems.length}
              </span>
            </div>
            {showDone ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </button>
          {showDone && (
            <div className="border-t border-slate-100">
              {doneItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 ${idx < doneItems.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center transition-colors"
                  >
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </button>
                  <span className="flex-1 text-sm text-slate-400 line-through">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-slate-300 font-medium">×{item.quantity}</span>
                  )}
                  <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-400 transition-colors ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <div className="font-medium">Zoznam je prázdny</div>
          <div className="text-sm mt-1">Pridaj prvú položku</div>
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Pridať položku</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Kategória</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-violet-100 text-violet-700 border-violet-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Názov položky..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                autoFocus
              />
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Ks"
                className="w-16 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1.5">Návrhy:</div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 6).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { addItem(s); }}
                      className="text-xs bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-violet-300 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Pridať do zoznamu
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
