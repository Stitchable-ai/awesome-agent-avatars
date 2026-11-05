// awesome-agent-avatars: one motion engine for AI agent avatars, any art style.
// Core has no dependencies. Styles and framework bindings are separate entry points:
//   awesome-agent-avatars/react · awesome-agent-avatars/dicebear · awesome-agent-avatars/styles/{micah,avataaars,gaze,nice,fluent}
export { createAvatar, injectStyles, REACTIONS, POKES, LOOK, FACES, FACE_FALLBACK } from "./engine";
export { defaultMotion, extendMotion, GROUPS } from "./motion";
export { PROPS, registerProp } from "./props";
export type { PropDef } from "./props";
export { stylesheet } from "./css";
export { attachInteractions, defaultInteractions } from "./interactions";
export { defineStyle, pictureStyle } from "./style";
export { randomOptions, normalizeOptions, createStyleRegistry, groupFields } from "./editor";
export { agentPresence, stateForTool } from "./presence";
export type * from "./types";
