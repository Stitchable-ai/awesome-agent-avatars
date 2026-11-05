// Built-in pointer behaviour, attached by createAvatar unless `interactions: false`.
// hover: eyes then head follow the pointer (not while a button is held)
// click: hop · double-click: double spin + happy · drag: dangle and swing
// rub back and forth: shy · five quick clicks: annoyed
import type { BotAvatar, InteractionOptions } from "./types.js";

export const defaultInteractions: InteractionOptions = { follow: "hover", reach: 1.2, click: true, doubleClick: true, drag: true, pet: true, annoy: true };

export function attachInteractions(av: BotAvatar, el: HTMLElement, partial: Partial<InteractionOptions> = {}): () => void {
  const o: InteractionOptions = { ...defaultInteractions, ...partial };
  const doc = el.ownerDocument;
  let down: { x: number; y: number; moved: boolean } | null = null;
  let clicks: number[] = [], rub: number[] = [], lastX: number | null = null, lastDir = 0, rubCool = 0;
  const local = (cx: number, cy: number): [number, number] => { const r = el.getBoundingClientRect(); return [((cx - r.left) / r.width - 0.5) * 200, ((cy - r.top) / r.height - 0.5) * 200]; };
  const now = () => performance.now();

  const onDown = (e: PointerEvent) => { if (!o.drag && !o.click) return; down = { x: e.clientX, y: e.clientY, moved: false }; el.setPointerCapture?.(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (down) {
      if (o.drag && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) { down.moved = true; av.grab(...local(down.x, down.y)); }
      if (down.moved) av.dragTo(...local(e.clientX, e.clientY));
      return;
    }
    if (!o.pet) return;
    if (lastX != null) {
      const dx = e.clientX - lastX, dir = Math.sign(dx);
      if (Math.abs(dx) > 2 && dir && dir !== lastDir) { if (lastDir) rub.push(now()); lastDir = dir; }
      rub = rub.filter((t) => now() - t < 1200);
      if (rub.length >= 4 && now() > rubCool) { rubCool = now() + 3500; rub = []; av.react("shy", 2.6); }
    }
    lastX = e.clientX;
  };
  const onLeave = () => { lastX = null; lastDir = 0; };
  const onUp = () => {
    if (!down) return; const wasDrag = down.moved; down = null;
    if (wasDrag) { av.release(); return; }
    const t = now(); clicks = clicks.filter((c) => t - c < 2000); clicks.push(t);
    if (o.annoy && clicks.length >= 5) { clicks = []; av.react("angry", 2.6); return; }
    if (o.doubleClick && clicks.length >= 2 && t - clicks[clicks.length - 2] < 320) { av.poke("spin", { turns: 2 }); av.react("happy", 1.8); return; }
    if (o.click) { av.poke("bounce"); av.attend(); }
  };
  // gaze: the pointer relative to the avatar, reaching about `reach` widths out
  const onDocMove = (e: PointerEvent) => {
    if (o.follow === "none") return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.42, span = r.width * o.reach;
    const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    const near = Math.abs(e.clientX - cx) < span * 1.6 && Math.abs(e.clientY - cy) < span * 1.6;
    const weight = e.buttons ? 0 : over ? 1 : o.follow === "page" ? 0.6 : near ? 0.45 : 0;
    av.setPointer((e.clientX - cx) / span, -(e.clientY - cy) / span, weight);
  };
  const onDocLeave = () => av.setPointer(0, 0, 0);

  el.addEventListener("pointerdown", onDown); el.addEventListener("pointermove", onMove); el.addEventListener("pointerleave", onLeave);
  el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
  doc.addEventListener("pointermove", onDocMove, { passive: true }); doc.documentElement.addEventListener("pointerleave", onDocLeave);
  return () => {
    el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
    doc.removeEventListener("pointermove", onDocMove); doc.documentElement.removeEventListener("pointerleave", onDocLeave);
  };
}
