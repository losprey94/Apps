import { useState, useEffect } from 'react'
import {
  User, Palette, Bell, BellOff, Database, Trash2,
  Download, Upload, Info, ChevronRight, Moon, Sun,
  Check, AlertTriangle, RefreshCw, Leaf, CheckSquare, ShoppingCart
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AVATAR_EMOJIS = ['😊','🧑','👨','👩','🧔','👴','👵','🧒','🧑‍💻','🧑‍🍳','🧑‍🌾','🧑‍🔧']

const COLOR_THEMES = [
  { id: 'indigo',  label: 'Indigová',  primary: 'bg-indigo-600',  preview: '#4f46e5' },
  { id: 'violet',  label: 'Fialová',   primary: 'bg-violet-600',  preview: '#7c3aed' },
  { id: 'rose',    label: 'Ružová',    primary: 'bg-rose-500',    preview: '#f43f5e' },
  { id: 'emerald', label: 'Zelená',    primary: 'bg-emerald-600', preview: '#059669' },
  { id: 'amber',   label: 'Jantárová', primary: 'bg-amber-500',   preview: '#f59e0b' },
  { id: 'cyan',    label: 'Tyrkysová', primary: 'bg-cyan-500',    preview: '#06b6d4' },
]

const MOTIVATIONAL_QUOTES = [
  'Malé kroky každý deň vedú k veľkým zmenám.',
  'Poriadok v domácnosti = poriadok v mysli.',
  'Dobre vedená domácnosť je základ pohody.',
  'Každá splnená úloha je dôvod na radosť.',
  'Starostlivosť o domov je starostlivosť o seba.',
]

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <Icon size={16} className="text-slate-500 dark:text-slate-400" />
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
        {children}
      </div>
    </div>
  )
}

function Row({ label, sublabel, children, onClick }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 gap-3 ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100' : ''}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</div>
        {sublabel && <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function Settings() {
  const [userName, setUserName] = useLocalStorage('user-name', '')
  const [userEmoji, setUserEmoji] = useLocalStorage('user-emoji', '😊')
  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false)
  const [colorTheme, setColorTheme] = useLocalStorage('color-theme', 'indigo')
  const [notifEnabled, setNotifEnabled] = useLocalStorage('notifications-enabled', false)
  const [reminderTime, setReminderTime] = useLocalStorage('reminder-time', '08:00')
  const [defaultTaskInterval, setDefaultTaskInterval] = useLocalStorage('default-task-interval', 30)
  const [defaultPlantInterval, setDefaultPlantInterval] = useLocalStorage('default-plant-interval', 7)
  const [showQuotes, setShowQuotes] = useLocalStorage('show-quotes', true)
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [confirmClear, setConfirmClear] = useState(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    const colors = {
      indigo:  { primary: '#4f46e5', bg: '#eef2ff', ring: '#6366f1' },
      violet:  { primary: '#7c3aed', bg: '#f5f3ff', ring: '#8b5cf6' },
      rose:    { primary: '#e11d48', bg: '#fff1f2', ring: '#f43f5e' },
      emerald: { primary: '#059669', bg: '#ecfdf5', ring: '#10b981' },
      amber:   { primary: '#d97706', bg: '#fffbeb', ring: '#f59e0b' },
      cyan:    { primary: '#0891b2', bg: '#ecfeff', ring: '#06b6d4' },
    }
    const t = colors[colorTheme] || colors.indigo
    document.documentElement.style.setProperty('--color-primary', t.primary)
    document.documentElement.style.setProperty('--color-primary-bg', t.bg)
    document.documentElement.style.setProperty('--color-primary-ring', t.ring)
  }, [colorTheme])

  const notifSupported = 'Notification' in window
  const notifPermission = notifSupported ? Notification.permission : 'denied'

  const requestNotifications = async () => {
    if (!notifSupported) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotifEnabled(true)
      new Notification('Domáci Rytmus 🏠', { body: 'Upozornenia sú zapnuté!' })
    } else {
      setNotifEnabled(false)
    }
  }

  const exportData = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      plants: JSON.parse(localStorage.getItem('plants') || '[]'),
      shopping: JSON.parse(localStorage.getItem('shopping') || '[]'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `domaci-rytmus-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 2000)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks))
        if (data.plants) localStorage.setItem('plants', JSON.stringify(data.plants))
        if (data.shopping) localStorage.setItem('shopping', JSON.stringify(data.shopping))
        window.location.reload()
      } catch {
        setImportError('Neplatný súbor. Skontroluj formát.')
        setTimeout(() => setImportError(''), 3000)
      }
    }
    reader.readAsText(file)
  }

  const clearData = (type) => {
    if (type === 'all') {
      const keys = ['tasks', 'plants', 'shopping']
      keys.forEach(k => localStorage.removeItem(k))
    } else {
      localStorage.removeItem(type)
    }
    setConfirmClear(null)
    window.location.reload()
  }

  const saveName = () => {
    setUserName(nameInput.trim())
    setEditingName(false)
  }

  const totalItems = tasks.length + plants.length + shopping.filter(i => !i.done).length

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      {/* Profile */}
      <Section title="Profil" icon={User}>
        <Row label="Avatar">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="text-2xl p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {userEmoji}
          </button>
        </Row>
        {showAvatarPicker && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => { setUserEmoji(e); setShowAvatarPicker(false) }}
                  className={`text-2xl p-1.5 rounded-xl transition-all ${userEmoji === e ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-400 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
        <Row label="Meno" sublabel="Zobrazí sa v pozdrave na domovskej stránke">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Tvoje meno..."
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 w-32 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={saveName} className="text-indigo-600 dark:text-indigo-400">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400"
            >
              {userName || 'Nastaviť'} <ChevronRight size={14} />
            </button>
          )}
        </Row>
      </Section>

      {/* Appearance */}
      <Section title="Vzhľad" icon={Palette}>
        <Row label="Tmavý režim" sublabel={darkMode ? 'Zapnutý' : 'Vypnutý'}>
          <Toggle value={darkMode} onChange={setDarkMode} />
        </Row>
        <Row label="Farebná téma">
          <div />
        </Row>
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {COLOR_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setColorTheme(theme.id)}
              title={theme.label}
              className={`w-8 h-8 rounded-full transition-transform ${colorTheme === theme.id ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-slate-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: theme.preview }}
            />
          ))}
        </div>
        <Row label="Motivačné citáty" sublabel="Zobrazovať na dashboarde">
          <Toggle value={showQuotes} onChange={setShowQuotes} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Upozornenia" icon={Bell}>
        <Row
          label="Upozornenia prehliadača"
          sublabel={
            !notifSupported ? 'Nie je podporované' :
            notifPermission === 'denied' ? 'Zablokované v nastaveniach' :
            notifEnabled ? 'Zapnuté' : 'Vypnuté'
          }
        >
          {notifSupported && notifPermission !== 'denied' ? (
            <Toggle
              value={notifEnabled && notifPermission === 'granted'}
              onChange={requestNotifications}
            />
          ) : (
            <BellOff size={16} className="text-slate-400" />
          )}
        </Row>
        {notifEnabled && notifPermission === 'granted' && (
          <Row label="Denná pripomienka" sublabel="Čas každodenného upozornenia">
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </Row>
        )}
      </Section>

      {/* Defaults */}
      <Section title="Predvolené hodnoty" icon={RefreshCw}>
        <Row label="Interval úloh" sublabel="Predvolený počet dní pre nové úlohy">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={defaultTaskInterval}
              onChange={e => setDefaultTaskInterval(parseInt(e.target.value) || 30)}
              className="w-16 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-sm text-slate-400">dní</span>
          </div>
        </Row>
        <Row label="Interval polievania" sublabel="Predvolený počet dní pre nové rastliny">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="90"
              value={defaultPlantInterval}
              onChange={e => setDefaultPlantInterval(parseInt(e.target.value) || 7)}
              className="w-16 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-sm text-slate-400">dní</span>
          </div>
        </Row>
      </Section>

      {/* Data */}
      <Section title="Dáta" icon={Database}>
        <Row
          label="Exportovať dáta"
          sublabel={`${totalItems} položiek celkom`}
          onClick={exportData}
        >
          {exportSuccess
            ? <Check size={16} className="text-emerald-500" />
            : <Download size={16} className="text-slate-400" />
          }
        </Row>

        <Row label="Importovať dáta" sublabel="Načítať zo zálohy (.json)">
          <label className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer">
            <Upload size={15} />
            <span>Vybrať súbor</span>
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </Row>
        {importError && (
          <div className="px-4 py-2 text-xs text-red-500 flex items-center gap-1.5">
            <AlertTriangle size={12} /> {importError}
          </div>
        )}

        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vymazať dáta</div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'tasks', label: 'Úlohy', icon: CheckSquare, count: tasks.length },
              { key: 'plants', label: 'Rastliny', icon: Leaf, count: plants.length },
              { key: 'shopping', label: 'Nákup', icon: ShoppingCart, count: shopping.length },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setConfirmClear(item.key)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <item.icon size={12} />
                {item.label} ({item.count})
              </button>
            ))}
          </div>
          <button
            onClick={() => setConfirmClear('all')}
            className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors mt-1"
          >
            <Trash2 size={14} /> Vymazať všetko
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="O aplikácii" icon={Info}>
        <Row label="Verzia" sublabel="Domáci Rytmus">
          <span className="text-sm text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">1.0.0</span>
        </Row>
        <Row label="Úložisko" sublabel="Dáta sú uložené len v tvojom zariadení">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Lokálne</span>
        </Row>
        <Row label="Vyvinuté s" sublabel="React · Tailwind · lucide-react">
          <span className="text-base">❤️</span>
        </Row>
      </Section>

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setConfirmClear(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 dark:bg-red-900/40 rounded-xl p-2">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Naozaj vymazať?</div>
                <div className="text-sm text-slate-500">
                  {confirmClear === 'all' ? 'Všetky dáta budú vymazané.' : `Sekcia "${confirmClear}" bude vymazaná.`}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmClear(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Zrušiť
              </button>
              <button
                onClick={() => clearData(confirmClear)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Vymazať
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
