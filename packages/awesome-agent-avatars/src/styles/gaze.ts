// Gaze by DiceBear (CC0 1.0). A friendly blob with expressive eyes and no mouth.
import definition from "@dicebear/styles/gaze.json" with { type: "json" };
import { colorField, dicebearStyle, variantField } from "../dicebear.js";
import type { DicebearDefinition } from "../dicebear.js";

const def: DicebearDefinition = definition;

export const gaze = dicebearStyle({
  id: "gaze",
  name: "Gaze",
  definition: def,
  skinKey: "bodyColor",
  sleeveKey: "bodyColor",
  base: { animationVariant: "none" },
  fields: [
    variantField(def, "shape", "Shape", { group: "Body" }),
    colorField(def, "body", "Colour", { extra: ["#ffd166", "#c7c9ff"], group: "Body" }),
    variantField(def, "spacing", "Eye spacing", { group: "Eyes" }),
    colorField(def, "ink", "Eye colour", { group: "Eyes" }),
  ],
  defaults: (seed = "Nova") => ({ seed, shapeVariant: "pill", bodyColor: "#9cc8fb", spacingVariant: "normal", inkColor: "#0f172a" }),
  traits: { shape: "shapeVariant", bodyColor: "bodyColor", eyeColor: "inkColor" },
  faces: {
    neutral: { eyesVariant: "dots" }, happy: { eyesVariant: "happy" }, laughing: { eyesVariant: "grin" }, calm: { eyesVariant: "beans" },
    focused: { eyesVariant: "small" }, surprised: { eyesVariant: "big" }, sad: { eyesVariant: "tall" }, sleepy: { eyesVariant: "dots" },
    squinted: { eyesVariant: "bars" }, angry: { eyesVariant: "bars" }, scared: { eyesVariant: "wide" }, love: { eyesVariant: "shine" },
  },
  art: { body: "head", rot: { yaw: 1.1, pitch: 1 }, tilt: { x: 14, y: 20 }, parallax: { eyes: 3.6 } },
});
export default gaze;
