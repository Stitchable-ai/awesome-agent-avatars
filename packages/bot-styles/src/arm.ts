// The app-drawn arm and hand (waving, raised to ask).
//
// Half-body styles get an attached arm: the upper arm and forearm are drawn BEHIND the
// art, rooted inside the shoulder, so the body's own outline hides the joint; the hand is
// drawn IN FRONT, so hair never covers it. Sleeve and skin come from the style's colours,
// the outline from the style's line weight. The forearm and hand swing about the elbow.
// Abstract styles (no body) keep a small floating hand.
import type { Anchors, StyleArt } from "./types";

type Pt = { x: number; y: number };
const darken = (hex: string, k: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex;
  const n = parseInt(m[1], 16), f = (v: number) => Math.max(0, Math.round(v * (1 - k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
};
const f1 = (n: number) => n.toFixed(1);

export function armMode(art: StyleArt): "attached" | "floating" | "none" { return art.arm ?? (art.bust ? "attached" : "floating"); }

/** Arm geometry in a 1000-unit box matching the art box. */
export function armGeometry(A: Anchors) {
  const U = 1000, hw = A.hw;
  const S: Pt = { x: (A.sx ?? Math.min(0.97, A.cx + hw * 0.72)) * U, y: (A.sy ?? Math.min(1.02, A.chin + 0.24)) * U };
  const H: Pt = { x: Math.min(0.92, A.cx + hw * 0.74) * U, y: (A.ey - hw * 0.02) * U };      // wrist
  const E: Pt = { x: Math.min(1.05 * U, Math.max(S.x, H.x) + hw * 0.16 * U), y: S.y - (S.y - H.y) * 0.4 }; // elbow, out to the side
  const w = hw * 0.2 * U, hand = hw * 0.34 * U;
  return { S, E, H, w, hand, angle: (Math.atan2(H.x - E.x, E.y - H.y) * 180) / Math.PI };
}

// A right hand seen palm-on, wrist at (0,0), fingers toward -y, 100 units long, thumb toward the face.
const HAND = [
  '<rect x="-24" y="-58" width="48" height="62" rx="20"/>',
  '<rect x="-25" y="-90" width="12" height="52" rx="6"/>', '<rect x="-12" y="-99" width="12" height="60" rx="6"/>',
  '<rect x="1" y="-96" width="12" height="57" rx="6"/>', '<rect x="14" y="-84" width="11" height="45" rx="5.5"/>',
  '<rect x="-6.5" y="-34" width="13" height="34" rx="6.5" transform="translate(-19 -20) rotate(-40)"/>',
].join("");

/** HTML for the front (hand) or back (upper arm + forearm) layer. */
export function armHTML(art: StyleArt, anchors: Anchors | undefined, layer: "front" | "back"): string {
  const mode = armMode(art);
  if (mode === "none") return "";
  if (mode === "floating") return layer === "front" ? FLOATING : "";
  if (!anchors) return "";
  const g = armGeometry(anchors), skin = art.skin || "#f2c6a0", sleeve = art.sleeve || "#6b7280";
  const ow = art.outline?.width ?? 0, oc = art.outline?.color ?? "#000";
  const elbow = `transform-origin:${f1(g.E.x)}px ${f1(g.E.y)}px`, shoulder = `transform-origin:${f1(g.S.x)}px ${f1(g.S.y)}px`;
  const open = `<svg class="bs-arm" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><g class="bs-arm-all" style="${shoulder}">`;
  if (layer === "back") {
    const seg = (a: Pt, b: Pt, w: number, color: string) => `<path d="M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}" stroke="${color}" stroke-width="${f1(w)}" stroke-linecap="round" fill="none"/>`;
    const upper = (ow ? seg(g.S, g.E, g.w * 1.08 + 2 * ow, oc) : "") + seg(g.S, g.E, g.w * 1.08, sleeve);
    const fore = (ow ? seg(g.E, g.H, g.w + 2 * ow, oc) : "") + seg(g.E, g.H, g.w, sleeve);
    return `${open}${upper}<g class="bs-arm-fore" style="${elbow}">${fore}</g></g></svg>`;
  }
  const s = g.hand / 100, lw = ow / s, cuffW = (g.w * 1.12) / s, cuffH = (g.w * 0.42) / s;
  const shapes = HAND + `<rect x="${f1(-cuffW / 2)}" y="-2" width="${f1(cuffW)}" height="${f1(cuffH)}" rx="${f1(cuffH / 2)}"/>`;
  const outline = ow ? `<g fill="${oc}" stroke="${oc}" stroke-width="${f1(lw * 2)}" stroke-linejoin="round">${shapes}</g>` : "";
  const hand = `<g fill="${skin}">${HAND}</g>`
    + `<g stroke="${darken(skin, 0.25)}" stroke-width="${f1(Math.max(1.5, lw * 0.6))}" stroke-linecap="round" opacity=".55"><path d="M-12 -40v-14M1 -40v-14M14 -40v-12"/></g>`
    + `<rect x="${f1(-cuffW / 2)}" y="-2" width="${f1(cuffW)}" height="${f1(cuffH)}" rx="${f1(cuffH / 2)}" fill="${darken(sleeve, 0.12)}"/>`;
  return `${open}<g class="bs-arm-fore" style="${elbow}"><g transform="translate(${f1(g.H.x)} ${f1(g.H.y)}) rotate(${f1(g.angle)}) scale(${s.toFixed(3)})">${outline}${hand}</g></g></g></svg>`;
}

// For abstract styles with no body: a small hand beside the head.
const FLOATING = '<div class="bs-w bs-w-hand" data-k="0"><svg viewBox="0 0 40 100"><rect x="9" y="40" width="22" height="64" rx="10" style="fill:var(--sleeve)"/><path d="M8 44V22a4 4 0 0 1 8 0V8a4 4 0 0 1 8 0v4a4 4 0 0 1 8 0v8a4 4 0 0 1 7 2v18a12 12 0 0 1-12 12h-6A13 13 0 0 1 8 44z" style="fill:var(--skin)" stroke="rgba(0,0,0,.12)"/></svg></div>';
