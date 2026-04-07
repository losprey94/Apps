import { useState, useEffect } from 'react'

const CACHE_KEY = 'weather-cache'
const CACHE_MS  = 30 * 60 * 1000 // 30 min

function wmoInfo(code) {
  if (code === 0)              return { text: 'Jasno',               emoji: '☀️' }
  if (code === 1)              return { text: 'Prevažne jasno',      emoji: '🌤️' }
  if (code === 2)              return { text: 'Čiastočne zamračené', emoji: '⛅' }
  if (code === 3)              return { text: 'Zamračené',           emoji: '☁️' }
  if ([45,48].includes(code))  return { text: 'Hmla',                emoji: '🌫️' }
  if ([51,53].includes(code))  return { text: 'Mrholenie',           emoji: '🌦️' }
  if (code === 55)             return { text: 'Silné mrholenie',     emoji: '🌦️' }
  if ([61,63].includes(code))  return { text: 'Dážď',               emoji: '🌧️' }
  if (code === 65)             return { text: 'Silný dážď',         emoji: '⛈️' }
  if ([71,73,75,77].includes(code)) return { text: 'Sneženie',      emoji: '❄️' }
  if ([80,81,82].includes(code)) return { text: 'Prehánky',         emoji: '🌦️' }
  if ([85,86].includes(code))  return { text: 'Snehové prehánky',   emoji: '🌨️' }
  if (code === 95)             return { text: 'Búrka',               emoji: '⛈️' }
  if ([96,99].includes(code))  return { text: 'Búrka s krúpami',    emoji: '⛈️' }
  return                              { text: 'Neznáme',             emoji: '🌡️' }
}

export function useWeather() {
  const [weather, setWeather]           = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY))
      return c && Date.now() - c.updatedAt < CACHE_MS ? c : null
    } catch { return null }
  })
  const [loading, setLoading]           = useState(false)
  const [locationDenied, setDenied]     = useState(false)

  const load = async (lat, lon) => {
    try {
      const [wRes, gRes] = await Promise.allSettled([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`),
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=sk`, {
          headers: { 'Accept-Language': 'sk' }
        }),
      ])

      if (wRes.status !== 'fulfilled') throw new Error('weather fetch failed')
      const wData = await wRes.value.json()
      const cur   = wData.current
      const info  = wmoInfo(cur.weather_code)

      let city = ''
      if (gRes.status === 'fulfilled') {
        const gData = await gRes.value.json()
        city = gData.address?.city || gData.address?.town || gData.address?.village || gData.address?.county || ''
      }

      const result = {
        temp:      Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        wind:      Math.round(cur.wind_speed_10m),
        city,
        ...info,
        updatedAt: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(result))
      setWeather(result)
    } catch {
      // fail silently — weather is optional
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) return
    setLoading(true)
    setDenied(false)
    navigator.geolocation.getCurrentPosition(
      pos => load(pos.coords.latitude, pos.coords.longitude),
      err => { setLoading(false); if (err.code === 1) setDenied(true) },
      { timeout: 10000, maximumAge: CACHE_MS }
    )
  }

  // refresh: used by the "Skúsiť znova" button — always asks for location
  const refresh = requestLocation

  useEffect(() => {
    // On mount: only load from cache, never auto-request location
    // (auto-requests without user gesture are silently blocked on mobile)
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY))
      if (c && Date.now() - c.updatedAt < CACHE_MS) {
        setWeather(c)
        return
      }
    } catch {}
    // Cache empty or expired — show the "tap to enable" card, don't auto-request
  }, [])

  return { weather, loading, locationDenied, refresh }
}
