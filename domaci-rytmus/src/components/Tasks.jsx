import { useState } from 'react'
import { CheckCircle2, Plus, Trash2, Clock, AlertCircle, CheckCheck, X, ChevronDown, Bell, BellOff, Calendar, CalendarClock } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage } from '../context/SyncContext'
import { useHistory } from '../hooks/useHistory'
import { useHaptic } from '../hooks/useHaptic'
import { useNotif } from '../context/NotifContext'

const DEFAULT_TASKS = [
  { id: 1, name: 'Odvápnenie kávovaru',       repeating: true, intervalDays: 30, lastDone: null, deadline: null },
  { id: 2, name: 'Čistenie filtra digestora',  repeating: true, intervalDays: 90, lastDone: null, deadline: null },
  { id: 3, name: 'Umytie okien',               repeating: true, intervalDays: 60, lastDone: null, deadline: null },
]

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function getStatus(task) {
  if (task.repeating === false) return 'pending'   // one-time tasks are always pending until deleted
  const days = getDaysSince(task.lastDone)
  if (days === null) return 'pending'
  const remaining = task.intervalDays - days
  if (remaining <= 0) return 'overdue'
  if (remaining <= Math.ceil(task.intervalDays * 0.2)) return 'soon'
  return 'ok'
}

function getDeadlineInfo(deadline) {
  if (!deadline) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(deadline + 'T00:00:00')
  const diff  = Math.round((due - today) / 86400000)
  if (diff < 0)  return { label: `Oneskorená ${Math.abs(diff)} d`, level: 'overdue' }
  if (diff === 0) return { label: 'Dnes!',  level: 'today' }
  if (diff === 1) return { label: 'Zajtra', level: 'soon' }
  if (diff <= 7)  return { label: `Za ${diff} dni`, level: 'week' }
  try {
    return { label: due.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }), level: 'later' }
  } catch {
    return { label: due.toLocaleDateString(), level: 'later' }
  }
}

const DEADLINE_STYLES = {
  overdue: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  today:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  soon:    'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  week:    'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  later:   'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
}

const STATUS_CONFIG = {
  pending: { label: 'Čaká',       bg: 'bg-slate-100 dark:bg-slate-700',          text: 'text-slate-600 dark:text-slate-300',    border: 'border-slate-200 dark:border-slate-700',  dot: 'bg-slate-400' },
  ok:      { label: 'V poriadku', bg: 'bg-emerald-50 dark:bg-emerald-900/30',    text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  soon:    { label: 'Čoskoro',    bg: 'bg-amber-50 dark:bg-amber-900/30',        text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800',  dot: 'bg-amber-500' },
  overdue: { label: 'Oneskorené', bg: 'bg-red-50 dark:bg-red-900/30',            text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-800',      dot: 'bg-red-500' },
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}
function offsetISO(days) {
  const d = new Date(); d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Notification request banner ──────────────────────────────────────────────
function NotifBanner({ tasks }) {
  const [notifEnabled, setNotifEnabled] = useLocalStorage('notifications-enabled', false)
  const [dismissed, setDismissed] = useLocalStorage('notif-banner-dismissed', false)

  const supported = 'Notification' in window
  const granted   = supported && Notification.permission === 'granted'
  const denied    = supported && Notification.permission === 'denied'

  const today = todayISO()
  const todayTasks = tasks.filter(t => t.deadline && t.deadline <= today)

  const requestPermission = async () => {
    if (!supported) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setNotifEnabled(true)
      // Send welcome notification immediately
      new Notification('🏠 Domáci Rytmus', {
        body: 'Notifikácie sú zapnuté. Budeš upozorňovaný na úlohy s termínom.',
        icon: './icon-192.png',
        tag: 'domaci-rytmus-welcome',
      })
    }
  }

  // Show today's tasks banner if there are any due today/overdue
  if (todayTasks.length > 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            {todayTasks.length === 1 ? '1 úloha na dnes' : `${todayTasks.length} úlohy na dnes`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {todayTasks.slice(0, 4).map(t => {
            const info = getDeadlineInfo(t.deadline)
            return (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold border ${DEADLINE_STYLES[info?.level || 'later']}`}>
                  {info?.label}
                </span>
                <span className="text-amber-800 dark:text-amber-200 truncate">{t.name}</span>
              </div>
            )
          })}
        </div>
        {!granted && !denied && !dismissed && (
          <button
            onClick={requestPermission}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Bell size={13} /> Zapnúť notifikácie
          </button>
        )}
      </div>
    )
  }

  // Offer to enable notifications if not yet set up
  if (!granted && !denied && !dismissed && !notifEnabled) {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 flex items-center gap-3">
        <Bell size={18} className="text-indigo-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Zapnúť pripomienky?</div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Upozorní ťa na úlohy s termínom</div>
        </div>
        <button onClick={requestPermission} className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          Zapnúť
        </button>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1">
          <X size={15} />
        </button>
      </div>
    )
  }

  return null
}

export default function Tasks() {
  const [tasks, setTasks] = useSyncedStorage('tasks', DEFAULT_TASKS)
  const [members] = useSyncedStorage('family-members', [])
  const { addEvent } = useHistory()
  const { pushNotif } = useNotif()
  const haptic = useHaptic()

  const [showForm, setShowForm]     = useState(false)
  const [name, setName]             = useState('')
  const [repeating, setRepeating]   = useState(false)
  const [interval, setInterval]     = useState('30')
  const [deadline, setDeadline]     = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [justDone, setJustDone]       = useState(null)
  const [justSnoozed, setJustSnoozed] = useState(null)
  const [dyingTask, setDyingTask]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filterMember, setFilterMember] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const markDone = (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    if (task.repeating === false) {
      // One-time task — green flash then fade out and delete
      setJustDone(id)
      addEvent('tasks', '✅', 'Hotovo', task.name)
      pushNotif('tasks', '✅', 'Hotovo', task.name)
      haptic.success()
      setTimeout(() => setDyingTask(id), 400)
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== id))
        setJustDone(null)
        setDyingTask(null)
      }, 750)
    } else {
      // Repeating task — mark done, keep in list
      setTasks(tasks.map(t => t.id === id ? { ...t, lastDone: new Date().toISOString() } : t))
      addEvent('tasks', '✅', 'Hotovo', task.name)
      pushNotif('tasks', '✅', 'Hotovo', task.name)
      haptic.success()
      setJustDone(id)
      setTimeout(() => setJustDone(null), 1200)
    }
  }

  const deleteTask = (id) => {
    haptic.tap()
    setTasks(tasks.filter(t => t.id !== id))
    setConfirmDelete(null)
  }

  const snoozeTask = (id) => {
    haptic.tap()
    const updated = tasks.map(t => {
      if (t.id !== id) return t
      if (t.deadline) {
        // Move deadline +1 day
        const d = new Date(t.deadline + 'T00:00:00')
        d.setDate(d.getDate() + 1)
        return { ...t, deadline: d.toISOString().split('T')[0] }
      }
      if (t.repeating && t.intervalDays) {
        // Shift lastDone +1 so the task is due 1 day later
        const base = t.lastDone
          ? new Date(t.lastDone)
          : new Date(Date.now() - t.intervalDays * 86400000)
        base.setDate(base.getDate() + 1)
        return { ...t, lastDone: base.toISOString() }
      }
      return t
    })
    setTasks(updated)
    setJustSnoozed(id)
    setTimeout(() => setJustSnoozed(null), 1200)
  }

  const addTask = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setTasks([...tasks, {
      id: Date.now(),
      name: name.trim(),
      repeating,
      intervalDays: repeating ? (parseInt(interval) || 30) : null,
      lastDone: null,
      deadline: deadline || null,
      assignedTo: assignedTo || null,
    }])
    pushNotif('tasks', '📋', 'Nová úloha', name.trim())
    haptic.done()
    setName(''); setRepeating(false); setInterval('30'); setDeadline(''); setAssignedTo('')
    setShowForm(false)
  }

  // Filter + sort
  let filtered = tasks
  if (filterMember !== 'all') {
    filtered = filtered.filter(t =>
      filterMember === 'unassigned' ? !t.assignedTo : t.assignedTo === filterMember
    )
  }
  if (filterStatus === 'all') {
    // Default view: hide recently-completed repeating tasks (status 'ok')
    filtered = filtered.filter(t => getStatus(t) !== 'ok')
  } else {
    filtered = filtered.filter(t => getStatus(t) === filterStatus)
  }

  const sorted = [...filtered].sort((a, b) => {
    // Deadline tasks sort to top, then by urgency
    const aHasDeadline = a.deadline ? 1 : 0
    const bHasDeadline = b.deadline ? 1 : 0
    if (aHasDeadline !== bHasDeadline) return bHasDeadline - aHasDeadline
    const order = { overdue: 0, pending: 1, soon: 2, ok: 3 }
    return order[getStatus(a)] - order[getStatus(b)]
  })

  const overdueCount = tasks.filter(t => getStatus(t) === 'overdue').length
  const pendingCount = tasks.filter(t => getStatus(t) === 'pending').length

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Today's tasks / notification banner */}
      <NotifBanner tasks={tasks} />

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

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {/* Status filter */}
        {['all','overdue','pending','soon','ok'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
            }`}
          >
            {{ all: 'Všetky', overdue: '🔴 Oneskorené', pending: '⚪ Čakajúce', soon: '🟡 Čoskoro', ok: '🟢 Hotové' }[s]}
          </button>
        ))}
        {members.map(m => (
          <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? 'all' : m.id)}
            className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterMember === m.id
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
            }`}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {sorted.map(task => {
          const status   = getStatus(task)
          const cfg      = STATUS_CONFIG[status]
          const days     = getDaysSince(task.lastDone)
          const isDone     = justDone === task.id
          const isSnoozed  = justSnoozed === task.id
          const isDying    = dyingTask === task.id
          const assignee = members.find(m => m.id === task.assignedTo)
          const dlInfo   = getDeadlineInfo(task.deadline)

          return (
            <div key={task.id}
              style={{ transition: 'opacity 0.3s, transform 0.3s' }}
              className={`bg-white dark:bg-slate-800 rounded-2xl border ${cfg.border} shadow-sm overflow-hidden ${isDone ? 'animate-pop' : ''} ${isDying ? 'opacity-0 scale-95 -translate-y-1 pointer-events-none' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{task.name}</div>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {status === 'overdue' && <AlertCircle size={10} />}
                          {status === 'ok'      && <CheckCheck  size={10} />}
                          {status === 'soon'    && <Clock       size={10} />}
                          {cfg.label}
                        </span>
                        {dlInfo && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${DEADLINE_STYLES[dlInfo.level]}`}>
                            <Calendar size={9} />
                            {dlInfo.label}
                          </span>
                        )}
                        {task.repeating === false
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">jednorazová</span>
                          : days !== null
                            ? <span className="text-xs text-slate-400">pred {days}d</span>
                            : <span className="text-xs text-slate-400">Ešte nesplnená</span>
                        }
                        {assignee && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{assignee.emoji} {assignee.name}</span>
                        )}
                      </div>
                      {task.repeating !== false && task.intervalDays && (
                        <div className="mt-0.5 text-xs text-slate-400">Každých {task.intervalDays} {task.intervalDays < 5 ? 'dni' : 'dní'}</div>
                      )}
                    </div>
                  </div>
                  {confirmDelete === task.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => deleteTask(task.id)} className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-lg">Zmazať</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(task.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {task.repeating !== false && days !== null && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status === 'overdue' ? 'bg-red-400' : status === 'soon' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min((days / task.intervalDays) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">0</span>
                      <span className="text-xs text-slate-400">{task.intervalDays}d</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {(task.deadline || task.repeating) && !isDone && (
                    <button
                      onClick={() => snoozeTask(task.id)}
                      title="Odložiť o 1 deň"
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0 ${
                        isSnoozed
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Clock size={13} />
                      {isSnoozed ? 'Odložené ✓' : '+1 deň'}
                    </button>
                  )}
                  <button
                    onClick={() => markDone(task.id)}
                    className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95 ${isDone ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    <CheckCircle2 size={16} />
                    {isDone ? 'Hotovo ✓' : 'Hotovo'}
                  </button>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Nová úloha</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
            </div>

            <form onSubmit={addTask} className="flex flex-col gap-4">
              {/* Name */}
              <input
                autoFocus
                type="text"
                placeholder="Názov úlohy..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />

              {/* Task type selector */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Typ úlohy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepeating(false)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-colors ${
                      !repeating
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <CheckCircle2 size={20} strokeWidth={1.8} />
                    <span className="text-sm font-semibold leading-tight">Jednorázová</span>
                    <span className="text-[11px] leading-tight text-center opacity-70">Splní sa raz a zmizne</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeating(true)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-colors ${
                      repeating
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Clock size={20} strokeWidth={1.8} />
                    <span className="text-sm font-semibold leading-tight">Opakujúca</span>
                    <span className="text-[11px] leading-tight text-center opacity-70">Vracia sa podľa intervalu</span>
                  </button>
                </div>
              </div>

              {/* Interval — only when repeating */}
              {repeating && (
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Interval opakovania</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Každých</span>
                    <input
                      type="number" min="1" max="365" value={interval}
                      onChange={e => setInterval(e.target.value)}
                      className="w-20 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">dní</span>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[[1,'1d'],[7,'7d'],[14,'14d'],[30,'30d'],[90,'90d']].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setInterval(String(v))}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          interval === String(v)
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                        }`}
                      >{l}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block flex items-center gap-1.5">
                  <Calendar size={12} /> Termín splnenia (voliteľné)
                </label>
                <input
                  type="date"
                  value={deadline}
                  min={todayISO()}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[['Dnes', 0],['Zajtra', 1],['Za týždeň', 7],['Za mesiac', 30]].map(([l, d]) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setDeadline(deadline === offsetISO(d) ? '' : offsetISO(d))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        deadline === offsetISO(d)
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                      }`}
                    >{l}</button>
                  ))}
                  {deadline && (
                    <button type="button" onClick={() => setDeadline('')}
                      className="text-xs px-2.5 py-1 rounded-lg border font-medium text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 transition-colors">
                      Zrušiť termín
                    </button>
                  )}
                </div>
              </div>

              {/* Assignee */}
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
                        {m.emoji} {m.name}
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
