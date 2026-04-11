import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, UtensilsCrossed, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DAYS = [
  { id: 'mon', label: 'Pondelok' },
  { id: 'tue', label: 'Utorok' },
  { id: 'wed', label: 'Streda' },
  { id: 'thu', label: 'Štvrtok' },
  { id: 'fri', label: 'Piatok' },
  { id: 'sat', label: 'Sobota' },
  { id: 'sun', label: 'Nedeľa' },
]

const DEFAULT_MEALS = Object.fromEntries(DAYS.map(d => [d.id, []]))

// All days open by default
const DEFAULT_EXPANDED = Object.fromEntries(DAYS.map(d => [d.id, true]))

const MEAL_TYPES = ['Raňajky', 'Obed', 'Večera', 'Desiata', 'Olovrant']

export default function MealPlan() {
  const [meals, setMeals] = useLocalStorage('mealplan', DEFAULT_MEALS)
  const [expanded, setExpanded] = useLocalStorage('mealplan-expanded', DEFAULT_EXPANDED)
  const [activeDay, setActiveDay] = useState(null)
  const [input, setInput] = useState('')
  const [mealType, setMealType] = useState('Obed')

  const toggleDay = (dayId) => {
    setExpanded(prev => ({ ...prev, [dayId]: !prev[dayId] }))
  }

  const openForm = (dayId) => {
    setActiveDay(dayId)
    setInput('')
    setMealType('Obed')
  }

  const closeForm = () => {
    setActiveDay(null)
    setInput('')
  }

  const addMeal = (e) => {
    e.preventDefault()
    if (!input.trim() || !activeDay) return
    const newItem = { id: Date.now(), type: mealType, name: input.trim() }
    setMeals(prev => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), newItem],
    }))
    setInput('')
  }

  const deleteMeal = (dayId, itemId) => {
    setMeals(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter(i => i.id !== itemId),
    }))
  }

  const totalMeals = Object.values(meals).reduce((sum, items) => sum + items.length, 0)

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div className="bg-orange-100 rounded-xl p-2">
          <UtensilsCrossed size={20} className="text-orange-600" />
        </div>
        <div>
          <div className="font-semibold text-slate-800">Jedálniček na týždeň</div>
          <div className="text-xs text-slate-400">{totalMeals} {totalMeals === 1 ? 'jedlo' : totalMeals < 5 ? 'jedlá' : 'jedál'} naplánovaných</div>
        </div>
      </div>

      {/* Days */}
      {DAYS.map(day => {
        const dayMeals = meals[day.id] || []
        const isOpen = expanded[day.id] !== false
        const isFormOpen = activeDay === day.id

        return (
          <div key={day.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Day header */}
            <button
              onClick={() => toggleDay(day.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-slate-800 text-sm">{day.label}</span>
                {dayMeals.length > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {dayMeals.length}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronDown size={16} className="text-slate-400" />
                : <ChevronRight size={16} className="text-slate-400" />
              }
            </button>

            {/* Day content */}
            {isOpen && (
              <div className="border-t border-slate-100">
                {/* Meal items */}
                {dayMeals.length === 0 && !isFormOpen && (
                  <div className="px-4 py-3 text-sm text-slate-400">Žiadne jedlá</div>
                )}

                {dayMeals.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${idx < dayMeals.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700 font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.type}</div>
                    </div>
                    <button
                      onClick={() => deleteMeal(day.id, item.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Add form */}
                {isFormOpen ? (
                  <div className="p-4 border-t border-slate-100 bg-orange-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Pridať jedlo</span>
                      <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                      </button>
                    </div>
                    {/* Meal type selector */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {MEAL_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMealType(type)}
                          className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition-all ${
                            mealType === type
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={addMeal} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Názov jedla..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <button
                    onClick={() => openForm(day.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors border-t border-slate-50"
                  >
                    <Plus size={14} />
                    Pridať jedlo
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
