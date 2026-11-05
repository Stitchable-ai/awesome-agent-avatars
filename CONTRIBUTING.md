# Contributing

Thanks for helping agents look alive. Everything here is open to contribution: styles, states, clips, props, framework wrappers, docs and fixes.

## Setup

```sh
npm ci
npm run build          # the library (packages/awesome-agent-avatars → dist)
npm test               # unit tests (node --test)
npm run typecheck      # the library, the site and examples, and the type tests in tests/types
npm run check:pack     # the published shape: arethetypeswrong, publint, and a fresh install of the tarball
npm run dev            # site + playground at localhost:5173, reading the library source
npm run build:site && npx playwright install chromium && npm run test:browser
```

The library is strict TypeScript with no `any`. `tests/types/` is compiled against the built declarations as an app sees them (NodeNext and bundler resolution); a `@ts-expect-error` line there pins something that must not compile. Relative imports in `src/` carry a `.js` extension, which the emitted declarations need under NodeNext.

## Where things live

| Path | What |
|---|---|
| `packages/awesome-agent-avatars/src/engine.ts` | the runtime: clips, faces, blinks, pokes, reactions, gaze, drag, props |
| `packages/awesome-agent-avatars/src/motion.ts` | the default motion pack (states + clips, plain data) |
| `packages/awesome-agent-avatars/src/props.ts`, `css.ts` | app-drawn props and the stylesheet (every class and keyframe is prefixed `aav-`) |
| `packages/awesome-agent-avatars/src/styles/*` | built-in styles; `dicebear.ts` is the DiceBear adapter |
| `site/` | landing page, playground (with screenshot sheets at `#matrix=<Group>`, `#faces`, `#worn`, `#react`, `#arms`; `node scripts/sheet.mjs arms out.png` captures one) and editor |
| `examples/` | copyable starting points |
| `skills/awesome-agent-avatars/` | the agent skill (`npx skills add …`) |

## Adding a style

1. Prefer publishing it as your own package (`awesome-agent-avatars-style-<name>`) and opening a PR to list it in the README. Built-in styles are kept few so the defaults stay small.
2. Credit the art's creator in `credit` and in your README, and only use art you may redistribute.
3. Check it on the sheets: `npm run dev`, then open `/playground.html#matrix=Lifecycle`, `#faces`, `#worn`, `#react` and `#arms` with your style added to `site/src/shared.ts`.

## Changing motion

States and clips are data in `motion.ts`. Keep clips starting and ending at the state's home pose so they chain smoothly, keep yaw small for flat art (styles scale it), and never put a prop over the face. After changes, regenerate the docs with `node scripts/gen-docs.mjs`, and refresh the README media with `npm run media` if they changed visibly.

## Pull requests

- `npm run build && npm test && npm run typecheck && npm run check:pack` pass, and `npm run test:browser` for anything visual.
- Explain what a person will see differently. A screenshot or GIF helps.
- Keep the core dependency-free and SSR-safe (no `window`/`document` at import time).
- A new public export gets a line in `tests/types/consumer.tsx` and in `skills/awesome-agent-avatars/references/api.md`.

## Releasing

The package on npm is `awesome-agent-avatars` (`packages/awesome-agent-avatars`; the root is a private workspace). Releases are tag-driven: `.github/workflows/release.yml` runs the whole check suite and publishes with npm provenance when a `v*` tag is pushed.

```sh
npm version patch --workspace awesome-agent-avatars --no-git-tag-version   # or minor / major
git commit -am "awesome-agent-avatars 0.1.1" && git tag v0.1.1 && git push --follow-tags
```

Authentication is npm trusted publishing (OIDC), so no token lives in GitHub. It is configured once on npmjs.com, after the first manual publish, under the package's Settings → Trusted publisher: GitHub Actions, repository `Stitchable-ai/awesome-agent-avatars`, workflow `release.yml`, environment `npm`. The first publish is by hand from a clean checkout:

```sh
npm ci && npm run build && npm run typecheck && npm test && npm run check:pack
cd packages/awesome-agent-avatars && npm publish --access public   # asks for the npm 2FA code
```
