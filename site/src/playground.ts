import "./site.css";
import { createAvatar, defaultMotion, extendMotion, REACTIONS, FACES, agentPresence } from "bot-styles";
import type { BotAvatar, PokeName, StyleArt, LookDirection } from "bot-styles";
import { STYLES, CAPS, renderDefaults } from "./shared";

// shorter timers so visitors see the hand-offs
const motion = extendMotion(defaultMotion, { states: { blocked: { hold: 20 }, bored: { hold: 10 } } });
const S = motion.states, NAME = (s: string) => S[s].doc![0];
const PEAK: Record<string, number> = { finished: 2.4, approving: 0.5, waking: 0.6, sending: 0.7, surprised: 0.25, scared: 0.3, turntable: 3.6, celebrate: 1.0, milestone: 1.4, intro: 2.2, notifying: 0.9, alerting: 0.6, dragging: 0.8, receiving: 1.0, "powering-down": 2.4 };
const app = document.getElementById("app")!;
const hash = location.hash.slice(1);
const arts = await renderDefaults();

if (hash.startsWith("matrix")) sheet(hash.split("=")[1] || "Lifecycle");
else if (hash === "faces") faces();
else if (hash === "worn") worn();
else if (hash === "react") reactSheet();
else if (hash === "arms") arms();
else main();

function main() {
  app.innerHTML = `<h1 style="font-size:22px;margin:0 0 2px">Playground</h1>
  <p class="caption" style="margin:0 0 12px">Hover: eyes, then the head, follow you. Click: hop. Double-click: happy spin. Drag one around. Rub back and forth over it. Click five times fast. Leave them alone: bored, then asleep. Every button below drives all five styles through the same engine.</p>
  <div class="gallery" id="gal"></div>
  <div class="panel"><div class="tool">
    <b>Try</b><input id="ask" placeholder="Type to it (it listens); press Enter to run a turn">
    <button class="chip" id="mic">🎙 Dictate</button><button class="chip" id="turn">▶ Full turn</button><button class="chip" id="need">Needs approval</button><button class="chip" id="approve" disabled>Approve</button><button class="chip" id="fail">Fail a step</button>
    <span class="sep"></span><b>Look</b>${["left", "up", "down", "right"].map((d) => `<button class="chip" data-look="${d}">${{ left: "←", up: "↑", down: "↓", right: "→" }[d]}</button>`).join("")}
    <span class="sep"></span><button class="chip" id="glow">Glow</button><button class="chip" id="page">Follow anywhere</button><button class="chip" id="rm">Reduced motion</button>
  </div><div class="caption" id="cap"></div></div>
  <div class="panel" id="states"></div>
  <div class="panel"><div class="row" id="pokes"><b>Pokes</b></div><div class="row" id="reacts"><b>Reactions</b></div>
    <div class="row" id="swap"><b>Hot-swap</b></div>
    <div class="row"><b>Small sizes</b><div class="smalls" id="smalls"></div></div></div>
  <div class="panel grid2" style="display:grid"><section><h3 style="margin:4px 0 6px;font-size:14px">The 58 states</h3><table class="t" id="tbl"></table></section>
  <section><h3 style="margin:4px 0 6px;font-size:14px">Interactions (built in)</h3><table class="t" id="itbl"></table></section></div>`;
  const gal = document.getElementById("gal")!, cap = document.getElementById("cap")!, statesEl = document.getElementById("states")!;
  const avs: BotAvatar[] = [], smalls: BotAvatar[] = [];
  const all = (fn: (a: BotAvatar) => void) => { avs.forEach(fn); smalls.forEach(fn); };
  let current = "idle";
  const setAll = (s: string) => { current = s; all((a) => a.setState(s)); };
  const mark = (s: string) => { statesEl.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.classList.toggle("on", b.dataset.k === s)); (document.getElementById("approve") as HTMLButtonElement).disabled = s !== "blocked" && s !== "drowsy"; };

  STYLES.forEach((st, i) => {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<h3>${st.name}<small>${st.credit.license}</small></h3><div class="stage"></div><div class="caps">${CAPS[st.id].map(([t, ok]) => `<span class="${ok ? "" : "no"}">${t}</span>`).join("")}</div><div class="now"></div>`;
    gal.append(card);
    const now = card.querySelector(".now")!;
    avs.push(createAvatar(card.querySelector<HTMLElement>(".stage")!, arts[i], { seed: "s" + i, motion, autoSleep: { bored: 12 }, onState: (s) => { now.innerHTML = `<em>${NAME(s)}</em> · ${S[s].doc![1]}`; if (i === 0) mark(s); } }));
  });
  for (const g of motion.groups) {
    const ids = Object.keys(S).filter((k) => S[k].group === g);
    const row = document.createElement("div"); row.className = "row"; row.innerHTML = `<b>${g} <span style="font-weight:500">${ids.length}</span></b>`;
    for (const s of ids) { const b = document.createElement("button"); b.className = "chip"; b.textContent = NAME(s); b.dataset.k = s; b.onclick = () => { stop(); setAll(s); }; row.append(b); }
    statesEl.append(row);
  }
  const pk = document.getElementById("pokes")!;
  for (const [label, n, p] of [["Hop", "bounce"], ["Spin", "spin", { turns: 1 }], ["Spin ×2", "spin", { turns: 2 }], ["Nod", "nod"], ["Wiggle", "wiggle"], ["Shake head", "shake"], ["Jolt", "jolt"]] as [string, PokeName, any][]) {
    const b = document.createElement("button"); b.className = "chip"; b.textContent = label; b.onclick = () => all((a) => a.poke(n, p)); pk.append(b);
  }
  const rx = document.getElementById("reacts")!;
  for (const f of Object.keys(REACTIONS)) { const b = document.createElement("button"); b.className = "chip"; b.textContent = f; b.onclick = () => all((a) => a.react(f)); rx.append(b); }
  // hot-swap: every card takes the next style's art, keeping its state
  const sw = document.getElementById("swap")!;
  const rot = document.createElement("button"); rot.className = "chip"; rot.textContent = "Rotate styles across cards";
  let shift = 0; rot.onclick = () => { shift = (shift + 1) % arts.length; avs.forEach((a, i) => a.setArt(arts[(i + shift) % arts.length])); };
  sw.append(rot);
  const sm = document.getElementById("smalls")!;
  for (const [w, label] of [[64, "64 px"], [40, "40 px"], [28, "28 px"]] as [number, string][]) {
    const grp = document.createElement("div"); grp.className = "grp"; grp.innerHTML = `<small style="color:#8a8696;width:34px">${label}</small>`; sm.append(grp);
    STYLES.forEach((_, i) => { const el = document.createElement("div"); el.style.width = w + "px"; grp.append(el); smalls.push(createAvatar(el, arts[i], { seed: "m" + w + i, motion, interactions: false, autoSleep: false })); });
  }
  document.getElementById("tbl")!.innerHTML = motion.groups.map((g) => `<tr class="g"><td colspan="3">${g}</td></tr>` + Object.entries(S).filter(([, v]) => v.group === g).map(([, v]) => `<tr><td>${v.doc![0]}</td><td>${v.doc![1]}</td><td style="color:#6b6878">${v.doc![2]}</td></tr>`).join("")).join("");
  const INTER = [["Hover", "eyes, then head, turn toward the pointer; eased in and out; not while a button is held"], ["Pointer elsewhere", "follows more lightly (follow: \"page\" follows anywhere)"], ["Click", "hop with squash and stretch"], ["Double-click", "spins twice, bounces, happy"], ["Drag", "grabbed: surprised, dangles and swings; drops with a bounce"], ["Rub back and forth", "shy: turns away, blushes, hearts"], ["Five quick clicks", "annoyed: shakes its head, steam"], ["Type in the box", "listening; Enter nods and sends"], ["Arrow keys", "look(left/up/down/right)"], ["Leave it alone", "bored, then asleep; hover wakes it with a stretch"], ["Under 56 px", "gentle clips and badges only"], ["Off screen / hidden tab / reduced motion", "stops animating / static pose"]];
  document.getElementById("itbl")!.innerHTML = INTER.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("");

  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  document.querySelectorAll<HTMLButtonElement>("[data-look]").forEach((b) => (b.onclick = () => all((a) => a.look(b.dataset.look as LookDirection))));
  document.addEventListener("keydown", (e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; const d = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as Record<string, LookDirection>)[e.key]; if (d) { e.preventDefault(); all((a) => a.look(d)); } });
  const toggle = (id: string, fn: (on: boolean) => void) => { const b = $(id); b.onclick = () => { b.classList.toggle("on"); fn(b.classList.contains("on")); }; };
  toggle("glow", (on) => all((a) => a.setGlow(on)));
  toggle("rm", (on) => all((a) => a.setReducedMotion(on)));
  toggle("page", (on) => { avs.forEach((a, i) => { a.destroy(); }); avs.length = 0; gal.querySelectorAll<HTMLElement>(".stage").forEach((el, i) => avs.push(createAvatar(el, arts[i], { seed: "s" + i, motion, interactions: { follow: on ? "page" : "hover" } }))); });
  toggle("mic", (on) => { stop(); presence.dictating(on); say(on ? "<b>Dictating</b>: voice input" : ""); });

  const presence = agentPresence((s) => { setAll(s); });
  $("ask").addEventListener("input", () => { if (!script) { presence.typing(); say("<b>Listening</b>: you are typing"); } });
  $("ask").addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") { e.preventDefault(); runTurn(); } });
  $("turn").onclick = runTurn;
  $("need").onclick = () => run([["working", 2200, "<b>Working</b>: a long tool call"], ["blocked", 0, "<b>Needs you</b>: an approval is waiting (press Approve)"]]);
  $("approve").onclick = () => run([["approving", 1400, "<b>Approving</b>: you approved"], ["working", 2600, "<b>Working</b>"], ["finished", 4000, "<b>Finished</b>"], ["idle", 0, ""]]);
  $("fail").onclick = () => run([["running", 2200, "<b>Running</b>: a shell command"], ["failed", 6000, "<b>Failed</b>: it exited with an error"], ["idle", 0, ""]]);

  let script: { stop: boolean } | null = null;
  function say(html: string) { cap.innerHTML = html; }
  function stop() { if (script) script.stop = true; script = null; }
  async function run(steps: [string, number, string][]) {
    stop(); const me = (script = { stop: false });
    for (const [s, ms, text] of steps) { if (me.stop) return; setAll(s); say(text); if (ms) await new Promise((r) => setTimeout(r, ms)); }
    if (script === me) script = null;
  }
  function runTurn() {
    ($("ask") as HTMLInputElement).value = "";
    run([["sending", 1100, "<b>Sending</b>: you pressed Enter (it nods)"], ["thinking", 2400, "<b>Thinking</b>: reasoning"], ["searching", 2200, "<b>Searching</b>: web_search"], ["reading", 2400, "<b>Reading</b>: read_file"],
      ["coding", 2600, "<b>Coding</b>: edit_file"], ["running", 2200, "<b>Running</b>: run_command"], ["streaming", 2800, "<b>Streaming</b>: the answer comes in"], ["finished", 4200, "<b>Finished</b>: double spin, bounce, then idle"], ["idle", 0, ""]]);
  }
  (window as any).BS_PAGE = { setAll, all, avs, smalls, runTurn, run };
}

// ---------- screenshot sheets (used by tests and the README images) ----------
function tile(parent: HTMLElement, art: StyleArt, state: string, secs: number, seed: string, before?: (a: BotAvatar) => void) {
  const el = document.createElement("div"); el.style.width = "118px"; parent.append(el);
  const a = createAvatar(el, art, { static: true, state, seed, motion }); before?.(a); a.simulate(secs); return a;
}
function grid(title: string, cols: string[]) {
  app.innerHTML = `<h1 style="font-size:20px;margin:0 0 10px">${title}</h1><div id="mx" style="display:grid;gap:6px;align-items:center;grid-template-columns:110px repeat(${cols.length},118px)"></div>`;
  const mx = document.getElementById("mx")!;
  mx.insertAdjacentHTML("beforeend", "<div></div>" + cols.map((c) => `<div style="font-size:10.5px;font-weight:700;color:#6b6878;text-align:center">${c}</div>`).join(""));
  return mx;
}
function sheet(group: string) {
  const gs = decodeURIComponent(group).split(","), ids = Object.keys(S).filter((k) => gs.includes(S[k].group));
  const mx = grid(`${gs.join(" + ")}: ${ids.length} states × ${STYLES.length} styles`, ids.map(NAME));
  STYLES.forEach((st, i) => { mx.insertAdjacentHTML("beforeend", `<div style="font-weight:700;font-size:12px">${st.name}</div>`); for (const k of ids) tile(mx, arts[i], k, PEAK[k] ?? 1.3, "x" + i); });
}
function faces() {
  const mx = grid("Face names → each style's art", FACES);
  STYLES.forEach((st, i) => { mx.insertAdjacentHTML("beforeend", `<div style="font-weight:700;font-size:12px">${st.name}</div>`); for (const n of FACES) tile(mx, arts[i], "idle", 0.2, "f" + i, (a) => a.holdFace(n)); });
}
function worn() {
  const cols: [string, string][] = [["headphones", "working"], ["hat", "celebrate"], ["cape", "milestone"], ["crystal", "making"], ["hand", "waving"], ["blush", "shy"], ["sweat", "scared"], ["steam", "angry"], ["orbit", "orbit"], ["ball", "bouncing"], ["back", "turntable"]];
  const mx = grid("Worn props, placed from each style's measured face", cols.map(([n]) => n));
  STYLES.forEach((st, i) => { mx.insertAdjacentHTML("beforeend", `<div style="font-weight:700;font-size:12px">${st.name}</div>`); for (const [n, s] of cols) tile(mx, arts[i], s, n === "back" ? 5 : PEAK[s] ?? 1.3, "w" + i); });
}
function arms() {
  // big tiles to review hands: waving (two moments of the wave) and the raised "needs you" hand
  const cols: [string, string, number][] = [["waving, start", "waving", 0.45], ["waving, later", "waving", 1.05], ["needs you", "blocked", 1.2], ["needs you, later", "blocked", 2.0]];
  app.innerHTML = `<h1 style="font-size:20px;margin:0 0 10px">Hands on every style</h1><div id="mx" style="display:grid;gap:8px;align-items:center;grid-template-columns:110px repeat(${cols.length},240px)"></div>`;
  const mx = document.getElementById("mx")!;
  mx.insertAdjacentHTML("beforeend", "<div></div>" + cols.map(([c]) => `<div style="font-size:11px;font-weight:700;color:#6b6878;text-align:center">${c}</div>`).join(""));
  STYLES.forEach((st, i) => {
    mx.insertAdjacentHTML("beforeend", `<div style="font-weight:700;font-size:12px">${st.name}</div>`);
    for (const [, s, t] of cols) { const el = document.createElement("div"); el.style.width = "240px"; mx.append(el); createAvatar(el, arts[i], { static: true, state: s, seed: "a" + i, motion }).simulate(t); }
  });
}
function reactSheet() {
  const names = Object.keys(REACTIONS);
  const mx = grid("Reactions on every style", names);
  STYLES.forEach((st, i) => { mx.insertAdjacentHTML("beforeend", `<div style="font-weight:700;font-size:12px">${st.name}</div>`); for (const n of names) tile(mx, arts[i], "idle", 0.9, "r" + i, (a) => { a.simulate(0.5); a.react(n); }); });
}
