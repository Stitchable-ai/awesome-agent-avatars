// Fluent Emoji 3D by Microsoft (MIT), as a picture style. No art ships in this package:
// images load from a pinned commit on jsDelivr by default; pass your own baseUrl to self-host.
import { pictureStyle } from "../style";
import type { AvatarStyle } from "../types";

const PIN = "1ffb34c752ecf5d402f04cfb4b392c77f57c54bc";
export const FLUENT_CDN = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@${PIN}/assets`;

const CHARACTERS: [string, string][] = [
  ["Woman office worker", "woman_office_worker"], ["Man office worker", "man_office_worker"], ["Office worker", "office_worker"],
  ["Technologist", "technologist"], ["Woman technologist", "woman_technologist"], ["Man technologist", "man_technologist"],
  ["Scientist", "scientist"], ["Teacher", "teacher"], ["Woman with headscarf", "woman_with_headscarf"], ["Person wearing turban", "person_wearing_turban"],
];
const TONES = ["Default", "Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];
const SKIN: Record<string, string> = { Default: "#ffc83d", Light: "#f7dece", "Medium-Light": "#f3d2a2", Medium: "#d5ab88", "Medium-Dark": "#af7e57", Dark: "#7c533e" };

const asset = (name: string, stem: string, tone: string, baseUrl: string) => `${baseUrl}/${encodeURIComponent(name)}/${tone}/3D/${stem}_3d_${tone.toLowerCase()}.png`;
/** Build the image URL for a character and skin tone. */
export const fluentUrl = (character: string, tone = "Default", baseUrl = FLUENT_CDN) =>
  asset(character, CHARACTERS.find(([n]) => n === character)?.[1] ?? "woman_office_worker", tone, baseUrl);

// The office workers have no visible arms, but Fluent's "raising hand" emoji of the same person has a
// real 3D raised arm. We borrow that arm (cut from the image, sleeve re-tinted to the suit) so the
// 3D character raises its own 3D arm instead of a drawn one. All three share one arm template.
const RAISING: Record<string, [string, string, [number, number, number]]> = {
  "Woman office worker": ["Woman raising hand", "woman_raising_hand", [0.002, 0.012, 0.81]],
  "Man office worker": ["Man raising hand", "man_raising_hand", [0.016, -0.007, 0.8]],
  "Office worker": ["Person raising hand", "person_raising_hand", [0.003, 0.012, 0.81]],
};
const ARM = {
  hand: "8.59% 2.34%, 39.06% 2.34%, 39.06% 19.53%, 34.38% 25%, 32.03% 37.89%, 10.94% 37.89%",
  sleeve: "10.16% 36.33%, 32.81% 36.33%, 32.03% 58.59%, 33.59% 69.53%, 38.28% 77.34%, 40.63% 85.16%, 3.91% 85.16%, 3.91% 58.59%",
  pivot: [21.48, 69.53] as [number, number], shoulder: [35.94, 80.08] as [number, number],
};
const SUIT = "#7d77b4";

export function fluentStyle(o: { baseUrl?: string } = {}): AvatarStyle<{ character: string; tone: string; src: string }> {
  const base = pictureStyle({
    id: "fluent", name: "Fluent Emoji 3D", src: fluentUrl("Woman office worker", "Default", o.baseUrl),
    credit: { author: "Microsoft", authorUrl: "https://github.com/microsoft", source: "Fluent Emoji", sourceUrl: "https://github.com/microsoft/fluentui-emoji", license: "MIT", licenseUrl: "https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE" },
    skin: "#ffc83d", sleeve: "#5b4f8a",
  });
  return {
    ...base,
    fields: [
      { key: "character", label: "Character", type: "select", options: CHARACTERS.map(([n]) => ({ value: n, label: n })) },
      { key: "tone", label: "Skin tone", type: "select", options: TONES.map((t) => ({ value: t, label: t.replace("-", " ") })) },
    ],
    defaults: () => ({ character: "Woman office worker", tone: "Default", src: "" }),
    render: async (opts) => {
      const art = { ...(await base.render({ src: fluentUrl(opts.character, opts.tone, o.baseUrl) })), skin: SKIN[opts.tone] ?? SKIN.Default };
      const r = RAISING[opts.character];
      if (r) art.armSprite = { src: asset(r[0], r[1], opts.tone, o.baseUrl ?? FLUENT_CDN), box: r[2], tint: SUIT, ...ARM };
      return art;
    },
  };
}
export const fluent = fluentStyle();
export default fluent;
