// react-nice-avatar by Dapi (MIT). Each part is its own <svg> layer; we find which layer
// is which part by rendering two looks that differ in one part and comparing them.
// Peer dependencies: react, react-dom, react-nice-avatar. Renders in the browser.
import { createElement } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import NiceAvatar from "react-nice-avatar";
import type { FaceName, StyleArt } from "../types.js";
import { defineStyle } from "../style.js";

type Opts = { sex: string; faceColor: string; earSize: string; hairStyle: string; hairColor: string; hatStyle: string; hatColor: string; eyeBrowStyle: string; glassesStyle: string; noseStyle: string; shirtStyle: string; shirtColor: string };
const sel = (key: string, label: string, values: string[], group: string) => ({ key, label, type: "select" as const, group, options: values.map((v) => ({ value: v, label: v.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()) })) });
const col = (key: string, label: string, swatches: string[], group: string) => ({ key, label, type: "color" as const, group, swatches });

function render(config: Record<string, unknown>): string {
  const host = document.createElement("div"), root = createRoot(host);
  // the component's props are its typed config; we pass a loose bag of probes, so widen the component rather than the bag
  flushSync(() => root.render(createElement(NiceAvatar as unknown as ComponentType<Record<string, unknown>>, { style: { width: "100%", height: "100%" }, shape: "square", bgColor: "transparent", ...config })));
  const html = host.innerHTML; root.unmount(); return html;
}
const chunks = (m: string) => m.match(/<svg[\s\S]*?<\/svg>/g) || [];
// for each part: an alternative value to compare against (chosen to differ from the current one)
const PROBE: [string, string, string[]][] = [
  ["eyes", "eyeStyle", ["oval", "circle"]], ["mouth", "mouthStyle", ["laugh", "smile"]], ["eyebrows", "eyeBrowStyle", ["up", "upWoman"]],
  ["nose", "noseStyle", ["long", "round", "short"]], ["glasses", "glassesStyle", ["square", "round"]], ["hair", "hairStyle", ["womanShort", "normal", "thick"]],
  ["face", "faceColor", ["#AC6651", "#F9C9B6"]], ["clothes", "shirtStyle", ["short", "polo", "hoody"]],
];
const partCache = new Map<string, Record<number, string>>();
/** Which <svg> layer is which part, for this exact look (a missing layer, e.g. no glasses, shifts the rest). */
function parts(cfg: Record<string, unknown>) {
  const key = JSON.stringify(cfg); const hit = partCache.get(key); if (hit) return hit;
  const idx: Record<number, string> = {}, base = chunks(render(cfg));
  for (const [part, k, alts] of PROBE) {
    if (k === "glassesStyle" && cfg[k] === "none") continue;
    const alt = alts.find((v) => v !== cfg[k]); if (!alt) continue;
    const other = chunks(render({ ...cfg, [k]: alt }));
    if (other.length !== base.length) continue;
    base.forEach((c, i) => { if (c !== other[i] && idx[i] == null) idx[i] = part; });
  }
  partCache.set(key, idx); return idx;
}
const FACES: Partial<Record<FaceName, Record<string, string>>> = {
  neutral: { eyeStyle: "circle", mouthStyle: "smile" }, talk: { eyeStyle: "circle", mouthStyle: "laugh" },
  happy: { eyeStyle: "smile", mouthStyle: "smile" }, laughing: { eyeStyle: "smile", mouthStyle: "laugh" }, calm: { eyeStyle: "smile", mouthStyle: "peace" },
  surprised: { eyeStyle: "oval", mouthStyle: "laugh" }, focused: { eyeStyle: "oval", mouthStyle: "peace" },
};

export const nice = defineStyle<Opts>({
  id: "nice",
  name: "Nice Avatar",
  tier: "parts",
  credit: { author: "Dapi", authorUrl: "https://github.com/dapi-labs", source: "react-nice-avatar", sourceUrl: "https://github.com/dapi-labs/react-nice-avatar", license: "MIT", licenseUrl: "https://github.com/dapi-labs/react-nice-avatar/blob/main/LICENSE" },
  fields: [
    sel("sex", "Body", ["woman", "man"], "Face"),
    col("faceColor", "Skin", ["#F9C9B6", "#E8B796", "#D39972", "#AC6651", "#8D5524", "#5C3A21"], "Face"),
    sel("earSize", "Ears", ["small", "big"], "Face"),
    sel("noseStyle", "Nose", ["short", "long", "round"], "Face"),
    sel("glassesStyle", "Glasses", ["none", "round", "square"], "Face"),
    sel("eyeBrowStyle", "Brows", ["up", "upWoman"], "Face"),
    sel("hairStyle", "Hair", ["normal", "thick", "mohawk", "womanLong", "womanShort"], "Hair"),
    col("hairColor", "Hair colour", ["#000000", "#2B2B2B", "#6B4423", "#C68642", "#506AF4", "#F48150", "#FC909F", "#D2EFF3"], "Hair"),
    sel("hatStyle", "Hat", ["none", "beanie", "turban"], "Hair"),
    col("hatColor", "Hat colour", ["#000000", "#506AF4", "#F48150", "#77311D", "#FC909F", "#D2EFF3"], "Hair"),
    sel("shirtStyle", "Top", ["hoody", "short", "polo"], "Clothes"),
    col("shirtColor", "Top colour", ["#9287FF", "#6BD9E9", "#FC909F", "#F4D150", "#77311D", "#2B2B2B"], "Clothes"),
  ],
  defaults: () => ({ sex: "woman", faceColor: "#F9C9B6", earSize: "small", hairStyle: "womanLong", hairColor: "#506AF4", hatStyle: "none", hatColor: "#000000", eyeBrowStyle: "upWoman", glassesStyle: "round", noseStyle: "round", shirtStyle: "polo", shirtColor: "#77311D" }),
  async render(o): Promise<StyleArt> {
    // React will not flush synchronously while it is rendering or running effects (where
    // useStyleArt calls us), so start from a fresh task.
    await new Promise((r) => setTimeout(r, 0));
    const base = { ...o };
    const idx = parts({ ...base, ...FACES.neutral });
    const tagged = (m: string) => { let i = -1; return m.replace(/<svg /g, () => { i++; return idx[i] ? `<svg class="aav-part-${idx[i]}" ` : "<svg "; }); };
    const faces: Record<string, string> = {};
    for (const [f, fo] of Object.entries(FACES)) faces[f] = tagged(render({ ...base, ...fo }));
    return {
      id: "nice", tier: "parts", faces: faces as StyleArt["faces"], bust: true, body: "bust", lift: 0.7, partUnits: "px", faceSelector: ".aav-part-face", outline: { color: "#000", width: 7 },
      skin: o.faceColor, sleeve: o.shirtColor, rot: { yaw: 0.75, pitch: 0.8, roll: 0.6, x: 0.6 }, tilt: { x: 8, y: 12 },
      parallax: { eyes: 4, eyebrows: 3.2, glasses: 3.6, nose: 2.6, mouth: 2, hair: 0.6 },
    };
  },
});
export default nice;
