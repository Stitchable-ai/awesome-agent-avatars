// The avatar runtime: one shared ticker, a clip player, faces, pokes, reactions,
// pointer gaze, drag physics and props. Styles only supply art (StyleArt).
//
// Nothing here touches `window` or `document` at import time, so the module is
// safe to import during server rendering (Next.js, Remix); create() needs a DOM.
import { defaultMotion } from "./motion.js";
import { PROPS } from "./props.js";
import { stylesheet } from "./css.js";
import { attachInteractions } from "./interactions.js";
import type { Anchors, AvatarOptions, BotAvatar, Clip, Ease, FaceName, Key, LookDirection, MotionPack, PokeName, PokeParams, Pose, ReactionName, StateRecipe, StyleArt } from "./types.js";

const PI2 = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt * 60);
const smooth = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const bump = (e: number, a: number, b: number) => (e <= a || e >= b ? 0 : Math.sin(Math.PI * (e - a) / (b - a)) ** 2);
function rng(seed: number) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) | 0; let e = Math.imul(t ^ (t >>> 15), 1 | t); e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e; return ((e ^ (e >>> 14)) >>> 0) / 4294967296; }; }
function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

// ---- cubic-bezier eases ----
type Bezier = [number, number, number, number];
const EASES: Record<Exclude<Ease, Bezier>, Bezier> = { io: [0.42, 0, 0.58, 1], out: [0.2, 0.7, 0.35, 1], in: [0.55, 0, 0.85, 0.45], lin: [0, 0, 1, 1] };
const bezCache = new Map<string, (u: number) => number>();
function bez(e: Ease): (u: number) => number {
  const key = String(e); const hit = bezCache.get(key); if (hit) return hit;
  const [x1, y1, x2, y2] = typeof e === "string" ? EASES[e] || EASES.io : e;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t, Y = (t: number) => ((ay * t + by) * t + cy) * t, dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const f = (u: number) => {
    if (u <= 0) return 0; if (u >= 1) return 1;
    let t = u; for (let i = 0; i < 8; i++) { const x = X(t) - u, d = dX(t); if (Math.abs(x) < 1e-5 || Math.abs(d) < 1e-6) break; t -= x / d; }
    if (t < 0 || t > 1) { let lo = 0, hi = 1; t = u; for (let i = 0; i < 24; i++) { if (X(t) < u) lo = t; else hi = t; t = (lo + hi) / 2; } }
    return Y(t);
  };
  bezCache.set(key, f); return f;
}
type V = number | number[];
const mix = (a: V, b: V, k: number): V => (Array.isArray(a) ? a.map((v, i) => v + ((b as number[])[i] - v) * k) : a + ((b as number) - a) * k);
function sample<T extends V>(keys: Key<T>[] | undefined, t: number): T | undefined {
  if (!keys || !keys.length) return undefined;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i]; return mix(v0, v1, bez(e || "io")((t - t0) / (t1 - t0 || 1))) as T; }
  return keys[keys.length - 1][1];
}

const REST: Pose = { x: 0, y: 0, pitch: 0, yaw: 0, roll: 0, sx: 1, sy: 1, zoom: 1, gx: 0, gy: 0, lid: 0 };
const POSE_KEYS = Object.keys(REST) as (keyof Pose)[];
const MUL = new Set<keyof Pose>(["sx", "sy", "zoom"]);
type CursorSource = { cursorAt(t: number): { x: number; y: number } };
/** Add a partial pose, scaled by `w`. */
const addPose = (p: Pose, d: Partial<Pose>, w: number) => { for (const k of POSE_KEYS) { const v = d[k]; if (v !== undefined) p[k] += v * w; } };
function clipPose(clip: Clip, t: number, a: CursorSource): Pose {
  const p: Pose = { ...REST }, tr = clip.tracks || {};
  const pos = sample(tr.pos, t); if (pos) { p.x = pos[0]; p.y = pos[1]; }
  const rot = sample(tr.rot, t); if (rot) { p.pitch = rot[0]; p.yaw = rot[1]; p.roll = rot[2]; }
  const sq = sample(tr.sq, t); if (sq) { p.sx = sq[0]; p.sy = sq[1]; }
  const zoom = sample(tr.zoom, t); if (zoom !== undefined) p.zoom = zoom;
  const gaze = sample(tr.gaze, t); if (gaze) { p.gx = gaze[0]; p.gy = gaze[1]; }
  const lid = sample(tr.lid, t); if (lid !== undefined) p.lid = lid;
  if (clip.fn) { const f = clip.fn(t, a); for (const k of POSE_KEYS) { const v = f[k]; if (v !== undefined) p[k] = MUL.has(k) ? p[k] * v : p[k] + v; } }
  return p;
}
const mixPose = (a: Pose, b: Pose, k: number): Pose => { const o = { ...REST }; for (const key of POSE_KEYS) o[key] = lerp(a[key], b[key], k); return o; };
const wrapYaw = (p: Pose): Pose => ({ ...p, yaw: ((p.yaw + 180) % 360 + 360) % 360 - 180 });
const clipFace = (clip: Clip, t: number) => { let n: FaceName | null | undefined = undefined; for (const [kt, name] of clip.tracks?.face || []) { if (kt > t) break; if (name !== "blink") n = name; } return n; };

/** A face a style lacks falls back along this chain, so a style with 4 faces still plays every state. */
export const FACE_FALLBACK: Partial<Record<FaceName, FaceName>> = { laughing: "happy", calm: "happy", wink: "happy", love: "happy", focused: "neutral", squinted: "focused", angry: "squinted", confused: "focused", scared: "surprised", dizzy: "sad", shy: "calm", surprised: "neutral", happy: "neutral", sad: "neutral", sleepy: "neutral" };
export const FACES: FaceName[] = ["neutral", "happy", "laughing", "calm", "focused", "surprised", "sad", "sleepy", "squinted", "angry", "confused", "scared", "wink", "dizzy", "love", "shy", "talk"];
const FEATURES = new Set(["eyes", "mouth", "nose", "eyebrows", "glasses", "facialHair", "accessories"]);

/** A poke in flight: its name, how long it has run, and its parameters. */
export interface PokeState extends PokeParams { name: PokeName; t: number }
/** What pokes add to the pose this frame: lift/roll/pitch/yaw/x/y add, sx/sy multiply. */
export interface PokeAcc { lift: number; sx: number; sy: number; roll: number; pitch: number; yaw: number; x: number; y: number }
/** One poke: how long it lasts and what it adds at progress `e` (0..1). */
export interface PokeDef { dur: (p: PokeState) => number; f: (e: number, o: PokeAcc, p: PokeState) => void }
const bounce: PokeDef = { dur: () => 0.6, f: (e, o) => { const land = bump(e, 0, 0.2) + bump(e, 0.8, 1), air = bump(e, 0.2, 0.8); o.lift += 11 * Math.sin(Math.PI * clamp((e - 0.15) / 0.7, 0, 1)); o.sx *= 1 + 0.07 * land - 0.05 * air; o.sy *= 1 - 0.09 * land + 0.05 * air; } };
/** Pokes compose additively over whatever clip is playing. `hop` is `bounce` under its older name. */
export const POKES: Record<PokeName, PokeDef> = {
  spin: { dur: (p) => 0.85 + 0.35 * ((p.turns || 1) - 1), f: (e, o, p) => { o.yaw += 180 * (p.turns || 1) * (1 - Math.cos(Math.PI * e)); } },
  bounce,
  hop: bounce,
  nod: { dur: () => 0.5, f: (e, o) => { o.pitch -= 12 * bump(e, 0, 1); o.y += 2 * bump(e, 0, 1); } },
  wiggle: { dur: () => 0.7, f: (e, o) => { o.roll += 9 * Math.sin(Math.PI * 4 * e) * (1 - e); } },
  shake: { dur: () => 0.8, f: (e, o) => { const s = Math.sin(Math.PI * 5 * e) * (1 - e); o.yaw += 18 * s; o.x += 3 * s; o.roll += 2.5 * s; } },
  jolt: { dur: () => 0.45, f: (e, o) => { o.pitch += 9 * bump(e, 0, 1); o.y -= 5 * bump(e, 0, 0.7); o.sy *= 1 + 0.06 * bump(e, 0, 0.5); } },
};

/** look(): a head turn that eases in over .5 s, holds, and eases out. */
export const LOOK: Record<LookDirection, Partial<Pose>> = { left: { yaw: -16, x: -4, gx: -0.85 }, right: { yaw: 16, x: 4, gx: 0.85 }, up: { pitch: 11, y: -3, gy: 0.85 }, down: { pitch: -11, y: 2, gy: -0.8 }, center: {} };

/** Reactions: a short moment over any state. Each one moves, sets lids and shows a prop, so it reads even when a style has no art for the face. */
export interface ReactionDef { face: FaceName; pokes?: PokeName[]; props?: string[]; pose?: Partial<Pose>; gaze?: [number, number]; lid?: number; fn?: (t: number) => Partial<Pose> }
export const REACTIONS: Record<ReactionName, ReactionDef> = {
  happy: { face: "happy", pokes: ["bounce"], props: ["sparkle"], pose: { pitch: 4 } },
  laughing: { face: "laughing", props: ["sparkle"], pose: { pitch: 8 }, fn: (t) => ({ y: -1.8 * Math.abs(Math.sin(PI2 * t / 0.18)) }) },
  surprised: { face: "surprised", pokes: ["jolt"], props: ["bang"], pose: { pitch: 6, y: -2 }, gaze: [0, 0.1] },
  sad: { face: "sad", props: ["oops"], pose: { pitch: -10, y: 3, roll: -4 }, gaze: [0.1, -0.5], lid: 0.3 },
  angry: { face: "angry", pokes: ["shake"], props: ["steam"], pose: { pitch: -6, y: 1 } },
  confused: { face: "confused", props: ["huh"], pose: { roll: 13, yaw: 6 }, gaze: [0.35, 0.4] },
  scared: { face: "scared", pokes: ["jolt"], props: ["sweat"], pose: { pitch: -5, y: 3 }, fn: (t) => ({ x: 1.2 * Math.sin(PI2 * t / 0.07), roll: Math.sin(PI2 * t / 0.09) }) },
  wink: { face: "wink", pokes: ["wiggle"], props: ["sparkle"], pose: { roll: 8, yaw: 4 } },
  love: { face: "love", props: ["hearts", "blush"], pose: { roll: 6, pitch: 3 } },
  sleepy: { face: "sleepy", lid: 0.88, props: ["zzz"], pose: { pitch: -9, roll: 7, y: 3 }, gaze: [0, -0.3] },
  shy: { face: "shy", props: ["blush", "hearts"], pokes: ["wiggle"], pose: { yaw: -12, roll: -6, pitch: -5 }, gaze: [-0.45, -0.4] },
};
const isReaction = (name: string): name is ReactionName => Object.prototype.hasOwnProperty.call(REACTIONS, name);

// ---- shared, lazily created globals (SSR-safe) ----
type Live = { step(dt: number): void; visible: boolean; reduced: boolean };
const live = new Set<Live>();
const byRoot = new WeakMap<Element, Live>();
let raf = 0, last = 0, io: IntersectionObserver | null = null, styled = false;
function tick(now: number) {
  raf = 0; const dt = Math.min(0.1, (now - last) / 1000 || 1 / 60); last = now;
  if (!document.hidden) for (const a of live) if (a.visible && !a.reduced) a.step(dt);
  if (live.size) raf = requestAnimationFrame(tick);
}
function wake() { if (!raf && typeof requestAnimationFrame === "function" && live.size) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function observer() {
  if (!io && typeof IntersectionObserver === "function") io = new IntersectionObserver((es) => es.forEach((e) => { const a = byRoot.get(e.target); if (a) a.visible = e.isIntersecting; }));
  return io;
}
/** Add the stylesheet to the document once. Called by createAvatar unless injectStyles is false. */
export function injectStyles(doc: Document = document) {
  if (styled || doc.getElementById("awesome-agent-avatars-css")) { styled = true; return; }
  const el = doc.createElement("style"); el.id = "awesome-agent-avatars-css"; el.textContent = stylesheet; doc.head.append(el); styled = true;
}

let uidSeq = 0;
function uniqueIds(html: string, uid: string) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids)) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`id="${esc}"`, "g"), `id="${id}-${uid}"`).replace(new RegExp(`#${esc}(?=[)"'\\s])`, "g"), `#${id}-${uid}`);
  }
  return html;
}

type Vec = { x: number; y: number };
type PartEntry = { els: HTMLElement[]; k: number };
type FaceEntry = { nodes: Node[]; parts: Record<string, PartEntry> };
/** One avatar's private state. */
interface Internal extends Live, CursorSource {
  root: HTMLElement; ph: number; uid: string;
  state: string; st: number; T: number; clip: { name: string; t: number }; queue: string[]; onceIdx: number;
  bridge: { pose: Pose; t: number; dur: number } | null; base: Pose;
  face: FaceName | null; faces: Partial<Record<FaceName, FaceEntry>>; parts: Record<string, PartEntry>;
  momentFace: FaceName | null; momentUntil: number; holdFace: FaceName | null;
  reactS: { name: ReactionName; t: number; dur: number } | null; lookS: { dir: LookDirection; t: number; hold: number } | null;
  flashes: Record<string, number>; propEls: Map<string, HTMLElement>; propKey: string; quietProps: boolean;
  glance: Vec; gl: Vec; glanceAt: number; glanceBack: number;
  blinkT: number; nextBlink: number; eye: Vec; talkOpen: boolean; talkT: number;
  ptr: { x: number; y: number; hold: number; want: number }; pokes: PokeState[];
  drag: { on: boolean; x: number; y: number; vx: number; vy: number; tx: number; ty: number; sw: number; sv: number; gx: number; gy: number; prev: string | null };
  unit: number; compact: boolean; anchored: boolean; backside: boolean; artStyle: StyleArt; anchors: Anchors | undefined;
  lastAttention: number; wakeTo: string | null; autoBored: number; noBlink: boolean;
  miniArt(): string;
}
// the computer-use cursor works the edges of the picture, never over the face
const CURSOR: Key<[number, number]>[] = [[0, [-0.78, -0.35]], [1.1, [0.74, -0.5]], [1.6, [0.74, -0.5]], [2.7, [0.3, 0.68]], [3.2, [0.3, 0.68]], [4.3, [-0.72, 0.42]], [4.8, [-0.72, 0.42]], [6, [-0.78, -0.35]]];

/** Mount a living avatar into `root`. */
export function createAvatar(root: HTMLElement, art: StyleArt, opts: AvatarOptions = {}): BotAvatar {
  if (opts.injectStyles !== false) injectStyles(root.ownerDocument);
  const motion: MotionPack = opts.motion || defaultMotion;
  const { CLIPS, STATES } = { CLIPS: motion.clips, STATES: motion.states };
  const r = rng(hash(art.id + (opts.seed || "")));
  let style = art;
  root.classList.add("aav-av");
  root.innerHTML = '<div class="aav-glow"></div><div class="aav-shadow"></div><div class="aav-drag"><div class="aav-body"><div class="aav-back"></div><div class="aav-art"></div><div class="aav-front"></div></div></div><div class="aav-fx"></div>';
  const $ = (s: string) => root.querySelector(s) as HTMLElement;
  const dragEl = $(".aav-drag"), body = $(".aav-body"), artEl = $(".aav-art"), fx = $(".aav-fx"), front = $(".aav-front"), back = $(".aav-back"), shadow = $(".aav-shadow");

  const a: Internal = {
    root, visible: true, ph: r() * PI2, uid: "bs" + ++uidSeq,
    state: "idle", st: 0, T: 0, clip: { name: "", t: 0 }, queue: [], onceIdx: -1, bridge: null, base: { ...REST },
    face: null, faces: {}, parts: {},
    momentFace: null, momentUntil: 0, holdFace: null, reactS: null, lookS: null, flashes: {}, propEls: new Map(), propKey: "", quietProps: false,
    glance: { x: 0, y: 0 }, gl: { x: 0, y: 0 }, glanceAt: 1 + r() * 3, glanceBack: 0,
    blinkT: 0, nextBlink: 1 + r() * 3, eye: { x: 0, y: 0 }, talkOpen: false, talkT: 0,
    ptr: { x: 0, y: 0, hold: 0, want: 0 }, pokes: [],
    drag: { on: false, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, sw: 0, sv: 0, gx: 0, gy: 0, prev: null },
    unit: 1, compact: false, anchored: false, backside: false, artStyle: art, anchors: undefined, lastAttention: 0, wakeTo: null,
    autoBored: opts.autoSleep === false ? 0 : opts.autoSleep?.bored ?? 45, noBlink: !!opts.static, reduced: false,
    // filled in below, once the helpers they call exist
    step: () => {},
    cursorAt: (t) => { const v = sample(CURSOR, t % 6)!; return { x: v[0], y: v[1] }; },
    miniArt: () => {
      const f = style.faces.neutral;
      if (style.tier === "picture" || f.startsWith("<img")) return f;
      if (f.startsWith("<svg")) return `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(f)}">`;
      return uniqueIds(f, a.uid + "m" + Math.floor(r() * 1e6));
    },
  };
  byRoot.set(root, a); observer()?.observe(root);
  const measure = () => { a.unit = (root.clientWidth || 200) / 200; const c = root.clientWidth > 0 && root.clientWidth < 56; if (c !== a.compact) { a.compact = c; root.classList.toggle("compact", c); } };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null; ro?.observe(root); measure();

  function applyArt(next: StyleArt) {
    style = next; a.artStyle = next; a.anchors = undefined; a.faces = {}; a.anchored = false; a.face = null;
    root.dataset.tier = style.tier; root.classList.toggle("bust", !!style.bust);
    body.style.setProperty("--skin", style.skin || "#f2c6a0"); body.style.setProperty("--sleeve", style.sleeve || style.skin || "#6b7280");
    // worn props and mini copies depend on the art
    for (const el of a.propEls.values()) el.remove(); a.propEls.clear();
    paintFace("neutral");
  }
  // ---- faces: parsed once per avatar, swapped by moving nodes ----
  function faceEntry(name: FaceName): FaceEntry {
    const hit = a.faces[name]; if (hit) return hit;
    const holder = document.createElement("div"); holder.innerHTML = uniqueIds(style.faces[name] ?? style.faces.neutral, a.uid);
    const parts: Record<string, PartEntry> = {};
    for (const [part, k] of Object.entries(style.parallax || {})) { const els = holder.querySelectorAll<HTMLElement>(".aav-part-" + part); if (els.length) parts[part] = { els: [...els], k }; }
    return (a.faces[name] = { nodes: [...holder.childNodes], parts });
  }
  function paintFace(name: FaceName) { const f = faceEntry(name); artEl.replaceChildren(...f.nodes); a.parts = f.parts; a.face = name; }
  const resolveFace = (n: FaceName | null | undefined): FaceName => { let k = n, g = 0; while (k && style.faces[k] == null && g++ < 8) k = FACE_FALLBACK[k]; return k && style.faces[k] != null ? k : "neutral"; };

  // ---- anchors for worn props: from the style, else measured from tagged parts ----
  function anchor() {
    let A: Anchors | undefined = style.anchors;
    if (!A) {
      const box = artEl.getBoundingClientRect(); if (!box.width) return false;
      const R = (sel: string) => {
        let l = 1e9, t = 1e9, rr = -1e9, b = -1e9;
        // a part may be a whole <svg> layer: measure what it draws, not its canvas
        const drawn = [...artEl.querySelectorAll(sel)].flatMap((e) => (e.tagName.toLowerCase() === "svg" ? [...e.querySelectorAll("path,circle,ellipse,rect,polygon,polyline,line,image")] : [e]));
        for (const e of drawn) { const q = e.getBoundingClientRect(); if (!q.width && !q.height) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); rr = Math.max(rr, q.right); b = Math.max(b, q.bottom); }
        return l > rr ? null : { l: (l - box.left) / box.width, t: (t - box.top) / box.height, r: (rr - box.left) / box.width, b: (b - box.top) / box.height };
      };
      const E = R(".aav-part-eyes"), M = R(".aav-part-mouth"), F = R(style.faceSelector || ".aav-part-head, .aav-part-face, .aav-part-shape"), H = R(".aav-part-hair, .aav-part-top"), Cl = R(".aav-part-clothes");
      const ey = E ? (E.t + E.b) / 2 : F ? F.t + (F.b - F.t) * 0.42 : 0.4;
      const hw = F ? F.r - F.l : E ? (E.r - E.l) * 2.1 : 0.5;
      const my = M ? (M.t + M.b) / 2 : ey + hw * 0.3;
      const cx = E ? (E.l + E.r) / 2 : F ? (F.l + F.r) / 2 : 0.5;
      const measured: Anchors = { cx, ey, hw, crown: Math.min(H ? H.t : 1, F ? F.t : 1, ey - hw * 0.45), my, chin: M ? M.b + (M.b - ey) * 0.3 : F ? F.b : ey + hw * 0.55 };
      // the shoulder: a point inside the clothes, part-way out toward the edge, where an arm can root
      if (Cl) { measured.sx = Math.min(0.97, cx + (Cl.r - cx) * 0.62); measured.sy = Cl.t + (Cl.b - Cl.t) * 0.3; measured.br = Cl.r; }
      A = measured;
    }
    const anchors: Anchors = { ...A, ...(style.anchorAdjust || {}) };
    anchors.chest = anchors.chest ?? Math.min(0.88, anchors.chin + 0.2);
    for (const [k, v] of Object.entries(anchors)) if (typeof v === "number") body.style.setProperty("--" + k, v.toFixed(4));
    a.anchors = anchors; a.anchored = true;
    for (const [id, el] of a.propEls) { const P = PROPS[id]; if (P?.anchored && typeof P.html === "function") el.innerHTML = P.html(a); }
    return true;
  }

  // ---- props ----
  function propIds() {
    const rec = STATES[a.state], want = new Set<string>(([] as string[]).concat(rec.prop || [], rec.wear || []));
    for (const [id, until] of Object.entries(a.flashes)) if (a.T < until) want.add(id);
    if (want.has("cape")) want.add("bow");
    return want;
  }
  function syncProps() {
    const want = propIds();
    for (const [id, el] of a.propEls) if (!want.has(id)) { a.propEls.delete(id); el.classList.add("out"); setTimeout(() => el.remove(), 280); }
    for (const id of ["hand"]) { const el = a.propEls.get(id); if (el) { const w = !!STATES[a.state].wave; el.classList.toggle("wave", w); el.classList.toggle("raise", !w); } }
    for (const id of want) {
      const P = PROPS[id]; if (a.propEls.has(id) || !P) continue;
      const el = document.createElement("div");
      // props pop in when a state starts; a hot-swap of the art keeps them steady
      el.className = "aav-prop" + (a.quietProps ? "" : " in") + (P.badge ? " badge" : ""); el.dataset.p = id;
      if (!a.quietProps) setTimeout(() => el.classList.remove("in"), 900);
      el.innerHTML = typeof P.html === "function" ? P.html(a) : P.html;
      if (id === "hand") el.classList.add(STATES[a.state].wave ? "wave" : "raise");
      (P.layer === "front" ? front : P.layer === "back" ? back : fx).append(el);
      a.propEls.set(id, el);
    }
    a.propKey = [...want].sort().join();
  }
  function flash(id: string, secs = 2) { a.flashes[id] = a.T + secs; syncProps(); wake(); }

  // ---- clips: several per state, shuffled, never the same one twice in a row ----
  const recClips = (rec: StateRecipe): string[] => (a.compact && rec.compact) || rec.clips;
  function pick(rec: StateRecipe): string {
    const list = recClips(rec);
    if (!a.queue.length) {
      const q = [...list]; for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
      const k = q.findIndex((n) => n !== a.clip.name); if (k > 0) [q[0], q[k]] = [q[k], q[0]];
      a.queue = q;
    }
    return a.queue.shift()!;
  }
  function startClip(name: string, bridgeDur = 0.32) {
    if (!CLIPS[name]) throw new Error(`awesome-agent-avatars: no clip named "${name}"`);
    if (a.clip.name) a.bridge = { pose: wrapYaw(a.base), t: 0, dur: bridgeDur };
    a.clip = { name, t: 0 };
  }
  function setState(s: string, { quiet = false } = {}) {
    const rec = STATES[s]; if (!rec) return;
    if (a.state === "blocked" && s === "drowsy") a.wakeTo = "blocked"; else if (s !== "drowsy") a.wakeTo = null;
    a.state = s; a.st = 0; a.queue = [];
    a.onceIdx = rec.next && rec.hold == null ? 0 : -1;
    startClip(a.onceIdx === 0 ? recClips(rec)[0] : pick(rec), 0.4);
    root.dataset.state = s; root.dataset.dim = rec.dim || "";
    syncProps();
    if (!quiet) for (const p of rec.pokes || []) Array.isArray(p) ? poke(p[0], p[1]) : poke(p);
    opts.onState?.(s);
  }
  function poke(name: PokeName, p: PokeParams = {}) { if (POKES[name] && !a.reduced) a.pokes.push({ name, t: 0, ...p }); wake(); }
  const attend = () => {
    a.lastAttention = a.T;
    if (a.state === "sleeping") setState("waking");
    else if (a.state === "bored") setState("idle");
    else if (a.state === "drowsy" && a.wakeTo) setState(a.wakeTo, { quiet: true });
  };
  // ---- one frame ----
  a.step = (dt: number) => {
    if (!a.anchored) { body.style.transform = "none"; anchor(); }
    a.T += dt; a.st += dt;
    let rec = STATES[a.state];
    if (rec.next && rec.hold != null && a.st >= rec.hold) { setState(rec.next); rec = STATES[a.state]; }
    if (a.autoBored && a.state === "idle" && a.T - a.lastAttention > a.autoBored && STATES.bored) { setState("bored"); rec = STATES[a.state]; }

    let clip = CLIPS[a.clip.name];
    const prevT = a.clip.t; a.clip.t += dt;
    for (const [kt, n] of clip.tracks?.face || []) if (n === "blink" && kt > prevT && kt <= a.clip.t && !a.blinkT) a.blinkT = 1e-4;
    if (a.clip.t >= clip.dur) {
      if (clip.end === "hold") a.clip.t = clip.dur;
      else if (a.onceIdx >= 0) {
        a.onceIdx++;
        if (a.onceIdx >= recClips(rec).length) { setState(rec.next!); rec = STATES[a.state]; } else startClip(recClips(rec)[a.onceIdx]);
      } else { const n = pick(rec); if (n === a.clip.name) a.clip.t -= clip.dur; else startClip(n); }
      clip = CLIPS[a.clip.name];
    }
    if (a.bridge) a.bridge.t += dt;
    let P = clipPose(clip, a.clip.t, a);
    if (a.bridge) { const w = smooth(a.bridge.t / a.bridge.dur); if (w >= 1) a.bridge = null; else P = mixPose(a.bridge.pose, P, w); }
    a.base = P; P = { ...P };

    const br = (clip.breath ?? 1) * Math.sin(PI2 * a.T / 3.6 + a.ph);
    P.sy *= 1 + 0.012 * br; P.sx *= 1 - 0.005 * br;
    if (rec.glance && !a.compact) {
      if (a.T >= a.glanceAt) {
        const g = [[0, 0], [-0.55, 0], [0.55, 0], [-0.4, 0.4], [0.4, 0.4], [0, -0.35], [0, 0]][Math.floor(r() * 7)];
        a.glance = { x: g[0], y: g[1] }; a.glanceBack = a.T + 0.8 + r() * 1.1; a.glanceAt = a.T + 2.5 + r() * 4;
      }
      if (a.glanceBack && a.T >= a.glanceBack) { a.glance = { x: 0, y: 0 }; a.glanceBack = 0; }
    } else a.glance = { x: 0, y: 0 };
    a.gl.x = lerp(a.gl.x, a.glance.x, ease(0.12, dt)); a.gl.y = lerp(a.gl.y, a.glance.y, ease(0.12, dt));
    P.gx += a.gl.x; P.gy += a.gl.y; P.yaw += a.gl.x * 7; P.pitch += a.gl.y * 4;
    if (a.lookS) {
      const L = a.lookS; L.t += dt;
      const w = L.t < 0.5 ? bez("io")(L.t / 0.5) : L.t < 0.5 + L.hold ? 1 : bez("io")(1 - (L.t - 0.5 - L.hold) / 0.5);
      addPose(P, LOOK[L.dir] || {}, w);
      if (L.t >= L.hold + 1) a.lookS = null;
    }
    if (a.reactS) {
      const X = a.reactS, Rx = REACTIONS[X.name]; X.t += dt;
      const w = X.t < 0.25 ? smooth(X.t / 0.25) : X.t > X.dur - 0.4 ? smooth((X.dur - X.t) / 0.4) : 1;
      addPose(P, Rx.pose || {}, w);
      if (Rx.fn) addPose(P, Rx.fn(X.t), w);
      if (Rx.gaze) { P.gx = lerp(P.gx, Rx.gaze[0], w); P.gy = lerp(P.gy, Rx.gaze[1], w); }
      if (Rx.lid) P.lid = Math.max(P.lid, Rx.lid * w);
      if (X.t >= X.dur) a.reactS = null;
    }
    if (!clip.noScale) { P.yaw *= style.rot?.yaw ?? 1; P.pitch *= style.rot?.pitch ?? 1; P.roll *= style.rot?.roll ?? 1; P.x *= style.rot?.x ?? 1; }
    // pointer gaze: the hold eases in and out (about .85 per 60 Hz frame)
    a.ptr.hold = lerp(a.ptr.hold, a.ptr.want * (rec.follow ?? 1), 1 - Math.pow(0.85, dt * 60));
    const h = a.ptr.hold;
    P.yaw = lerp(P.yaw, a.ptr.x * (style.tilt?.y ?? 12), h); P.pitch = lerp(P.pitch, a.ptr.y * (style.tilt?.x ?? 8), h);
    P.roll *= 1 - 0.5 * h; P.x += 3 * a.ptr.x * h; P.y -= 1.5 * a.ptr.y * h;
    P.gx = lerp(P.gx, a.ptr.x, h); P.gy = lerp(P.gy, a.ptr.y, h);
    a.eye.x = lerp(a.eye.x, P.gx, ease(0.35, dt)); a.eye.y = lerp(a.eye.y, P.gy, ease(0.35, dt));

    // face: moment > held > clip track > recipe; changes wait for a blink (talking cuts)
    const want = a.momentFace && a.T < a.momentUntil ? a.momentFace : a.holdFace || clipFace(clip, a.clip.t) || rec.face;
    let face = resolveFace(want), cut = false;
    if (rec.talk && style.faces.talk && face === resolveFace(rec.face) && !a.reduced) {
      a.talkT -= dt;
      if (a.talkT <= 0) { a.talkOpen = !a.talkOpen && r() > 0.12; a.talkT = a.talkOpen ? 0.08 + r() * 0.1 : r() < 0.14 ? 0.3 + r() * 0.3 : 0.06 + r() * 0.09; }
      if (a.talkOpen) face = "talk";
      cut = face === "talk" || a.face === "talk";
    }
    const needSwap = face !== a.face;
    if (!a.blinkT && !a.noBlink && style.tier !== "picture" && (a.T >= a.nextBlink || (needSwap && !cut)) && P.lid < 0.6) a.blinkT = 1e-4;
    let blink = 0;
    if (a.blinkT) {
      a.blinkT += dt; const u = a.blinkT / 0.17;
      blink = u < 0.4 ? u / 0.4 : u < 0.55 ? 1 : u < 1 ? 1 - (u - 0.55) / 0.45 : 0;
      if (blink > 0.95 && needSwap) paintFace(face);
      if (u >= 1) { a.blinkT = 0; a.nextBlink = a.T + (r() < 0.18 ? 0.22 : 2.2 + r() * 3.6); }
    }
    if (face !== a.face && (cut || style.tier === "picture" || a.noBlink || P.lid >= 0.6)) paintFace(face);

    const o: PokeAcc = { lift: 0, sx: 1, sy: 1, roll: 0, pitch: 0, yaw: 0, x: 0, y: 0 };
    a.pokes = a.pokes.filter((p: PokeState) => { p.t += dt; const K = POKES[p.name], d = K.dur(p); K.f(Math.min(1, p.t / d), o, p); return p.t < d; });
    o.lift *= style.lift ?? 1; o.roll *= style.rot?.roll ?? 1;

    // drag: springs (semi-implicit, sub-stepped) and a pendulum swing
    const D = a.drag;
    for (let n = Math.ceil(dt / (1 / 120)), s = dt / n, i = 0; i < n; i++) {
      const k = D.on ? 240 : 150, c = D.on ? 24 : 11;
      const tx = D.on ? clamp(D.tx, -70, 70) : 0, ty = D.on ? clamp(D.ty, -60, 40) : 0;
      D.vx += (k * (tx - D.x) - c * D.vx) * s; D.x += D.vx * s;
      D.vy += (k * (ty - D.y) - c * D.vy) * s; D.y += D.vy * s;
      D.sv += (60 * (clamp(-D.vx * 0.14, -34, 34) - D.sw) - 4.5 * D.sv) * s; D.sw += D.sv * s;
    }
    if (![D.x, D.y, D.vx, D.vy, D.sw, D.sv].every(Number.isFinite)) Object.assign(D, { x: 0, y: 0, vx: 0, vy: 0, sw: 0, sv: 0, tx: 0, ty: 0 });

    const u = a.unit, yaw = P.yaw + o.yaw, pitch = P.pitch + o.pitch, lift = o.lift + Math.max(0, -D.y) * 0.6;
    dragEl.style.transform = `translate(${D.x * u}px,${D.y * u}px) rotate(${D.sw}deg)`;
    body.style.transform = `translate(${(P.x + o.x) * u}px,${(P.y + o.y - o.lift) * u}px) rotate(${P.roll + o.roll}deg) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${P.sx * o.sx * P.zoom},${P.sy * o.sy * P.zoom})`;
    shadow.style.transform = `translateX(${D.x * u}px) scale(${clamp(1 - lift / 34, 0.4, 1.2)})`; shadow.style.opacity = String(clamp(0.5 - lift / 50, 0.15, 0.5));
    const backside = Math.cos(yaw * D2R) < 0;
    if (backside !== a.backside) { a.backside = backside; root.classList.toggle("back", backside); }

    // 2.5D parallax: features move further than the outline, toward the gaze and the head turn
    const sYaw = clamp(Math.sin(yaw * D2R) / 0.34, -1.4, 1.4), sPitch = clamp(Math.sin(pitch * D2R) / 0.34, -1.4, 1.4);
    const lx = clamp(0.75 * a.eye.x + 0.45 * sYaw, -1.3, 1.3), ly = clamp(0.75 * a.eye.y + 0.45 * sPitch, -1.3, 1.3);
    let lid = clamp(Math.max(P.lid, rec.lid || 0, blink), 0, 1);
    const closed = !!a.face && (style.closedFaces || []).includes(a.face);
    for (const [part, { els, k }] of Object.entries(a.parts)) {
      const kk = style.partUnits === "px" ? k * u : k;
      const tf = `translate(${lx * kk}px,${-ly * kk}px)` + (part === "eyes" && !closed ? ` scaleY(${1 - 0.92 * lid})` : "");
      // inline, not a class: some styles draw parts through <use>, whose clones ignore ancestor class changes
      const op = backside && FEATURES.has(part) ? "0" : "";
      for (const el of els) { el.style.transform = tf; el.style.opacity = op; }
    }
    for (const el of front.querySelectorAll<HTMLElement>(".aav-w[data-k]")) { const k = +el.dataset.k! * u; el.style.transform = `translate(${lx * k}px,${-ly * k}px)`; }
    const cur = a.propEls.get("cursor");
    if (cur) { const c = a.cursorAt(a.clip.t); (cur.firstChild as HTMLElement).style.transform = `translate(${c.x * 70 * u}px,${c.y * 60 * u}px)`; const t6 = a.clip.t % 6; cur.classList.toggle("click", (t6 > 1.15 && t6 < 1.45) || (t6 > 2.75 && t6 < 3.05) || (t6 > 4.35 && t6 < 4.65)); }
    if (Object.keys(a.flashes).length && [...propIds()].sort().join() !== a.propKey) { for (const [id, t] of Object.entries(a.flashes)) if (a.T >= t) delete a.flashes[id]; syncProps(); }
    lid = 0;
  };

  const api: BotAvatar = {
    root,
    get state() { return a.state; },
    setState: (s, o) => { a.lastAttention = a.T; setState(s, o); wake(); },
    react: (name, secs = 2.4) => {
      if (!isReaction(name)) { api.moment(name as FaceName, secs); return; }
      const Rx = REACTIONS[name];
      a.lastAttention = a.T; a.momentFace = Rx.face; a.momentUntil = a.T + secs; a.reactS = { name, t: 0, dur: secs };
      for (const id of Rx.props || []) flash(id, secs);
      for (const p of Rx.pokes || []) poke(p);
      wake();
    },
    poke: (n, p) => { a.lastAttention = a.T; poke(n, p); },
    look: (dir, secs = 1.2) => { a.lookS = { dir, t: 0, hold: secs }; wake(); },
    moment: (face, secs = 2.2) => { a.momentFace = face; a.momentUntil = a.T + secs; wake(); },
    holdFace: (face) => { a.holdFace = face; wake(); },
    setPointer: (x, y, weight) => { a.ptr.x = clamp(x, -1, 1); a.ptr.y = clamp(y, -1, 1); a.ptr.want = weight; if (weight >= 1) attend(); wake(); },
    grab: (x, y) => { if (!a.drag.on) { a.drag.prev = a.state; a.drag.gx = x; a.drag.gy = y; a.drag.tx = 0; a.drag.ty = 0; } a.drag.on = true; a.lastAttention = a.T; if (STATES.dragging) setState("dragging"); wake(); },
    dragTo: (x, y) => { a.drag.tx = x - a.drag.gx; a.drag.ty = y - a.drag.gy; },
    release: () => {
      if (!a.drag.on) return; a.drag.on = false;
      const p = a.drag.prev; setState(!p || ["sleeping", "bored", "drowsy", "dragging"].includes(p) ? "idle" : p, { quiet: true }); poke("bounce");
    },
    attend: () => { attend(); wake(); },
    setGlow: (on) => { root.classList.toggle("glow", !!on); },
    setReducedMotion: (on) => {
      a.reduced = !!on; root.classList.toggle("rm", a.reduced);
      if (a.reduced) { a.pokes = []; a.lookS = null; a.reactS = null; a.clip.t = 0; a.bridge = null; a.blinkT = 0; const keep = a.T; a.step(0); a.T = keep; } else wake();
    },
    setArt: (next) => { applyArt(next); a.quietProps = true; syncProps(); a.quietProps = false; a.step(0); },
    flash,
    simulate: (secs) => { for (let i = 0; i < secs * 60; i++) a.step(1 / 60); },
    destroy: () => { live.delete(a); byRoot.delete(root); io?.unobserve(root); ro?.disconnect(); detach(); for (const el of a.propEls.values()) el.remove(); root.replaceChildren(); root.classList.remove("aav-av"); },
  };

  applyArt(art); anchor(); setState(opts.state || "idle", { quiet: !!opts.static });
  const detach = opts.interactions === false || opts.static ? () => {} : attachInteractions(api, root, opts.interactions === true || opts.interactions == null ? {} : opts.interactions);
  if (!opts.static) {
    live.add(a); wake();
    const mq = opts.reducedMotion === "auto" || opts.reducedMotion == null ? matchMedia?.("(prefers-reduced-motion: reduce)") : null;
    if (opts.reducedMotion === true || mq?.matches) api.setReducedMotion(true);
  }
  a.step(0);
  return api;
}
