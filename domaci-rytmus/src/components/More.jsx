import { useLocalStorage } from '../hooks/useLocalStorage'
import { useSyncedStorage } from '../context/SyncContext'

const SECTIONS = [
  { id: 'mealplan',  label: 'Jedálniček', emoji: '🍽️', desc: 'Týždenný plán jedál',             color: 'orange' },
  { id: 'budget',    label: 'Rozpočet',   emoji: '💶', desc: 'Výdavky a úspory',                color: 'emerald' },
  { id: 'pets',      label: 'Zvieratá',   emoji: '🐾', desc: 'Starostlivosť o miláčikov',       color: 'amber'  },
  { id: 'energy',    label: 'Energie',    emoji: '⚡', desc: 'Odpočty meračov',                  color: 'orange' },
  { id: 'contacts',  label: 'Kontakty',   emoji: '📞', desc: 'Dôležité telefóny',               color: 'indigo' },
  { id: 'history',   label: 'História',   emoji: '📋', desc: 'Prehľad aktivít',                 color: 'slate'  },
  { id: 'family',    label: 'Rodina',     emoji: '👨‍👩‍👧', desc: 'Členovia a zdieľanie',          color: 'rose'   },
  { id: 'settings',  label: 'Nastavenia', emoji: '⚙️', desc: 'Profil, téma, dáta',             color: 'slate'  },
]

const COLORS = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-200 dark:border-amber-800',   text: 'text-amber-600 dark:text-amber-400' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600 dark:text-indigo-400' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-700/50',   border: 'border-slate-200 dark:border-slate-600',   text: 'text-slate-600 dark:text-slate-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/30',     border: 'border-rose-200 dark:border-rose-800',     text: 'text-rose-600 dark:text-rose-400' },
}

function filterByPeriod(expenses, period) {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
    return d >= mon && d <= sun
  })
}

export default function More({ onNavigate }) {
  const [pets] = useLocalStorage('pets', [])
  const [contacts] = useLocalStorage('contacts', [])
  const [history] = useLocalStorage('activity-history', [])
  const [members] = useLocalStorage('family-members', [])
  const [energyReadings] = useLocalStorage('energy-readings', {})
  const [budgetConfig] = useSyncedStorage('budget-config', { period: 'monthly', totalBudget: 1000, categories: [] })
  const [budgetExpenses] = useSyncedStorage('budget-expenses', [])

  const readingsCount = Object.values(energyReadings).flat().length
  const periodExp     = filterByPeriod(budgetExpenses, budgetConfig.period)
  const budgetSpent   = periodExp.reduce((s, e) => s + e.amount, 0)
  const budgetPct     = Math.round((budgetSpent / budgetConfig.totalBudget) * 100)

  const [mealPlan] = useSyncedStorage('meal-plan', {})
  const todayMeals = Object.values(mealPlan[new Date().toISOString().split('T')[0]] || {}).flatMap(g => Object.values(g)).filter(Boolean).length

  const badges = {
    mealplan: todayMeals,
    budget:   budgetExpenses.length,
    pets:     pets.length,
    energy:   readingsCount,
    contacts: contacts.length,
    history:  history.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length,
    family:   members.length,
    settings: 0,
  }

  const hints = {
    mealplan: todayMeals > 0 ? `Dnes ${todayMeals} jedál naplánovaných` : 'Naplánuj jedálniček',
    budget:   budgetExpenses.length > 0 ? `${budgetPct}% z rozpočtu minuto` : 'Nastav mesačný rozpočet',
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
