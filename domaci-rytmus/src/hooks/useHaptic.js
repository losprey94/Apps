export function useHaptic() {
  const vibe = (pattern) => {
    try {
      if (localStorage.getItem('haptic-enabled') === 'false') return
      if (navigator?.vibrate) navigator.vibrate(pattern)
    } catch {}
  }
  return {
    tap:     () => vibe(8),
    success: () => vibe([15, 40, 15]),
    done:    () => vibe([20, 30, 60]),
    error:   () => vibe([80, 30, 80]),
    light:   () => vibe(5),
  }
}
