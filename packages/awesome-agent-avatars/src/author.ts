// The authoring layer: what an agent (or an editor) needs to change an avatar truthfully and to make
// new styles from existing ones. Pure functions over the same `AvatarStyle` contract the runtime uses,
// so a person in an editor, an agent in a shell (`aav` wraps these) and a host's own UI cannot disagree.
// No dependencies, no DOM required except where a function says so.
import type { AvatarRecipe, AvatarStyle, Credit, FaceName, Field, FieldOption, StyleArt, StyleOptions, TraitMap, TraitName } from "./types.js";

// ---------------- traits ----------------

/** The cross-style vocabulary and the field type each trait expects. */
export const TRAITS: Record<TraitName, { type: "color" | "select"; doc: string }> = {
  skin: { type: "color", doc: "skin or body tone of a drawn person" },
  hairStyle: { type: "select", doc: "hair: short, long, curly, bald, covered…" },
  hairColor: { type: "color", doc: "hair colour" },
  facialHair: { type: "select", doc: "beard, moustache, stubble, none" },
  glasses: { type: "select", doc: "glasses: none, round, square, sunglasses…" },
  hat: { type: "select", doc: "headwear drawn by the art: cap, beanie, hijab, turban…" },
  hatColor: { type: "color", doc: "headwear colour" },
  topStyle: { type: "select", doc: "clothes: hoodie, shirt, collar…" },
  topColor: { type: "color", doc: "clothes colour" },
  eyeColor: { type: "color", doc: "eye or ink colour" },
  earrings: { type: "select", doc: "earrings: none, stud, hoop" },
  shape: { type: "select", doc: "body shape of an abstract character" },
  bodyColor: { type: "color", doc: "body colour of an abstract character" },
};

/** Worn props every style can carry (drawn by the engine on measured anchors), with plain words for each. */
export const WEARABLES: Record<string, string[]> = {
  cap: ["cap", "baseball cap", "hat"], beanie: ["beanie", "knit hat", "woolly hat"], hat: ["party hat", "cone hat", "birthday hat"],
  headphones: ["headphones", "headset"], bow: ["bow tie", "bow"], cape: ["cape", "cloak"], crystal: ["crystal", "gem", "amulet"],
};

// ---------------- colours ----------------

const NAMED: Record<string, string> = {
  black: "#000000", white: "#ffffff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#dc2626", crimson: "#dc143c", maroon: "#800000",
  orange: "#f97316", amber: "#f59e0b", gold: "#d4af37", yellow: "#facc15", lime: "#84cc16", green: "#16a34a", olive: "#808000", teal: "#0d9488",
  cyan: "#06b6d4", aqua: "#06b6d4", turquoise: "#40e0d0", blue: "#3b82f6", navy: "#1e3a8a", sky: "#38bdf8", indigo: "#4f46e5", violet: "#7c3aed",
  purple: "#7c3aed", lavender: "#c4b5fd", lilac: "#d8b1fb", magenta: "#d946ef", fuchsia: "#d946ef", pink: "#ec4899", rose: "#f43f5e", coral: "#f97362",
  salmon: "#fa8072", peach: "#ffcba4", brown: "#6b4423", chocolate: "#5c3a21", tan: "#d2b48c", beige: "#e8d8c0", cream: "#fdf6e3", ivory: "#fffff0",
  blonde: "#f4d150", blond: "#f4d150", auburn: "#8c3a1d", ginger: "#c2410c", chestnut: "#6b4423", brunette: "#3a2418", platinum: "#e6e2dc",
  mint: "#9bd78d", emerald: "#10b981", ruby: "#be123c", sapphire: "#1d4ed8", charcoal: "#2b2b2b", slate: "#475569",
};
const MODIFIERS: Record<string, number> = { light: 0.35, pale: 0.45, pastel: 0.5, dark: -0.35, deep: -0.3, bright: 0.1 };

const hex = (c: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim());
const expand = (c: string) => (c.length === 4 ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c).toLowerCase();
/** A colour that will be written into markup: a hex, or an error. Data style packages are untrusted text. */
const needHex = (where: string, c: unknown): string => {
  if (typeof c !== "string" || !hex(c)) throw new Error(`${where}: ${JSON.stringify(c)} is not a hex colour like #7c3aed`);
  return expand(c.trim());
};
/** A name that will be written into markup and CSS selectors (`aav-part-<name>`): letters, digits, - and _. */
const needName = (where: string, v: unknown): string => {
  if (typeof v !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(v)) throw new Error(`${where}: ${JSON.stringify(v)} must be a plain name (letters, digits, - and _)`);
  return v;
};
const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mix = (a: string, b: string, t: number) => {
  const A = [1, 3, 5].map((i) => parseInt(expand(a).slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(expand(b).slice(i, i + 2), 16));
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

/**
 * A colour from a hex, a colour word ("blue", "dark blue", "brand purple" through `palette`), or nothing.
 * `palette` is the host's own names (theme tokens); it wins over the built-in words.
 */
export function resolveColor(input: string, palette: Record<string, string> = {}): string | null {
  const t = input.trim().toLowerCase();
  if (hex(t)) return expand(t);
  const pal = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k.toLowerCase(), v]));
  if (pal[t]) return expand(pal[t]);
  const words = t.replace(/[-_]/g, " ").split(/\s+/).filter((w) => !["a", "the", "colour", "color", "coloured", "colored"].includes(w));
  let base: string | undefined, shift = 0;
  for (const w of words) {
    if (MODIFIERS[w] != null) shift += MODIFIERS[w];
    else if (pal[w]) base = pal[w];
    else if (NAMED[w]) base = NAMED[w];
  }
  if (!base) { const joined = words.join(" "); if (pal[joined]) base = pal[joined]; }
  if (!base) return null;
  return shift ? mix(base, shift > 0 ? "#ffffff" : "#000000", Math.min(0.7, Math.abs(shift))) : expand(base);
}

// ---------------- describe ----------------

export interface StyleDescription {
  style: { id: string; name: string; tier: "parts" | "picture"; credit: string; provenance?: AvatarStyle["provenance"] };
  /** trait → field key, or null when the style cannot express it */
  traits: Record<TraitName, string | null>;
  fields: Array<{ key: string; label: string; type: Field["type"]; group?: string; free: boolean; optional?: boolean; options?: FieldOption[]; swatches?: string[] }>;
  /** props the engine can wear on this style regardless of its art */
  wear: string[];
  /** traits this style has no field for, in words */
  cannot: string[];
  current?: StyleOptions;
}

/** What an agent needs to know before it edits: every field, what is free, what each option is, what is impossible. */
export function describeStyle(style: AvatarStyle, options?: StyleOptions): StyleDescription {
  const traits = {} as Record<TraitName, string | null>;
  for (const t of Object.keys(TRAITS) as TraitName[]) traits[t] = style.traits?.[t] ?? null;
  const c = style.credit;
  return {
    style: { id: style.id, name: style.name, tier: style.tier, credit: `${c.source ? c.source + " by " : ""}${c.author} · ${c.license}`, provenance: style.provenance },
    traits,
    fields: style.fields.map((f) => ({
      key: f.key, label: f.label, type: f.type, group: f.group,
      free: f.type === "color" || f.type === "text",
      ...(f.type === "select" ? { optional: f.options.some((o) => o.value === "none"), options: f.options.map((o) => ({ ...o, tags: o.tags?.length ? o.tags : optionTags(o) })) } : {}),
      ...(f.type === "color" ? { swatches: f.swatches } : {}),
    })),
    wear: Object.keys(WEARABLES),
    cannot: (Object.keys(TRAITS) as TraitName[]).filter((t) => !style.traits?.[t]).map((t) => `${t} (${TRAITS[t].doc})`),
    current: options,
  };
}

/** An option's words: its tags, else its label split into words. */
export function optionTags(o: FieldOption): string[] {
  if (o.tags?.length) return [...new Set(o.tags.flatMap((t) => t.toLowerCase().split(/[\s_-]+/)))];
  return o.label.toLowerCase().replace(/([a-z])([0-9])/g, "$1 $2").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

// ---------------- edit ----------------

export interface EditPatch {
  /** by field key: { hairColor: "#3b82f6", glassesVariant: "none" } */
  fields?: Record<string, string | number | boolean>;
  /** by trait: { hairColor: "blue", hat: "cap", glasses: "none" } */
  traits?: Partial<Record<TraitName, string>>;
  /** worn props to add / remove (engine-drawn; works on every style) */
  wear?: string[];
  unwear?: string[];
}
export interface EditChange { key: string; trait?: TraitName; from: unknown; to: unknown; label: string }
export interface EditRejection { key?: string; trait?: TraitName; value: unknown; reason: string; alternatives: string[] }
export interface EditResult {
  options: StyleOptions;
  wear: string[];
  applied: EditChange[];
  rejected: EditRejection[];
  /** when a trait has no field here: other styles that have it (filled in by `applyEdit` when `styles` is given) */
  switchable: Array<{ style: string; name: string; has: TraitName[] }>;
}

const sameWords = (a: string[], b: string[]) => a.filter((w) => b.includes(w)).length;
const norm = (v: unknown) => String(v).trim().toLowerCase();

/** Resolve a value for a select field: exact value, exact label, every word in tags, else the best word overlap. */
export function resolveOption(field: Extract<Field, { type: "select" }>, value: unknown): { option?: FieldOption; nearest: FieldOption[] } {
  const v = norm(value);
  const exact = field.options.find((o) => norm(o.value) === v || norm(o.label) === v);
  if (exact) return { option: exact, nearest: [] };
  if (["none", "no", "off", "remove", "without"].includes(v)) { const none = field.options.find((o) => o.value === "none"); if (none) return { option: none, nearest: [] }; }
  const words = v.replace(/[-_]/g, " ").split(/\s+/).filter((w) => w && !["hair", "style", "a", "an", "the", "with"].includes(w));
  const scored = field.options.map((o) => ({ o, s: sameWords(words, optionTags(o)) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (scored.length && scored[0].s === words.length) return { option: scored[0].o, nearest: scored.slice(1, 4).map((x) => x.o) };
  if (scored.length && (scored.length === 1 || scored[0].s > scored[1].s)) return { option: scored[0].o, nearest: scored.slice(1, 4).map((x) => x.o) };
  return { nearest: scored.slice(0, 3).map((x) => x.o) };
}

/**
 * Apply a patch and say exactly what happened. Nothing is dropped silently: every key either lands in
 * `applied` or in `rejected` with a reason and the nearest alternatives. `styles` (other styles the host
 * offers) fills `switchable` for traits this style cannot express.
 */
export function applyEdit(style: AvatarStyle, options: StyleOptions, patch: EditPatch, ctx: { palette?: Record<string, string>; styles?: AvatarStyle[]; wear?: string[] } = {}): EditResult {
  const out: StyleOptions = { ...style.defaults(), ...options };
  const applied: EditChange[] = [], rejected: EditRejection[] = [];
  const missing = new Set<TraitName>();
  // Two asks can land on one field (Avataaars keeps hair and headwear in `topVariant`). The later one
  // wins and the earlier one is reported as replaced, except that a later "none" never clears what
  // this same edit just set, so "long hair, no hat" keeps the hair instead of going bald.
  const claimed = new Map<string, { trait?: TraitName; value: unknown; change?: EditChange }>();
  const setField = (key: string, value: unknown, trait?: TraitName) => {
    const f = style.fields.find((x) => x.key === key);
    if (!f) { rejected.push({ key, trait, value, reason: `${style.name} has no field "${key}"`, alternatives: style.fields.map((x) => x.key) }); return; }
    let to: string | boolean, label: string;
    if (f.type === "select") {
      const { option, nearest } = resolveOption(f, value);
      if (!option) { rejected.push({ key, trait, value, reason: `no ${f.label.toLowerCase()} option matches "${value}"`, alternatives: (nearest.length ? nearest : f.options.slice(0, 6)).map((o) => `${o.value} (${optionTags(o).join(", ")})`) }); return; }
      to = option.value; label = `${f.label} → ${option.label}`;
    } else if (f.type === "color") {
      const c = typeof value === "string" ? resolveColor(value, ctx.palette) : null;
      if (!c) { rejected.push({ key, trait, value, reason: `"${value}" is not a colour I know; use a hex like #3b82f6 or a colour word`, alternatives: f.swatches.slice(0, 8) }); return; }
      to = c; label = `${f.label} → ${c}`;
    } else if (f.type === "toggle") {
      const b = typeof value === "boolean" ? value : ["true", "on", "yes", "1"].includes(norm(value)) ? true : ["false", "off", "no", "0"].includes(norm(value)) ? false : null;
      if (b == null) { rejected.push({ key, trait, value, reason: `${f.label} is on or off`, alternatives: ["on", "off"] }); return; }
      to = b; label = `${f.label} → ${b ? "on" : "off"}`;
    } else { to = String(value); label = `${f.label} → ${to}`; }
    const prev = claimed.get(key);
    if (prev) {
      if (to === out[key]) return; // both asks agree
      const by = prev.trait ?? key;
      if (to === "none") { rejected.push({ key, trait, value, reason: `${f.label} also holds ${by}, which this edit already set; kept that`, alternatives: [] }); return; }
      if (prev.change) applied.splice(applied.indexOf(prev.change), 1);
      rejected.push({ key, trait: prev.trait, value: prev.value, reason: `replaced by ${trait ?? key}: both are ${f.label} in ${style.name}`, alternatives: [] });
    }
    const from = prev?.change ? prev.change.from : out[key];
    out[key] = to;
    const change = to !== from ? { key, trait, from, to, label } : undefined;
    if (change) applied.push(change);
    claimed.set(key, { trait, value, change });
  };
  for (const [t, v] of Object.entries(patch.traits || {}) as [TraitName, string][]) {
    const key = style.traits?.[t];
    if (key) setField(key, v, t);
    else { missing.add(t); rejected.push({ trait: t, value: v, reason: `${style.name} cannot change ${t}: ${TRAITS[t]?.doc ?? "unknown trait"}`, alternatives: wearAlternatives(t, v) }); }
  }
  for (const [k, v] of Object.entries(patch.fields || {})) setField(k, v);
  // worn props: by id or by word ("a hat" → cap)
  let wear = [...(ctx.wear || [])];
  for (const w of patch.wear || []) {
    const id = resolveWearable(w);
    if (!id) rejected.push({ key: "wear", value: w, reason: `nothing wearable matches "${w}"`, alternatives: Object.keys(WEARABLES) });
    else if (!wear.includes(id)) { wear.push(id); applied.push({ key: "wear", from: undefined, to: id, label: `wearing ${id}` }); }
  }
  for (const w of patch.unwear || []) {
    // a prop already worn is removed by its own id first: "hat" is the party hat a recipe wears,
    // even though the word "hat" on its own means a cap when putting one on
    const exact = norm(w), id = wear.includes(exact) ? exact : resolveWearable(w);
    if (!id) rejected.push({ key: "wear", value: w, reason: `nothing wearable matches "${w}"`, alternatives: wear.length ? wear : Object.keys(WEARABLES) });
    else if (wear.includes(id)) { wear = wear.filter((x) => x !== id); applied.push({ key: "wear", from: id, to: undefined, label: `no longer wearing ${id}` }); }
  }
  const switchable = (ctx.styles || []).filter((s) => s.id !== style.id).map((s) => ({ style: s.id, name: s.name, has: [...missing].filter((t) => s.traits?.[t]) })).filter((s) => s.has.length);
  return { options: out, wear, applied, rejected, switchable };
}

export function resolveWearable(word: string): string | null {
  const w = norm(word).replace(/^(a|an|the)\s+/, "").replace(/\s+/g, " ");
  if (!w) return null;
  // a plain word first ("hat" → cap), then the id itself ("hat" is the party cone), then a loose match
  // on whole words only ("a red cap" → cap, "knit" → beanie), never on fragments ("t", "rainbow")
  const padded = ` ${w} `;
  const hit = Object.entries(WEARABLES).find(([, words]) => words.includes(w)) || (WEARABLES[w] ? [w] : undefined)
    || Object.entries(WEARABLES).find(([, words]) => words.some((x) => padded.includes(` ${x} `) || x.split(" ").includes(w)));
  return hit ? hit[0] : null;
}
function wearAlternatives(t: TraitName, v: string): string[] {
  if (t === "hat") { const id = resolveWearable(v) || "cap"; return [`wear: ${id} (drawn by the engine on this style)`]; }
  return [];
}

/** Move a look to another style: carries every trait both styles share, reports the rest as lost. */
export function carryTraits(from: AvatarStyle, options: StyleOptions, to: AvatarStyle, ctx: { palette?: Record<string, string> } = {}): { options: StyleOptions; carried: TraitName[]; lost: TraitName[] } {
  const values: Partial<Record<TraitName, string>> = {}, patch: Partial<Record<TraitName, string>> = {};
  const carried: TraitName[] = [], lost: TraitName[] = [];
  for (const t of Object.keys(TRAITS) as TraitName[]) {
    const fk = from.traits?.[t]; if (!fk || options[fk] === undefined) continue;
    const ff = from.fields.find((f) => f.key === fk);
    const value = ff?.type === "select" ? optionTags(ff.options.find((o) => o.value === options[fk]) || { value: "", label: String(options[fk]) }).join(" ") : String(options[fk]);
    if (to.traits?.[t]) values[t] = value; else lost.push(t);
  }
  for (const [t, v] of Object.entries(values) as [TraitName, string][]) {
    // "no hat" has nothing to carry onto a field the target shares with a trait that is being carried
    // (Avataaars: hair and headwear are one field); sending it would clear the hair just carried
    const shared = (Object.entries(values) as [TraitName, string][]).some(([u, w]) => u !== t && w !== "none" && to.traits?.[u] === to.traits?.[t]);
    if (!(v === "none" && shared)) patch[t] = v;
    carried.push(t);
  }
  const r = applyEdit(to, to.defaults(), { traits: patch }, ctx);
  const really = carried.filter((t) => !r.rejected.some((x) => x.trait === t));
  return { options: r.options, carried: really, lost: [...lost, ...carried.filter((t) => !really.includes(t))] };
}

// ---------------- new styles: derive ----------------

export interface DeriveSpec<O extends StyleOptions = StyleOptions, B extends StyleOptions = StyleOptions> {
  id: string;
  name: string;
  credit?: Credit;
  /** fields to drop from the base (what the derivation decides for itself) */
  drop?: string[];
  /** extra fields */
  fields?: Field[];
  /** defaults for the derived style (base defaults, minus `drop`, unless given) */
  defaults?: (seed?: string) => O;
  /** derived options → base options (default: pass through) */
  options?: (o: O) => B;
  /** base art → derived art (recolour, gradient, swap faces…) */
  art?: (art: StyleArt, o: O) => StyleArt;
  traits?: TraitMap;
  by?: string;
}

/** A style from an existing one, with a few decisions made for it. The cheapest way to make a new style. */
export function deriveStyle<O extends StyleOptions = StyleOptions, B extends StyleOptions = StyleOptions>(base: AvatarStyle<B>, spec: DeriveSpec<O, B>): AvatarStyle<O> {
  const drop = new Set(spec.drop || []);
  const fields = [...base.fields.filter((f) => !drop.has(f.key)), ...(spec.fields || [])];
  const traits: TraitMap = { ...(base.traits || {}) };
  for (const [t, k] of Object.entries(traits) as [TraitName, string][]) if (drop.has(k)) delete traits[t];
  return {
    id: spec.id, name: spec.name, tier: base.tier, credit: spec.credit || base.credit, fields,
    traits: { ...traits, ...(spec.traits || {}) },
    provenance: { kind: "derive", from: [base.id], by: spec.by, at: new Date().toISOString().slice(0, 10) },
    defaults: spec.defaults || ((seed) => { const d: StyleOptions = { ...base.defaults(seed) }; for (const k of drop) delete d[k]; return d as O; }),
    async render(o) {
      const bo = spec.options ? spec.options(o) : ({ ...base.defaults(), ...o } as unknown as B);
      const art = await base.render(bo);
      const next = spec.art ? spec.art(art, o) : art;
      return { ...next, id: `${spec.id}:${next.id}` };
    },
  };
}

/** Replace one flat colour in every face with a gradient (ids stay unique per avatar: the engine suffixes them). */
export function fillGradient(art: StyleArt, color: string, stops: string[], angle = 135): StyleArt {
  // every value below is written into SVG markup, and a data style (style.json) supplies them: hex only
  const target = needHex("fillGradient colour", color);
  if (!Array.isArray(stops) || !stops.length) throw new Error("fillGradient: stops must be a non-empty list of hex colours");
  const cols = stops.map((s, i) => needHex(`fillGradient stop ${i + 1}`, s));
  const deg = Number.isFinite(Number(angle)) ? Number(angle) : 135;
  const a = ((deg - 90) * Math.PI) / 180, x2 = 0.5 + Math.cos(a) / 2, y2 = 0.5 + Math.sin(a) / 2;
  const id = "aav-grad-" + cols.join("").replace(/[^0-9a-z]/gi, "").slice(0, 12);
  const def = `<linearGradient id="${id}" x1="${(1 - x2).toFixed(3)}" y1="${(1 - y2).toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}">${cols.map((s, i) => `<stop offset="${(cols.length > 1 ? i / (cols.length - 1) : 0).toFixed(3)}" stop-color="${s}"/>`).join("")}</linearGradient>`;
  const re = new RegExp(`(fill|stroke)="${target}"`, "gi");
  const faces = {} as StyleArt["faces"];
  for (const [k, svg] of Object.entries(art.faces) as [FaceName, string][]) {
    const swapped = svg.replace(/#[0-9a-f]{3,6}(?=")/gi, (m) => (expand(m) === target ? target : m)).replace(re, `$1="url(#${id})"`);
    faces[k] = swapped.includes("<defs>") ? swapped.replace("<defs>", "<defs>" + def) : swapped.replace(/(<svg[^>]*>)/, `$1<defs>${def}</defs>`);
  }
  const mid = cols[Math.floor(cols.length / 2)];
  return { ...art, faces, skin: art.skin && expand(art.skin) === target ? mid : art.skin, sleeve: art.sleeve && expand(art.sleeve) === target ? mid : art.sleeve };
}

// ---------------- new styles: compose ----------------

/** A part of another style laid over a base style, sized and placed on one of the base's measured anchors. */
export interface ComposeLayer {
  /** the style the part comes from (its `render` is called with `pick`) */
  from: AvatarStyle;
  /** which tagged part of the foreign art to take: "top", "accessories", "hair", "glasses"… */
  part: string;
  /** the foreign field that chooses the part, exposed as a field on the composite under `key` */
  field: string;
  key?: string;
  label?: string;
  group?: string;
  /** limit the choices */
  only?: string[];
  /** foreign options to render with (the chosen field is set per option) */
  pick?: StyleOptions;
  /**
   * Where it sits when the faces cannot be matched: on the crown (hats), over the eyes (glasses), on the face.
   * When both arts tag their eyes (every built-in parts style does), the part is placed face to face instead:
   * the foreign eyes are mapped onto the base eyes, so a hat sits on the new head as it sat on its own.
   */
  fit: "crown" | "eyes" | "face";
  /** a size multiplier (1 = as drawn for its own face) and a vertical nudge in head widths */
  width?: number;
  dy?: number;
  /** base parts to remove while this layer is worn: a hat that covers the head hides the base's "hair" */
  hides?: string[];
  /** maps to a trait on the composite (e.g. hat) */
  trait?: TraitName;
}
export interface ComposeSpec { id: string; name: string; base: AvatarStyle; layers: ComposeLayer[]; by?: string }

type Box = { x: number; y: number; w: number; h: number };
const svgOf = (html: string) => html.match(/<svg[\s\S]*<\/svg>/)?.[0] || "";
const viewBoxOf = (svg: string): Box => { const m = svg.match(/viewBox="([^"]+)"/); const [x, y, w, h] = m ? m[1].split(/[\s,]+/).map(Number) : [0, 0, 100, 100]; return { x, y, w, h }; };

/** Bounding boxes need a layout engine: in a browser we measure with a hidden SVG; elsewhere the caller passes `measure`. */
export type Measure = (svg: string, selector: string) => Box | null;
const domMeasure: Measure | null = typeof document === "undefined" ? null : (svg, selector) => {
  const host = document.createElement("div"); host.style.cssText = "position:absolute;left:-9999px;top:0;width:400px;height:400px;opacity:0;pointer-events:none";
  host.innerHTML = svg; document.body.appendChild(host);
  try {
    const root = host.querySelector("svg") as SVGSVGElement | null; if (!root) return null;
    const els = selector === "svg" ? [root] : [...root.querySelectorAll(selector)];
    if (!els.length) return null;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const el of els) { try { const g = (el as SVGGraphicsElement).getBBox(); if (!g.width && !g.height) continue; const m = (el as SVGGraphicsElement).getCTM(), rm = root.getCTM(); const pts = [[g.x, g.y], [g.x + g.width, g.y + g.height]].map(([x, y]) => { const p = root.createSVGPoint(); p.x = x; p.y = y; const q = m && rm ? p.matrixTransform(rm.inverse().multiply(m)) : p; return [q.x, q.y]; }); l = Math.min(l, pts[0][0], pts[1][0]); t = Math.min(t, pts[0][1], pts[1][1]); r = Math.max(r, pts[0][0], pts[1][0]); b = Math.max(b, pts[0][1], pts[1][1]); } catch { /* not drawable */ } }
    return isFinite(l) ? { x: l, y: t, w: r - l, h: b - t } : null;
  } finally { host.remove(); }
};

const HEAD_PARTS = ["head", "face", "shape", "skin"];
const HEAD_SEL = HEAD_PARTS.map((p) => `.aav-part-${p}`).join(", ");
/** A head estimated from the eyes, for art that does not tag one (Avataaars draws its head on the canvas). */
const headAroundEyes = (e: Box | null): Box | null => (e ? { x: e.x + e.w / 2 - e.w * 0.85, y: e.y - e.w * 0.95, w: e.w * 1.7, h: e.w * 2.1 } : null);
/** The `<g class="…">…</g>` element with that class, nesting respected. */
export function extractGroup(svg: string, cls: string): string | null {
  const start = svg.search(new RegExp(`<g class="${reEscape(cls)}"[^>]*>`)); if (start < 0) return null;
  const re = /<g\b[^>]*>|<\/g>/g; re.lastIndex = start; let depth = 0, m: RegExpExecArray | null;
  while ((m = re.exec(svg))) { depth += m[0] === "</g>" ? -1 : 1; if (!depth) return svg.slice(start, m.index + m[0].length); }
  return null;
}
/**
 * One style made of parts from several: the base's art with foreign parts (hats, glasses, accessories)
 * placed on its measured anchors. Data only, nothing executes. Credits are the union. In a browser the
 * measuring is automatic; elsewhere pass `measure` (or the parts land on an estimate from the viewBox).
 */
export function composeStyle(spec: ComposeSpec, opts: { measure?: Measure } = {}): AvatarStyle {
  const measure = opts.measure || domMeasure;
  const layerKey = (L: ComposeLayer) => L.key || `${L.from.id}_${L.field}`;
  const fields: Field[] = [...spec.base.fields];
  const traits: TraitMap = { ...(spec.base.traits || {}) };
  for (const L of spec.layers) {
    // the key, part and hidden parts become class names in the art (`aav-part-<name>`) and CSS
    // selectors in the engine, and a data style (style.json) supplies them: plain names only
    needName("composeStyle: layer key", layerKey(L)); needName("composeStyle: layer part", L.part);
    for (const h of L.hides || []) needName("composeStyle: layer hides", h);
    const f = L.from.fields.find((x) => x.key === L.field);
    if (!f || f.type !== "select") throw new Error(`composeStyle: ${L.from.id} has no select field "${L.field}"`);
    const options = f.options.filter((o) => !L.only || L.only.includes(o.value) || o.value === "none");
    fields.push({ key: layerKey(L), label: L.label || `${f.label} (${L.from.name})`, type: "select", group: L.group || f.group, options: options.some((o) => o.value === "none") ? options : [{ value: "none", label: "None" }, ...options] });
    if (L.trait) traits[L.trait] = layerKey(L);
  }
  const credits = [spec.base, ...spec.layers.map((L) => L.from)].map((s) => s.credit);
  const credit: Credit = { ...credits[0], author: [...new Set(credits.map((c) => c.author))].join(" + "), license: [...new Set(credits.map((c) => c.license))].join(" + "), source: [...new Set(credits.map((c) => c.source || ""))].filter(Boolean).join(" + ") };
  const cache = new Map<string, Promise<{ svg: string; box: Box; vb: Box; eyes: Box | null; head: Box | null } | null>>();
  const fragment = (L: ComposeLayer, value: string) => {
    const k = `${L.from.id}/${L.field}/${value}`;
    if (!cache.has(k)) cache.set(k, (async () => {
      const art = await L.from.render({ ...L.from.defaults(), ...(L.pick || {}), [L.field]: value });
      const svg = svgOf(art.faces.neutral); if (!svg) return null;
      // the part on its own: the document's defs (the art it uses) plus the tagged group, lifted out of
      // the foreign canvas; measured in that same lifted form, so placement and measurement agree
      const group = extractGroup(svg, `aav-part-${L.part}`); if (!group) return null;
      const defs = (svg.match(/<defs>[\s\S]*?<\/defs>/g) || []).join("");
      const vb = viewBoxOf(svg), body = defs + group;
      const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">${inner}</svg>`;
      const box = measure?.(wrap(body), `.aav-part-${L.part}`) || { x: vb.x + vb.w * 0.2, y: vb.y, w: vb.w * 0.6, h: vb.h * 0.4 };
      // the foreign face, lifted the same way: a part drawn for that face is placed on the base by
      // mapping that face onto the base's, so it sits on the new head as it sat on its own
      const eyesGroup = extractGroup(svg, "aav-part-eyes");
      const eyes = eyesGroup ? measure?.(wrap(defs + eyesGroup), ".aav-part-eyes") ?? null : null;
      const headGroup = HEAD_PARTS.map((p) => extractGroup(svg, `aav-part-${p}`)).find(Boolean);
      const head = (headGroup && measure?.(wrap(defs + headGroup), HEAD_SEL)) || headAroundEyes(eyes);
      return { svg: body, box, vb, eyes, head };
    })());
    return cache.get(k)!;
  };
  return {
    id: spec.id, name: spec.name, tier: "parts", credit, fields, traits,
    provenance: { kind: "compose", from: [spec.base.id, ...spec.layers.map((L) => L.from.id)], by: spec.by, at: new Date().toISOString().slice(0, 10) },
    defaults: (seed) => { const d: StyleOptions = { ...spec.base.defaults(seed) }; for (const L of spec.layers) d[layerKey(L)] = "none"; return d; },
    async render(o) {
      const baseOptions: StyleOptions = { ...spec.base.defaults(), ...o };
      for (const L of spec.layers) delete baseOptions[layerKey(L)];
      const art = await spec.base.render(baseOptions);
      const faces = { ...art.faces } as StyleArt["faces"];
      const parallax = { ...(art.parallax || {}) };
      const baseSvg = svgOf(art.faces.neutral), vb = viewBoxOf(baseSvg);
      const eyesM = measure?.(baseSvg, ".aav-part-eyes");
      // a head part when the art tags one; else a head around the eyes; else a guess from the canvas
      const headM = measure?.(baseSvg, HEAD_SEL) || headAroundEyes(eyesM ?? null);
      const head = headM || { x: vb.x + vb.w * 0.25, y: vb.y + vb.h * 0.1, w: vb.w * 0.5, h: vb.h * 0.6 };
      const eyes = eyesM || { x: head.x + head.w * 0.2, y: head.y + head.h * 0.35, w: head.w * 0.6, h: head.h * 0.12 };
      for (const L of spec.layers) {
        const value = String(o[layerKey(L)] ?? "none"); if (value === "none") continue;
        const frag = await fragment(L, value); if (!frag) continue;
        let s: number, tx: number, ty: number;
        if (L.fit === "eyes" && frag.eyes && eyesM) {
          // glasses and the like: the foreign eyes land on the base eyes
          s = (eyesM.w / frag.eyes.w) * (L.width ?? 1);
          tx = eyesM.x + eyesM.w / 2 - (frag.eyes.x + frag.eyes.w / 2) * s;
          ty = eyesM.y + eyesM.h / 2 - (frag.eyes.y + frag.eyes.h / 2) * s + (L.dy || 0) * head.w;
        } else if (L.fit !== "eyes" && frag.head && headM) {
          // headwear: the foreign head lands on the base head (same width, centres and crowns aligned),
          // so a hat drawn for that head sits on this one as it sat on its own
          s = (headM.w / frag.head.w) * (L.width ?? 1);
          tx = headM.x + headM.w / 2 - (frag.head.x + frag.head.w / 2) * s;
          ty = headM.y - frag.head.y * s + (L.dy || 0) * headM.w;
        } else {
          // no eyes to map: size to the head and sit on the crown, over the eyes, or on the face
          s = (head.w * (L.width ?? (L.fit === "crown" ? 1.25 : L.fit === "eyes" ? 1.05 : 1))) / frag.box.w;
          const cx = L.fit === "eyes" ? eyes.x + eyes.w / 2 : head.x + head.w / 2;
          const top = L.fit === "crown" ? head.y - frag.box.h * s * 0.72 : L.fit === "eyes" ? eyes.y + eyes.h / 2 - frag.box.h * s / 2 : head.y;
          tx = cx - (frag.box.x + frag.box.w / 2) * s; ty = top + (L.dy || 0) * head.w - frag.box.y * s;
        }
        const part = `aav-part-${layerKey(L)}`;
        // placement on a plain wrapper: the engine moves every aav-part-* element with a CSS transform
        // (parallax), and a CSS transform replaces an SVG transform attribute on the same element
        const layer = `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})"><g class="${part}">${frag.svg}</g></g>`;
        for (const [k, svg] of Object.entries(faces) as [FaceName, string][]) {
          let next = svg;
          for (const h of L.hides || []) { const g = extractGroup(next, `aav-part-${h}`); if (g) next = next.replace(g, ""); }
          // a hat may rise above the canvas the head was drawn on
          if (!/^<svg[^>]*\soverflow=/.test(next)) next = next.replace(/^<svg\b/, '<svg overflow="visible"');
          faces[k] = next.replace(/<\/svg>\s*$/, layer + "</svg>");
        }
        parallax[layerKey(L)] = L.fit === "eyes" ? (art.parallax?.eyes ?? 6) * 0.8 : 1.2;
      }
      return { ...art, id: `${spec.id}:${art.id}`, faces, parallax };
    },
  };
}

// ---------------- lint and sanitize ----------------

export interface LintIssue { level: "error" | "warn"; code: string; message: string }

// The engine mounts faces with innerHTML, so these follow the HTML tokenizer rather than tidy markup:
// an attribute may follow a quote or a slash as well as a space (`<img/src="x"/onerror=…>`), and a
// value may be single-quoted, unquoted or entity-encoded (`href='java&#115;cript:…'`), which is why
// any href that is not a local `#ref` is refused outright rather than matched against "javascript:".
const UNSAFE = [/<script\b/i, /<foreignObject\b/i, /[\s"'/]on[a-z]+\s*=/i, /javascript:/i, /\bhref\s*=(?!\s*["']?\s*#)/i, /url\((?!\s*['"]?\s*#)/i,
  /<(iframe|object|embed|link|meta|base)\b/i, /@import/i, /\battributeName\s*=\s*["']?(?:[a-z]+:)?(?:href|on[a-z]+)/i];
/** Drawn (parts) art is SVG, where no element takes `src`: one that does is HTML smuggled into it. */
const UNSAFE_PARTS = [/[\s"'/]src\s*=/i];

/** Problems an agent can act on before it registers a style, and a host must check before it loads one. */
export async function lintStyle(style: AvatarStyle, options?: StyleOptions): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  if (!style.id || !/^[a-z0-9][a-z0-9-_:]*$/i.test(style.id)) issues.push({ level: "error", code: "id", message: "id must be a short slug" });
  if (!style.credit?.author || !style.credit?.license) issues.push({ level: "error", code: "credit", message: "credit needs an author and a licence" });
  let art: StyleArt;
  try { art = await style.render({ ...style.defaults(), ...(options || {}) }); } catch (e) { return [...issues, { level: "error", code: "render", message: `render threw: ${(e as Error).message}` }]; }
  if (!art.faces?.neutral) return [...issues, { level: "error", code: "neutral", message: "faces.neutral is required" }];
  const rules = art.tier === "parts" ? [...UNSAFE, ...UNSAFE_PARTS] : UNSAFE;
  for (const [k, svg] of Object.entries(art.faces)) for (const re of rules) if (re.test(svg)) issues.push({ level: "error", code: "unsafe", message: `face "${k}" contains ${re.source.slice(0, 24)}… (scripts, foreign objects, event handlers and external references are not allowed)` });
  if (art.tier === "parts") {
    if (!/aav-part-eyes/.test(art.faces.neutral)) issues.push({ level: "warn", code: "eyes", message: "no aav-part-eyes: it cannot blink or follow the pointer with its eyes" });
    if (!/aav-part-mouth/.test(art.faces.neutral) && !art.faces.talk) issues.push({ level: "warn", code: "talk", message: "no aav-part-mouth and no talk face: it cannot talk while streaming" });
    if (!art.parallax || !Object.keys(art.parallax).length) issues.push({ level: "warn", code: "parallax", message: "no parallax: the face stays flat when the head turns" });
  }
  for (const f of ["happy", "sleepy", "surprised", "talk"] as FaceName[]) if (!art.faces[f]) issues.push({ level: "warn", code: `face-${f}`, message: `no "${f}" face (falls back)` });
  for (const f of style.fields) if (f.type === "select" && !f.options.length) issues.push({ level: "error", code: "field", message: `field ${f.key} has no options` });
  const d = style.defaults();
  for (const f of style.fields) if (f.type === "select" && d[f.key] !== undefined && !f.options.some((o) => o.value === d[f.key])) issues.push({ level: "error", code: "default", message: `default ${f.key}=${String(d[f.key])} is not one of its options` });
  return issues;
}

/** Strip what the lint forbids from every face. A host should run this on any art it did not author. */
export function sanitizeArt(art: StyleArt): StyleArt {
  // attributes as the HTML tokenizer reads them: after a space, a quote or a slash; any quoting
  const attr = (name: string) => new RegExp(`([\\s"'/])(?:${name})\\s*=\\s*("[^"]*"|'[^']*'|[^\\s"'>]+)`, "gi");
  const clean = (s: string) => {
    let t = s.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<(foreignObject|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/?(script|foreignObject|iframe|object|embed|link|meta|base)\b[^>]*>/gi, "")
      .replace(attr("on[a-z]+"), "$1").replace(attr("attributeName"), (m, pre, v) => (/^["']?(?:[a-z]+:)?(?:href|on[a-z]+)/i.test(v) ? pre : m))
      .replace(attr("(?:xlink:)?href"), (m, pre, v) => (/^["']?#/.test(v) ? m : pre))
      .replace(/javascript:[^"')\s]*/gi, "").replace(/url\((?!\s*['"]?\s*#)[^)]*\)/gi, "none").replace(/@import[^;]*;?/gi, "");
    if (art.tier === "parts") t = t.replace(attr("src"), "$1");
    return t;
  };
  const faces = {} as StyleArt["faces"];
  for (const [k, v] of Object.entries(art.faces) as [FaceName, string][]) faces[k] = clean(v);
  return { ...art, faces };
}

// ---------------- stills ----------------

/** One face of an avatar as markup: an `<svg>` for drawn styles, an `<img>` for picture styles. No DOM needed for DiceBear styles. */
export async function renderStill(source: AvatarStyle | StyleArt, options?: StyleOptions, face: FaceName = "neutral"): Promise<string> {
  const art = "faces" in source ? source : await source.render({ ...source.defaults(), ...(options || {}) });
  return art.faces[face] || art.faces.neutral;
}
/** The same still as a data URL (SVG only), for `<img src>` tiles and vision models. */
export async function stillDataUrl(source: AvatarStyle | StyleArt, options?: StyleOptions, face: FaceName = "neutral"): Promise<string> {
  const html = await renderStill(source, options, face);
  const m = html.match(/src="([^"]+)"/);
  if (html.startsWith("<img") && m) return m[1];
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgOf(html) || html);
}

// ---------------- recipes and style packages as files ----------------

/** The saved-avatar file (`avatar.json`). Also published as `schema/avatar.schema.json`. */
export const RECIPE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema", $id: "https://awesome-agent-avatars.stitchable.ai/schema/avatar.schema.json",
  title: "Avatar recipe", type: "object", required: ["v", "style", "options"], additionalProperties: false,
  properties: {
    v: { const: 1 }, style: { type: "string", description: "style id" }, name: { type: "string" },
    options: { type: "object", additionalProperties: { type: ["string", "number", "boolean"] } },
    wear: { type: "array", items: { type: "string", enum: Object.keys(WEARABLES) } },
  },
} as const;

/** Validate a recipe against its style and report, rather than silently normalising. */
export function checkRecipe(recipe: AvatarRecipe, style: AvatarStyle): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (recipe.v !== 1) problems.push(`v must be 1 (got ${String(recipe.v)})`);
  if (recipe.style !== style.id) problems.push(`style is "${recipe.style}", checked against "${style.id}"`);
  for (const [k, v] of Object.entries(recipe.options || {})) {
    const f = style.fields.find((x) => x.key === k);
    if (!f) { if (k !== "seed") problems.push(`unknown option "${k}"`); continue; }
    if (f.type === "select" && !f.options.some((o) => o.value === v)) problems.push(`${k}: "${String(v)}" is not an option`);
    if (f.type === "toggle" && typeof v !== "boolean") problems.push(`${k}: expected true/false`);
    if (f.type === "color" && !(typeof v === "string" && hex(v))) problems.push(`${k}: "${String(v)}" is not a hex colour`);
  }
  for (const w of recipe.wear || []) if (!WEARABLES[w]) problems.push(`wear: "${w}" is not wearable (${Object.keys(WEARABLES).join(", ")})`);
  return { ok: !problems.length, problems };
}

/** A data-only style package (`style.json`): derive or compose, no code. */
export type StyleSpecFile =
  | { kind: "derive"; id: string; name: string; from: string; drop?: string[]; set?: StyleOptions; gradient?: { replace: string; stops: string[]; angle?: number }; recolor?: Record<string, string>; traits?: TraitMap; by?: string }
  | { kind: "compose"; id: string; name: string; base: string; layers: Array<Omit<ComposeLayer, "from"> & { from: string }>; by?: string };

/** Build a style from a data spec, given the styles it names. */
export function styleFromSpec(spec: StyleSpecFile, resolve: (id: string) => AvatarStyle | undefined): AvatarStyle {
  const need = (id: string) => { const s = resolve(id); if (!s) throw new Error(`unknown style "${id}"`); return s; };
  if (spec.kind === "derive") {
    const base = need(spec.from);
    // a data style must stay inert: everything it writes into the art is a checked colour, refused at load
    const gradient = spec.gradient && { replace: needHex("gradient.replace", spec.gradient.replace), stops: (Array.isArray(spec.gradient.stops) ? spec.gradient.stops : []).map((s, i) => needHex(`gradient.stops[${i}]`, s)), angle: spec.gradient.angle };
    if (gradient && !gradient.stops.length) throw new Error("gradient.stops must list at least one hex colour");
    const recolor = Object.entries(spec.recolor || {}).map(([from, to]) => [needHex("recolor key", from), needHex(`recolor[${JSON.stringify(from)}]`, to)] as const);
    return deriveStyle(base, {
      id: spec.id, name: spec.name, drop: spec.drop, traits: spec.traits, by: spec.by,
      options: (o) => ({ ...base.defaults(), ...o, ...(spec.set || {}) }),
      art: (art) => {
        let a = art;
        if (gradient) a = fillGradient(a, gradient.replace, gradient.stops, gradient.angle);
        for (const [from, to] of recolor) {
          const re = new RegExp(reEscape(from), "gi"); const faces = {} as StyleArt["faces"];
          for (const [k, v] of Object.entries(a.faces) as [FaceName, string][]) faces[k] = v.replace(re, to);
          a = { ...a, faces };
        }
        return a;
      },
    });
  }
  return composeStyle({ id: spec.id, name: spec.name, base: need(spec.base), by: spec.by, layers: spec.layers.map((L) => ({ ...L, from: need(L.from) })) });
}
