// A Next.js (App Router) component. awesome-agent-avatars/react already carries "use client",
// so this file can be imported from a server component as-is.
"use client";
import { useRef } from "react";
import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { gaze } from "awesome-agent-avatars/styles/gaze";
import type { BotAvatar } from "awesome-agent-avatars";

export default function Bot({ state = "idle" }: { state?: string }) {
  const art = useStyleArt(gaze);                 // or useStyleArt(gaze, savedRecipe.options)
  const ref = useRef<BotAvatar | null>(null);
  return (
    <div onDoubleClick={() => ref.current?.react("love")}>
      <AgentAvatar ref={ref} art={art} state={state} size={140} />
    </div>
  );
}
