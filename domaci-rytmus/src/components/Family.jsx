import { useState } from 'react'
import { Plus, Trash2, X, Share2, Download, Copy, Check, Users } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHistory } from '../hooks/useHistory'

const MEMBER_EMOJIS = ['👨','👩','🧔','👴','👵','🧒','👦','👧','🧑','👱','🧕','🧑‍🦱']
const MEMBER_COLORS = [
  { id: 'indigo', label: 'Modrá',    preview: '#4f46e5' },
  { id: 'rose',   label: 'Ružová',   preview: '#e11d48' },
  { id: 'emerald',label: 'Zelená',   preview: '#059669' },
  { id: 'amber',  label: 'Žltá',     preview: '#d97706' },
  { id: 'violet', label: 'Fialová',  preview: '#7c3aed' },
  { id: 'cyan',   label: 'Tyrkysová',preview: '#0891b2' },
]

function encodeShare(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))) } catch { return '' }
}
function decodeShare(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))) } catch { return null }
}

export default function Family() {
  const [members, setMembers] = useLocalStorage('family-members', [])
  const [tasks] = useLocalStorage('tasks', [])
  const [plants] = useLocalStorage('plants', [])
  const [shopping] = useLocalStorage('shopping', [])
  const { addEvent } = useHistory()

  const [showForm, setShowForm] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmoji, setMemberEmoji] = useState('👨')
  const [memberColor, setMemberColor] = useState('indigo')

  const [shareType, setShareType] = useState(null) // 'shopping' | 'tasks' | 'all'
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const addMember = (e) => {
    e.preventDefault()
    if (!memberName.trim()) return
    const newMember = { id: Date.now(), name: memberName.trim(), emoji: memberEmoji, color: memberColor }
    setMembers([...members, newMember])
    addEvent('family', memberEmoji, 'Pridaný člen', memberName.trim())
    setMemberName(''); setMemberEmoji('👨'); setMemberColor('indigo')
    setShowForm(false)
  }

  const deleteMember = (id) => setMembers(members.filter(m => m.id !== id))

  const generateShareLink = (type) => {
    let data = { type, generatedAt: new Date().toISOString() }
    if (type === 'shopping' || type === 'all') data.shopping = shopping.filter(i => !i.done)
    if (type === 'tasks' || type === 'all') data.tasks = tasks.map(t => ({ name: t.name, intervalDays: t.intervalDays }))
    if (type === 'all') data.plants = plants.map(p => ({ name: p.name, emoji: p.emoji, intervalDays: p.intervalDays }))
    const encoded = encodeShare(data)
    const baseUrl = window.location.origin + window.location.pathname
    const link = `${baseUrl}#import=${encoded}`
    setShareLink(link)
    setShareType(type)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = shareLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const previewImport = () => {
    const data = decodeShare(importCode.trim())
    if (!data) { setImportResult({ error: 'Neplatný kód' }); return }
    setImportResult(data)
  }

  const [tasks2, setTasks] = useLocalStorage('tasks', [])
  const [shopping2, setShopping] = useLocalStorage('shopping', [])

  const confirmImport = () => {
    if (!importResult || importResult.error) return
    if (importResult.shopping) {
      const existing = new Set(shopping2.map(i => i.name.toLowerCase()))
      const newItems = importResult.shopping
        .filter(i => !existing.has(i.name.toLowerCase()))
        .map(i => ({ ...i, id: Date.now() + Math.random(), done: false }))
      setShopping([...shopping2, ...newItems])
    }
    if (importResult.tasks) {
      const existing = new Set(tasks2.map(t => t.name.toLowerCase()))
      const newTasks = importResult.tasks
        .filter(t => !existing.has(t.name.toLowerCase()))
        .map(t => ({ ...t, id: Date.now() + Math.random(), lastDone: null }))
      setTasks([...tasks2, ...newTasks])
    }
    addEvent('family', '🔗', 'Import zdieľaných dát', '')
    setImportResult(null); setImportCode(''); setShowImport(false)
  }

  const taskCount = tasks.filter(t => t.assignedTo).length
  const activeMember = (id) => members.find(m => m.id === id)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Member count */}
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
          {members.length === 0 && (
            <div className="text-rose-200 text-sm">Zatiaľ žiadni členovia</div>
          )}
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

      {/* Sharing section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Zdieľanie</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Vygeneruj odkaz a pošli ho rodine</div>
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
              onChange={e => setImportCode(e.target.value)}
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

      {/* Add member form */}
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
