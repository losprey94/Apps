import { useState } from 'react'
import { CheckCircle2, Plus, Trash2, Clock, AlertCircle, CheckCheck, X, ChevronDown } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHistory } from '../hooks/useHistory'

const DEFAULT_TASKS = [
  { id: 1, name: 'Odvápnenie kávovaru', intervalDays: 30, lastDone: null },
  { id: 2, name: 'Čistenie filtra digestora', intervalDays: 90, lastDone: null },
  { id: 3, name: 'Umytie okien', intervalDays: 60, lastDone: null },
]

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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
  pending: { label: 'Čaká',       bg: 'bg-slate-100 dark:bg-slate-700',         text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
  ok:      { label: 'V poriadku', bg: 'bg-emerald-50 dark:bg-emerald-900/30',   text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  soon:    { label: 'Čoskoro',    bg: 'bg-amber-50 dark:bg-amber-900/30',       text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  overdue: { label: 'Oneskorené', bg: 'bg-red-50 dark:bg-red-900/30',           text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
}

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage('tasks', DEFAULT_TASKS)
  const [members] = useLocalStorage('family-members', [])
  const { addEvent } = useHistory()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [interval, setInterval] = useState('30')
  const [assignedTo, setAssignedTo] = useState('')
  const [justDone, setJustDone] = useState(null)
  const [filterMember, setFilterMember] = useState('all')

  const markDone = (id) => {
    const task = tasks.find(t => t.id === id)
    setTasks(tasks.map(t => t.id === id ? { ...t, lastDone: new Date().toISOString() } : t))
    if (task) addEvent('tasks', '✅', 'Hotovo', task.name)
    setJustDone(id)
    setTimeout(() => setJustDone(null), 1200)
  }

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id))

  const addTask = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setTasks([...tasks, { id: Date.now(), name: name.trim(), intervalDays: parseInt(interval) || 30, lastDone: null, assignedTo: assignedTo || null }])
    setName(''); setInterval('30'); setAssignedTo('')
    setShowForm(false)
  }

  const filtered = filterMember === 'all' ? tasks : tasks.filter(t => t.assignedTo === filterMember || (!t.assignedTo && filterMember === 'unassigned'))

  const sorted = [...filtered].sort((a, b) => {
    const order = { overdue: 0, pending: 1, soon: 2, ok: 3 }
    return order[getStatus(a)] - order[getStatus(b)]
  })

  const overdueCount = tasks.filter(t => getStatus(t) === 'overdue').length
  const pendingCount = tasks.filter(t => getStatus(t) === 'pending').length

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{tasks.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Celkom</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-red-100 dark:border-red-900/50 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{overdueCount + pendingCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Na splnenie</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{tasks.filter(t => getStatus(t) === 'ok').length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hotové</div>
        </div>
      </div>

      {/* Member filter */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterMember('all')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filterMember === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
            Všetky
          </button>
          {members.map(m => (
            <button key={m.id} onClick={() => setFilterMember(m.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filterMember === m.id ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
              <span>{m.emoji}</span>{m.name}
            </button>
          ))}
        </div>
      )}

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {sorted.map(task => {
          const status = getStatus(task)
          const cfg = STATUS_CONFIG[status]
          const days = getDaysSince(task.lastDone)
          const isDone = justDone === task.id
          const assignee = members.find(m => m.id === task.assignedTo)

          return (
            <div key={task.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${cfg.border} shadow-sm overflow-hidden ${isDone ? 'animate-pop' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{task.name}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {status === 'overdue' && <AlertCircle size={10} />}
                          {status === 'ok' && <CheckCheck size={10} />}
                          {status === 'soon' && <Clock size={10} />}
                          {cfg.label}
                        </span>
                        {days !== null
                          ? <span className="text-xs text-slate-400">pred {days} {days === 1 ? 'dňom' : 'dňami'}</span>
                          : <span className="text-xs text-slate-400">Ešte nesplnené</span>
                        }
                        {assignee && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            {assignee.emoji} {assignee.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Každých {task.intervalDays} {task.intervalDays < 5 ? 'dni' : 'dní'}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={15} />
                  </button>
                </div>

                {days !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${status === 'overdue' ? 'bg-red-400' : status === 'soon' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min((days / task.intervalDays) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">0</span>
                      <span className="text-xs text-slate-400">{task.intervalDays}d</span>
                    </div>
                  </div>
                )}

                <button onClick={() => markDone(task.id)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95 ${isDone ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  <CheckCircle2 size={16} />
                  {isDone ? 'Hotovo ✓' : 'Hotovo'}
                </button>
              </div>
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <CheckCircle2 size={36} className="mx-auto mb-3 opacity-30" />
            <div className="font-medium">Žiadne úlohy</div>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Nová úloha</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <input autoFocus type="text" placeholder="Názov úlohy..." value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Každých</label>
              <input type="number" min="1" max="365" value={interval} onChange={e => setInterval(e.target.value)}
                className="w-20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <label className="text-sm text-slate-600 dark:text-slate-400">dní</label>
            </div>
            {members.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Priradiť členovi (voliteľné)</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setAssignedTo('')}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${!assignedTo ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                    Nikto
                  </button>
                  {members.map(m => (
                    <button key={m.id} type="button" onClick={() => setAssignedTo(m.id)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${assignedTo === m.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                      <span>{m.emoji}</span>{m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
              Pridať úlohu
            </button>
          </form>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900 flex items-center justify-center transition-all z-10">
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
