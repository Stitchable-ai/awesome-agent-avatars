// DiceBear adapter. DiceBear 10 styles are data-only JSON definitions; we wrap every
// component in <g class="bs-part-<name>"> by transforming the definition (no art is
// forked), which gives the engine addressable eyes, brows and mouth in any DiceBear style.
// Peer dependency: @dicebear/core (and @dicebear/styles for the presets).
import { Avatar, Style } from "@dicebear/core";
import type { AvatarStyle, Credit, FaceName, Field, StyleArt, StyleOptions } from "./types";

type Definition = { meta?: any; components: Record<string, { variants: Record<string, unknown>; probability?: number }>; colors?: Record<string, { values: string[] }> } & Record<string, any>;

function tag(node: any): any {
  if (Array.isArray(node)) return node.map(tag);
  if (!node || typeof node !== "object") return node;
  if (node.type === "component" && typeof node.name === "string") return { name: "g", type: "element", attributes: { class: `bs-part-${node.name}` }, children: [{ ...node }] };
  const out: any = {};
  for (const [k, v] of Object.entries(node)) out[k] = k === "attributes" ? v : tag(v);
  return out;
}

const words = (s: string) => s.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/** Credit straight from the definition's own metadata. */
export function creditOf(def: Definition): Credit {
  const m = def.meta || {};
  return { author: m.creator?.name || "DiceBear", authorUrl: m.creator?.url, source: m.source?.name, sourceUrl: m.source?.url, license: m.license?.name || "see DiceBear", licenseUrl: m.license?.url };
}

/** A select field from a component's variants. `optional` adds "None" (probability 0). */
export function variantField(def: Definition, component: string, label: string, o: { optional?: boolean; group?: string; only?: string[] } = {}): Field {
  const names = Object.keys(def.components[component]?.variants || {}).filter((v) => !o.only || o.only.includes(v));
  return { key: `${component}Variant`, label, type: "select", group: o.group, options: [...(o.optional ? [{ value: "none", label: "None" }] : []), ...names.map((v) => ({ value: v, label: words(v) }))] };
}
/** A colour field from a palette in the definition, plus extra swatches. */
export function colorField(def: Definition, color: string, label: string, o: { extra?: string[]; group?: string } = {}): Field {
  const values = [...(def.colors?.[color]?.values || []), ...(o.extra || [])].filter((v, i, a) => a.indexOf(v) === i && v !== "transparent");
  return { key: `${color}Color`, label, type: "color", group: o.group, swatches: values };
}

export interface DicebearPreset<O extends StyleOptions> {
  id: string;
  name: string;
  definition: Definition;
  fields: Field[];
  defaults: (seed?: string) => O;
  /** fixed DiceBear options (e.g. animationVariant) */
  base?: Record<string, unknown>;
  /** per face: the DiceBear options for eyes/mouth/brows */
  faces: Partial<Record<FaceName, Record<string, unknown>>>;
  /** which option holds skin / sleeve colour (for app-drawn hands) */
  skinKey?: string;
  sleeveKey?: string;
  art?: Omit<StyleArt, "id" | "tier" | "faces">;
}

/** Turn a DiceBear definition into an editable bot-styles style. */
export function dicebearStyle<O extends StyleOptions>(p: DicebearPreset<O>): AvatarStyle<O> {
  let tagged: InstanceType<typeof Style> | null = null;
  const style = () => (tagged ??= new Style(tag(p.definition)));
  const toDicebear = (options: StyleOptions) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(options)) {
      if (k.endsWith("Variant") && v === "none") out[k.replace(/Variant$/, "Probability")] = 0;
      else if (k.endsWith("Variant")) { out[k] = v; const c = k.replace(/Variant$/, ""); if (p.definition.components[c]?.probability != null) out[`${c}Probability`] = 100; }
      else out[k] = v;
    }
    return out;
  };
  return {
    id: p.id, name: p.name, tier: "parts", credit: creditOf(p.definition), fields: p.fields, defaults: p.defaults,
    render(options) {
      const common = { ...(p.base || {}), ...toDicebear(options) };
      const faces: Record<string, string> = {};
      for (const [face, fo] of Object.entries(p.faces)) faces[face] = new Avatar(style(), { ...common, ...fo } as any).toString().replace(/<metadata[\s\S]*?<\/metadata>/, "");
      return {
        id: p.id, tier: "parts", faces: faces as StyleArt["faces"],
        skin: p.skinKey ? String(options[p.skinKey] ?? "") || undefined : undefined,
        sleeve: p.sleeveKey ? String(options[p.sleeveKey] ?? "") || undefined : undefined,
        ...(p.art || {}),
      };
    },
  };
}
