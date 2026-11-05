# Contributing

Thanks for helping agents look alive. Everything here is open to contribution: styles, states, clips, props, framework wrappers, docs and fixes.

## Setup

```sh
npm ci
npm run build          # the library (packages/bot-styles → dist)
npm test               # unit tests (node --test)
npm run typecheck
npm run dev            # site + playground at localhost:5173, reading the library source
npm run build:site && npx playwright install chromium && npm run test:browser
```

## Where things live

| Path | What |
|---|---|
| `packages/bot-styles/src/engine.ts` | the runtime: clips, faces, blinks, pokes, reactions, gaze, drag, props |
| `packages/bot-styles/src/motion.ts` | the default motion pack (states + clips, plain data) |
| `packages/bot-styles/src/props.ts`, `css.ts` | app-drawn props and the stylesheet (every class and keyframe is prefixed `bs-`) |
| `packages/bot-styles/src/styles/*` | built-in styles; `dicebear.ts` is the DiceBear adapter |
| `site/` | landing page, playground (with screenshot sheets at `#matrix=<Group>`, `#faces`, `#worn`, `#react`, `#arms`; `node scripts/sheet.mjs arms out.png` captures one) and editor |
| `examples/` | copyable starting points |
| `skills/bot-styles/` | the agent skill (`npx skills add …`) |

## Adding a style

1. Prefer publishing it as your own package (`bot-styles-style-<name>`) and opening a PR to list it in the README. Built-in styles are kept few so the defaults stay small.
2. Credit the art's creator in `credit` and in your README, and only use art you may redistribute.
3. Check it on the sheets: `npm run dev`, then open `/playground.html#matrix=Lifecycle`, `#faces`, `#worn`, `#react` and `#arms` with your style added to `site/src/shared.ts`.

## Changing motion

States and clips are data in `motion.ts`. Keep clips starting and ending at the state's home pose so they chain smoothly, keep yaw small for flat art (styles scale it), and never put a prop over the face. After changes, regenerate the docs with `node scripts/gen-docs.mjs`, and refresh the README media with `npm run media` if they changed visibly.

## Pull requests

- `npm run build && npm test && npm run typecheck` pass, and `npm run test:browser` for anything visual.
- Explain what a person will see differently. A screenshot or GIF helps.
- Keep the core dependency-free and SSR-safe (no `window`/`document` at import time).
