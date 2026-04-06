import { useState } from 'react'
import { Trash2, Filter } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const SECTION_CONFIG = {
  tasks:    { label: 'Úlohy',     bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-600 dark:text-indigo-400' },
  plants:   { label: 'Rastliny', bg: 'bg-cyan-100 dark:bg-cyan-900/40',    text: 'text-cyan-600 dark:text-cyan-400' },
  shopping: { label: 'Nákup',    bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400' },
  pets:     { label: 'Zvieratá', bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-600 dark:text-amber-400' },
  energy:   { label: 'Energie',  bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' },
  family:   { label: 'Rodina',   bg: 'bg-rose-100 dark:bg-rose-900/40',    text: 'text-rose-600 dark:text-rose-400' },
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Práve teraz'
  if (mins < 60) return `pred ${mins} min`
  if (hours < 24) return `pred ${hours} hod`
  if (days === 1) return 'Včera'
  if (days < 7) return `pred ${days} dňami`
  try { return new Date(dateStr).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }) }
  catch { return new Date(dateStr).toLocaleDateString() }
}

function groupByDay(events) {
  const groups = {}
  events.forEach(evt => {
    const d = new Date(evt.date)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let key
    if (d.toDateString() === today.toDateString()) key = 'Dnes'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Včera'
    else {
      try { key = d.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' }) }
      catch { key = d.toLocaleDateString() }
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(evt)
  })
  return groups
}

export default function History() {
  const [history, setHistory] = useLocalStorage('activity-history', [])
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? history : history.filter(e => e.section === filter)
  const grouped = groupByDay(filtered)
  const sections = [...new Set(history.map(e => e.section))]

  const clearHistory = () => setHistory([])

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{history.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Celkom akcií</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {history.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Dnes</div>
        </div>
      </div>

      {/* Filter */}
      {sections.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilter('all')}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filter === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
            <Filter size={11} /> Všetko
          </button>
          {sections.map(s => {
            const cfg = SECTION_CONFIG[s]
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filter === s ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                {cfg?.label || s}
              </button>
            )
          })}
        </div>
      )}

      {/* Timeline */}
      {Object.entries(grouped).map(([day, events]) => (
        <div key={day}>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1 mb-2">{day}</div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {events.map((evt, idx) => {
              const cfg = SECTION_CONFIG[evt.section]
              return (
                <div key={evt.id} className={`flex items-center gap-3 px-4 py-3 ${idx < events.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cfg?.bg || 'bg-slate-100 dark:bg-slate-700'}`}>
                    {evt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{evt.itemName}</span>
                      <span className="text-slate-400"> — {evt.action}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg?.bg || 'bg-slate-100'} ${cfg?.text || 'text-slate-500'}`}>
                        {cfg?.label || evt.section}
                      </span>
                      <span className="text-xs text-slate-400">{formatRelative(evt.date)}</span>
                    </div>
                  </div>
                  {evt.member && (
                    <span className="text-sm flex-shrink-0">{evt.member}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {history.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <div className="text-5xl mb-3">📋</div>
          <div className="font-medium">Zatiaľ žiadna aktivita</div>
          <div className="text-sm mt-1">Tu sa zobrazí všetko, čo robíš v appke</div>
        </div>
      )}

      {history.length > 0 && (
        <button onClick={clearHistory}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors text-center py-2">
          Vymazať históriu
        </button>
      )}
    </div>
  )
}
