// The app-drawn arm and hand (waving, raised to ask). Four ways, chosen per style:
//
//  forearm  – 2D half-body art (default for busts). A head-and-shoulders crop shows no
//             elbow, so only a forearm rises from below the frame, in front of the
//             shoulder, in the style's sleeve colour and line. It waves about the elbow,
//             which stays out of view, and only swings outward so the hand never covers the face.
//  sprite   – 3D/picture art. A drawn arm on a rendered character looks wrong, so the style
//             supplies a real raised arm cut from a matching image (`armSprite`); it sits
//             behind the body and waves about its own elbow.
//  floating – abstract characters with no body: a small hand beside the head.
//  none     – no arm (pictures without an arm sprite).
import type { Anchors, StyleArt } from "./types";

type Pt = { x: number; y: number };
const darken = (hex: string, k: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex;
  const n = parseInt(m[1], 16), f = (v: number) => Math.max(0, Math.round(v * (1 - k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
};
const f1 = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]!);

export type ArmMode = "forearm" | "sprite" | "floating" | "none";
export function armMode(art: StyleArt): ArmMode {
  if (art.arm === "attached") return "forearm";
  if (art.arm) return art.arm;
  if (art.armSprite) return "sprite";
  if (art.tier === "picture") return "none";
  return art.bust ? "forearm" : "floating";
}

/** Forearm geometry in a 1000-unit box matching the art box: from the elbow (below the frame,
 *  over the body so the arm reads as in front of the shoulder) up to the wrist beside the head. */
export function forearmGeometry(A: Anchors) {
  const U = 1000, hw = A.hw;
  const H: Pt = { x: Math.min(0.88, A.cx + hw * 0.66) * U, y: (A.ey + hw * 0.02) * U };             // wrist, beside the cheek
  const edge = (A.br ?? A.cx + hw * 0.95) - hw * 0.16;                                            // keep the elbow over the clothes
  const B: Pt = { x: Math.max(H.x, Math.min(H.x + hw * 0.24 * U, edge * U)), y: 1.12 * U };       // elbow, out of view
  return { B, H, w0: hw * 0.2 * U, w1: hw * 0.3 * U, hand: hw * 0.38 * U, angle: (Math.atan2(H.x - B.x, B.y - H.y) * 180) / Math.PI };
}

// A hand seen palm-on, wrist at (0,0), fingers toward -y, 100 units long, thumb toward the face.
const HAND = [
  '<rect x="-24" y="-58" width="48" height="62" rx="20"/>',
  '<rect x="-25" y="-90" width="12" height="52" rx="6"/>', '<rect x="-12" y="-99" width="12" height="60" rx="6"/>',
  '<rect x="1" y="-96" width="12" height="57" rx="6"/>', '<rect x="14" y="-84" width="11" height="45" rx="5.5"/>',
  '<rect x="-6.5" y="-34" width="13" height="34" rx="6.5" transform="translate(-19 -20) rotate(-40)"/>',
].join("");

/** HTML for the front layer (forearm, hand) or the back layer (an arm sprite behind the body). */
export function armHTML(art: StyleArt, anchors: Anchors | undefined, layer: "front" | "back"): string {
  const mode = armMode(art);
  if (mode === "none") return "";
  if (mode === "floating") return layer === "front" ? FLOATING : "";
  if (mode === "sprite") return layer === "back" ? spriteHTML(art) : "";
  if (layer === "back" || !anchors) return "";
  const g = forearmGeometry(anchors), skin = art.skin || "#f2c6a0", sleeve = art.sleeve || "#6b7280";
  const ow = art.outline?.width ?? 0, oc = art.outline?.color ?? "#000";
  // a tapered, slightly bowed sleeve from the elbow (wide) to the wrist (narrow)
  const len = Math.hypot(g.H.x - g.B.x, g.H.y - g.B.y), d = { x: (g.H.x - g.B.x) / len, y: (g.H.y - g.B.y) / len }, n = { x: -d.y, y: d.x };
  const at = (p: Pt, k: number, along = 0) => `${f1(p.x + n.x * k + d.x * along)} ${f1(p.y + n.y * k + d.y * along)}`;
  const mid = { x: (g.B.x + g.H.x) / 2, y: (g.B.y + g.H.y) / 2 }, bow = (g.w0 + g.w1) * 0.28;
  const sleevePath = `M${at(g.B, g.w1 / 2)}Q${at(mid, (g.w0 + g.w1) / 4 + bow)} ${at(g.H, g.w0 / 2)}Q${at(g.H, 0, g.w0 * 0.55)} ${at(g.H, -g.w0 / 2)}Q${at(mid, -(g.w0 + g.w1) / 4 - bow * 0.6)} ${at(g.B, -g.w1 / 2)}Z`;
  const seg = (_w: number, color: string) => color === oc && ow ? `<path d="${sleevePath}" fill="${oc}" stroke="${oc}" stroke-width="${f1(2 * ow)}" stroke-linejoin="round"/>` : `<path d="${sleevePath}" fill="${color}"/>`;
  const shade = `<path d="M${at(mid, -(g.w0 + g.w1) / 4 + bow * 0.1)}Q${at(g.H, -g.w0 / 2 + g.w0 * 0.12, -g.w0 * 0.2)} ${at(g.H, -g.w0 / 2 + g.w0 * 0.12, -g.w0)}" stroke="${darken(sleeve, 0.18)}" stroke-width="${f1(g.w0 * 0.16)}" stroke-linecap="round" fill="none" opacity=".5"/>`;
  const w = g.w0, s = g.hand / 100, lw = ow / s, cuffW = (w * 1.14) / s, cuffH = (w * 0.42) / s;
  const cuff = (fill: string, extra = 0) => `<rect x="${f1(-cuffW / 2 - extra)}" y="${f1(-2 - extra)}" width="${f1(cuffW + 2 * extra)}" height="${f1(cuffH + 2 * extra)}" rx="${f1(cuffH / 2 + extra)}" fill="${fill}"/>`;
  const handOutline = ow ? `<g fill="${oc}" stroke="${oc}" stroke-width="${f1(lw * 2)}" stroke-linejoin="round">${HAND}</g>${cuff(oc, lw)}` : "";
  const hand = `<g transform="translate(${f1(g.H.x)} ${f1(g.H.y)}) rotate(${f1(g.angle)}) scale(${s.toFixed(3)})">${handOutline}<g fill="${skin}">${HAND}</g>`
    + `<g stroke="${darken(skin, 0.25)}" stroke-width="${f1(Math.max(1.5, lw * 0.6))}" stroke-linecap="round" opacity=".55"><path d="M-12 -40v-14M1 -40v-14M14 -40v-12"/></g>${cuff(darken(sleeve, 0.12))}</g>`;
  const elbow = `transform-origin:${f1(g.B.x)}px ${f1(g.B.y)}px`;
  return `<svg class="aav-arm" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><g class="aav-arm-all" style="${elbow}"><g class="aav-arm-fore" style="${elbow}">`
    + (ow ? seg(0, oc) : "") + seg(0, sleeve) + shade + hand + `</g></g></svg>`;
}

// A real arm cut from a matching picture: sleeve and hand are two clips of the same image so the
// sleeve alone can be recoloured to the outfit. Everything is in % of the sprite image.
function spriteHTML(art: StyleArt): string {
  const sp = art.armSprite!; const [x, y, w] = sp.box, src = esc(sp.src);
  const img = (poly: string, filter = "") => `<img alt="" draggable="false" src="${src}" style="clip-path:polygon(${poly})${filter ? `;filter:${filter}` : ""}">`;
  // tint: greyscale the sleeve, then multiply by the outfit colour inside the sleeve's own silhouette
  const sleeve = sp.tint
    ? img(sp.sleeve, sp.sleeveFilter || "grayscale(1) brightness(1.55) contrast(.9)") + `<i style="background:${esc(sp.tint)};clip-path:polygon(${sp.sleeve});-webkit-mask-image:url(&quot;${src}&quot;);mask-image:url(&quot;${src}&quot;)"></i>`
    : img(sp.sleeve, sp.sleeveFilter);
  return `<div class="aav-arm3d" style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;--aav-arm-in:-60deg;--aav-wave-a:2deg;--aav-wave-b:-11deg;--aav-raise:-5deg">`
    + `<div class="aav-arm-all" style="transform-origin:${sp.shoulder[0]}% ${sp.shoulder[1]}%"><div class="aav-arm-fore" style="transform-origin:${sp.pivot[0]}% ${sp.pivot[1]}%">`
    + sleeve + img(sp.hand) + `</div></div></div>`;
}

// For abstract styles with no body: a small hand beside the head.
const FLOATING = '<div class="aav-w aav-w-hand" data-k="0"><svg viewBox="0 0 40 100"><rect x="9" y="40" width="22" height="64" rx="10" style="fill:var(--sleeve)"/><path d="M8 44V22a4 4 0 0 1 8 0V8a4 4 0 0 1 8 0v4a4 4 0 0 1 8 0v8a4 4 0 0 1 7 2v18a12 12 0 0 1-12 12h-6A13 13 0 0 1 8 44z" style="fill:var(--skin)" stroke="rgba(0,0,0,.12)"/></svg></div>';
