import { useState } from 'react'
import { Plus, Trash2, X, Calendar, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useHistory } from '../hooks/useHistory'

const PET_EMOJIS = ['🐶','🐱','🐰','🐹','🐦','🐠','🐍','🦜','🐢','🐓','🐈','🦮']

const EVENT_TYPES = [
  { id: 'vet',      label: 'Veterinár',   icon: '🏥', color: 'blue'  },
  { id: 'vaccine',  label: 'Vakcína',     icon: '💉', color: 'violet'},
  { id: 'deworm',   label: 'Odčervenie',  icon: '💊', color: 'amber' },
  { id: 'bath',     label: 'Kúpeľ',       icon: '🛁', color: 'cyan'  },
  { id: 'groom',    label: 'Strihanie',   icon: '✂️', color: 'pink'  },
  { id: 'medicine', label: 'Liek',        icon: '🩺', color: 'red'   },
  { id: 'other',    label: 'Iné',         icon: '📋', color: 'slate' },
]

function getDaysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function getDaysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return new Date(dateStr).toLocaleDateString()
  }
}

export default function Pets() {
  const [pets, setPets] = useLocalStorage('pets', [])
  const [events, setEvents] = useLocalStorage('pet-events', [])
  const { addEvent } = useHistory()

  const [showAddPet, setShowAddPet] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(null) // petId
  const [expandedPet, setExpandedPet] = useLocalStorage('expanded-pet', null)

  const [petName, setPetName] = useState('')
  const [petEmoji, setPetEmoji] = useState('🐶')
  const [petSpecies, setPetSpecies] = useState('')
  const [petBirth, setPetBirth] = useState('')

  const [evtType, setEvtType] = useState('vet')
  const [evtDate, setEvtDate] = useState(new Date().toISOString().slice(0, 10))
  const [evtNext, setEvtNext] = useState('')
  const [evtNotes, setEvtNotes] = useState('')

  const addPet = (e) => {
    e.preventDefault()
    if (!petName.trim()) return
    setPets([...pets, { id: Date.now(), name: petName.trim(), emoji: petEmoji, species: petSpecies.trim(), birthDate: petBirth }])
    setPetName(''); setPetEmoji('🐶'); setPetSpecies(''); setPetBirth('')
    setShowAddPet(false)
  }

  const deletePet = (id) => {
    setPets(pets.filter(p => p.id !== id))
    setEvents(events.filter(e => e.petId !== id))
  }

  const addPetEvent = (e) => {
    e.preventDefault()
    const pet = pets.find(p => p.id === showAddEvent)
    const newEvt = { id: Date.now(), petId: showAddEvent, type: evtType, date: evtDate, nextDate: evtNext, notes: evtNotes.trim() }
    setEvents([...events, newEvt])
    const evtLabel = EVENT_TYPES.find(t => t.id === evtType)?.label || evtType
    addEvent('pets', pet?.emoji || '🐾', evtLabel, pet?.name || '')
    setEvtType('vet'); setEvtDate(new Date().toISOString().slice(0, 10)); setEvtNext(''); setEvtNotes('')
    setShowAddEvent(null)
  }

  const deleteEvent = (id) => setEvents(events.filter(e => e.id !== id))

  const upcomingEvents = events
    .filter(e => e.nextDate)
    .map(e => ({ ...e, daysUntil: getDaysUntil(e.nextDate), pet: pets.find(p => p.id === e.petId) }))
    .filter(e => e.daysUntil !== null && e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Upcoming reminders */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100 dark:border-amber-800/50">
            <AlertCircle size={15} className="text-amber-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Nadchádzajúce udalosti</span>
          </div>
          {upcomingEvents.slice(0, 3).map(e => {
            const evtType = EVENT_TYPES.find(t => t.id === e.type)
            return (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <span className="text-lg">{evtType?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{e.pet?.name} — {evtType?.label}</div>
                  <div className="text-xs text-slate-400">{formatDate(e.nextDate)}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  e.daysUntil <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
                  e.daysUntil <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {e.daysUntil <= 0 ? 'Dnes!' : `za ${e.daysUntil}d`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{pets.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Zvieratá</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center border border-amber-100 dark:border-amber-900/50 shadow-sm">
          <div className="text-2xl font-bold text-amber-500">{upcomingEvents.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Nadchádzajúce</div>
        </div>
      </div>

      {/* Pet list */}
      {pets.map(pet => {
        const petEvts = events.filter(e => e.petId === pet.id).sort((a, b) => new Date(b.date) - new Date(a.date))
        const isExpanded = expandedPet === pet.id
        const age = pet.birthDate ? Math.floor(getDaysSince(pet.birthDate) / 365) : null

        return (
          <div key={pet.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="text-3xl">{pet.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{pet.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {[pet.species, age !== null ? `${age} rokov` : null].filter(Boolean).join(' · ')}
                </div>
                <div className="text-xs text-slate-400">{petEvts.length} udalostí</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddEvent(pet.id)}
                  className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-xl font-medium hover:bg-amber-200 transition-colors"
                >
                  + Udalosť
                </button>
                <button
                  onClick={() => setExpandedPet(isExpanded ? null : pet.id)}
                  className="text-slate-400 p-1"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <button onClick={() => deletePet(pet.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {petEvts.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-400 text-center">Zatiaľ žiadne udalosti</div>
                ) : (
                  petEvts.slice(0, 5).map(evt => {
                    const et = EVENT_TYPES.find(t => t.id === evt.type)
                    return (
                      <div key={evt.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                        <span className="text-base mt-0.5">{et?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{et?.label}</div>
                          <div className="text-xs text-slate-400">{formatDate(evt.date)}</div>
                          {evt.nextDate && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              Ďalší: {formatDate(evt.nextDate)}
                            </div>
                          )}
                          {evt.notes && <div className="text-xs text-slate-500 mt-0.5 italic">{evt.notes}</div>}
                        </div>
                        <button onClick={() => deleteEvent(evt.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}

      {pets.length === 0 && (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <div className="text-5xl mb-3">🐾</div>
          <div className="font-medium">Žiadne zvieratá</div>
          <div className="text-sm mt-1">Pridaj svojho prvého miláčika</div>
        </div>
      )}

      {/* Add pet form */}
      {showAddPet && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Nový miláčik</h3>
            <button onClick={() => setShowAddPet(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <form onSubmit={addPet} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {PET_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setPetEmoji(e)}
                  className={`text-xl p-1.5 rounded-lg transition-all ${petEmoji === e ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400 scale-110' : 'bg-slate-50 dark:bg-slate-700'}`}>
                  {e}
                </button>
              ))}
            </div>
            <input autoFocus type="text" placeholder="Meno..." value={petName} onChange={e => setPetName(e.target.value)}
              className="input-base" />
            <input type="text" placeholder="Druh (napr. Labrador, Perzská mačka...)" value={petSpecies} onChange={e => setPetSpecies(e.target.value)}
              className="input-base" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Dátum narodenia</label>
              <input type="date" value={petBirth} onChange={e => setPetBirth(e.target.value)}
                className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
              Pridať miláčika
            </button>
          </form>
        </div>
      )}

      {/* Add event form */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowAddEvent(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Nová udalosť — {pets.find(p => p.id === showAddEvent)?.name}
              </h3>
              <button onClick={() => setShowAddEvent(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addPetEvent} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setEvtType(t.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${
                      evtType === t.id ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300' :
                      'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Dátum</label>
                  <input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Ďalší termín</label>
                  <input type="date" value={evtNext} onChange={e => setEvtNext(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <input type="text" placeholder="Poznámka..." value={evtNotes} onChange={e => setEvtNotes(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95">
                Uložiť udalosť
              </button>
            </form>
          </div>
        </div>
      )}

      {!showAddPet && (
        <button onClick={() => setShowAddPet(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10">
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
