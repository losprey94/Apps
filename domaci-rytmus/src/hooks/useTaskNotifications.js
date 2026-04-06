import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Fires a browser notification once per day when:
 * - notifications-enabled is true AND permission is granted
 * - there are tasks with deadline <= today
 *
 * Also schedules a daily reminder at the user-chosen time using setTimeout
 * (works as long as the app stays open in background — best effort).
 */
export function useTaskNotifications(tasks) {
  const [notifEnabled]    = useLocalStorage('notifications-enabled', false)
  const [lastNotified, setLastNotified] = useLocalStorage('last-notified-date', '')
  const [reminderTime]    = useLocalStorage('reminder-time', '08:00')

  // ── Fire once-per-day notification on app open ─────────────────────────────
  useEffect(() => {
    if (!notifEnabled) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!tasks?.length) return

    const today = todayISO()
    if (lastNotified === today) return

    const due      = tasks.filter(t => t.deadline && t.deadline < today)
    const dueToday = tasks.filter(t => t.deadline && t.deadline === today)
    const all      = [...dueToday, ...due]
    if (all.length === 0) return

    const lines = []
    if (dueToday.length) lines.push(`Dnes: ${dueToday.map(t => t.name).slice(0, 2).join(', ')}`)
    if (due.length)      lines.push(`Oneskorené: ${due.slice(0, 2).map(t => t.name).join(', ')}`)

    try {
      new Notification('🏠 Domáci Rytmus', {
        body: lines.join('\n'),
        icon: './icon-192.png',
        tag: 'domaci-rytmus-daily',
        requireInteraction: false,
      })
      setLastNotified(today)
    } catch (e) {
      console.warn('Notification error:', e)
    }
  }, [tasks, notifEnabled, lastNotified, setLastNotified])

  // ── Schedule daily reminder at chosen time ─────────────────────────────────
  useEffect(() => {
    if (!notifEnabled) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!reminderTime) return

    const now   = new Date()
    const [hh, mm] = reminderTime.split(':').map(Number)
    const target = new Date(now)
    target.setHours(hh, mm, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1) // schedule for tomorrow

    const ms = target - now
    const timerId = setTimeout(() => {
      const today  = todayISO()
      const urgent = (tasks || []).filter(t => t.deadline && t.deadline <= today)
      if (!urgent.length) return
      try {
        new Notification('🏠 Domáci Rytmus — Pripomienka', {
          body: urgent.slice(0, 3).map(t => `• ${t.name}`).join('\n'),
          icon: './icon-192.png',
          tag: 'domaci-rytmus-reminder',
        })
      } catch {}
    }, ms)

    return () => clearTimeout(timerId)
  }, [notifEnabled, reminderTime, tasks])
}
