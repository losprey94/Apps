import { useState } from 'react'
import { Plus, Trash2, X, Share2, Download, Copy, Check, Users, Wifi, WifiOff, Link2, LogOut, Loader } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage, useSync } from '../context/SyncContext'
import { useHistory } from '../hooks/useHistory'

const MEMBER_EMOJIS = ['👨','👩','🧔','👴','👵','🧒','👦','👧','🧑','👱','🧕','🧑‍🦱']
const MEMBER_COLORS = [
  { id: 'indigo',  label: 'Modrá',     preview: '#4f46e5' },
  { id: 'rose',    label: 'Ružová',    preview: '#e11d48' },
  { id: 'emerald', label: 'Zelená',    preview: '#059669' },
  { id: 'amber',   label: 'Žltá',      preview: '#d97706' },
  { id: 'violet',  label: 'Fialová',   preview: '#7c3aed' },
  { id: 'cyan',    label: 'Tyrkysová', preview: '#0891b2' },
]

function encodeShare(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))) } catch { return '' }
}
function decodeShare(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))) } catch { return null }
}

function SyncPanel() {
  const { householdCode, syncStatus, isConfigured, isConnected, autoJoining, createHousehold, joinHousehold, leaveHousehold } = useSync()
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  if (!isConfigured) {
    return (
      <div className="bg-slate-100 dark:bg-slate-700/60 rounded-2xl p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Firebase nie je nakonfigurovaný. Pozri README pre inštrukcie.
      </div>
    )
  }

  if (autoJoining) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex items-center gap-3">
        <Loader size={18} className="text-emerald-500 animate-spin flex-shrink-0" />
        <div>
          <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Načítavam tvoju domácnosť…</div>
          <div className="text-xs text-slate-400 mt-0.5">Hľadám dáta prepojené s tvojim Google účtom</div>
        </div>
      </div>
    )
  }

  const handleCreate = async () => {
    setCreating(true)
    setJoinError('')
    try {
      const code = await createHousehold()
      if (!code) setJoinError('Firebase nie je správne nastavený. Skontroluj GitHub secrets a re-run deploy.')
    } catch (err) {
      setJoinError('Chyba: Firestore databáza nie je vytvorená. Dokonči krok 4 v návode (Create database).')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const ok = await joinHousehold(joinCode)
      if (!ok) setJoinError('Domácnosť s týmto kódom neexistuje.')
      else setShowJoin(false)
    } catch (err) {
      setJoinError('Chyba pripojenia. Skontroluj či je Firestore databáza vytvorená.')
    } finally {
      setJoining(false)
    }
  }

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(householdCode) } catch { /* ignore */ }
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const statusIcon = {
    offline:    <WifiOff size={16} className="text-slate-400" />,
    connecting: <Loader size={16} className="text-amber-500 animate-spin" />,
    synced:     <Wifi size={16} className="text-emerald-500" />,
    error:      <WifiOff size={16} className="text-red-500" />,
  }[syncStatus]

  const statusLabel = {
    offline:    'Nepripojený',
    connecting: 'Pripájam sa…',
    synced:     'Synchronizované',
    error:      'Chyba pripojenia',
  }[syncStatus]

  if (householdCode) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-sm font-semibold">{statusLabel}</span>
          </div>
          <button
            onClick={leaveHousehold}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors"
          >
            <LogOut size={12} /> Odpojiť
          </button>
        </div>

        <div className="text-emerald-100 text-xs mb-1">Kód domácnosti</div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-3xl font-bold tracking-[0.2em]">{householdCode}</div>
          <button onClick={copyCode}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            {codeCopied ? <><Check size={13} /> Skopírované</> : <><Copy size={13} /> Kopírovať</>}
          </button>
        </div>
        <div className="mt-3 text-emerald-100 text-xs">
          Zdieľaj tento kód s rodinou. Všetky zmeny sa synchronizujú v reálnom čase.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <Wifi size={16} className="text-slate-400" />
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Synchronizácia v reálnom čase</span>
      </div>
      <div className="text-xs text-slate-400 mb-4">Vytvor domácnosť alebo sa pripoj k existujúcej. Zmeny uvidí celá rodina okamžite.</div>

      {!showJoin ? (
        <div className="flex flex-col gap-2">
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors active:scale-95">
            {creating ? <Loader size={16} className="animate-spin" /> : <Link2 size={16} />}
            {creating ? 'Vytvárám…' : 'Vytvoriť novú domácnosť'}
          </button>
          <button onClick={() => { setShowJoin(true); setJoinError('') }}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold py-3 rounded-xl transition-colors active:scale-95">
            <Users size={16} /> Pripojiť sa k domácnosti
          </button>
          {joinError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-600 dark:text-red-400">
              ⚠️ {joinError}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Zadaj kód domácnosti (napr. AB12CD)…"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
            maxLength={6}
            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
          />
          {joinError && <div className="text-xs text-red-500">{joinError}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowJoin(false); setJoinError('') }}
              className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Zrušiť
            </button>
            <button type="submit" disabled={joining || joinCode.length < 4}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
              {joining ? <Loader size={14} className="animate-spin" /> : null}
              {joining ? 'Pripájam…' : 'Pripojiť'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function Family() {
  const [members, setMembers] = useSyncedStorage('family-members', [])
  const [tasks] = useSyncedStorage('tasks', [])
  const [plants] = useSyncedStorage('plants', [])
  const [shopping] = useSyncedStorage('shopping', [])
  const { addEvent } = useHistory()

  const [showForm, setShowForm] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmoji, setMemberEmoji] = useState('👨')
  const [memberColor, setMemberColor] = useState('indigo')

  const [shareType, setShareType] = useState(null)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const addMember = (e) => {
    e.preventDefault()
    if (!memberName.trim()) return
    const newMember = { id: Date.now(), name: memberName.trim(), emoji: memberEmoji, color: memberColor }
    setMembers(prev => [...prev, newMember])
    addEvent('family', memberEmoji, 'Pridaný člen', memberName.trim())
    setMemberName(''); setMemberEmoji('👨'); setMemberColor('indigo')
    setShowForm(false)
  }

  const deleteMember = (id) => setMembers(prev => prev.filter(m => m.id !== id))

  const generateShareLink = (type) => {
    let data = { type, generatedAt: new Date().toISOString() }
    if (type === 'shopping' || type === 'all') data.shopping = shopping.filter(i => !i.done)
    if (type === 'tasks' || type === 'all') data.tasks = tasks.map(t => ({ name: t.name, intervalDays: t.intervalDays }))
    if (type === 'all') data.plants = plants.map(p => ({ name: p.name, emoji: p.emoji, intervalDays: p.intervalDays }))
    const encoded = encodeShare(data)
    const baseUrl = window.location.origin + window.location.pathname
    setShareLink(`${baseUrl}#import=${encoded}`)
    setShareType(type)
  }

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink) } catch {
      const el = document.createElement('textarea')
      el.value = shareLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewImport = () => {
    const url = importCode.trim()
    const match = url.match(/#import=(.+)$/)
    const code = match ? match[1] : url
    const data = decodeShare(code)
    if (!data) { setImportResult({ error: 'Neplatný kód alebo odkaz' }); return }
    setImportResult(data)
  }

  const confirmImport = () => {
    if (!importResult || importResult.error) return
    if (importResult.shopping) {
      const existing = new Set(shopping.map(i => i.name.toLowerCase()))
      const newItems = importResult.shopping
        .filter(i => !existing.has(i.name.toLowerCase()))
        .map(i => ({ ...i, id: Date.now() + Math.random(), done: false }))
      setMembers(prev => prev) // noop to avoid re-render
    }
    addEvent('family', '🔗', 'Import zdieľaných dát', '')
    setImportResult(null); setImportCode(''); setShowImport(false)
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Real-time sync panel */}
      <SyncPanel />

      {/* Member count header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 rounded-3xl p-5 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">Rodinní členovia</div>
            <div className="text-rose-200 text-sm">{members.length} {members.length === 1 ? 'člen' : members.length < 5 ? 'členovia' : 'členov'}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {members.map(m => (
            <div key={m.id} className="bg-white/20 rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-xl">{m.emoji}</span>
              <span className="text-sm font-medium">{m.name}</span>
            </div>
          ))}
          {members.length === 0 && <div className="text-rose-200 text-sm">Zatiaľ žiadni členovia</div>}
        </div>
      </div>

      {/* Members list */}
      {members.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Členovia</span>
          </div>
          {members.map((member, idx) => {
            const assignedTasks = tasks.filter(t => t.assignedTo === member.id)
            const colorHex = MEMBER_COLORS.find(c => c.id === member.color)?.preview || '#4f46e5'
            return (
              <div key={member.id} className={`flex items-center gap-3 px-4 py-3.5 ${idx < members.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: colorHex + '20', border: `2px solid ${colorHex}40` }}>
                  {member.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{member.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {assignedTasks.length > 0 ? `${assignedTasks.length} priradených úloh` : 'Žiadne úlohy'}
                  </div>
                </div>
                <button onClick={() => deleteMember(member.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* One-time sharing (offline) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Jednorazové zdieľanie</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Vygeneruj odkaz a pošli ho rodine (bez real-time syncu)</div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { type: 'shopping', label: '🛒 Nákupný zoznam' },
              { type: 'tasks',    label: '✅ Úlohy' },
              { type: 'all',      label: '📦 Všetko' },
            ].map(opt => (
              <button key={opt.type} onClick={() => generateShareLink(opt.type)}
                className={`text-sm px-3.5 py-2 rounded-xl border font-medium transition-colors ${shareType === opt.type ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {shareLink && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Odkaz na zdieľanie:</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all mb-3 bg-white dark:bg-slate-700 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                {shareLink.slice(0, 80)}...
              </div>
              <button onClick={copyLink}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}>
                {copied ? <><Check size={15} /> Skopírované!</> : <><Copy size={15} /> Kopírovať odkaz</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <button onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <div className="flex items-center gap-2">
            <Download size={15} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Prijať zdieľané dáta</span>
          </div>
        </button>
        {showImport && (
          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
            <textarea
              placeholder="Vlož sem odkaz alebo kód, ktorý ti poslala rodina..."
              value={importCode}
              onChange={e => { setImportCode(e.target.value); setImportResult(null) }}
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />
            <button onClick={previewImport}
              className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Skontrolovať
            </button>
            {importResult && (
              <div className={`rounded-xl p-3 text-sm ${importResult.error ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
                {importResult.error ? importResult.error : (
                  <div>
                    <div className="font-semibold mb-1">Nájdené:</div>
                    {importResult.shopping && <div>🛒 {importResult.shopping.length} položiek nákupu</div>}
                    {importResult.tasks && <div>✅ {importResult.tasks.length} úloh</div>}
                    {importResult.plants && <div>🌿 {importResult.plants.length} rastlín</div>}
                    <button onClick={confirmImport}
                      className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                      Importovať
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Pridať člena rodiny</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addMember} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {MEMBER_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setMemberEmoji(e)}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${memberEmoji === e ? 'bg-rose-100 dark:bg-rose-900/40 ring-2 ring-rose-400 scale-110' : 'bg-slate-50 dark:bg-slate-700'}`}>
                    {e}
                  </button>
                ))}
              </div>
              <input autoFocus type="text" placeholder="Meno (napr. Mama, Otec, Jano)..." value={memberName} onChange={e => setMemberName(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400" required />
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Farba</label>
                <div className="flex gap-2">
                  {MEMBER_COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setMemberColor(c.id)}
                      className={`w-8 h-8 rounded-full transition-transform ${memberColor === c.id ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c.preview }} />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
                Pridať člena
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10">
        <Plus size={24} />
      </button>
    </div>
  )
}
