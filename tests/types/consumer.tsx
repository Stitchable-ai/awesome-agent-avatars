// Type-level tests. This file is compiled the way an app sees the package: through its
// published `exports` and emitted declarations (run `npm run build` first), under NodeNext
// and under Bundler resolution. A line marked @ts-expect-error must NOT compile; when one
// starts compiling, a type got looser than it should be.
import {
  createAvatar, agentPresence, createStyleRegistry, defaultMotion, extendMotion, pictureStyle, stateForTool,
  registerProp, injectStyles, stylesheet, POKES, REACTIONS, LOOK, FACES, FACE_FALLBACK, GROUPS, STATE_NAMES, PROPS,
} from "awesome-agent-avatars";
import type {
  AgentPresence, AnyStateName, AvatarStyle, BotAvatar, BuiltinStateName, Clip, FaceName, LookDirection, MotionPack,
  PokeDef, PokeName, PropDef, ReactionDef, ReactionName, StateName, StateRecipe, StyleArt, StyleRegistry,
} from "awesome-agent-avatars";
import { AgentAvatar, useRecipeArt, useStyleArt } from "awesome-agent-avatars/react";
import { colorField, creditOf, dicebearStyle, variantField } from "awesome-agent-avatars/dicebear";
import type { DicebearDefinition } from "awesome-agent-avatars/dicebear";
import { micah } from "awesome-agent-avatars/styles/micah";
import { avataaars } from "awesome-agent-avatars/styles/avataaars";
import { gaze } from "awesome-agent-avatars/styles/gaze";
import { nice } from "awesome-agent-avatars/styles/nice";
import { fluent, fluentStyle, fluentUrl, FLUENT_CDN } from "awesome-agent-avatars/styles/fluent";

declare const el: HTMLElement;
declare const art: StyleArt;

// ---- the live avatar ----
const av: BotAvatar = createAvatar(el, art, { state: "thinking", seed: "a", interactions: { follow: "page", reach: 2 }, autoSleep: { bored: 30 }, reducedMotion: "auto" });
av.setState("coding");
av.setState("coding", { quiet: true });
av.setState("a-state-from-my-own-pack"); // any string: a motion pack is data
// @ts-expect-error a state is a string
av.setState(42);
av.poke("spin", { turns: 2 });
av.poke("hop");
// @ts-expect-error not a poke
av.poke("fly");
av.look("left", 2);
// @ts-expect-error not a direction
av.look("sideways");
av.react("love");
av.react("talk"); // a face name shows as a plain moment
av.moment("happy", 1);
// @ts-expect-error not a face
av.moment("grumpy");
av.holdFace("calm");
av.holdFace(null);
av.flash("sparkle", 1);
export const current: string = av.state;
// @ts-expect-error the state is read-only; use setState
av.state = "idle";

// ---- the vocabularies are closed types, not string maps ----
export const poke: PokeName = "hop";
export const reaction: ReactionName = "shy";
export const face: FaceName = "talk";
export const dir: LookDirection = "center";
export const def: PokeDef = POKES.hop;
export const rx: ReactionDef = REACTIONS.love;
// @ts-expect-error unknown pokes are not in POKES
POKES.fly;
// @ts-expect-error unknown reactions are not in REACTIONS
REACTIONS.grumpy;
export const pitch: number | undefined = LOOK.up.pitch;
export const faces: FaceName[] = FACES;
export const fallback: FaceName | undefined = FACE_FALLBACK.laughing;
export const names: readonly BuiltinStateName[] = STATE_NAMES;
export const first: BuiltinStateName = STATE_NAMES[0];
export const known: StateName = "powering-down";
export const loose: AnyStateName = "whatever";
// @ts-expect-error not a built-in state
export const notBuiltin: BuiltinStateName = "party";
export const groups: readonly string[] = GROUPS;

// ---- motion packs ----
const clip: Clip = { dur: 1, tracks: { rot: [[0, [0, 0, 0]], [1, [0, 10, 0], "out"]], face: [[0.5, "blink"], [0.8, "happy"], [0.9, null]] } };
const pack: MotionPack = extendMotion(defaultMotion, { clips: { partyA: clip }, states: { party: { clips: ["partyA"], face: "laughing", group: "Custom", pokes: ["bounce", ["spin", { turns: 2 }]] } } });
export const rec: StateRecipe = pack.states.party;
// @ts-expect-error a face track names a face, "blink", or null
export const badClip: Clip = { dur: 1, tracks: { face: [[0, "grumpy"]] } };
createAvatar(el, art, { motion: pack, state: "party" });

// ---- presence ----
const presence: AgentPresence = agentPresence(av);
agentPresence([av, av]);
agentPresence((s: string) => s, { typingIdleMs: 500 });
presence.typing(); presence.tool("web_search"); presence.tool("x", "computing"); presence.set("party"); presence.react("love");
export const guessed: BuiltinStateName = stateForTool("read_file");

// ---- styles and the editor ----
const pic: AvatarStyle<{ src: string }> = pictureStyle({ id: "pic", name: "Pic", src: "/a.png", credit: { author: "me", license: "MIT" }, faces: { happy: "/b.png" }, bust: false });
// @ts-expect-error faces are keyed by face name
pictureStyle({ id: "pic", name: "Pic", src: "/a.png", credit: { author: "me", license: "MIT" }, faces: { grumpy: "/b.png" } });
const reg: StyleRegistry = createStyleRegistry([micah, avataaars, gaze, nice, fluent, pic, fluentStyle({ baseUrl: FLUENT_CDN })]);
export const got: AvatarStyle | undefined = reg.get("micah");
const recipe = reg.recipe("micah", micah.defaults("seed"), "Kit");
export const rendered: Promise<StyleArt> = reg.render(recipe);
export const url: string = fluentUrl("Woman", "Dark");
export const hair: string | number | boolean = micah.defaults().hairVariant;
const prop: PropDef = { layer: "front", html: (a) => a.miniArt() + a.artStyle.id };
registerProp("badge2", prop);
export const added: PropDef = PROPS.badge2;
injectStyles();
export const css: string = stylesheet;

// ---- the DiceBear adapter ----
declare const definition: DicebearDefinition;
const custom = dicebearStyle({
  id: "custom", name: "Custom", definition,
  fields: [variantField(definition, "hair", "Hair", { optional: true }), colorField(definition, "base", "Skin")],
  defaults: () => ({ seed: "x", hairVariant: "none", baseColor: "#fff" }),
  faces: { neutral: { eyesVariant: "eyes" } },
  skinKey: "baseColor",
});
export const license: string = creditOf(definition).license;
export const customOptions: { seed: string; hairVariant: string; baseColor: string } = custom.defaults();

// ---- React ----
export function App() {
  const a = useStyleArt(micah, micah.defaults("x"));
  const b = useRecipeArt(reg, recipe);
  return (
    <>
      <AgentAvatar art={a} state="thinking" size={120} glow onStateChange={(s: string) => s} interactions={false} />
      <AgentAvatar art={b} state="party" className="x" style={{ margin: 4 }} />
      {/* @ts-expect-error art is required */}
      <AgentAvatar />
    </>
  );
}
