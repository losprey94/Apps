import { useEffect, useRef, useState, useCallback } from 'react'
import { useSync } from '../context/SyncContext'

export function useFamilyNotifications(uid, displayName) {
  const { householdData, updateHousehold, isConnected } = useSync()
  const sessionStart = useRef(Date.now())
  const seenIds = useRef(new Set())
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const notifs = householdData?.notifications
    if (!Array.isArray(notifs)) return

    notifs.forEach(n => {
      if (seenIds.current.has(n.id)) return
      seenIds.current.add(n.id)
      if (n.byUid === uid) return                        // own action — skip
      if (n.timestamp < sessionStart.current) return    // pre-session notif — skip

      // Browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${n.icon} ${n.action}`, {
          body: `${n.itemName}${n.byName ? ` · ${n.byName}` : ''}`,
          icon: './icon-192.png',
          tag: `fam-${n.id}`,
        })
      }

      // In-app toast (keep max 4, auto-dismiss after 5s)
      const toastId = n.id
      setToasts(prev => [...prev.slice(-3), { ...n, toastId }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 5000)
    })
  }, [householdData?.notifications, uid])

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  const pushNotif = useCallback(async (icon, action, itemName) => {
    if (!isConnected) return
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      byUid: uid || 'anon',
      byName: displayName || '',
      icon,
      action,
      itemName,
    }
    const current = Array.isArray(householdData?.notifications) ? householdData.notifications : []
    await updateHousehold('notifications', [entry, ...current].slice(0, 50))
  }, [isConnected, uid, displayName, householdData?.notifications, updateHousehold])

  return { toasts, dismissToast, pushNotif }
}
