// App-drawn props: the same for every style. fx = around the avatar; front/back = worn, moving with the head.
// Register more with registerProp(). Classes are prefixed aav- (see css.ts).
import { armHTML } from "./arm";
import type { Anchors, StyleArt } from "./types";
/** `anchored` props depend on the style's anchors and are redrawn when the art changes. */
export interface PropDef { layer?: "fx" | "front" | "back"; badge?: 1 | boolean; anchored?: boolean; html: string | ((avatar: { miniArt(): string; artStyle: StyleArt; anchors?: Anchors }) => string) }
const mini = '<i class="aav-mini"><b class="aav-mini-art">{ART}</b></i>';
export const PROPS: Record<string, PropDef> = {
  dots: { badge: 1, html: '<div class="aav-p-bubble aav-p-think"><i></i><i></i><i></i></div>' },
  ask: { badge: 1, html: '<div class="aav-p-bubble aav-p-ask">?</div>' },
  zzz: { badge: 1, html: '<div class="aav-p-zzz"><b>z</b><b>z</b><b>Z</b></div>' },
  ear: { html: '<div class="aav-p-wave"><i></i><i></i><i></i><i></i></div>' },
  radar: { html: '<div class="aav-p-radar"><i></i><i></i><i></i></div>' },
  sparkle: { html: '<div class="aav-p-spark"><i></i><i></i><i></i><i></i></div>' },
  confetti: { html: '<div class="aav-p-confetti">' + Array.from({ length: 22 }, (_, i) => `<i style="--i:${i};--x:${((i * 53) % 22) * 4.4 + 2}%;--d:${-((i * 37) % 22) * 0.09}s"></i>`).join("") + "</div>" },
  laptop: { html: '<svg class="aav-p-laptop" viewBox="0 0 120 52"><path d="M14 4h92a4 4 0 0 1 4 4v34H10V8a4 4 0 0 1 4-4z" fill="#3b3f4a"/><rect x="16" y="9" width="88" height="29" rx="2" fill="#8fd3ff" opacity=".9"/><g class="scr"><rect x="22" y="14" width="40" height="3" rx="1.5" fill="#fff" opacity=".8"/><rect x="22" y="20" width="58" height="3" rx="1.5" fill="#fff" opacity=".6"/><rect x="22" y="26" width="30" height="3" rx="1.5" fill="#fff" opacity=".6"/></g><path class="kbd" d="M2 42h116l-6 8H8z" fill="#c9ccd4"/><circle cx="60" cy="6.5" r="1.2" fill="#9aa"/></svg>' },
  lines: { html: '<div class="aav-p-bubble aav-p-lines"><i></i><i></i><i></i></div>' },
  doc: { html: '<svg class="aav-p-doc" viewBox="0 0 80 56"><path d="M8 4h58l8 8v40H8z" fill="#fff" stroke="#d6d3cc"/><g fill="#c9c6bf"><rect x="16" y="14" width="44" height="3" rx="1.5"/><rect x="16" y="22" width="50" height="3" rx="1.5"/><rect x="16" y="30" width="38" height="3" rx="1.5"/><rect x="16" y="38" width="46" height="3" rx="1.5"/></g><rect class="hl" x="14" y="12" width="8" height="7" rx="2" fill="#fde68a" opacity=".8"/></svg>' },
  code: { html: '<div class="aav-p-code"><b>&lt;/&gt;</b><b>{ }</b><b>=&gt;</b></div>' },
  term: { html: '<div class="aav-p-term"><i></i><i></i><span>&gt;_</span></div>' },
  gears: { html: '<svg class="aav-p-gears" viewBox="0 0 60 44"><g class="g1"><circle cx="20" cy="22" r="10" fill="none" stroke="#7c3aed" stroke-width="5" stroke-dasharray="4 3.2"/><circle cx="20" cy="22" r="6" fill="#7c3aed"/></g><g class="g2"><circle cx="42" cy="16" r="7" fill="none" stroke="#06b6d4" stroke-width="4" stroke-dasharray="3 2.6"/><circle cx="42" cy="16" r="4" fill="#06b6d4"/></g></svg>' },
  cursor: { html: '<div class="aav-p-cursor"><svg viewBox="0 0 18 18"><path d="M2 1l13 7-6 1.5L6.5 16z" fill="#2a2733" stroke="#fff" stroke-width="1.3"/></svg><i class="rip"></i></div>' },
  orbit: { layer: "front", html: '<div class="aav-w aav-w-orbit" data-k="1.2"><i></i><i></i><i></i></div>' },
  progress: { badge: 1, html: '<svg class="aav-p-progress" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#fff" stroke="#ece9e3" stroke-width="5"/><circle class="bar" cx="20" cy="20" r="15" fill="none" stroke="#7c3aed" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="100" transform="rotate(-90 20 20)"/></svg>' },
  spinner: { badge: 1, html: '<div class="aav-p-spinner"></div>' },
  gather: { html: (a) => '<div class="aav-p-gather">' + [0, 1, 2].map(() => mini.replace("{ART}", a.miniArt())).join("") + "</div>" },
  helpers: { html: (a) => '<div class="aav-p-helpers">' + [0, 1].map(() => mini.replace("{ART}", a.miniArt()) .replace("</i>", '<svg class="aav-mini-lap" viewBox="0 0 40 16"><path d="M5 1h30v11H5z" fill="#3b3f4a"/><path d="M1 12h38l-3 4H4z" fill="#c9ccd4"/></svg></i>')).join("") + "</div>" },
  mic: { badge: 1, html: '<div class="aav-p-mic"><svg viewBox="0 0 20 30"><rect x="6" y="2" width="8" height="15" rx="4" fill="#fff"/><path d="M3 13a7 7 0 0 0 14 0" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M10 20v6" stroke="#fff" stroke-width="2.2"/></svg><i></i><i></i><i></i><i></i></div>' },
  send: { html: '<svg class="aav-p-send" viewBox="0 0 24 24"><path d="M2 11l20-9-7 20-3-8z" fill="#7c3aed"/><path d="M12 14l10-12" stroke="#fff" stroke-width="1.2"/></svg>' },
  receive: { html: '<svg class="aav-p-receive" viewBox="0 0 28 20"><rect x="1" y="1" width="26" height="18" rx="3" fill="#fff" stroke="#7c3aed" stroke-width="2"/><path d="M2 3l12 9 12-9" fill="none" stroke="#7c3aed" stroke-width="2"/></svg>' },
  dock: { html: '<div class="aav-p-dock"><svg viewBox="0 0 48 32"><path d="M14 28h22a9 9 0 0 0 1-18 12 12 0 0 0-23-1A9 9 0 0 0 14 28z" fill="#fff" stroke="#c7d2fe" stroke-width="2"/></svg><b>↑</b></div>' },
  pencil: { html: '<div class="aav-p-pencil"><svg class="pad" viewBox="0 0 80 40"><rect x="2" y="2" width="76" height="36" rx="4" fill="#fff" stroke="#d6d3cc"/><path class="ink" d="M10 22c6-10 10 10 16 0s10 10 16 0 10 10 16 0 8 8 12 0" fill="none" stroke="#7c3aed" stroke-width="2.4" stroke-linecap="round" pathLength="100"/></svg><svg class="pen" viewBox="0 0 12 40"><path d="M3 2h6v28l-3 8-3-8z" fill="#f5b400"/><path d="M3 30h6l-3 8z" fill="#f4d9b0"/><rect x="3" y="2" width="6" height="5" fill="#f9a8d4"/></svg></div>' },
  bang: { badge: 1, html: '<div class="aav-p-bang">!</div>' },
  ball: { layer: "front", html: '<div class="aav-w aav-w-ball" data-k="0"><i></i></div>' },
  standby: { badge: 1, html: '<svg class="aav-p-standby" viewBox="0 0 24 24"><path d="M12 3v8" stroke="#7c6fb0" stroke-width="2.6" stroke-linecap="round"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0" fill="none" stroke="#7c6fb0" stroke-width="2.6" stroke-linecap="round"/></svg>' },
  notes: { html: '<div class="aav-p-notes"><b>♪</b><b>♫</b><b>♪</b></div>' },
  bell: { badge: 1, html: '<div class="aav-p-bell"><svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-6 6v4l-2 4h16l-2-4V9a6 6 0 0 0-6-6z" fill="#f5b400"/><circle cx="12" cy="20" r="2.2" fill="#d97706"/></svg><i></i></div>' },
  badge: { html: '<div class="aav-p-logo">S</div>' },
  shine: { layer: "front", html: '<div class="aav-w aav-w-shine" data-k="1.2"><i></i><i></i></div>' },
  steam: { layer: "front", html: '<div class="aav-w aav-w-steam" data-k="1.2"><i></i><i></i><i></i><i></i></div>' },
  huh: { html: '<div class="aav-p-huh"><b>?</b><b>?</b></div>' },
  sweat: { layer: "front", html: '<div class="aav-w aav-w-sweat" data-k="2"><i></i></div>' },
  oops: { layer: "front", html: '<div class="aav-w aav-w-tear" data-k="6"><i></i></div>' },
  check: { badge: 1, html: '<div class="aav-p-check">✓</div>' },
  popper: { html: '<div class="aav-p-popper"><i></i><i></i></div>' },
  flash: { html: '<div class="aav-p-flash"></div>' },
  hearts: { html: '<div class="aav-p-hearts"><b>♥</b><b>♥</b><b>♥</b></div>' },
  // worn: these sit on the avatar and move with its head
  headphones: { layer: "front", html: '<div class="aav-w aav-w-phones" data-k="1.2"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M9 64C7 4 93 4 91 64" fill="none" stroke="#3f4552" stroke-width="7" vector-effect="non-scaling-stroke"/><rect x="0" y="52" width="17" height="40" rx="8" fill="#5b6270"/><rect x="83" y="52" width="17" height="40" rx="8" fill="#5b6270"/><rect x="4" y="58" width="9" height="28" rx="4" fill="#8fd3ff"/><rect x="87" y="58" width="9" height="28" rx="4" fill="#8fd3ff"/></svg></div>' },
  hat: { layer: "front", html: '<div class="aav-w aav-w-hat" data-k="1.2"><svg viewBox="0 0 40 50"><path d="M20 2L37 46H3z" fill="#5b6ee1"/><path d="M9 31l22-8M6 40l28-10M13 20l14-5" stroke="#f5b400" stroke-width="3"/><circle cx="20" cy="4" r="4" fill="#ef4444"/><rect x="2" y="44" width="36" height="5" rx="2.5" fill="#fbbf24"/></svg></div>' },
  cape: { layer: "back", html: '<div class="aav-w aav-w-cape" data-k="0"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100L4 4Q26 40 50 62Q74 40 96 4L100 100z" fill="#4c1d95"/><path d="M9 100L11 20Q31 50 50 70Q69 50 89 20L91 100z" fill="#7c3aed"/></svg></div>' },
  bow: { layer: "front", html: '<div class="aav-w aav-w-bow" data-k="0"><svg viewBox="0 0 30 14"><path d="M15 7L2 1v12zM15 7l13-6v12z" fill="#6d28d9"/><circle cx="15" cy="7" r="3" fill="#5b21b6"/></svg></div>' },
  crystal: { layer: "front", html: '<div class="aav-w aav-w-crystal" data-k="0"><i class="glow"></i><svg viewBox="0 0 40 48"><path d="M20 1l17 15-17 31L3 16z" fill="#a78bfa"/><path d="M20 1l17 15H3z" fill="#c4b5fd"/><path d="M20 1v46M3 16l17 6 17-6" stroke="#ede9fe" stroke-width="1" fill="none" opacity=".8"/></svg><b></b><b></b><b></b></div>' },
  blush: { layer: "front", html: '<div class="aav-w aav-w-blush" data-k="3.5"><i></i><i></i></div>' },
  hand: { layer: "front", anchored: true, html: (a) => armHTML(a.artStyle, a.anchors, "front") },
  arm: { layer: "back", anchored: true, html: (a) => armHTML(a.artStyle, a.anchors, "back") },
};


export function registerProp(id: string, def: PropDef): void { PROPS[id] = def; }
