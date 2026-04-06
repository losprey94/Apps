import { useLocalStorage } from './useLocalStorage'

export function useHistory() {
  const [, setHistory] = useLocalStorage('activity-history', [])

  const addEvent = (section, icon, action, itemName) => {
    setHistory(prev => [{
      id: Date.now() + Math.random(),
      date: new Date().toISOString(),
      section,
      icon,
      action,
      itemName,
    }, ...prev].slice(0, 300))
  }

  return { addEvent }
}

export function useHistoryLog() {
  const [history] = useLocalStorage('activity-history', [])
  return history
}
