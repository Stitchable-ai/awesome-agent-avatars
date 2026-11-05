// The app-drawn arm and hand (waving, raised to ask). Three ways, chosen per style:
//
//  forearm  – 2D half-body art (default for busts). A head-and-shoulders crop shows no
//             elbow, so only a forearm rises from below the frame, in front of the
//             shoulder, in the style's sleeve colour and line, with the hand at chin height.
//             It waves about the elbow, which stays out of view, and only swings outward so
//             the hand never covers the face.
//  floating – a hand beside the head, the way emoji hold theirs: a drawn hand for abstract
//             characters, or the style's own hand images (`hands`) for picture styles.
//  none     – no hand. Half-body pictures that already have arms at their sides get this:
//             adding a raised arm to them always reads as a third arm.
import type { Anchors, StyleArt } from "./types";

type Pt = { x: number; y: number };
const darken = (hex: string, k: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex;
  const n = parseInt(m[1], 16), f = (v: number) => Math.max(0, Math.round(v * (1 - k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
};
const f1 = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]!);

export type ArmMode = "forearm" | "floating" | "none";
export function armMode(art: StyleArt): ArmMode {
  if (art.arm === "attached") return "forearm";
  if (art.arm) return art.arm;
  if (art.tier === "picture") return art.hands ? "floating" : "none";
  return art.bust ? "forearm" : "floating";
}

/** Forearm geometry in a 1000-unit box matching the art box: from the elbow (below the frame,
 *  over the body so the arm reads as in front of the shoulder) up to the wrist beside the head. */
export function forearmGeometry(A: Anchors) {
  const U = 1000, hw = A.hw;
  const H: Pt = { x: Math.min(0.9, A.cx + hw * 0.74) * U, y: (A.chin - hw * 0.08) * U };             // wrist at chin height, a natural small wave
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

/** HTML for the front layer (forearm and hand, or a floating hand). */
export function armHTML(art: StyleArt, anchors: Anchors | undefined, layer: "front" | "back"): string {
  const mode = armMode(art);
  if (mode === "none") return "";
  if (mode === "floating") return layer === "front" ? (art.hands ? handImages(art.hands) : FLOATING) : "";
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

// Picture hands (e.g. Fluent's 3D ✋ and 👋): both are present, and the prop's wave/raise class picks one.
function handImages(h: { wave?: string; raise?: string }): string {
  const img = (src: string | undefined, cls: string) => (src ? `<img class="${cls}" alt="" draggable="false" src="${esc(src)}">` : "");
  return `<div class="aav-w aav-w-hand aav-w-hand3d" data-k="0">${img(h.wave || h.raise, "aav-hand-wave")}${img(h.raise || h.wave, "aav-hand-raise")}</div>`;
}

// For abstract styles with no body: a small hand beside the head.
const FLOATING = '<div class="aav-w aav-w-hand" data-k="0"><svg viewBox="0 0 40 100"><rect x="9" y="40" width="22" height="64" rx="10" style="fill:var(--sleeve)"/><path d="M8 44V22a4 4 0 0 1 8 0V8a4 4 0 0 1 8 0v4a4 4 0 0 1 8 0v8a4 4 0 0 1 7 2v18a12 12 0 0 1-12 12h-6A13 13 0 0 1 8 44z" style="fill:var(--skin)" stroke="rgba(0,0,0,.12)"/></svg></div>';
