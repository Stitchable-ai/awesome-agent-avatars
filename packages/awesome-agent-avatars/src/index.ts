// awesome-agent-avatars: one motion engine for AI agent avatars, any art style.
// Core has no dependencies. Styles and framework bindings are separate entry points:
//   awesome-agent-avatars/react · awesome-agent-avatars/dicebear · awesome-agent-avatars/styles/{micah,avataaars,gaze,nice,fluent}
export { createAvatar, injectStyles, REACTIONS, POKES, LOOK, FACES, FACE_FALLBACK } from "./engine.js";
export type { PokeDef, PokeState, PokeAcc, ReactionDef } from "./engine.js";
export { defaultMotion, extendMotion, GROUPS, STATE_NAMES } from "./motion.js";
export { PROPS, registerProp } from "./props.js";
export type { PropDef } from "./props.js";
export { stylesheet } from "./css.js";
export { attachInteractions, defaultInteractions } from "./interactions.js";
export { defineStyle, pictureStyle } from "./style.js";
export type { PictureStyleConfig } from "./style.js";
export { randomOptions, normalizeOptions, createStyleRegistry, groupFields } from "./editor.js";
export type { StyleRegistry } from "./editor.js";
export { agentPresence, stateForTool } from "./presence.js";
export type { AgentPresence } from "./presence.js";
// `export *` rather than `export type *`, so declarations stay readable by TypeScript 4.x consumers
export * from "./types.js";
