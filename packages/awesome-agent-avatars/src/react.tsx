"use client";
// React bindings. Works in any React 18/19 app (Vite, Next.js App Router, Remix, Electron, Tauri).
// The engine only starts in an effect, so server rendering outputs an empty, sized box.
import { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createAvatar } from "./engine.js";
import type { AnyStateName, AvatarOptions, AvatarRecipe, AvatarStyle, BotAvatar, StyleArt, StyleOptions } from "./types.js";

export interface AgentAvatarProps extends Omit<AvatarOptions, "state" | "onState"> {
  /** art from a style's render(), or from useStyleArt() */
  art: StyleArt | null | undefined;
  /** controlled state; change it to move the avatar */
  state?: AnyStateName;
  glow?: boolean;
  /** width (the stage is square) */
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  onStateChange?: (state: string) => void;
}

/** <AgentAvatar art={art} state="thinking" />. The ref gives the live BotAvatar (react, poke, look…). */
export const AgentAvatar = forwardRef<BotAvatar | null, AgentAvatarProps>(function AgentAvatar(props, ref) {
  const { art, state, glow, size, className, style, onStateChange, ...opts } = props;
  const host = useRef<HTMLDivElement>(null);
  const av = useRef<BotAvatar | null>(null);
  const cb = useRef(onStateChange); cb.current = onStateChange;
  const [, ready] = useState(0);

  useEffect(() => {
    if (!host.current || !art) return;
    if (!av.current) { av.current = createAvatar(host.current, art, { ...opts, state, onState: (s) => cb.current?.(s) }); ready((n) => n + 1); }
    else av.current.setArt(art);
  }, [art]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { av.current?.destroy(); av.current = null; }, []);
  useEffect(() => { if (state && av.current && av.current.state !== state) av.current.setState(state); }, [state]);
  // worn props are identity: a recipe's `wear` changes without a remount (a host re-dressing on file change)
  const wearKey = (opts.wear || []).join(",");
  useEffect(() => { if (av.current && av.current.wear.join(",") !== wearKey) av.current.setWear(wearKey ? wearKey.split(",") : []); }, [wearKey]);
  useEffect(() => { av.current?.setGlow(!!glow); }, [glow, av.current]);
  useImperativeHandle(ref, () => av.current as BotAvatar, [av.current]);

  return createElement("div", { ref: host, className, style: { width: size ?? "100%", ...style }, "data-awesome-agent-avatars": "" });
});

/** Render a style's art for some options; re-renders only when the options change. */
export function useStyleArt<O extends StyleOptions>(style: AvatarStyle<O> | null | undefined, options?: O | null): StyleArt | null {
  const key = useMemo(() => (style ? style.id + JSON.stringify(options ?? null) : ""), [style, options]);
  const [art, setArt] = useState<StyleArt | null>(null);
  useEffect(() => {
    if (!style) { setArt(null); return; }
    let live = true;
    Promise.resolve(style.render((options ?? style.defaults()) as O)).then((a) => { if (live) setArt(a); });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return art;
}

/** Render a saved recipe with a registry from createStyleRegistry(). */
export function useRecipeArt(registry: { render(r: AvatarRecipe): Promise<StyleArt> }, recipe: AvatarRecipe | null | undefined): StyleArt | null {
  const key = recipe ? JSON.stringify(recipe) : "";
  const [art, setArt] = useState<StyleArt | null>(null);
  useEffect(() => {
    if (!recipe) { setArt(null); return; }
    let live = true; registry.render(recipe).then((a) => { if (live) setArt(a); });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return art;
}
