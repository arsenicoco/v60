import { motion } from 'motion/react'
import { STRENGTHS } from '@/lib/brew'
import { TickSlider } from '@/components/spaceui/tick-slider'
import { cn } from '@/lib/utils'

type Props = { ratio: number; onChange: (r: number) => void }

export function StrengthPicker({ ratio, onChange }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span>Strength</span>
        <span className="font-mono tnum text-sm normal-case text-foreground">1 : {ratio}</span>
      </div>
      <div role="radiogroup" aria-label="Brew strength" className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
        {STRENGTHS.map((s) => {
          const selected = s.ratio === ratio
          return (
            <button
              key={s.ratio}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s.ratio)}
              className={cn(
                'relative rounded-xl px-1 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {selected && (
                <motion.span
                  layoutId="strength-pill"
                  className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative block">{s.label}</span>
              <span className="relative block font-mono text-[0.68rem] opacity-70">1:{s.ratio}</span>
            </button>
          )
        })}
      </div>
      <TickSlider
        className="mt-2"
        label="Fine-tune ratio"
        value={ratio}
        onChange={onChange}
        min={13}
        max={20}
        step={0.5}
        isMajorMark={(v) => Number.isInteger(v)}
        showValue={false}
      />
    </div>
  )
}
