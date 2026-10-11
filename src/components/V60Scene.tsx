import { objects, useTheatre } from '@/theatre/brewSheet'
import { cn } from '@/lib/utils'

// Cone geometry, in viewBox units.
const CONE = { top: 128, bottom: 252, left: 70, right: 230, tipL: 138, tipR: 162 }
const CONE_H = CONE.bottom - CONE.top
const BED_TOP = 214
const KETTLE_PIVOT = [268, 46] as const
const SPOUT_TIP = [168, 60] as const
const CARAFE = { top: 286, bottom: 368, left: 92, right: 208 }

/** Half-width of the cone interior at height y. */
const halfWidthAt = (y: number) => {
  const t = (y - CONE.top) / CONE_H
  return ((CONE.right - CONE.left) * (1 - t) + (CONE.tipR - CONE.tipL) * t) / 2
}

type Props = { weight: number; active: boolean; className?: string }

export function V60Scene({ weight, active, className }: Props) {
  const kettle = useTheatre(objects.kettle)
  const pour = useTheatre(objects.pour)
  const dripper = useTheatre(objects.dripper)
  const carafe = useTheatre(objects.carafe)

  const cx = 150
  // Slurry fills from the bed up towards the rim.
  const surfaceY = BED_TOP - dripper.slurry * (BED_TOP - CONE.top - 10)
  const tiltSurface = dripper.swirl * 6
  const bedBulge = dripper.bloom * 14
  // Spout tip rotated about the kettle pivot, then translated — same as the kettle <g> transform.
  const a = (-kettle.tilt * 14 * Math.PI) / 180
  const [tx, ty] = [SPOUT_TIP[0] - KETTLE_PIVOT[0], SPOUT_TIP[1] - KETTLE_PIVOT[1]]
  const spoutX = KETTLE_PIVOT[0] + tx * Math.cos(a) - ty * Math.sin(a) + kettle.sway * 16
  const spoutY = KETTLE_PIVOT[1] + tx * Math.sin(a) + ty * Math.cos(a) - kettle.tilt * 10
  const carafeLevel = CARAFE.bottom - 6 - carafe.fill * (CARAFE.bottom - CARAFE.top - 22)

  return (
    <svg viewBox="0 0 300 400" className={cn('h-full w-full overflow-visible', className)} role="img" aria-label={`V60 pour-over, scale reads ${weight} grams`}>
      <defs>
        <clipPath id="cone-inside">
          <path d={`M${CONE.left + 8} ${CONE.top + 4} L${CONE.right - 8} ${CONE.top + 4} L${CONE.tipR - 2} ${CONE.bottom - 2} L${CONE.tipL + 2} ${CONE.bottom - 2} Z`} />
        </clipPath>
        <clipPath id="carafe-inside">
          <path d={carafePath(4)} />
        </clipPath>
        <linearGradient id="slurry" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--crema)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--brew)" />
        </linearGradient>
        <linearGradient id="coffee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brew)" />
          <stop offset="1" stopColor="oklch(0.25 0.04 40)" />
        </linearGradient>
      </defs>

      {/* Gooseneck kettle, pivoting on its body when it tilts to pour. */}
      <g
        style={{
          transform: `translate(${kettle.sway * 16}px, ${-kettle.tilt * 10}px) rotate(${-kettle.tilt * 14}deg)`,
          transformOrigin: `${KETTLE_PIVOT[0]}px ${KETTLE_PIVOT[1]}px`,
          transition: active ? undefined : 'transform 600ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <path d="M258 6 h20" stroke="var(--foreground)" strokeWidth="5" strokeLinecap="round" />
        <path d="M244 14 h48 a6 6 0 0 1 6 6 v46 a12 12 0 0 1 -12 12 h-36 a12 12 0 0 1 -12 -12 v-46 a6 6 0 0 1 6 -6 z" fill="var(--foreground)" />
        <path d="M244 26 h56" stroke="var(--background)" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M240 66 C 214 72, 204 42, 176 52 L 168 60" fill="none" stroke="var(--foreground)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Pour stream */}
      <path
        d={`M${spoutX} ${spoutY} Q ${spoutX - 4} ${(spoutY + surfaceY) / 2} ${cx + kettle.sway * 10} ${surfaceY}`}
        fill="none"
        stroke="var(--crema)"
        strokeWidth={1.5 + pour.stream * 2.5}
        strokeLinecap="round"
        strokeDasharray="10 2"
        opacity={pour.stream}
        className="motion-loop"
        style={{ animation: 'stream-flow 0.35s linear infinite' }}
      />

      {/* Cone body + ribs */}
      <path
        d={`M${CONE.left - 6} ${CONE.top - 6} H${CONE.right + 6} L${CONE.tipR + 6} ${CONE.bottom + 4} H${CONE.tipL - 6} Z`}
        fill="var(--card)"
        stroke="var(--foreground)"
        strokeOpacity="0.85"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d={`M${CONE.left - 22} ${CONE.top - 8} H${CONE.right + 22}`} stroke="var(--foreground)" strokeOpacity="0.85" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${CONE.tipL - 26} ${CONE.bottom + 10} H${CONE.tipR + 26}`} stroke="var(--foreground)" strokeOpacity="0.85" strokeWidth="5" strokeLinecap="round" />

      <g clipPath="url(#cone-inside)">
        <rect x="0" y={CONE.top} width="300" height={CONE_H} fill="var(--crema)" opacity="0.18" />
        {/* Spiral ribs */}
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${cx + i * 26} ${CONE.top} Q ${cx + i * 14 + 18} ${CONE.top + 60} ${cx + i * 4} ${CONE.bottom}`} fill="none" stroke="var(--foreground)" strokeOpacity="0.08" strokeWidth="2" />
        ))}
        {/* Coffee bed with bloom dome */}
        <path
          d={`M0 ${BED_TOP + 6} Q ${cx} ${BED_TOP - 6 - bedBulge} 300 ${BED_TOP + 6} V400 H0 Z`}
          fill="url(#coffee)"
        />
        {/* Slurry */}
        {dripper.slurry > 0.01 && (
          <path
            d={`M0 ${surfaceY + tiltSurface} Q ${cx} ${surfaceY - 4} 300 ${surfaceY - tiltSurface} V${BED_TOP + 10} Q ${cx} ${BED_TOP - bedBulge} 0 ${BED_TOP + 10} Z`}
            fill="url(#slurry)"
            opacity={0.55 + dripper.slurry * 0.35}
          />
        )}
        {/* Bloom bubbles */}
        {dripper.bloom > 0.05 &&
          [-34, -18, -4, 10, 24, 38].map((dx, i) => (
            <circle
              key={dx}
              cx={cx + dx}
              cy={Math.min(surfaceY, BED_TOP - bedBulge) + 2}
              r={2 + (i % 3)}
              fill="var(--crema)"
              opacity={dripper.bloom}
              className="motion-loop"
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `bubble ${1.1 + i * 0.17}s ease-in-out infinite` }}
            />
          ))}
      </g>
      {/* Water line hint on the paper */}
      {dripper.slurry > 0.01 && (
        <line x1={cx - halfWidthAt(surfaceY) + 10} x2={cx + halfWidthAt(surfaceY) - 10} y1={surfaceY} y2={surfaceY} stroke="var(--crema)" strokeOpacity="0.6" strokeWidth="1" />
      )}

      {/* Drips */}
      {carafe.drip > 0.05 &&
        [0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={cx}
            cy={CONE.bottom + 14}
            r={2.2}
            fill="var(--brew)"
            opacity={carafe.drip}
            className="motion-loop"
            style={{ animation: `drip-fall ${0.9 - carafe.drip * 0.2}s ${i * 0.3}s ease-in infinite` }}
          />
        ))}

      {/* Carafe */}
      <g clipPath="url(#carafe-inside)">
        <rect x="0" y={carafeLevel} width="300" height="200" fill="url(#coffee)" />
        <path d={`M0 ${carafeLevel} Q 150 ${carafeLevel + 4} 300 ${carafeLevel}`} stroke="var(--crema)" strokeOpacity="0.5" fill="none" />
      </g>
      <path d={carafePath(0)} fill="var(--glass)" fillOpacity="0.4" stroke="var(--foreground)" strokeOpacity="0.55" strokeWidth="2.5" />

      {/* Scale */}
      <rect x="54" y="372" width="192" height="24" rx="8" fill="var(--foreground)" />
      <rect x="168" y="377" width="64" height="14" rx="3" fill="oklch(0.2 0.02 160)" />
      <text x="228" y="388.5" textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" fill="oklch(0.85 0.17 150)" className="tnum">
        {weight.toFixed(0).padStart(4, ' ')}g
      </text>
      <circle cx="74" cy="384" r="4" fill="var(--background)" opacity="0.5" />
    </svg>
  )
}

function carafePath(inset: number) {
  const { top, bottom, left, right } = CARAFE
  return `M${left + 14 + inset} ${top + inset} H${right - 14 - inset} Q ${right - inset} ${top + 30} ${right - inset} ${bottom - 22} Q ${right - inset} ${bottom - inset} ${right - 24} ${bottom - inset} H${left + 24} Q ${left + inset} ${bottom - inset} ${left + inset} ${bottom - 22} Q ${left + inset} ${top + 30} ${left + 14 + inset} ${top + inset} Z`
}
