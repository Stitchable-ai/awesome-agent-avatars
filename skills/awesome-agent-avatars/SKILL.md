---
name: awesome-agent-avatars
description: Add an animated, interactive avatar for an AI agent to a web, React, Next.js, Remix, Vite, Tauri or Electron app with the awesome-agent-avatars library. Use when the user wants an agent/assistant/bot avatar or mascot that reacts to agent activity (typing, thinking, tool calls, streaming, approvals, errors, sleep), a character picker or avatar editor, or a custom avatar style.
---

# awesome-agent-avatars: an avatar for an AI agent

awesome-agent-avatars is one motion engine (58 agent states, reactions, pointer interactions) that animates hot-swappable art styles. The app supplies a style and tells the avatar what the agent is doing; the engine does the rest.

## 1. Look before writing

- Find the framework (React, Next.js App Router, Remix/React Router, Vite + vanilla, Tauri v2, Electron, Vue/Svelte) and the package manager from the lockfile.
- Find where the agent's activity lives: the chat state/store, the streaming hook, tool-call events, approval prompts, error handling, and the composer input. The avatar must be driven from these real events, not from timers.
- Ask the user only if the placement or the style is genuinely unclear. Default placement: next to the agent's name in the chat header, or beside the composer, 64–160 px wide.

## 2. Install

```sh
npm i awesome-agent-avatars                                  # engine, no dependencies
npm i @dicebear/core @dicebear/styles             # for micah, avataaars, gaze or any DiceBear style
npm i react-nice-avatar                           # only for the "nice" style (React apps)
```

Pick a style: `micah` (friendly illustrated person, CC BY 4.0, attribution required), `avataaars` (classic, free for commercial use), `gaze` (a cute bot blob, CC0, tiniest), `nice` (react-nice-avatar, MIT), `fluent` (Microsoft Fluent Emoji 3D picture, MIT; loads images from a CDN unless self-hosted), or `pictureStyle({ src })` for the product's own mascot image.

## 3. Mount

React / Next.js / Remix (the React entry already has `"use client"`; it renders an empty box on the server):

```tsx
import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { micah } from "awesome-agent-avatars/styles/micah";

export function AgentFace({ state }: { state: string }) {
  const art = useStyleArt(micah);            // useStyleArt(micah, savedOptions) for a customised look
  return <AgentAvatar art={art} state={state} size={120} />;
}
```

Plain DOM, Tauri, Electron, Vue, Svelte (create on mount, `destroy()` on unmount):

```ts
import { createAvatar } from "awesome-agent-avatars";
import { gaze } from "awesome-agent-avatars/styles/gaze";
const avatar = createAvatar(el, await gaze.render(gaze.defaults()), { state: "idle" });
```

## 4. Drive it from agent events

```ts
import { agentPresence } from "awesome-agent-avatars";
const bot = agentPresence(avatar);   // or (state) => setAvatarState(state) in React
// composer input → bot.typing()      submit → bot.sent()          reasoning → bot.thinking()
// tool call start → bot.tool(name)  (web_search → searching, read_file → reading, edit_file → coding, bash → running, computer → controlling)
// text delta → bot.streaming()      approval/question → bot.needsInput()     approved → bot.approved()
// turn done → bot.done()            error/cancel → bot.error()               offline → bot.offline()
```

In React, keep the state in your store and pass it as the `state` prop; use the callback form `agentPresence((s) => setState(s))`. Call `ref.current.react("happy" | "confused" | "love" | …)` for short moments. The full state list with triggers is in [references/states.md](references/states.md).

## 5. Optional: let users customise it

Every style exposes `fields`, `defaults()` and `render(options)`. Build the editor UI in the app's own design system from `groupFields(style.fields)`; save `{ v: 1, style, options, name }` as JSON with the user and render it with `createStyleRegistry(styles).render(recipe)` or `useStyleArt(style, recipe.options)`. A complete React example editor is in the repository at `examples/react-editor/src/Editor.tsx`. Details: [references/styles.md](references/styles.md).

## 6. Optional: a custom style

Any image: `pictureStyle({ id, name, src, credit })`. Any DiceBear style: `dicebearStyle({ definition, fields, defaults, faces, art })` from `awesome-agent-avatars/dicebear`. From scratch: return SVG strings whose parts carry `class="aav-part-eyes"`, `aav-part-mouth`, etc. See [references/styles.md](references/styles.md) and [references/motion.md](references/motion.md) for custom states and clips.

## Rules

- Keep the art's credit visible where the app lists credits/licences (Micah is CC BY 4.0: attribution is required). Never copy third-party art into the repo; import it from the npm packages.
- Do not start the engine during server rendering; use the React component or create it in a mount hook.
- Under a strict CSP (`style-src` without `'unsafe-inline'`), pass `injectStyles: false` and import `awesome-agent-avatars/styles.css`.
- Respect reduced motion (default) and do not drive states from timers when real events exist.
- Verify in the running app: the avatar renders, follows the pointer on hover, and changes state during a real agent turn. Report anything you could not check.

API summary: [references/api.md](references/api.md). Framework notes: [references/frameworks.md](references/frameworks.md).
