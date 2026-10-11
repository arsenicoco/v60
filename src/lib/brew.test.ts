import { describe, expect, test } from 'bun:test'
import {
  BREW_LENGTH,
  PHASES,
  coffeeForWater,
  phaseAt,
  pourTargets,
  scaleWeightAt,
  waterForCoffee,
  formatClock,
} from './brew'

describe('ratio math', () => {
  test('water is coffee times ratio, rounded to whole grams', () => {
    expect(waterForCoffee(15, 16)).toBe(240)
    expect(waterForCoffee(18.3, 15)).toBe(275)
  })

  test('coffee is water over ratio, rounded to 0.1 g', () => {
    expect(coffeeForWater(250, 16)).toBe(15.6)
    expect(coffeeForWater(300, 15)).toBe(20)
  })

  test('non-finite input yields 0 instead of NaN', () => {
    expect(waterForCoffee(Number.NaN, 16)).toBe(0)
    expect(coffeeForWater(Number.NaN, 16)).toBe(0)
  })
})

describe('pour targets', () => {
  test('bloom is twice the dose, then 60% and 100% of the water', () => {
    expect(pourTargets(15, 240)).toEqual([30, 144, 240])
  })
})

describe('scale weight over time', () => {
  // level 0..3 comes from the Theatre "pour" track: each whole number is a finished pour
  test('maps whole levels onto the pour targets', () => {
    expect(scaleWeightAt(0, 15, 240)).toBe(0)
    expect(scaleWeightAt(1, 15, 240)).toBe(30)
    expect(scaleWeightAt(2, 15, 240)).toBe(144)
    expect(scaleWeightAt(3, 15, 240)).toBe(240)
  })

  test('interpolates inside a pour', () => {
    expect(scaleWeightAt(1.5, 15, 240)).toBe(87)
  })

  test('clamps outside the range', () => {
    expect(scaleWeightAt(-1, 15, 240)).toBe(0)
    expect(scaleWeightAt(9, 15, 240)).toBe(240)
  })
})

describe('phases', () => {
  test('cover the whole brew without gaps', () => {
    expect(PHASES[0].start).toBe(0)
    for (let i = 1; i < PHASES.length; i++) expect(PHASES[i].start).toBe(PHASES[i - 1].end)
    expect(PHASES.at(-1)!.end).toBe(BREW_LENGTH)
  })

  test('phaseAt finds the phase for a time and clamps past the end', () => {
    expect(phaseAt(0).id).toBe('bloom')
    expect(phaseAt(30).id).toBe('bloom-rest')
    expect(phaseAt(BREW_LENGTH + 100).id).toBe('done')
  })
})

test('formatClock pads minutes and seconds', () => {
  expect(formatClock(0)).toBe('00:00')
  expect(formatClock(75.9)).toBe('01:15')
  expect(formatClock(240)).toBe('04:00')
})
