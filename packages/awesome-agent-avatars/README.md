# awesome-agent-avatars

**Make your AI agent feel alive.** One motion engine for agent avatars: 58 agent states, reactions and interactions, on hot-swappable open-source avatar styles. React, Next.js, Remix, Tauri, Electron or plain DOM. Core ~24 KB gzipped, no dependencies.

```sh
npm i awesome-agent-avatars @dicebear/core @dicebear/styles
```

```tsx
import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { micah } from "awesome-agent-avatars/styles/micah";

export function Bot({ state }: { state: string }) {
  const art = useStyleArt(micah);
  return <AgentAvatar art={art} state={state} size={160} />;
}
```

Docs, demos, credits and the agent skill: **https://github.com/Stitchable-ai/awesome-agent-avatars** · Playground: **https://awesome-agent-avatars.stitchable.ai**

The engine is MIT. Each art style keeps its own licence (Micah is CC BY 4.0 and requires attribution); see THIRD_PARTY_NOTICES.md.
