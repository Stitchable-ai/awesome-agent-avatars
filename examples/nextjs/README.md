# Next.js (App Router)

Two files to copy into an existing Next.js app:

```sh
npm i awesome-agent-avatars @dicebear/core @dicebear/styles
```

- [`app/components/bot.tsx`](app/components/bot.tsx): a client component using `AgentAvatar` and `useStyleArt`.
- [`app/page.tsx`](app/page.tsx): a server component rendering it.

The server outputs an empty, sized box; the avatar starts after hydration. Drive it by changing the `state` prop from your chat UI (for example from your streaming hook), or call methods on the ref.

These files are type-checked in this repository's CI but not built (that needs a Next.js app around them).
