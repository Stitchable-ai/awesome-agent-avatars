import "./site.css";
import { createAvatar, defaultMotion, agentPresence } from "awesome-agent-avatars";
import type { BotAvatar } from "awesome-agent-avatars";
import { STYLES, renderDefaults, esc } from "./shared";

const arts = await renderDefaults();
const $ = (id: string) => document.getElementById(id) as HTMLElement;

// ---- hero: all five styles, one engine ----
const hero = $("hero"), avs: BotAvatar[] = [];
STYLES.forEach((s, i) => {
  const box = document.createElement("div"); box.innerHTML = `<div></div><div class="label">${esc(s.name)}</div>`; hero.append(box);
  avs.push(createAvatar(box.firstElementChild as HTMLElement, arts[i], { seed: "h" + i, state: i === 0 ? "waving" : "idle" }));
});
setTimeout(() => avs[0].setState("idle"), 2600);
const presence = agentPresence(avs);
const cap = $("cap");
let timer: ReturnType<typeof setTimeout> | undefined;
const play = (steps: [string, number, string][]) => {
  clearTimeout(timer);
  const next = (i: number) => { if (i >= steps.length) return; const [s, ms, t] = steps[i]; presence.set(s); cap.innerHTML = t; if (ms) timer = setTimeout(() => next(i + 1), ms); };
  next(0);
};
$("ask").addEventListener("input", () => { presence.typing(); cap.innerHTML = "<b>Listening</b>: you are typing"; });
$("ask").addEventListener("keydown", (e) => {
  if ((e as KeyboardEvent).key !== "Enter") return; (e.target as HTMLInputElement).value = "";
  play([["sending", 1100, "<b>Sending</b>"], ["thinking", 2200, "<b>Thinking</b>"], ["searching", 2000, "<b>Searching</b> (web_search)"], ["coding", 2400, "<b>Coding</b> (edit_file)"], ["streaming", 2600, "<b>Streaming</b>: it talks"], ["finished", 3800, "<b>Finished</b>"], ["idle", 0, "Hover them, click, double-click, drag, or rub back and forth."]]);
});
$("need").onclick = () => play([["blocked", 0, "<b>Needs you</b>: hand up, ? bubble (drowsy after 2 minutes)"]]);
$("party").onclick = () => play([["celebrate", 3200, "<b>Celebrate</b>: party hat, poppers, confetti"], ["idle", 0, ""]]);

// ---- one avatar, any state, any style (hot-swap keeps the state) ----
const solo = createAvatar($("solo"), arts[0], { seed: "solo", state: "showcase" });
const soloCap = $("solo-cap");
const S = defaultMotion.states;
const describe = (s: string) => { soloCap.innerHTML = `<b>${S[s].doc![0]}</b>: ${S[s].doc![1]}. <span style="color:#a29fb0">Trigger: ${S[s].doc![2]}.</span>`; };
describe("showcase");
const styleRow = $("solo-styles");
STYLES.forEach((s, i) => { const b = document.createElement("button"); b.className = "chip" + (i === 0 ? " on" : ""); b.textContent = s.name; b.onclick = () => { solo.setArt(arts[i]); styleRow.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }; styleRow.append(b); });
const chips = $("chips");
for (const g of defaultMotion.groups) {
  chips.insertAdjacentHTML("beforeend", `<div class="grp">${g}</div>`);
  for (const [id, rec] of Object.entries(S)) if (rec.group === g) {
    const b = document.createElement("button"); b.className = "chip"; b.textContent = rec.doc![0];
    b.onclick = () => { solo.setState(id); describe(id); chips.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); };
    chips.append(b);
  }
}

// ---- code ----
const hl = (code: string) => esc(code)
  .replace(/(\/\/[^\n]*)/g, '<span class="c">$1</span>')
  .replace(/(&quot;[^&]*?&quot;)/g, '<span class="s">$1</span>')
  .replace(/\b(import|from|export|const|await|return|function|new)\b/g, '<span class="k">$1</span>');
const TABS: [string, string][] = [
  ["Plain DOM · Tauri · Electron", `import { createAvatar } from "awesome-agent-avatars";
import { micah } from "awesome-agent-avatars/styles/micah";
import { gaze } from "awesome-agent-avatars/styles/gaze";

const art = await micah.render(micah.defaults());       // or a saved recipe's options
const avatar = createAvatar(document.querySelector("#bot"), art);

avatar.setState("thinking");      // any of the 58 states
avatar.react("happy");            // a short reaction over any state
avatar.look("left");              // turn the head
avatar.setArt(await gaze.render(gaze.defaults()));  // hot-swap the style, keep the state`],
  ["React", `import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { micah } from "awesome-agent-avatars/styles/micah";

export function Bot({ state }: { state: string }) {
  const art = useStyleArt(micah);                       // or useStyleArt(micah, savedOptions)
  return <AgentAvatar art={art} state={state} size={160} />;
}`],
  ["Next.js", `// app/components/bot.tsx: awesome-agent-avatars/react already ships "use client"
import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { gaze } from "awesome-agent-avatars/styles/gaze";

export default function Bot({ state }: { state: string }) {
  const art = useStyleArt(gaze);
  return <AgentAvatar art={art} state={state} size={120} />;
}
// The server renders an empty, sized box; the engine starts after hydration.`],
  ["Remix / React Router", `// Same component as React. Nothing runs on the server, so no ClientOnly wrapper is needed.
import { AgentAvatar, useStyleArt } from "awesome-agent-avatars/react";
import { avataaars } from "awesome-agent-avatars/styles/avataaars";

export default function Route() {
  const art = useStyleArt(avataaars);
  return <AgentAvatar art={art} state="listening" size={140} />;
}`],
  ["Strict CSP", `// The stylesheet is injected once by default. Under a strict CSP, ship it as a file:
import "awesome-agent-avatars/styles.css";
import { createAvatar } from "awesome-agent-avatars";

createAvatar(el, art, { injectStyles: false });`],
];
const tabs = $("tabs"), code = $("code");
TABS.forEach(([name, src], i) => { const b = document.createElement("button"); b.textContent = name; b.onclick = () => { code.innerHTML = hl(src); tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }; tabs.append(b); if (i === 0) b.click(); });
$("code-presence").innerHTML = hl(`import { agentPresence } from "awesome-agent-avatars";

const bot = agentPresence(avatar);           // one avatar, an array, or a callback
composer.addEventListener("input", () => bot.typing());   // listening, then idle after a pause
onSubmit(() => bot.sent());                  // nods, paper plane, then thinking
agent.on("reasoning", () => bot.thinking());
agent.on("tool_call", (call) => bot.tool(call.name));     // web_search → searching, bash → running …
agent.on("text_delta", () => bot.streaming());           // it talks
agent.on("approval_required", () => bot.needsInput());   // hand up; drowsy after 2 minutes
agent.on("done", () => bot.done());          // double spin, sparkles, then idle
agent.on("error", () => bot.error());`);
$("code-style").innerHTML = hl(`import { pictureStyle } from "awesome-agent-avatars";
import { dicebearStyle, variantField } from "awesome-agent-avatars/dicebear";
import lorelei from "@dicebear/styles/lorelei.json";

// Any picture: tilts, hops, sleeps, wears props, plays every state.
export const mascot = pictureStyle({ id: "mascot", name: "Our mascot", src: "/mascot.png",
  credit: { author: "Our design team", license: "Proprietary" } });

// Any DiceBear style: parts are tagged automatically, so eyes and mouth move.
export const loreleiStyle = dicebearStyle({
  id: "lorelei", name: "Lorelei", definition: lorelei,
  fields: [variantField(lorelei, "hair", "Hair"), variantField(lorelei, "glasses", "Glasses", { optional: true })],
  defaults: () => ({ seed: "Ada", hairVariant: "variant05", glassesVariant: "none" }),
  faces: { neutral: { mouthVariant: "happy01" }, happy: { mouthVariant: "happy08" }, sad: { mouthVariant: "sad03" }, talk: { mouthVariant: "happy05" } },
  art: { parallax: { eyes: 6, eyebrows: 4, mouth: 3, hair: 1 } },
});`);
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((b) => (b.onclick = async () => { await navigator.clipboard.writeText(b.dataset.copy!); b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1200); }));

// ---- credits ----
const CREDITS: [string, string, string, string, string][] = [
  ["DiceBear", "Florian Körner and contributors", "MIT (library); each style has its own licence", "https://www.dicebear.com", "The avatar library whose data-only style definitions let us tag eyes, brows and mouths in any style without forking the art."],
  ["Micah", "Micah Lanier", "CC BY 4.0", "https://www.figma.com/community/file/829741575478342595", "Remix of the “Avatar Illustration System”. Attribution required: keep this credit."],
  ["Avataaars", "Pablo Stanley", "Free for personal and commercial use", "https://avataaars.com/", "The playful illustration system that half the internet's avatars come from."],
  ["Gaze", "DiceBear", "CC0 1.0", "https://www.dicebear.com/styles/gaze", "A friendly blob with very expressive eyes."],
  ["react-nice-avatar", "Dapi (dapi-labs)", "MIT", "https://github.com/dapi-labs/react-nice-avatar", "Layered SVG avatars for React."],
  ["Fluent Emoji", "Microsoft", "MIT", "https://github.com/microsoft/fluentui-emoji", "Familiar, friendly 3D emoji; used here as a picture style."],
];
$("credits").innerHTML = CREDITS.map(([n, who, lic, url, txt]) => `<div class="credit"><b><a href="${url}">${n}</a></b><small>by ${esc(who)}</small><span class="lic">${esc(lic)}</span><p style="margin-top:6px">${esc(txt)}</p></div>`).join("")
  + `<div class="credit"><b>Built with</b><small>tools we rely on</small><p><a href="https://vite.dev">Vite</a>, <a href="https://esbuild.github.io">esbuild</a>, <a href="https://react.dev">React</a>, <a href="https://www.typescriptlang.org">TypeScript</a>, <a href="https://playwright.dev">Playwright</a>.</p></div>`;
