import { useState } from 'react'
import { CheckCircle2, Plus, Trash2, Clock, AlertCircle, CheckCheck, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_TASKS = [
  { id: 1, name: 'Odvápnenie kávovaru', intervalDays: 30, lastDone: null },
  { id: 2, name: 'Čistenie filtra digestora', intervalDays: 90, lastDone: null },
  { id: 3, name: 'Umytie okien', intervalDays: 60, lastDone: null },
]

function getDaysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getStatus(task) {
  const days = getDaysSince(task.lastDone)
  if (days === null) return 'pending'
  const remaining = task.intervalDays - days
  if (remaining <= 0) return 'overdue'
  if (remaining <= Math.ceil(task.intervalDays * 0.2)) return 'soon'
  return 'ok'
}

const STATUS_CONFIG = {
  pending: {
    label: 'Čaká',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  ok: {
    label: 'V poriadku',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  soon: {
    label: 'Čoskoro',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  overdue: {
    label: 'Oneskorene',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
}

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage('tasks', DEFAULT_TASKS)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [interval, setInterval] = useState('30')

  const markDone = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, lastDone: new Date().toISOString() } : t))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const addTask = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const newTask = {
      id: Date.now(),
      name: name.trim(),
      intervalDays: parseInt(interval) || 30,
      lastDone: null,
    }
    setTasks([...tasks, newTask])
    setName('')
    setInterval('30')
    setShowForm(false)
  }

  const sorted = [...tasks].sort((a, b) => {
    const order = { overdue: 0, pending: 1, soon: 2, ok: 3 }
    return order[getStatus(a)] - order[getStatus(b)]
  })

  const overdueCount = tasks.filter(t => getStatus(t) === 'overdue').length
  const pendingCount = tasks.filter(t => getStatus(t) === 'pending').length

  return (
    <div className="flex flex-col gap-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{tasks.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Celkom úloh</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-red-100 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{overdueCount + pendingCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Na splnenie</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-emerald-100 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">
            {tasks.filter(t => getStatus(t) === 'ok').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Hotové</div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {sorted.map(task => {
          const status = getStatus(task)
          const cfg = STATUS_CONFIG[status]
          const days = getDaysSince(task.lastDone)

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm leading-tight">{task.name}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {status === 'overdue' && <AlertCircle size={10} />}
                          {status === 'ok' && <CheckCheck size={10} />}
                          {status === 'soon' && <Clock size={10} />}
                          {cfg.label}
                        </span>
                        {days !== null ? (
                          <span className="text-xs text-slate-400">
                            pred {days} {days === 1 ? 'dňom' : 'dňami'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Ešte nesplnené</span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-slate-400">
                        Opakovať každých {task.intervalDays}{' '}
                        {task.intervalDays === 1 ? 'deň' : task.intervalDays < 5 ? 'dni' : 'dní'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress bar */}
                {days !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'overdue' ? 'bg-red-400' :
                          status === 'soon' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min((days / task.intervalDays) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">0</span>
                      <span className="text-xs text-slate-400">{task.intervalDays} dní</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => markDone(task.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <CheckCircle2 size={16} />
                  Hotovo
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add task form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Nová úloha</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Názov úlohy..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 whitespace-nowrap">Každých</label>
              <input
                type="number"
                min="1"
                max="365"
                value={interval}
                onChange={e => setInterval(e.target.value)}
                className="w-20 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <label className="text-sm text-slate-600">dní</label>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Pridať úlohu
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
