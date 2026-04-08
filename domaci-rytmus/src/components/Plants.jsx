import { useState } from 'react'
import { Droplets, Plus, Trash2, Leaf, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage } from '../context/SyncContext'
import { useHistory } from '../hooks/useHistory'
import { useHaptic } from '../hooks/useHaptic'
import { useNotif } from '../context/NotifContext'

const DEFAULT_PLANTS = [
  { id: 1, name: 'Monstera', emoji: '🌿', intervalDays: 7, lastWatered: null, location: 'Obývačka' },
  { id: 2, name: 'Kaktus', emoji: '🌵', intervalDays: 21, lastWatered: null, location: 'Kuchyňa' },
  { id: 3, name: 'Orchidea', emoji: '🌸', intervalDays: 14, lastWatered: null, location: 'Spálňa' },
]

const PLANT_EMOJIS = ['🌿', '🌵', '🌸', '🌺', '🍀', '🌱', '🪴', '🌻', '🌹', '🪷', '🌾', '🍃']

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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
  thirsty: { label: 'Smädná', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800', barColor: 'bg-red-400' },
  soon:    { label: 'Čoskoro', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', barColor: 'bg-amber-400' },
  ok:      { label: 'Napojená', bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', barColor: 'bg-cyan-400' },
}

export default function Plants() {
  const [plants, setPlants] = useSyncedStorage('plants', DEFAULT_PLANTS)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🪴')
  const [interval, setInterval] = useState('7')
  const [location, setLocation] = useState('')
  const [justWatered, setJustWatered] = useState(null)
  const { addEvent } = useHistory()
  const { pushNotif } = useNotif()
  const haptic = useHaptic()

  const water = (id) => {
    const plant = plants.find(p => p.id === id)
    setPlants(plants.map(p => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p))
    if (plant) {
      addEvent('plants', plant.emoji, 'Zaliata', plant.name)
      pushNotif(plant.emoji, 'Zaliata', plant.name)
    }
    haptic.success()
    setJustWatered(id)
    setTimeout(() => setJustWatered(null), 1200)
  }

  const deletePlant = (id) => { haptic.tap(); setPlants(plants.filter(p => p.id !== id)) }

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
    haptic.done()
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
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Banner */}
      {thirstyCount > 0 && (
        <div className="bg-cyan-600 dark:bg-cyan-700 rounded-2xl p-4 flex items-center gap-3">
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{plants.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rastlín</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-red-100 dark:border-red-900/50 shadow-sm">
          <div className="text-2xl font-bold text-red-500">{thirstyCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Smädné</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-cyan-100 dark:border-cyan-900/50 shadow-sm">
          <div className="text-2xl font-bold text-cyan-600">
            {plants.filter(p => getWaterStatus(p) === 'ok').length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Napojené</div>
        </div>
      </div>

      {/* Plant list */}
      <div className="flex flex-col gap-3">
        {sorted.map(plant => {
          const status = getWaterStatus(plant)
          const cfg = STATUS[status]
          const days = getDaysSince(plant.lastWatered)
          const daysUntil = days !== null ? plant.intervalDays - days : null
          const isWatered = justWatered === plant.id

          return (
            <div key={plant.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${cfg.border} shadow-sm overflow-hidden ${isWatered ? 'animate-pop' : 'animate-fade-in'}`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl leading-none mt-0.5">{plant.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{plant.name}</div>
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

                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {days === null
                        ? 'Ešte nezaliata'
                        : daysUntil !== null && daysUntil > 0
                          ? `Ďalšie polievanie o ${daysUntil} ${daysUntil === 1 ? 'deň' : 'dní'}`
                          : `Oneskorené o ${Math.abs(daysUntil || 0)} dní`
                      }
                    </div>

                    {days !== null && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`}
                            style={{ width: `${Math.min((days / plant.intervalDays) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => water(plant.id)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95 ${
                    isWatered
                      ? 'bg-emerald-500 text-white'
                      : status === 'thirsty'
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Droplets size={16} />
                  {isWatered ? 'Zaliata ✓' : status === 'thirsty' ? 'Zaliať teraz' : 'Zaliať'}
                </button>
              </div>
            </div>
          )
        })}

        {plants.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <span className="text-5xl block mb-3">🪴</span>
            <div className="font-medium">Žiadne rastliny</div>
            <div className="text-sm mt-1">Pridaj prvú rastlinu tlačidlom +</div>
          </div>
        )}
      </div>

      {/* Add plant form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-cyan-200 dark:border-cyan-800 shadow-sm p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Nová rastlina</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={addPlant} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Ikona</label>
              <div className="flex flex-wrap gap-2">
                {PLANT_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-cyan-100 dark:bg-cyan-900/50 ring-2 ring-cyan-400 scale-110' : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100'}`}
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
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              autoFocus
            />
            <input
              type="text"
              placeholder="Umiestnenie (voliteľné)..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Polievať každých</label>
              <input
                type="number"
                min="1"
                max="90"
                value={interval}
                onChange={e => setInterval(e.target.value)}
                className="w-16 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
              <label className="text-sm text-slate-600 dark:text-slate-400">dní</label>
            </div>
            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
              Pridať rastlinu
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white rounded-full shadow-lg shadow-cyan-200 dark:shadow-cyan-900 flex items-center justify-center transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
