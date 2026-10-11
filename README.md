# V60 ratio

Coffee-to-water calculator and guided V60 pour-over timer. Live at https://v60.cllbrtn.com.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173
bun test           # recipe maths
bun run build      # static site in dist/
```

## How it fits together

- `src/lib/brew.ts`: the recipe (phase times, pour targets, ratio maths). Pure and unit-tested.
- `src/theatre/`: the brew animation is a [Theatre.js](https://www.theatrejs.com/) sequence. `choreography.ts` builds its keyframes from the phases in `brew.ts`, and `useBrewClock` moves the sequence playhead, so seeking the timeline scrubs the whole scene.
  - To tweak the motion visually, run `bun run dev` and open `/?studio`. Studio is dev-only and never shipped.
- Components from [SpaceUI](https://www.spaceui.one/) (`src/components/spaceui/`: tick slider, slide-to-confirm, squircle button, theme toggle) and [Componentry](https://componentry.dev/) (`src/components/ui/`: split-flap display, grain gradient, text morph) were installed through the shadcn registry, e.g. `bunx shadcn@latest add @componentry/split-flap-display`.

## Deploy

`.github/workflows/deploy.yml` builds with bun and publishes `dist/` to GitHub Pages on every push to `main`. The custom domain comes from `public/CNAME`. Set the repository's Pages source to "GitHub Actions" (Settings → Pages).
