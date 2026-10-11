import * as React from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useTheme } from 'next-themes'
import { GrainGradient } from '@/components/ui/grain-gradient'
import { ThemeToggleButton } from '@/components/spaceui/theme-toggle'
import { ScrubNumber } from '@/components/ScrubNumber'
import { StrengthPicker } from '@/components/StrengthPicker'
import { V60Scene } from '@/components/V60Scene'
import { BrewPanel } from '@/components/BrewPanel'
import { useBrewClock } from '@/hooks/useBrewClock'
import { usePersistentState } from '@/hooks/usePersistentState'
import { objects, useTheatre } from '@/theatre/brewSheet'
import { coffeeForWater, scaleWeightAt, waterForCoffee } from '@/lib/brew'
import { cn } from '@/lib/utils'

const CUPS = [
  { label: '1 cup', water: 250 },
  { label: 'Mug', water: 350 },
  { label: '2 cups', water: 500 },
]

export default function App() {
  const { coffee, water, ratio, setCoffee, setWater, setRatio } = useRecipe()
  const clock = useBrewClock()
  const pour = useTheatre(objects.pour)
  const weight = clock.status === 'idle' ? 0 : scaleWeightAt(pour.level, coffee, water)
  const brewing = clock.status !== 'idle'

  return (
    <MotionConfig reducedMotion="user">
      <Backdrop />
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-5 pb-10 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-semibold tracking-tight">V60 ratio</span>
          </div>
          <ThemeToggleButton variant="circle" buttonVariant="ghost" blur />
        </header>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-8 max-w-2xl font-display text-4xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl"
        >
          <span className="text-cherry">{coffee.toFixed(1).replace(/\.0$/, '')} g</span> of coffee,{' '}
          <span className="text-cherry">{water} g</span> of water.
        </motion.h1>

        <main className={cn('mt-8 grid gap-4 lg:gap-6', !brewing && 'lg:grid-cols-[1fr_1.1fr]')}>
          <AnimatePresence initial={false} mode="popLayout">
            {!brewing && (
              <motion.section
                key="calc"
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className={cn(card, 'space-y-6')}
                aria-label="Ratio calculator"
              >
                <ScrubNumber label="Coffee" value={coffee} onChange={setCoffee} min={5} max={60} step={0.1} decimals={1} unit="g" />
                <ScrubNumber
                  label="Water"
                  value={water}
                  onChange={setWater}
                  min={Math.ceil(5 * ratio)}
                  max={Math.floor(60 * ratio)}
                  step={1}
                  unit="g"
                />
                <div className="flex flex-wrap gap-2">
                  {CUPS.map((c) => {
                    const active = Math.abs(water - c.water) <= 2
                    return (
                      <motion.button
                        key={c.label}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setWater(c.water)}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                          active ? 'border-transparent bg-cherry text-white' : 'border-border hover:bg-muted',
                        )}
                      >
                        {c.label} <span className="font-mono text-xs opacity-70">{c.water}g</span>
                      </motion.button>
                    )
                  })}
                </div>
                <StrengthPicker ratio={ratio} onChange={setRatio} />
              </motion.section>
            )}
          </AnimatePresence>

          <motion.section
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={cn(
              card,
              'grid items-center gap-4',
              brewing
                ? 'sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10 lg:px-12'
                : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
            )}
            aria-label="Brew guide"
          >
            <motion.div
              layout="position"
              className={cn('mx-auto aspect-[3/4] w-full', brewing ? 'max-w-[240px] sm:max-w-[400px]' : 'max-w-[280px]')}
            >
              <V60Scene weight={weight} active={clock.status === 'running'} />
            </motion.div>
            <motion.div layout="position" className="min-w-0">
              <BrewPanel clock={clock} coffee={coffee} water={water} weight={weight} />
            </motion.div>
          </motion.section>
        </main>

        <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          Drag the numbers, or slide to brew. Bloom at 2× the dose, then 60% and 100% of the water.
        </footer>
      </div>
    </MotionConfig>
  )
}

/** Coffee and water stay linked by the ratio; whichever you touched last is kept when the ratio changes. */
function useRecipe() {
  const [coffee, setCoffeeRaw] = usePersistentState('v60.coffee', 15)
  const [water, setWaterRaw] = usePersistentState('v60.water', 240)
  const [ratio, setRatioRaw] = usePersistentState('v60.ratio', 16)
  const anchor = React.useRef<'coffee' | 'water'>('coffee')

  const setCoffee = (c: number) => {
    anchor.current = 'coffee'
    setCoffeeRaw(c)
    setWaterRaw(waterForCoffee(c, ratio))
  }
  const setWater = (w: number) => {
    anchor.current = 'water'
    setWaterRaw(w)
    setCoffeeRaw(coffeeForWater(w, ratio))
  }
  const setRatio = (r: number) => {
    setRatioRaw(r)
    if (anchor.current === 'coffee') setWaterRaw(waterForCoffee(coffee, r))
    else setCoffeeRaw(coffeeForWater(water, r))
  }
  return { coffee, water, ratio, setCoffee, setWater, setRatio }
}

const card =
  'rounded-[28px] border border-border bg-card p-5 shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_30px_60px_-30px_rgb(0_0_0/0.35)] backdrop-blur-xl sm:p-7'

function Backdrop() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== 'light'
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <GrainGradient
        key={dark ? 'dark' : 'light'}
        className="h-full w-full"
        colorLight={dark ? '#4a2a1d' : '#fbf3e8'}
        colorMid={dark ? '#7d2533' : '#f2c7b8'}
        colorDark={dark ? '#120b08' : '#ead8c2'}
        angle={-18}
        grain={dark ? 0.35 : 0.22}
        speed={0.6}
      />
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--cherry)" />
      <path d="M8 10h16l-6 11h-4z" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11 24h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
