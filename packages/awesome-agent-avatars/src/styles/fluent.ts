// Fluent Emoji 3D by Microsoft (MIT), as a picture style. Neck-up heads only: a half-body picture
// already has arms at its sides, so it cannot raise one without growing a third. Hands come from
// Fluent's own 3D hand emoji (✋ to ask, 👋 to wave), floating beside the head the way Fluent's
// own smileys (🤗 🫡 🤭) hold theirs. No art ships in this package: images load from a pinned
// commit on jsDelivr by default; pass your own baseUrl to self-host.
import { pictureStyle } from "../style.js";
import type { AvatarStyle } from "../types.js";

const PIN = "1ffb34c752ecf5d402f04cfb4b392c77f57c54bc";
export const FLUENT_CDN = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@${PIN}/assets`;

const HEADS = [
  "Woman", "Man", "Person", "Woman curly hair", "Woman red hair", "Woman white hair", "Woman bald",
  "Man curly hair", "Man red hair", "Man white hair", "Man bald", "Man beard",
  "Person curly hair", "Person red hair", "Person white hair", "Person bald", "Person beard", "Older person",
];
const TONES = ["Default", "Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];
const asset = (name: string, tone: string, baseUrl: string) => `${baseUrl}/${encodeURIComponent(name)}/${tone}/3D/${name.toLowerCase().replace(/ /g, "_")}_3d_${tone.toLowerCase()}.png`;

/** Build the image URL for a head (e.g. "Woman curly hair") and skin tone. */
export const fluentUrl = (character: string, tone = "Default", baseUrl = FLUENT_CDN) => asset(HEADS.includes(character) ? character : "Woman", tone, baseUrl);

export function fluentStyle(o: { baseUrl?: string } = {}): AvatarStyle<{ character: string; tone: string; src: string }> {
  const baseUrl = o.baseUrl ?? FLUENT_CDN;
  const base = pictureStyle({
    id: "fluent", name: "Fluent Emoji 3D", src: fluentUrl("Woman", "Default", baseUrl), bust: false, pad: 0.11,
    credit: { author: "Microsoft", authorUrl: "https://github.com/microsoft", source: "Fluent Emoji", sourceUrl: "https://github.com/microsoft/fluentui-emoji", license: "MIT", licenseUrl: "https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE" },
    // a head fills most of the square: eyes at the middle, chin near the bottom
    anchors: { cx: 0.5, ey: 0.5, hw: 0.74, crown: 0.05, my: 0.71, chin: 0.9, chest: 0.97 },
  });
  return {
    ...base,
    fields: [
      { key: "character", label: "Character", type: "select", options: HEADS.map((n) => ({ value: n, label: n.replace(/^(Woman|Man|Person) /, "$1, ") })) },
      { key: "tone", label: "Skin tone", type: "select", options: TONES.map((t) => ({ value: t, label: t.replace("-", " ") })) },
    ],
    defaults: () => ({ character: "Woman", tone: "Default", src: "" }),
    render: async (opts) => {
      const tone = TONES.includes(opts.tone) ? opts.tone : "Default";
      const art = await base.render({ src: fluentUrl(opts.character, tone, baseUrl) });
      return { ...art, body: "head" as const, rot: { yaw: 0.9, pitch: 0.9, roll: 0.8, x: 0.8 }, tilt: { x: 12, y: 18 }, lift: 1,
        hands: { wave: asset("Waving hand", tone, baseUrl), raise: asset("Raised hand", tone, baseUrl) } };
    },
  };
}
export const fluent = fluentStyle();
export default fluent;
