import { useState } from 'react'
import { Plus, Trash2, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHistory } from '../hooks/useHistory'

const METERS = [
  { id: 'electricity', label: 'Elektrina',  icon: '⚡', unit: 'kWh', color: 'amber'  },
  { id: 'water',       label: 'Voda',       icon: '💧', unit: 'm³',  color: 'cyan'   },
  { id: 'gas',         label: 'Plyn',       icon: '🔥', unit: 'm³',  color: 'orange' },
  { id: 'heat',        label: 'Teplo',      icon: '🌡️', unit: 'GJ',  color: 'red'    },
]

const METER_COLORS = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-200 dark:border-amber-800',   text: 'text-amber-700 dark:text-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600' },
  cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-900/30',     border: 'border-cyan-200 dark:border-cyan-800',     text: 'text-cyan-700 dark:text-cyan-400',    btn: 'bg-cyan-500 hover:bg-cyan-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', btn: 'bg-orange-500 hover:bg-orange-600' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/30',       border: 'border-red-200 dark:border-red-800',       text: 'text-red-700 dark:text-red-400',      btn: 'bg-red-500 hover:bg-red-600' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return new Date(dateStr).toLocaleDateString() }
}

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default function Energy() {
  const [readings, setReadings] = useLocalStorage('energy-readings', {})
  const { addEvent } = useHistory()

  const [showForm, setShowForm] = useState(null) // meterId
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [cost, setCost] = useState('')
  const [showHistory, setShowHistory] = useState(null) // meterId

  const getMeterReadings = (meterId) => (readings[meterId] || []).sort((a, b) => new Date(b.date) - new Date(a.date))

  const addReading = (e) => {
    e.preventDefault()
    if (!value) return
    const meter = METERS.find(m => m.id === showForm)
    const newReading = { id: Date.now(), date, value: parseFloat(value), cost: cost ? parseFloat(cost) : null }
    setReadings(prev => ({ ...prev, [showForm]: [...(prev[showForm] || []), newReading] }))
    addEvent('energy', meter?.icon || '⚡', 'Zápis', meter?.label || '')
    setValue(''); setDate(new Date().toISOString().slice(0, 10)); setCost('')
    setShowForm(null)
  }

  const deleteReading = (meterId, readingId) => {
    setReadings(prev => ({ ...prev, [meterId]: (prev[meterId] || []).filter(r => r.id !== readingId) }))
  }

  const totalCost = Object.values(readings).flat().reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Total cost */}
      {totalCost > 0 && (
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 text-white">
          <div className="text-xs text-slate-400 mb-1">Celkové náklady (zaznamenaných)</div>
          <div className="text-3xl font-bold">{totalCost.toFixed(2)} €</div>
        </div>
      )}

      {/* Meter cards */}
      {METERS.map(meter => {
        const meterReadings = getMeterReadings(meter.id)
        const latest = meterReadings[0]
        const prev = meterReadings[1]
        const diff = latest && prev ? (latest.value - prev.value).toFixed(1) : null
        const daysSince = latest ? getDaysSince(latest.date) : null
        const c = METER_COLORS[meter.color]
        const isHistoryOpen = showHistory === meter.id

        return (
          <div key={meter.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${c.border} shadow-sm overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl p-2 rounded-xl ${c.bg}`}>{meter.icon}</div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{meter.label}</div>
                    {latest ? (
                      <div className="text-xs text-slate-400 mt-0.5">
                        Posledný: {formatDate(latest.date)}
                        {daysSince !== null && ` (${daysSince}d)`}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-0.5">Žiadne záznamy</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {latest && (
                    <>
                      <div className={`text-xl font-bold ${c.text}`}>{latest.value} <span className="text-sm font-normal text-slate-400">{meter.unit}</span></div>
                      {diff !== null && (
                        <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
                          {parseFloat(diff) > 0 ? <TrendingUp size={11} className="text-red-500" /> :
                           parseFloat(diff) < 0 ? <TrendingDown size={11} className="text-emerald-500" /> :
                           <Minus size={11} className="text-slate-400" />}
                          <span className={parseFloat(diff) > 0 ? 'text-red-500' : parseFloat(diff) < 0 ? 'text-emerald-500' : 'text-slate-400'}>
                            {parseFloat(diff) > 0 ? '+' : ''}{diff} {meter.unit}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {latest?.cost && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Cena: <span className="font-semibold">{latest.cost.toFixed(2)} €</span>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowForm(meter.id); setValue(''); setCost('') }}
                  className={`flex-1 ${c.btn} text-white text-sm font-semibold py-2 rounded-xl transition-colors active:scale-95`}
                >
                  + Zápis
                </button>
                {meterReadings.length > 0 && (
                  <button
                    onClick={() => setShowHistory(isHistoryOpen ? null : meter.id)}
                    className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    História ({meterReadings.length})
                  </button>
                )}
              </div>
            </div>

            {/* Reading history */}
            {isHistoryOpen && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {meterReadings.slice(0, 10).map((r, idx) => {
                  const prevR = meterReadings[idx + 1]
                  const usage = prevR ? (r.value - prevR.value).toFixed(1) : null
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.value} {meter.unit}</div>
                        <div className="text-xs text-slate-400">{formatDate(r.date)}{usage !== null ? ` · Spotreba: ${usage} ${meter.unit}` : ''}</div>
                        {r.cost && <div className="text-xs text-slate-500">{r.cost.toFixed(2)} €</div>}
                      </div>
                      <button onClick={() => deleteReading(meter.id, r.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Add reading form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowForm(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Nový zápis — {METERS.find(m => m.id === showForm)?.label}
              </h3>
              <button onClick={() => setShowForm(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addReading} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Stav merača ({METERS.find(m => m.id === showForm)?.unit})
                </label>
                <input autoFocus type="number" step="0.01" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Dátum</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Suma (€, voliteľné)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
                Uložiť zápis
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
