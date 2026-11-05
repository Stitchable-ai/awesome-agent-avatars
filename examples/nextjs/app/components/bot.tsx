// A Next.js (App Router) component. bot-styles/react already carries "use client",
// so this file can be imported from a server component as-is.
"use client";
import { useRef } from "react";
import { AgentAvatar, useStyleArt } from "bot-styles/react";
import { gaze } from "bot-styles/styles/gaze";
import type { BotAvatar } from "bot-styles";

export default function Bot({ state = "idle" }: { state?: string }) {
  const art = useStyleArt(gaze);                 // or useStyleArt(gaze, savedRecipe.options)
  const ref = useRef<BotAvatar | null>(null);
  return (
    <div onDoubleClick={() => ref.current?.react("love")}>
      <AgentAvatar ref={ref} art={art} state={state} size={140} />
    </div>
  );
}
