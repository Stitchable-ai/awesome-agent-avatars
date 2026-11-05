// The editing interface. Every style describes its editable identity as `fields`;
// an app builds whatever editor UI it likes from them (see examples/react-editor).
// Saved avatars are AvatarRecipe JSON: { v: 1, style, options }.
import type { AvatarRecipe, AvatarStyle, Field, StyleArt, StyleOptions } from "./types";

function rand(seed: string) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); let t = h >>> 0; return () => { t = (t + 0x6d2b79f5) | 0; let e = Math.imul(t ^ (t >>> 15), 1 | t); e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e; return ((e ^ (e >>> 14)) >>> 0) / 4294967296; }; }

/** Random options for a style (deterministic per seed). */
export function randomOptions<O extends StyleOptions>(style: AvatarStyle<O>, seed = String(Math.random())): O {
  const r = rand(seed), out: StyleOptions = { ...style.defaults(seed) };
  for (const f of style.fields) {
    if (f.type === "select") out[f.key] = f.options[Math.floor(r() * f.options.length)].value;
    else if (f.type === "color") out[f.key] = f.swatches[Math.floor(r() * f.swatches.length)];
    else if (f.type === "toggle") out[f.key] = r() < 0.5;
  }
  return out as O;
}

/** Keep only known fields and fill the rest from defaults (safe for recipes saved by older versions). */
export function normalizeOptions<O extends StyleOptions>(style: AvatarStyle<O>, options: StyleOptions): O {
  const out: StyleOptions = { ...style.defaults() };
  for (const f of style.fields) {
    const v = options[f.key];
    if (v === undefined) continue;
    if (f.type === "select" && !f.options.some((o) => o.value === v)) continue;
    if (f.type === "toggle" && typeof v !== "boolean") continue;
    out[f.key] = v;
  }
  return out as O;
}

/** A set of styles an app offers. */
export function createStyleRegistry(styles: AvatarStyle<any>[]) {
  const byId = new Map(styles.map((s) => [s.id, s]));
  return {
    list: () => [...byId.values()],
    get: (id: string) => byId.get(id),
    add: (s: AvatarStyle<any>) => { byId.set(s.id, s); },
    recipe: (styleId: string, options?: StyleOptions, name?: string): AvatarRecipe => {
      const s = byId.get(styleId); if (!s) throw new Error(`awesome-agent-avatars: unknown style "${styleId}"`);
      return { v: 1, style: styleId, options: normalizeOptions(s, options || s.defaults()), ...(name ? { name } : {}) };
    },
    async render(recipe: AvatarRecipe): Promise<StyleArt> {
      const s = byId.get(recipe.style); if (!s) throw new Error(`awesome-agent-avatars: unknown style "${recipe.style}"`);
      return s.render(normalizeOptions(s, recipe.options));
    },
  };
}

/** Group fields for a tabbed or sectioned editor. */
export function groupFields(fields: Field[]): [string, Field[]][] {
  const m = new Map<string, Field[]>();
  for (const f of fields) { const g = f.group || "Look"; if (!m.has(g)) m.set(g, []); m.get(g)!.push(f); }
  return [...m];
}
