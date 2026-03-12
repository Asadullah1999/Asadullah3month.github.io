// FahmiFit sound effects using Web Audio API (no external deps)
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.07, delay = 0) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  const start = c.currentTime + delay
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.01)
}

export const sounds = {
  /** Soft click — buttons, toggles */
  click: () => tone(900, 0.06, 'sine', 0.05),

  /** Navigation tap */
  nav: () => tone(660, 0.08, 'sine', 0.04),

  /** Success — 3-note ascending */
  success: () => {
    tone(523, 0.1, 'sine', 0.07, 0)
    tone(659, 0.1, 'sine', 0.07, 0.1)
    tone(784, 0.18, 'sine', 0.07, 0.2)
  },

  /** Error — low buzz */
  error: () => tone(200, 0.25, 'sawtooth', 0.05),

  /** Message sent */
  send: () => {
    tone(440, 0.05, 'sine', 0.06, 0)
    tone(880, 0.12, 'sine', 0.06, 0.05)
  },

  /** Message received */
  receive: () => {
    tone(660, 0.06, 'sine', 0.04, 0)
    tone(880, 0.1,  'sine', 0.04, 0.07)
  },

  /** Toggle / switch on */
  toggle: () => tone(750, 0.07, 'sine', 0.05),
}
