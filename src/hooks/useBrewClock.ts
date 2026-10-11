import { useCallback, useEffect, useRef, useState } from 'react'
import { BREW_LENGTH } from '@/lib/brew'
import { sheet } from '@/theatre/brewSheet'

export type ClockStatus = 'idle' | 'running' | 'paused'

/**
 * Wall-clock timer that drives the Theatre sequence playhead. The timer keeps
 * counting after the choreography ends (like the old 4:00 timer would let you
 * see overtime), while the sequence clamps at its last frame.
 */
export function useBrewClock() {
  const [status, setStatus] = useState<ClockStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const origin = useRef(0) // performance.now() at which elapsed was 0
  const pausedAt = useRef(0)

  const apply = useCallback((t: number) => {
    setElapsed(t)
    sheet.sequence.position = Math.min(t, BREW_LENGTH)
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    let raf = 0
    const tick = () => {
      apply((performance.now() - origin.current) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [status, apply])

  const start = useCallback(() => {
    origin.current = performance.now()
    apply(0)
    setStatus('running')
  }, [apply])

  const pause = useCallback(() => {
    pausedAt.current = (performance.now() - origin.current) / 1000
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    origin.current = performance.now() - pausedAt.current * 1000
    setStatus('running')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    apply(0)
  }, [apply])

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(t, BREW_LENGTH))
      origin.current = performance.now() - clamped * 1000
      pausedAt.current = clamped
      setStatus((s) => (s === 'idle' ? 'paused' : s))
      apply(clamped)
    },
    [apply],
  )

  return { status, elapsed, start, pause, resume, reset, seek }
}
