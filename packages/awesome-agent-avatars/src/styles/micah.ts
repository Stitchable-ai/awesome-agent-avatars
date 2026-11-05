// Micah by Micah Lanier (CC BY 4.0), via DiceBear. Remix of "Avatar Illustration System".
import definition from "@dicebear/styles/micah.json";
import { colorField, dicebearStyle, variantField } from "../dicebear";

const def = definition as any;
const SKIN = ["#f9c9b6", "#e8b796", "#d39972", "#ac6651", "#8d5524", "#77311d", "#5c3a21"];

export const micah = dicebearStyle({
  id: "micah",
  name: "Micah",
  definition: def,
  skinKey: "baseColor",
  sleeveKey: "shirtColor",
  fields: [
    colorField(def, "base", "Skin", { extra: SKIN, group: "Face" }),
    variantField(def, "hair", "Hair", { group: "Hair" }),
    colorField(def, "hair", "Hair colour", { extra: ["#2b2b2b", "#6b4423", "#c68642", "#b55239"], group: "Hair" }),
    variantField(def, "glasses", "Glasses", { optional: true, group: "Face" }),
    variantField(def, "facialHair", "Facial hair", { optional: true, group: "Face" }),
    variantField(def, "earrings", "Earrings", { optional: true, group: "Face" }),
    variantField(def, "nose", "Nose", { group: "Face" }),
    variantField(def, "ears", "Ears", { group: "Face" }),
    variantField(def, "clothes", "Top", { group: "Clothes" }),
    colorField(def, "shirt", "Top colour", { group: "Clothes" }),
  ],
  defaults: (seed = "Kit") => ({ seed, baseColor: "#ac6651", hairVariant: "fonze", hairColor: "#2b2b2b", glassesVariant: "round", facialHairVariant: "none", earringsVariant: "none", noseVariant: "curve", earsVariant: "attached", clothesVariant: "collared", shirtColor: "#6bd9e9" }),
  faces: {
    neutral: { eyesVariant: "eyes", mouthVariant: "smile", eyebrowsVariant: "up" },
    talk: { eyesVariant: "eyes", mouthVariant: "laughing", eyebrowsVariant: "up" },
    happy: { eyesVariant: "smiling", mouthVariant: "smile", eyebrowsVariant: "up" },
    laughing: { eyesVariant: "smiling", mouthVariant: "laughing", eyebrowsVariant: "up" },
    calm: { eyesVariant: "smilingShadow", mouthVariant: "smile", eyebrowsVariant: "down" },
    focused: { eyesVariant: "eyes", mouthVariant: "pucker", eyebrowsVariant: "eyelashesDown" },
    surprised: { eyesVariant: "round", mouthVariant: "surprised", eyebrowsVariant: "eyelashesUp" },
    sad: { eyesVariant: "eyesShadow", mouthVariant: "sad", eyebrowsVariant: "down" },
    sleepy: { eyesVariant: "eyesShadow", mouthVariant: "pucker", eyebrowsVariant: "down" },
    squinted: { eyesVariant: "eyesShadow", mouthVariant: "smirk", eyebrowsVariant: "down" },
    angry: { eyesVariant: "eyes", mouthVariant: "frown", eyebrowsVariant: "down" },
    confused: { eyesVariant: "eyes", mouthVariant: "nervous", eyebrowsVariant: "eyelashesUp" },
    scared: { eyesVariant: "round", mouthVariant: "nervous", eyebrowsVariant: "up" },
  },
  art: {
    bust: true, body: "bust", lift: 0.7, outline: { color: "#000", width: 10 }, rot: { yaw: 0.75, pitch: 0.8, roll: 0.6, x: 0.6 }, tilt: { x: 8, y: 12 },
    parallax: { eyes: 10, eyebrows: 7, glasses: 7.5, nose: 5, mouth: 3.5, facialHair: 3, hair: 1.2, ears: -1.5, earrings: -1.5 },
  },
});
export default micah;
