/** Total length of the guided brew, in seconds. Matches the old 4:00 timer. */
export const BREW_LENGTH = 240

export type PhaseId = 'bloom' | 'bloom-rest' | 'pour-2' | 'rest-2' | 'pour-3' | 'swirl' | 'drawdown' | 'done'

export type Phase = {
  id: PhaseId
  /** Short label for the split-flap board (A–Z, digits and a few symbols only). */
  board: string
  title: string
  hint: string
  start: number
  end: number
  /** Index into `pourTargets` for phases where you pour. */
  pour?: 0 | 1 | 2
}

export const PHASES: Phase[] = [
  { id: 'bloom', board: 'BLOOM', title: 'Bloom', hint: 'Pour gently and wet all the grounds.', start: 0, end: 10, pour: 0 },
  { id: 'bloom-rest', board: 'WAIT', title: 'Let it bloom', hint: 'Swirl once and let the CO₂ escape.', start: 10, end: 45 },
  { id: 'pour-2', board: 'POUR 2', title: 'Second pour', hint: 'Slow spirals, keep off the paper.', start: 45, end: 70, pour: 1 },
  { id: 'rest-2', board: 'REST', title: 'Rest', hint: 'Let the level drop a little.', start: 70, end: 90 },
  { id: 'pour-3', board: 'FINAL POUR', title: 'Final pour', hint: 'Steady centre pour to the top.', start: 90, end: 115, pour: 2 },
  { id: 'swirl', board: 'SWIRL', title: 'Swirl', hint: 'A gentle swirl flattens the bed.', start: 115, end: 125 },
  { id: 'drawdown', board: 'DRAWDOWN', title: 'Drawdown', hint: 'Hands off. Aim to finish by 3:30.', start: 125, end: 210 },
  { id: 'done', board: 'ENJOY', title: 'Enjoy', hint: 'Remove the dripper and serve.', start: 210, end: BREW_LENGTH },
]

export const STRENGTHS = [
  { ratio: 15, label: 'Strong' },
  { ratio: 16, label: 'Normal' },
  { ratio: 17, label: 'Bright' },
  { ratio: 18, label: 'Light' },
] as const

const safe = (n: number) => (Number.isFinite(n) ? n : 0)

export function waterForCoffee(coffee: number, ratio: number) {
  return Math.round(safe(coffee * ratio))
}

export function coffeeForWater(water: number, ratio: number) {
  return Math.round(safe(water / ratio) * 10) / 10
}

/** Scale readings to stop each pour at: bloom (2× dose), 60%, 100%. */
export function pourTargets(coffee: number, water: number): [number, number, number] {
  return [Math.round(coffee * 2), Math.round(water * 0.6), Math.round(water)]
}

/**
 * Scale weight for a pour level from the Theatre "pour" track.
 * Level n means pour n is finished; fractions are mid-pour.
 */
export function scaleWeightAt(level: number, coffee: number, water: number) {
  const stops = [0, ...pourTargets(coffee, water)]
  const l = Math.min(Math.max(level, 0), stops.length - 1)
  const i = Math.min(Math.floor(l), stops.length - 2)
  return Math.round(stops[i] + (stops[i + 1] - stops[i]) * (l - i))
}

export function phaseAt(t: number): Phase {
  return PHASES.find((p) => t < p.end) ?? PHASES[PHASES.length - 1]
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
