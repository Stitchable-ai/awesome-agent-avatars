# bot-styles

**Make your AI agent feel alive.** One motion engine for agent avatars: 58 agent states, reactions and interactions, on hot-swappable open-source avatar styles. React, Next.js, Remix, Tauri, Electron or plain DOM. Core ~22 KB gzipped, no dependencies.

```sh
npm i bot-styles @dicebear/core @dicebear/styles
```

```tsx
import { AgentAvatar, useStyleArt } from "bot-styles/react";
import { micah } from "bot-styles/styles/micah";

export function Bot({ state }: { state: string }) {
  const art = useStyleArt(micah);
  return <AgentAvatar art={art} state={state} size={160} />;
}
```

Docs, demos, credits and the agent skill: **https://github.com/Stitchable-ai/open-stitch-bot-styles** · Playground: **https://bot-styles.stitchable.ai**

The engine is MIT. Each art style keeps its own licence (Micah is CC BY 4.0 and requires attribution); see THIRD_PARTY_NOTICES.md.
