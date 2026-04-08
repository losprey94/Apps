import { useState, useEffect } from 'react'
import {
  User, Palette, Bell, BellOff, Database, Trash2,
  Download, Upload, Info, ChevronRight, Moon, Sun,
  Check, AlertTriangle, RefreshCw, Leaf, CheckSquare, ShoppingCart,
  ChevronUp, ChevronDown, Plus, Minus,
  Home, Grid3x3, UtensilsCrossed, Wallet, PawPrint, Zap, Users,
  Navigation2, LayoutDashboard, Globe, Coins,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage, useSync } from '../context/SyncContext'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import { LANGUAGES } from '../i18n/index'
import { CURRENCIES } from '../hooks/useCurrency'

const AVATAR_EMOJIS = ['😊','🧑','👨','👩','🧔','👴','👵','🧒','🧑‍💻','🧑‍🍳','🧑‍🌾','🧑‍🔧']

// Nav config (same as App.jsx)
const ALL_NAV_OPTIONS = [
  { id: 'home',     label: 'Domov',      icon: Home,            color: 'text-indigo-600 dark:text-indigo-400'   },
  { id: 'tasks',    label: 'Úlohy',      icon: CheckSquare,     color: 'text-indigo-600 dark:text-indigo-400'   },
  { id: 'plants',   label: 'Rastliny',   icon: Leaf,            color: 'text-cyan-600 dark:text-cyan-400'       },
  { id: 'shopping', label: 'Nákup',      icon: ShoppingCart,    color: 'text-violet-600 dark:text-violet-400'   },
  { id: 'mealplan', label: 'Jedálniček', icon: UtensilsCrossed, color: 'text-orange-600 dark:text-orange-400'   },
  { id: 'budget',   label: 'Rozpočet',   icon: Wallet,          color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'pets',     label: 'Zvieratá',   icon: PawPrint,        color: 'text-rose-600 dark:text-rose-400'       },
  { id: 'energy',   label: 'Energie',    icon: Zap,             color: 'text-amber-600 dark:text-amber-400'     },
  { id: 'contacts', label: 'Kontakty',   icon: Users,           color: 'text-sky-600 dark:text-sky-400'         },
  { id: 'more',     label: 'Viac',       icon: Grid3x3,         color: 'text-slate-600 dark:text-slate-300'     },
]
const DEFAULT_NAV = ['home', 'tasks', 'plants', 'shopping', 'more']
const MAX_NAV = 5

// Dashboard widgets config (same as Dashboard.jsx)
const WIDGET_DEFS = [
  { id: 'weather',      label: 'Počasie',           emoji: '🌤️' },
  { id: 'smart',        label: 'Denný tip',          emoji: '💡' },
  { id: 'mealtoday',    label: 'Dnešný jedálniček',  emoji: '🍽️' },
  { id: 'budget',       label: 'Rozpočet',           emoji: '💶' },
  { id: 'budgetchart',  label: 'Graf výdavkov',      emoji: '📊' },
  { id: 'loyaltycards', label: 'Rýchle karty',       emoji: '💳' },
  { id: 'quicknav',     label: 'Rýchla navigácia',   emoji: '🗂️' },
  { id: 'quote',        label: 'Citát',              emoji: '💬' },
]
const DEFAULT_WIDGETS = ['weather','smart','mealtoday','budget','budgetchart','loyaltycards','quicknav','quote']

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
  const { user, logout, isAuthEnabled } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { updateHousehold, isConnected } = useSync()
  const [userName, setUserName] = useLocalStorage('user-name', '')
  const [userEmoji, setUserEmoji] = useLocalStorage('user-emoji', '😊')
  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false)
  const [notifEnabled, setNotifEnabled] = useLocalStorage('notifications-enabled', false)
  const [reminderTime, setReminderTime] = useLocalStorage('reminder-time', '08:00')
  const [notifTasks,    setNotifTasks]    = useLocalStorage('notif-family-tasks',    true)
  const [notifShopping, setNotifShopping] = useLocalStorage('notif-family-shopping', true)
  const [notifPlants,   setNotifPlants]   = useLocalStorage('notif-family-plants',   true)
  const [defaultTaskInterval, setDefaultTaskInterval] = useLocalStorage('default-task-interval', 30)
  const [defaultPlantInterval, setDefaultPlantInterval] = useLocalStorage('default-plant-interval', 7)
  const [showQuotes, setShowQuotes] = useLocalStorage('show-quotes', true)
  const [currency, setCurrency] = useLocalStorage('currency', 'EUR')
  const [navIds, setNavIds] = useSyncedStorage('nav-tabs', DEFAULT_NAV)
  const [dashWidgets, setDashWidgets] = useLocalStorage('dashboard-widgets', DEFAULT_WIDGETS)
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])

  // Nav helpers
  const safeNavIds = Array.isArray(navIds) && navIds.length > 0 ? navIds : DEFAULT_NAV
  const moveNav = (id, dir) => {
    const idx = safeNavIds.indexOf(id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === safeNavIds.length - 1) return
    const next = [...safeNavIds]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setNavIds(next)
  }
  const removeNav = (id) => setNavIds(safeNavIds.filter(x => x !== id))
  const addNav    = (id) => { if (safeNavIds.length < MAX_NAV) setNavIds([...safeNavIds, id]) }

  // Dashboard helpers
  const safeDash = Array.isArray(dashWidgets) ? dashWidgets.filter(id => WIDGET_DEFS.some(w => w.id === id)) : DEFAULT_WIDGETS
  const moveDash = (id, dir) => {
    const idx = safeDash.indexOf(id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === safeDash.length - 1) return
    const next = [...safeDash]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setDashWidgets(next)
  }
  const removeDash = (id) => setDashWidgets(safeDash.filter(x => x !== id))
  const addDash    = (id) => setDashWidgets([...safeDash, id])

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(userName)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [confirmClear, setConfirmClear] = useState(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

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
    const keys = type === 'all' ? ['tasks', 'plants', 'shopping'] : [type]
    keys.forEach(k => {
      localStorage.removeItem(k)
      if (isConnected) updateHousehold(k, [])
    })
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

      {/* Google Account */}
      {isAuthEnabled && user && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl flex-shrink-0">
                {user.displayName?.[0] || '👤'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{user.displayName || 'Používateľ'}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('settings.loggedIn')}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex-shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors border border-red-100 dark:border-red-800"
            >
              {t('settings.logout')}
            </button>
          </div>
        </div>
      )}

      {/* Profile */}
      <Section title={t('settings.profile')} icon={User}>
        <Row label={t('settings.avatar')}>
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
        <Row label={t('settings.name')} sublabel={t('settings.nameHint')}>
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
              {userName || t('common.edit')} <ChevronRight size={14} />
            </button>
          )}
        </Row>
      </Section>

      {/* Appearance */}
      <Section title={t('settings.appearance')} icon={Palette}>
        <Row label={t('settings.darkMode')} sublabel={darkMode ? t('settings.darkOn') : t('settings.darkOff')}>
          <Toggle value={darkMode} onChange={setDarkMode} />
        </Row>
        <Row label={t('settings.quotes')} sublabel={t('settings.quotesHint')}>
          <Toggle value={showQuotes} onChange={setShowQuotes} />
        </Row>
      </Section>

      {/* Language */}
      <Section title={t('settings.language')} icon={Globe}>
        <div className="px-4 py-3 flex flex-col gap-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                lang === l.code
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}>
              <span className="text-xl">{l.flag}</span>
              <span className={`text-sm font-medium ${lang === l.code ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{l.label}</span>
              {lang === l.code && <Check size={15} className="ml-auto text-indigo-500" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Currency */}
      <Section title={t('settings.currency')} icon={Coins}>
        <div className="px-4 py-3 flex flex-col gap-2">
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setCurrency(c.code)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                currency === c.code
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-8">{c.code}</span>
              <span className={`text-sm font-medium ${currency === c.code ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{c.label}</span>
              {currency === c.code && <Check size={15} className="ml-auto text-indigo-500" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t('settings.notifications')} icon={Bell}>
        <Row
          label={t('settings.notifBrowser')}
          sublabel={
            !notifSupported ? t('settings.notifNotSupported') :
            notifPermission === 'denied' ? t('settings.notifBlocked') :
            notifEnabled ? t('settings.notifOn') : t('settings.notifOff')
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
          <>
            <Row label={t('settings.reminder')} sublabel={t('settings.reminderHint')}>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </Row>
            {/* Family notification categories */}
            <div className="px-4 pt-3 pb-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Rodinné notifikácie
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                Upozorni ma, keď niekto z rodiny zmení…
              </p>
              <div className="flex flex-col gap-1">
                {[
                  { key: 'tasks',    icon: '📋', label: 'Úlohy',    sub: 'pridanie, splnenie',   val: notifTasks,    set: setNotifTasks    },
                  { key: 'shopping', icon: '🛒', label: 'Nákup',    sub: 'pridanie, kúpenie',    val: notifShopping, set: setNotifShopping },
                  { key: 'plants',   icon: '🌿', label: 'Rastliny', sub: 'zalievanie',           val: notifPlants,   set: setNotifPlants   },
                ].map(({ icon, label, sub, val, set }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base leading-none">{icon}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
                        <div className="text-xs text-slate-400">{sub}</div>
                      </div>
                    </div>
                    <Toggle value={val} onChange={() => set(!val)} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Nav customizer */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Navigation2 size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{t('settings.navBar')}</span>
          <span className="ml-auto text-xs text-slate-400">{safeNavIds.length}/{MAX_NAV}</span>
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">{t('settings.inBar')}</div>
          {safeNavIds.map((id, idx) => {
            const opt = ALL_NAV_OPTIONS.find(o => o.id === id)
            if (!opt) return null
            return (
              <div key={id} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5">
                <opt.icon size={16} className={`${opt.color} flex-shrink-0`} />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{t(`nav.${opt.id}`, opt.label)}</span>
                <button onClick={() => moveNav(id, 'up')} disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveNav(id, 'down')} disabled={idx === safeNavIds.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeNav(id)}
                  className="p-1 text-rose-400 hover:text-rose-600 transition-colors ml-1">
                  <Minus size={14} />
                </button>
              </div>
            )
          })}
        </div>
        {ALL_NAV_OPTIONS.filter(o => !safeNavIds.includes(o.id)).length > 0 && (
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">{t('settings.available')}</div>
            {ALL_NAV_OPTIONS.filter(o => !safeNavIds.includes(o.id)).map(opt => {
              const full = safeNavIds.length >= MAX_NAV
              return (
                <div key={opt.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600 ${full ? 'opacity-40' : ''}`}>
                  <opt.icon size={16} className={`${opt.color} flex-shrink-0`} />
                  <span className="flex-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t(`nav.${opt.id}`, opt.label)}</span>
                  <button onClick={() => addNav(opt.id)} disabled={full}
                    className="p-1 text-emerald-500 hover:text-emerald-700 disabled:pointer-events-none transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dashboard customizer */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <LayoutDashboard size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Dashboard</span>
          <span className="ml-auto text-xs text-slate-400">{safeDash.length}/{WIDGET_DEFS.length} {t('settings.widgets')}</span>
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">{t('settings.visible')}</div>
          {safeDash.map((id, idx) => {
            const w = WIDGET_DEFS.find(x => x.id === id)
            if (!w) return null
            return (
              <div key={id} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5">
                <span className="text-base flex-shrink-0">{w.emoji}</span>
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{t(`widget.${w.id}`, w.label)}</span>
                <button onClick={() => moveDash(id, 'up')} disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveDash(id, 'down')} disabled={idx === safeDash.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeDash(id)}
                  className="p-1 text-rose-400 hover:text-rose-600 transition-colors ml-1">
                  <Minus size={14} />
                </button>
              </div>
            )
          })}
        </div>
        {WIDGET_DEFS.filter(w => !safeDash.includes(w.id)).length > 0 && (
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">{t('settings.available')}</div>
            {WIDGET_DEFS.filter(w => !safeDash.includes(w.id)).map(w => (
              <div key={w.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600">
                <span className="text-base flex-shrink-0">{w.emoji}</span>
                <span className="flex-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t(`widget.${w.id}`, w.label)}</span>
                <button onClick={() => addDash(w.id)}
                  className="p-1 text-emerald-500 hover:text-emerald-700 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Defaults */}
      <Section title={t('settings.defaults')} icon={RefreshCw}>
        <Row label={t('settings.taskInterval')} sublabel={t('settings.taskIntervalHint')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={defaultTaskInterval}
              onChange={e => setDefaultTaskInterval(parseInt(e.target.value) || 30)}
              className="w-16 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-sm text-slate-400">{t('common.days')}</span>
          </div>
        </Row>
        <Row label={t('settings.plantInterval')} sublabel={t('settings.plantIntervalHint')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="90"
              value={defaultPlantInterval}
              onChange={e => setDefaultPlantInterval(parseInt(e.target.value) || 7)}
              className="w-16 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-2 py-1 text-sm text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-sm text-slate-400">{t('common.days')}</span>
          </div>
        </Row>
      </Section>

      {/* Data */}
      <Section title={t('settings.data')} icon={Database}>
        <Row
          label={t('settings.exportData')}
          sublabel={`${totalItems} ${t('common.items')}`}
          onClick={exportData}
        >
          {exportSuccess
            ? <Check size={16} className="text-emerald-500" />
            : <Download size={16} className="text-slate-400" />
          }
        </Row>

        <Row label={t('settings.importData')} sublabel={t('settings.importHint')}>
          <label className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer">
            <Upload size={15} />
            <span>{t('settings.chooseFile')}</span>
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </Row>
        {importError && (
          <div className="px-4 py-2 text-xs text-red-500 flex items-center gap-1.5">
            <AlertTriangle size={12} /> {importError}
          </div>
        )}

        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('settings.clearData')}</div>
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
            <Trash2 size={14} /> {t('settings.clearAll')}
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title={t('settings.about')} icon={Info}>
        <Row label={t('settings.version')} sublabel="Domáci Rytmus">
          <span className="text-sm text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">1.0.0</span>
        </Row>
        <Row label={t('settings.storage')} sublabel={t('settings.storageHint')}>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('settings.storageLocal')}</span>
        </Row>
        <Row label={t('settings.builtWith')} sublabel="React · Tailwind · lucide-react">
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
                <div className="font-semibold text-slate-800 dark:text-slate-200">{t('settings.confirmDelete')}</div>
                <div className="text-sm text-slate-500">
                  {confirmClear === 'all' ? t('settings.confirmDeleteAll') : `"${confirmClear}"`}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmClear(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => clearData(confirmClear)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
