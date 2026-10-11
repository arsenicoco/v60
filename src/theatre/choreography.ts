import { BREW_LENGTH, PHASES } from '@/lib/brew'

/**
 * The brew choreography as Theatre.js project state.
 *
 * Theatre normally gets this JSON from Studio's export. Here it is generated
 * from the recipe in `brew.ts`, so changing a phase time moves the animation
 * with it. To hand-tune the motion, open the app with `?studio` in dev, tweak
 * the curves, export, and pass the exported JSON to `getProject` instead.
 */

type Key = [time: number, value: number]

const EASE: [number, number, number, number] = [0.5, 1, 0.5, 0]

let nextId = 0
const id = () => `k${(nextId++).toString(36)}`

function track(debugName: string, keys: Key[]) {
  // Ramps can land on the same time as a previous key; Theatre wants unique positions.
  const byTime = new Map(keys.map(([t, v]) => [t, v]))
  keys = [...byTime].sort((a, b) => a[0] - b[0])
  return {
    type: 'BasicKeyframedTrack',
    __debugName: debugName,
    keyframes: keys.map(([position, value]) => ({
      id: id(),
      position,
      value,
      connectedRight: true,
      handles: EASE,
      type: 'bezier',
    })),
  }
}

function object(name: string, props: Record<string, Key[]>) {
  const trackData: Record<string, ReturnType<typeof track>> = {}
  const trackIdByPropPath: Record<string, string> = {}
  for (const [prop, keys] of Object.entries(props)) {
    const tid = `${name}-${prop}`
    trackData[tid] = track(`${name}:${prop}`, keys)
    trackIdByPropPath[JSON.stringify([prop])] = tid
  }
  return { trackData, trackIdByPropPath }
}

const pours = PHASES.filter((p) => p.pour !== undefined)

/** Pour level climbs one whole step per pour (see `scaleWeightAt`). */
function pourLevel(): Key[] {
  const keys: Key[] = [[0, 0]]
  pours.forEach((p, i) => keys.push([p.start, i], [p.end, i + 1]))
  return keys
}

/** Stream on during pours, with a short ramp at each end. */
function stream(): Key[] {
  const keys: Key[] = [[0, 0]]
  for (const p of pours) keys.push([p.start, 0], [p.start + 0.8, 1], [p.end - 0.8, 1], [p.end, 0])
  return keys
}

function kettleTilt(): Key[] {
  const keys: Key[] = [[0, 0]]
  for (const p of pours) keys.push([Math.max(0, p.start - 1.5), 0], [p.start + 0.5, 1], [p.end - 0.5, 1], [p.end + 1.5, 0])
  return keys
}

/** Spiral pour: the spout sways side to side while pouring. */
function kettleSway(): Key[] {
  const keys: Key[] = [[0, 0]]
  for (const p of pours) {
    keys.push([p.start, 0])
    let side = 1
    for (let t = p.start + 1.25; t < p.end - 1; t += 2.5) {
      keys.push([t, side])
      side = -side
    }
    keys.push([p.end, 0])
  }
  return keys
}

/** Swirl phases wobble the slurry. */
function swirl(): Key[] {
  const keys: Key[] = [[0, 0]]
  for (const id of ['bloom-rest', 'swirl'] as const) {
    const p = PHASES.find((ph) => ph.id === id)!
    keys.push([p.start, 0], [p.start + 1, 1], [p.start + 2, -1], [p.start + 3, 0.6], [p.start + 4.5, 0])
  }
  return keys
}

export function buildBrewState() {
  return {
    sheetsById: {
      Brew: {
        staticOverrides: { byObject: {} },
        sequence: {
          type: 'PositionalSequence',
          length: BREW_LENGTH,
          subUnitsPerUnit: 30,
          tracksByObject: {
            Kettle: object('Kettle', { tilt: kettleTilt(), sway: kettleSway() }),
            Pour: object('Pour', { level: pourLevel(), stream: stream() }),
            Dripper: object('Dripper', {
              slurry: [[0, 0], [10, 0.38], [45, 0.22], [70, 0.72], [90, 0.5], [115, 0.95], [125, 0.88], [205, 0.04], [210, 0]],
              bloom: [[0, 0], [14, 1], [45, 0.35], [60, 0]],
              swirl: swirl(),
            }),
            Carafe: object('Carafe', {
              fill: [[0, 0], [16, 0], [45, 0.06], [90, 0.3], [125, 0.56], [210, 1]],
              drip: [[0, 0], [14, 0], [16, 1], [205, 1], [212, 0]],
            }),
          },
        },
      },
    },
    definitionVersion: '0.4.0',
    revisionHistory: [],
  }
}
