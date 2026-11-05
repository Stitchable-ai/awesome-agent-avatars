// Writing a style: return StyleArt from render(options). Two helpers cover most cases.
import type { Anchors, AvatarStyle, Credit, Field, StyleArt, StyleOptions } from "./types";

/** Identity helper that keeps the option types. */
export function defineStyle<O extends StyleOptions>(style: AvatarStyle<O>): AvatarStyle<O> { return style; }

const esc = (s: string) => s.replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]!);

/**
 * A picture style: any image (PNG, SVG, WebP, GIF, a 3D render). It tilts, hops, sleeps,
 * wears props and plays every state, but its eyes cannot move or blink.
 * Pass several `faces` (one image per face) to get expressions too.
 */
export function pictureStyle(cfg: {
  id: string; name: string; credit: Credit; src: string;
  faces?: Partial<Record<string, string>>;
  anchors?: Anchors; bust?: boolean; skin?: string; sleeve?: string;
  /** empty margin around the picture, as a fraction of its box (anchors are given for the unpadded image) */
  pad?: number;
  /** let the user pick from several images */
  choices?: { value: string; label: string; src: string }[];
}): AvatarStyle<{ src: string }> {
  const pad = cfg.pad ?? 0;
  const img = (src: string) => `<img alt="" draggable="false" src="${esc(src)}"${pad ? ` style="box-sizing:border-box;padding:${(pad * 100).toFixed(2)}%"` : ""}>`;
  const fit = (a: Anchors): Anchors => { const m = (v: number) => pad + v * (1 - 2 * pad); const o: any = {}; for (const [k, v] of Object.entries(a)) o[k] = k === "hw" ? v * (1 - 2 * pad) : m(v as number); return o; };
  const fields: Field[] = cfg.choices ? [{ key: "src", label: "Picture", type: "select", options: cfg.choices.map((c) => ({ value: c.src, label: c.label })) }] : [];
  return {
    id: cfg.id, name: cfg.name, tier: "picture", credit: cfg.credit, fields,
    defaults: () => ({ src: cfg.src }),
    render: ({ src }) => {
      const faces: StyleArt["faces"] = { neutral: img(src || cfg.src) };
      for (const [k, v] of Object.entries(cfg.faces || {})) if (v) (faces as any)[k] = img(v);
      return {
        id: cfg.id, tier: "picture", faces, bust: cfg.bust ?? true, skin: cfg.skin, sleeve: cfg.sleeve,
        anchors: fit(cfg.anchors ?? { cx: 0.5, ey: 0.36, hw: 0.5, crown: 0.06, my: 0.5, chin: 0.6, chest: 0.8 }),
        rot: { yaw: 0.8, pitch: 0.8, roll: 0.6, x: 0.6 }, tilt: { x: 10, y: 16 }, lift: 0.7,
      };
    },
  };
}
