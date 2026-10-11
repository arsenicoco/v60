import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconRotate, IconVolume, IconVolumeOff } from '@tabler/icons-react'
import { SplitFlapDisplay } from '@/components/ui/split-flap-display'
import { SlideToConfirm } from '@/components/spaceui/slide-to-confirm'
import { Button } from '@/components/spaceui/button-squircle'
import { BrewTimeline } from '@/components/BrewTimeline'
import { PHASES, formatClock, phaseAt, pourTargets, type Phase } from '@/lib/brew'
import type { useBrewClock } from '@/hooks/useBrewClock'
import { cn } from '@/lib/utils'

type Clock = ReturnType<typeof useBrewClock>
type Props = { clock: Clock; coffee: number; water: number; weight: number }

export function BrewPanel({ clock, coffee, water, weight }: Props) {
  const { status, elapsed } = clock
  const phase = phaseAt(elapsed)
  const targets = pourTargets(coffee, water)
  const [sound, setSound] = React.useState(true)
  usePhaseCue(status === 'running' ? phase.id : null, sound)

  // Space toggles pause while a brew is on.
  React.useEffect(() => {
    if (status === 'idle') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement).closest('input,button,[role=slider],[role=spinbutton]')) return
      e.preventDefault()
      if (status === 'running') clock.pause()
      else clock.resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, clock])

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === 'idle' ? (
        <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <h2 className="font-display text-xl font-semibold">Your pours</h2>
          <ol className="mt-3 space-y-1.5">
            {PHASES.filter((p) => p.id !== 'done').map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-baseline gap-3 text-sm"
              >
                <span className="w-10 font-mono text-xs text-muted-foreground tnum">{formatClock(p.start).replace(/^0/, '')}</span>
                <span className={cn('flex-1', p.pour === undefined && 'text-muted-foreground')}>{p.title}</span>
                {p.pour !== undefined && (
                  <span className="font-mono tnum font-medium">
                    → <AnimatedGrams value={targets[p.pour]} />
                  </span>
                )}
              </motion.li>
            ))}
          </ol>
          <div className="mt-5 flex justify-center">
            <SlideToConfirm label="Slide to start brewing" confirmedLabel="Brewing" resetDelay={600} onConfirm={() => {
                primeAudio()
                setTimeout(clock.start, 350)
              }} />
          </div>
        </motion.div>
      ) : (
        <motion.div key="brewing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-5xl font-medium tracking-tight tnum sm:text-6xl" aria-live="off">
                <RollingClock seconds={elapsed} />
              </div>
              <NextUp phase={phase} elapsed={elapsed} />
            </div>
            <div className="text-right">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Scale</div>
              <div className="font-display text-4xl font-semibold tnum">
                {weight}
                <span className="text-lg text-muted-foreground">g</span>
              </div>
              {phase.pour !== undefined && (
                <div className="text-sm whitespace-nowrap text-cherry">
                  pour to <span className="font-mono font-semibold">{targets[phase.pour]} g</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-hidden">
            <div className="origin-left max-[400px]:scale-[0.82]">
              <SplitFlapDisplay text={phase.board} columns={10} size="sm" accentColor="#e0405a" staggerDelay={25} flipSpeed={28} />
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase.id}
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              className="mt-2 text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span className="font-medium text-foreground">{phase.title}.</span> {phase.hint}
            </motion.p>
          </AnimatePresence>

          <BrewTimeline className="mt-4" elapsed={elapsed} onSeek={clock.seek} />

          <div className="mt-4 flex items-center gap-2">
            {status === 'running' ? (
              <Button variant="primary" onClick={clock.pause} className="flex-1" hover>
                <IconPlayerPauseFilled /> Pause
              </Button>
            ) : (
              <Button variant="primary" onClick={clock.resume} className="flex-1" hover>
                <IconPlayerPlayFilled /> Resume
              </Button>
            )}
            <Button variant="base" onClick={clock.reset} hover>
              <IconRotate /> Reset
            </Button>
            <Button variant="base" size="icon" onClick={() => setSound((s) => !s)} aria-label={sound ? 'Mute cues' : 'Unmute cues'} aria-pressed={!sound}>
              {sound ? <IconVolume /> : <IconVolumeOff />}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NextUp({ phase, elapsed }: { phase: Phase; elapsed: number }) {
  const next = PHASES[PHASES.indexOf(phase) + 1]
  if (!next) return <div className="mt-1 text-sm text-muted-foreground">{elapsed > phase.end ? `+${formatClock(elapsed - phase.end)} over` : 'Nearly there'}</div>
  return (
    <div className="mt-1 text-sm text-muted-foreground">
      {next.title} in <span className="font-mono tnum text-foreground">{Math.ceil(phase.end - elapsed)}s</span>
    </div>
  )
}

/** mm:ss where each digit rolls when it changes. */
function RollingClock({ seconds }: { seconds: number }) {
  return (
    <span className="inline-flex">
      {formatClock(seconds)
        .split('')
        .map((ch, i) => (
          <span key={i} className="relative inline-block h-[1.1em] overflow-hidden" style={{ width: ch === ':' ? '0.5em' : '0.6em' }}>
            <AnimatePresence initial={false}>
              <motion.span
                key={ch}
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 text-center"
              >
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
    </span>
  )
}

function AnimatedGrams({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={value} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="inline-block">
        {value} g
      </motion.span>
    </AnimatePresence>
  )
}

let audio: AudioContext | null = null

/** Browsers only allow audio after a gesture, so unlock it when the brew starts. */
function primeAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // Audio is a nicety; ignore browsers that block it.
  }
}

/** A short two-note chime and a buzz whenever the phase changes mid-brew. */
function usePhaseCue(phaseId: string | null, enabled: boolean) {
  const prev = React.useRef(phaseId)
  React.useEffect(() => {
    const changed = phaseId && prev.current && phaseId !== prev.current
    prev.current = phaseId
    if (!changed || !enabled) return
    navigator.vibrate?.(60)
    if (!audio) return
    try {
      const ac = audio
      ;[880, 1320].forEach((f, i) => {
        const o = ac.createOscillator()
        const g = ac.createGain()
        const t = ac.currentTime + i * 0.12
        o.frequency.value = f
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
        o.connect(g).connect(ac.destination)
        o.start(t)
        o.stop(t + 0.4)
      })
    } catch {
      // Audio is a nicety; ignore browsers that block it.
    }
  }, [phaseId, enabled])
}
