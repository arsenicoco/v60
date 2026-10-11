import { getProject, types } from '@theatre/core'
import { useEffect, useState } from 'react'
import { buildBrewState } from './choreography'

const project = getProject('V60', { state: buildBrewState() })
export const sheet = project.sheet('Brew')

const n = (v: number, range: [number, number]) => types.number(v, { range })

export const objects = {
  kettle: sheet.object('Kettle', { tilt: n(0, [0, 1]), sway: n(0, [-1, 1]) }),
  pour: sheet.object('Pour', { level: n(0, [0, 3]), stream: n(0, [0, 1]) }),
  dripper: sheet.object('Dripper', { slurry: n(0, [0, 1]), bloom: n(0, [0, 1]), swirl: n(0, [-1, 1]) }),
  carafe: sheet.object('Carafe', { fill: n(0, [0, 1]), drip: n(0, [0, 1]) }),
}

type Obj = (typeof objects)[keyof typeof objects]

/** Subscribe a component to a Theatre object's animated values. */
export function useTheatre<O extends Obj>(obj: O): O['value'] {
  const [value, setValue] = useState(obj.value)
  useEffect(() => obj.onValuesChange((v) => setValue(v as O['value'])), [obj])
  return value
}

export const projectReady = project.ready
