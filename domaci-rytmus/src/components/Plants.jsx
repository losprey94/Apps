import { useState } from 'react'
import { Droplets, Plus, Trash2, Leaf, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_PLANTS = [
  { id: 1, name: 'Monstera', emoji: '🌿', intervalDays: 7, lastWatered: null, location: 'Obývačka' },
  { id: 2, name: 'Kaktus', emoji: '🌵', intervalDays: 21, lastWatered: null, location: 'Kuchyňa' },
  { id: 3, name: 'Orchidea', emoji: '🌸', intervalDays: 14, lastWatered: null, location: 'Spálňa' },
]

const PLANT_EMOJIS = ['🌿', '🌵', '🌸', '🌺', '🍀', '🌱', '🪴', '🌻', '🌹', '🪷', '🌾', '🍃']

function getDaysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getWaterStatus(plant) {
  const days = getDaysSince(plant.lastWatered)
  if (days === null) return 'thirsty'
  const remaining = plant.intervalDays - days
  if (remaining <= 0) return 'thirsty'
  if (remaining <= 1) return 'soon'
  return 'ok'
}

const STATUS = {
  thirsty: { label: 'Smädná', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', barColor: 'bg-red-400' },
  soon: { label: 'Čoskoro', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', barColor: 'bg-amber-400' },
  ok: { label: 'Napojená', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', barColor: 'bg-cyan-400' },
}

export default function Plants() {
  const [plants, setPlants] = useLocalStorage('plants', DEFAULT_PLANTS)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🪴')
  const [interval, setInterval] = useState('7')
  const [location, setLocation] = useState('')

  const water = (id) => {
    setPlants(plants.map(p => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p))
  }

  const deletePlant = (id) => {
    setPlants(plants.filter(p => p.id !== id))
  }

  const addPlant = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setPlants([...plants, {
      id: Date.now(),
      name: name.trim(),
      emoji,
      intervalDays: parseInt(interval) || 7,
      lastWatered: null,
      location: location.trim(),
    }])
    setName('')
    setEmoji('🪴')
    setInterval('7')
    setLocation('')
    setShowForm(false)
  }

  const thirstyCount = plants.filter(p => getWaterStatus(p) === 'thirsty').length

  const sorted = [...plants].sort((a, b) => {
    const order = { thirsty: 0, soon: 1, ok: 2 }
    return order[getWaterStatus(a)] - order[getWaterStatus(b)]
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Banner */}
      {thirstyCount > 0 && (
        <div className="bg-cyan-600 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Droplets size={22} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">
              {thirstyCount} {thirstyCount === 1 ? 'rastlina potrebuje' : thirstyCount < 5 ? 'rastliny potrebujú' : 'rastlín potrebuje'} vodu
            </div>
            <div className="text-cyan-100 text-xs mt-0.5">Nezabúdaj na ne!</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{plants.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Rastlín</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-red-100 shadow-sm">
          <div className="text-2xl font-bold text-red-500">{thirstyCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Smädné</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-cyan-100 shadow-sm">
          <div className="text-2xl font-bold text-cyan-600">
            {plants.filter(p => getWaterStatus(p) === 'ok').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Napojené</div>
        </div>
      </div>

      {/* Plant list */}
      <div className="grid grid-cols-1 gap-3">
        {sorted.map(plant => {
          const status = getWaterStatus(plant)
          const cfg = STATUS[status]
          const days = getDaysSince(plant.lastWatered)
          const daysUntil = days !== null ? plant.intervalDays - days : null

          return (
            <div key={plant.id} className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl leading-none mt-0.5">{plant.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{plant.name}</div>
                        {plant.location && (
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Leaf size={10} />
                            {plant.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <button onClick={() => deletePlant(plant.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {days === null
                        ? 'Ešte nezaliata'
                        : daysUntil !== null && daysUntil > 0
                          ? `Ďalšie polievanie o ${daysUntil} ${daysUntil === 1 ? 'deň' : daysUntil < 5 ? 'dni' : 'dní'}`
                          : `Oneskorené o ${Math.abs(daysUntil || 0)} dní`
                      }
                    </div>

                    {days !== null && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${cfg.barColor}`}
                            style={{ width: `${Math.min((days / plant.intervalDays) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => water(plant.id)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    status === 'thirsty'
                      ? 'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700'
                      : 'bg-slate-200 hover:bg-slate-300 !text-slate-600'
                  }`}
                >
                  <Droplets size={16} />
                  {status === 'thirsty' ? 'Zaliať teraz' : 'Zaliať'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add plant form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cyan-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Nová rastlina</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={addPlant} className="flex flex-col gap-3">
            {/* Emoji picker */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Ikona</label>
              <div className="flex flex-wrap gap-2">
                {PLANT_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-cyan-100 ring-2 ring-cyan-400 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Názov rastliny..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              autoFocus
            />
            <input
              type="text"
              placeholder="Umiestnenie (voliteľné)..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 whitespace-nowrap">Polievať každých</label>
              <input
                type="number"
                min="1"
                max="90"
                value={interval}
                onChange={e => setInterval(e.target.value)}
                className="w-16 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
              <label className="text-sm text-slate-600">dní</label>
            </div>
            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Pridať rastlinu
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
