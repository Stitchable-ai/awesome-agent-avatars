// Avataaars by Pablo Stanley (free for personal and commercial use), via DiceBear.
import definition from "@dicebear/styles/avataaars.json";
import { colorField, dicebearStyle, variantField } from "../dicebear";

const def = definition as any;
const SKIN = ["#ffdbb4", "#edb98a", "#d08b5b", "#ae5d29", "#8d5524", "#614335"];

export const avataaars = dicebearStyle({
  id: "avataaars",
  name: "Avataaars",
  definition: def,
  skinKey: "skinColor",
  sleeveKey: "clothesColor",
  fields: [
    colorField(def, "skin", "Skin", { extra: SKIN, group: "Face" }),
    variantField(def, "top", "Hair / headwear", { optional: true, group: "Hair" }),
    colorField(def, "hair", "Hair colour", { group: "Hair" }),
    colorField(def, "hat", "Headwear colour", { extra: ["#5b6ee1"], group: "Hair" }),
    variantField(def, "accessories", "Glasses", { optional: true, group: "Face" }),
    variantField(def, "facialHair", "Facial hair", { optional: true, group: "Face" }),
    colorField(def, "facialHair", "Facial hair colour", { group: "Face" }),
    variantField(def, "clothes", "Clothes", { group: "Clothes" }),
    colorField(def, "clothes", "Clothes colour", { extra: ["#262e33"], group: "Clothes" }),
  ],
  defaults: (seed = "Zara") => ({ seed, skinColor: "#ae5d29", topVariant: "hijab", hairColor: "#2c1b18", hatColor: "#5b6ee1", accessoriesVariant: "none", facialHairVariant: "none", facialHairColor: "#2c1b18", clothesVariant: "blazerAndShirt", clothesColor: "#262e33" }),
  faces: {
    neutral: { eyesVariant: "default", mouthVariant: "default", eyebrowsVariant: "defaultNatural" },
    talk: { eyesVariant: "default", mouthVariant: "smile", eyebrowsVariant: "defaultNatural" },
    happy: { eyesVariant: "happy", mouthVariant: "smile", eyebrowsVariant: "defaultNatural" },
    laughing: { eyesVariant: "happy", mouthVariant: "twinkle", eyebrowsVariant: "raisedExcitedNatural" },
    calm: { eyesVariant: "happy", mouthVariant: "default", eyebrowsVariant: "defaultNatural" },
    focused: { eyesVariant: "squint", mouthVariant: "serious", eyebrowsVariant: "flatNatural" },
    surprised: { eyesVariant: "surprised", mouthVariant: "disbelief", eyebrowsVariant: "raisedExcited" },
    sad: { eyesVariant: "default", mouthVariant: "sad", eyebrowsVariant: "sadConcernedNatural" },
    sleepy: { eyesVariant: "closed", mouthVariant: "default", eyebrowsVariant: "defaultNatural" },
    squinted: { eyesVariant: "squint", mouthVariant: "default", eyebrowsVariant: "upDownNatural" },
    angry: { eyesVariant: "default", mouthVariant: "serious", eyebrowsVariant: "angryNatural" },
    confused: { eyesVariant: "eyeRoll", mouthVariant: "concerned", eyebrowsVariant: "upDownNatural" },
    scared: { eyesVariant: "surprised", mouthVariant: "screamOpen", eyebrowsVariant: "sadConcerned" },
    wink: { eyesVariant: "wink", mouthVariant: "twinkle", eyebrowsVariant: "raisedExcitedNatural" },
    dizzy: { eyesVariant: "xDizzy", mouthVariant: "concerned", eyebrowsVariant: "defaultNatural" },
    love: { eyesVariant: "hearts", mouthVariant: "smile", eyebrowsVariant: "raisedExcitedNatural" },
  },
  art: {
    bust: true, body: "bust", lift: 0.7, closedFaces: ["sleepy"], rot: { yaw: 0.75, pitch: 0.8, roll: 0.6, x: 0.6 }, tilt: { x: 8, y: 12 },
    parallax: { eyes: 7, eyebrows: 5.5, nose: 4, mouth: 3, facialHair: 2.5, top: 1, accessories: 4.5 },
  },
});
export default avataaars;
