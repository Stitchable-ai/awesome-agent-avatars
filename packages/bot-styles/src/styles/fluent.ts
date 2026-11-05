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

/** Build the image URL for a character and skin tone. */
export const fluentUrl = (character: string, tone = "Default", baseUrl = FLUENT_CDN) => {
  const stem = CHARACTERS.find(([n]) => n === character)?.[1] ?? "woman_office_worker";
  return `${baseUrl}/${encodeURIComponent(character)}/${tone}/3D/${stem}_3d_${tone.toLowerCase()}.png`;
};

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
    render: async (opts) => ({ ...(await base.render({ src: fluentUrl(opts.character, opts.tone, o.baseUrl) })), skin: SKIN[opts.tone] ?? SKIN.Default }),
  };
}
export const fluent = fluentStyle();
export default fluent;
