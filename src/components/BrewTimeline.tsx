import * as React from 'react'
import { motion } from 'motion/react'
import { BREW_LENGTH, PHASES, formatClock } from '@/lib/brew'
import { cn } from '@/lib/utils'

type Props = { elapsed: number; onSeek: (t: number) => void; className?: string }

/** Phase strip with a draggable playhead. Dragging seeks the Theatre sequence. */
export function BrewTimeline({ elapsed, onSeek, className }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scrubbing, setScrubbing] = React.useState(false)
  const pct = Math.min(elapsed / BREW_LENGTH, 1) * 100

  const seekTo = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect()
    onSeek(((clientX - r.left) / r.width) * BREW_LENGTH)
  }

  return (
    <div className={className}>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Brew timeline"
        aria-valuemin={0}
        aria-valuemax={BREW_LENGTH}
        aria-valuenow={Math.round(elapsed)}
        aria-valuetext={formatClock(elapsed)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setScrubbing(true)
          seekTo(e.clientX)
        }}
        onPointerMove={(e) => scrubbing && seekTo(e.clientX)}
        onPointerUp={() => setScrubbing(false)}
        onPointerCancel={() => setScrubbing(false)}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 15 : 5
          if (e.key === 'ArrowRight') onSeek(elapsed + d)
          else if (e.key === 'ArrowLeft') onSeek(elapsed - d)
          else return
          e.preventDefault()
        }}
        className="group relative h-10 cursor-pointer touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="absolute inset-x-0 top-1/2 flex h-2.5 -translate-y-1/2 gap-0.5 overflow-hidden rounded-full">
          {PHASES.map((p) => (
            <div
              key={p.id}
              title={p.title}
              className={cn('h-full', p.pour !== undefined ? 'bg-cherry/35' : 'bg-foreground/12')}
              style={{ width: `${((p.end - p.start) / BREW_LENGTH) * 100}%` }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center" style={{ width: `${pct}%` }}>
          <div className="h-2.5 w-full rounded-full bg-cherry" />
        </div>
        <motion.div
          className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-background bg-cherry shadow-md"
          style={{ left: `${pct}%` }}
          animate={{ scale: scrubbing ? 1.3 : 1 }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.68rem] text-muted-foreground tnum">
        <span>0:00</span>
        <span>{formatClock(BREW_LENGTH).replace(/^0/, '')}</span>
      </div>
    </div>
  )
}
