import * as React from 'react'
import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/spaceui/button-squircle'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  decimals?: number
  unit: string
  className?: string
}

const PX_PER_STEP = 6

/**
 * A big number you can drag sideways to scrub, click to type, or nudge with
 * arrow keys (shift = ×10). The readout springs to new values.
 */
export function ScrubNumber({ label, value, onChange, min, max, step, decimals = 0, unit, className }: Props) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef<{ x: number; start: number; moved: boolean } | null>(null)

  const spring = useSpring(value, { stiffness: 260, damping: 30 })
  React.useEffect(() => spring.set(value), [spring, value])
  const text = useTransform(spring, (v) => v.toFixed(decimals))
  const nudge = useMotionValue(0)

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step))

  const commit = (v: number) => {
    const next = clamp(v)
    if (next === value && (v < min || v > max)) {
      // Hit the stop: a small rubber-band shake.
      animate(nudge, [0, v < min ? -6 : 6, 0], { duration: 0.3 })
    }
    if (next !== value) onChange(Number(next.toFixed(decimals)))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, start: value, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 3) {
      d.moved = true
      setDragging(true)
    }
    if (d.moved) commit(d.start + Math.round(dx / PX_PER_STEP) * step)
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (d && !d.moved) {
      setDraft(value.toFixed(decimals))
      setEditing(true)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const mult = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') commit(value + step * mult)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') commit(value - step * mult)
    else if (e.key === 'Enter') {
      setDraft(value.toFixed(decimals))
      setEditing(true)
    } else return
    e.preventDefault()
  }

  return (
    <div className={cn('group relative', className)}>
      <div className="mb-1 flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span>{label}</span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100 max-sm:hidden">drag ↔ · click to type</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="base" size="icon" aria-label={`Less ${label.toLowerCase()}`} onClick={() => commit(value - step * (decimals ? 5 : 10))}>
          <IconMinus />
        </Button>
        <motion.div
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${value} ${unit}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          style={{ x: nudge }}
          animate={{ scale: dragging ? 1.04 : 1 }}
          className={cn(
            'relative flex min-w-0 flex-1 touch-none items-baseline justify-center gap-1 rounded-2xl px-2 py-1 outline-none select-none',
            'focus-visible:ring-2 focus-visible:ring-ring',
            editing ? 'cursor-text' : 'cursor-ew-resize',
          )}
        >
          {editing ? (
            <input
              autoFocus
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setEditing(false)
                const n = parseFloat(draft.replace(',', '.'))
                if (Number.isFinite(n)) commit(n)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="font-display tnum w-full min-w-0 bg-transparent text-center text-6xl font-semibold tracking-tight outline-none sm:text-7xl"
            />
          ) : (
            <motion.span className="font-display tnum text-6xl font-semibold tracking-tight sm:text-7xl">{text}</motion.span>
          )}
          <span className="text-lg font-medium text-muted-foreground">{unit}</span>
        </motion.div>
        <Button variant="base" size="icon" aria-label={`More ${label.toLowerCase()}`} onClick={() => commit(value + step * (decimals ? 5 : 10))}>
          <IconPlus />
        </Button>
      </div>
    </div>
  )
}
