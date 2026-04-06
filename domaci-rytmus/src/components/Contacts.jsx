import { useState } from 'react'
import { Plus, Trash2, X, Phone, Search } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CATEGORIES = [
  { id: 'emergency', label: 'Záchranné', emoji: '🚨' },
  { id: 'repair',    label: 'Opravári',  emoji: '🔧' },
  { id: 'medical',   label: 'Lekári',    emoji: '🏥' },
  { id: 'family',    label: 'Rodina',    emoji: '👨‍👩‍👧' },
  { id: 'neighbor',  label: 'Susedia',   emoji: '👥' },
  { id: 'service',   label: 'Služby',    emoji: '🏢' },
  { id: 'other',     label: 'Iné',       emoji: '📋' },
]

const DEFAULT_CONTACTS = [
  { id: 1, name: 'Záchranná služba', phone: '155', category: 'emergency', emoji: '🚑', notes: '' },
  { id: 2, name: 'Polícia',          phone: '158', category: 'emergency', emoji: '🚔', notes: '' },
  { id: 3, name: 'Hasiči',          phone: '150', category: 'emergency', emoji: '🚒', notes: '' },
  { id: 4, name: 'Tiesňová linka',  phone: '112', category: 'emergency', emoji: '📞', notes: '' },
]

const CONTACT_EMOJIS = ['👤','👨','👩','🧔','🏠','🔧','🏥','🚗','💈','🧹','⚡','💧','🔌','🌡️','📞']

export default function Contacts() {
  const [contacts, setContacts] = useLocalStorage('contacts', DEFAULT_CONTACTS)
  const [showForm, setShowForm] = useState(false)
  const [activeCategory, setActiveCategory] = useLocalStorage('contacts-cat', 'all')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('other')
  const [emoji, setEmoji] = useState('👤')
  const [notes, setNotes] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const addContact = (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setContacts([...contacts, { id: Date.now(), name: name.trim(), phone: phone.trim(), category, emoji, notes: notes.trim() }])
    setName(''); setPhone(''); setCategory('other'); setEmoji('👤'); setNotes('')
    setShowForm(false)
  }

  const deleteContact = (id) => setContacts(contacts.filter(c => c.id !== id))

  const filtered = contacts.filter(c => {
    const matchCat = activeCategory === 'all' || c.category === activeCategory
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    return matchCat && matchSearch
  })

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filtered.filter(c => c.category === cat.id),
  })).filter(cat => cat.items.length > 0 && (activeCategory === 'all' || activeCategory === cat.id))

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 px-4 py-2.5">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Hľadať kontakt..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${activeCategory === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}
        >
          Všetky ({contacts.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = contacts.filter(c => c.category === cat.id).length
          if (count === 0) return null
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${activeCategory === cat.id ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}
            >
              <span>{cat.emoji}</span>{cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Contact groups */}
      {grouped.map(group => (
        <div key={group.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <span>{group.emoji}</span>
            <span className="font-semibold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">{group.label}</span>
          </div>
          {group.items.map((contact, idx) => (
            <div key={contact.id} className={`flex items-center gap-3 px-4 py-3.5 ${idx < group.items.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${contact.category === 'emergency' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {contact.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{contact.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{contact.phone}</div>
                {contact.notes && <div className="text-xs text-slate-400 mt-0.5 truncate">{contact.notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                <a href={`tel:${contact.phone}`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${contact.category === 'emergency' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                >
                  <Phone size={15} />
                </a>
                {contact.id > 4 && (
                  <button onClick={() => deleteContact(contact.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <div className="text-4xl mb-3">📞</div>
          <div className="font-medium">Žiadne kontakty</div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Nový kontakt</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addContact} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-12 h-12 text-2xl rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  {emoji}
                </button>
                <input autoFocus type="text" placeholder="Meno kontaktu..." value={name} onChange={e => setName(e.target.value)}
                  className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
              </div>
              {showEmojiPicker && (
                <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2">
                  {CONTACT_EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                      className={`text-xl p-1.5 rounded-lg ${emoji === e ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-600'}`}>{e}</button>
                  ))}
                </div>
              )}
              <input type="tel" placeholder="Telefónne číslo..." value={phone} onChange={e => setPhone(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${category === cat.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                    <span>{cat.emoji}</span><span>{cat.label}</span>
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Poznámka (voliteľné)..." value={notes} onChange={e => setNotes(e.target.value)}
                className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
                Uložiť kontakt
              </button>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10">
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
