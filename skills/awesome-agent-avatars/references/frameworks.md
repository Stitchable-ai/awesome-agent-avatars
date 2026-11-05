# Frameworks and hosts

awesome-agent-avatars is DOM + CSS. There are no native modules, no Node APIs and no network calls (except the Fluent Emoji style, which loads images from a pinned jsDelivr commit unless you pass `fluentStyle({ baseUrl })` to self-host).

| Host | Notes |
|---|---|
| **Plain DOM / Vite** | `createAvatar(el, art, opts)`. See [examples/vanilla](https://github.com/Stitchable-ai/awesome-agent-avatars/tree/main/examples/vanilla). |
| **React 18/19** | `<AgentAvatar art={art} state={state} />` and `useStyleArt(style, options)`. The ref is the live avatar (`react`, `poke`, `look`, `setArt`…). Safe under StrictMode. |
| **Next.js (App Router)** | `awesome-agent-avatars/react` ships `"use client"`, so import it from a client or server component. The server renders an empty, sized box; the engine starts after hydration. See [examples/nextjs](https://github.com/Stitchable-ai/awesome-agent-avatars/tree/main/examples/nextjs). |
| **Remix / React Router 7** | Same as React; nothing runs during server rendering, so no `ClientOnly` wrapper is needed. |
| **Tauri v2** | Works in WKWebView (macOS, iOS), WebView2 (Windows) and WebKitGTK (Linux). No Rust side, no permissions. Container queries need Safari 16+ / WebKitGTK 2.40+. |
| **Electron** | Use it in the renderer like any web app. Nothing to do in the main process. |
| **Vue, Svelte, Solid, Angular** | Call `createAvatar` in the mount hook and `avatar.destroy()` in the unmount hook. A thin wrapper is a welcome contribution. |

## Performance and courtesy

- One `requestAnimationFrame` loop drives every avatar on the page. It skips avatars that are off screen (IntersectionObserver) and stops while the tab is hidden.
- `prefers-reduced-motion` gives a still pose (override with `reducedMotion: true | false`).
- Faces are parsed once per avatar and swapped by moving nodes; the per-frame work is a handful of style writes.
- Under 56 px an avatar plays gentle clips only and shows badges instead of props.

## Styling and CSP

- All classes and keyframes are prefixed `aav-`; parts are `aav-part-<name>`.
- The stylesheet is injected once into `<head>` (`#awesome-agent-avatars-css`). Under a strict `style-src` CSP, pass `injectStyles: false` and import `awesome-agent-avatars/styles.css`.
- Theme the stage with CSS variables on the container: `--aav-bg` (background) and `--aav-radius`.

## Server rendering

Importing `awesome-agent-avatars` or `awesome-agent-avatars/react` never touches `window` or `document`. Only `createAvatar` needs a DOM. Style `render()` for DiceBear styles is pure and also works on the server (useful for static thumbnails); the react-nice-avatar style renders in the browser.
