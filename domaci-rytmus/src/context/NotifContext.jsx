import { createContext, useContext } from 'react'
import { useFamilyNotifications } from '../hooks/useFamilyNotifications'

const NotifContext = createContext({ toasts: [], dismissToast: () => {}, pushNotif: async () => {} })

export function NotifProvider({ uid, displayName, children }) {
  const value = useFamilyNotifications(uid, displayName)
  return <NotifContext.Provider value={value}>{children}</NotifContext.Provider>
}

export function useNotif() {
  return useContext(NotifContext)
}
