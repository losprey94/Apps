import { useEffect, useRef, useState, useCallback } from 'react'
import { useSync } from '../context/SyncContext'
import { useLocalStorage } from './useLocalStorage'

export function useFamilyNotifications(uid, displayName) {
  const { householdData, updateHousehold, isConnected } = useSync()
  const sessionStart = useRef(Date.now())
  const seenIds = useRef(new Set())
  const [toasts, setToasts] = useState([])

  const [notifTasks]    = useLocalStorage('notif-family-tasks',    true)
  const [notifShopping] = useLocalStorage('notif-family-shopping', true)
  const [notifPlants]   = useLocalStorage('notif-family-plants',   true)

  const sectionAllowed = useCallback((section) => {
    if (section === 'tasks')    return notifTasks
    if (section === 'shopping') return notifShopping
    if (section === 'plants')   return notifPlants
    return true
  }, [notifTasks, notifShopping, notifPlants])

  useEffect(() => {
    const notifs = householdData?.notifications
    if (!Array.isArray(notifs)) return

    notifs.forEach(n => {
      if (seenIds.current.has(n.id)) return
      seenIds.current.add(n.id)
      if (n.byUid === uid) return                        // own action — skip
      if (n.timestamp < sessionStart.current) return    // pre-session notif — skip
      if (!sectionAllowed(n.section)) return            // user disabled this category

      // Browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${n.icon} ${n.action}`, {
          body: `${n.itemName}${n.byName ? ` · ${n.byName}` : ''}`,
          icon: './pwa-192x192.png',
          tag: `fam-${n.id}`,
        })
      }

      // In-app toast (keep max 4, auto-dismiss after 5s)
      const toastId = n.id
      setToasts(prev => [...prev.slice(-3), { ...n, toastId }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 5000)
    })
  }, [householdData?.notifications, uid, sectionAllowed])

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  // pushNotif(section, icon, action, itemName)
  const pushNotif = useCallback(async (section, icon, action, itemName) => {
    if (!isConnected) return
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      byUid: uid || 'anon',
      byName: displayName || '',
      section,
      icon,
      action,
      itemName,
    }
    const current = Array.isArray(householdData?.notifications) ? householdData.notifications : []
    await updateHousehold('notifications', [entry, ...current].slice(0, 50))
  }, [isConnected, uid, displayName, householdData?.notifications, updateHousehold])

  return { toasts, dismissToast, pushNotif }
}
