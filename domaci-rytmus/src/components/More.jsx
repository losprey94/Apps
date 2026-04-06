import { useLocalStorage } from '../hooks/useLocalStorage'

const SECTIONS = [
  { id: 'pets',      label: 'Zvieratá',  emoji: '🐾', desc: 'Starostlivosť o miláčikov',    color: 'amber'  },
  { id: 'energy',    label: 'Energie',   emoji: '⚡', desc: 'Odpočty meračov',               color: 'orange' },
  { id: 'contacts',  label: 'Kontakty',  emoji: '📞', desc: 'Dôležité telefóny',             color: 'indigo' },
  { id: 'history',   label: 'História',  emoji: '📋', desc: 'Prehľad aktivít',               color: 'slate'  },
  { id: 'family',    label: 'Rodina',    emoji: '👨‍👩‍👧', desc: 'Členovia a zdieľanie',        color: 'rose'   },
  { id: 'settings',  label: 'Nastavenia',emoji: '⚙️', desc: 'Profil, téma, dáta',           color: 'slate'  },
]

const COLORS = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-200 dark:border-amber-800',   text: 'text-amber-600 dark:text-amber-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600 dark:text-indigo-400' },
  slate:  { bg: 'bg-slate-50 dark:bg-slate-700/50',   border: 'border-slate-200 dark:border-slate-600',   text: 'text-slate-600 dark:text-slate-400' },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-900/30',     border: 'border-rose-200 dark:border-rose-800',     text: 'text-rose-600 dark:text-rose-400' },
}

export default function More({ onNavigate }) {
  const [pets] = useLocalStorage('pets', [])
  const [contacts] = useLocalStorage('contacts', [])
  const [history] = useLocalStorage('activity-history', [])
  const [members] = useLocalStorage('family-members', [])
  const [energyReadings] = useLocalStorage('energy-readings', {})

  const readingsCount = Object.values(energyReadings).flat().length

  const badges = {
    pets:     pets.length,
    energy:   readingsCount,
    contacts: contacts.length,
    history:  history.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length,
    family:   members.length,
    settings: 0,
  }

  const hints = {
    pets:     pets.length > 0 ? `${pets.length} miláčikov` : 'Pridaj miláčika',
    energy:   readingsCount > 0 ? `${readingsCount} záznamov` : 'Žiadne záznamy',
    contacts: contacts.length > 0 ? `${contacts.length} kontaktov` : 'Záchranné čísla',
    history:  `${history.length} akcií celkom`,
    family:   members.length > 0 ? members.map(m => m.name).slice(0, 2).join(', ') : 'Pridaj člena',
    settings: 'Profil, téma, dáta',
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">Ďalšie sekcie</div>
      <div className="grid grid-cols-2 gap-3">
        {SECTIONS.map(section => {
          const c = COLORS[section.color]
          const badge = badges[section.id]
          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`bg-white dark:bg-slate-800 rounded-2xl border ${c.border} shadow-sm p-4 flex flex-col items-start gap-2 text-left active:scale-95 transition-transform hover:shadow-md`}
            >
              <div className="flex items-start justify-between w-full">
                <div className={`text-2xl p-2 rounded-xl ${c.bg}`}>{section.emoji}</div>
                {badge > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                    {badge}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{section.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{hints[section.id]}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
