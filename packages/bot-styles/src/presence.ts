// Map an agent's life to avatar states, so wiring an agent takes a few calls:
//   const p = agentPresence(avatar)
//   p.typing(); p.sent(); p.thinking(); p.tool("web_search"); p.streaming(); p.done()
import type { BotAvatar, StateName } from "./types";

type Target = BotAvatar | BotAvatar[] | ((state: string) => void);

/** Guess a state from a tool name (works for most agent frameworks' tool naming). */
export function stateForTool(name: string): StateName {
  const n = name.toLowerCase();
  if (/(computer|browser|click|screenshot|mouse|keyboard|navigate|playwright|desktop)/.test(n)) return "controlling";
  if (/(search|find|grep|lookup|query|retriev|rag)/.test(n)) return "searching";
  if (/(read|fetch|get|open|list|load|view|cat|inspect|download)/.test(n)) return "reading";
  if (/(write|edit|patch|apply|create_file|replace|refactor|code)/.test(n)) return "coding";
  if (/(run|exec|bash|shell|command|terminal|test|build|deploy)/.test(n)) return "running";
  if (/(image|video|audio|generat|render|draw|paint|tts|music)/.test(n)) return "making";
  if (/(upload|publish|post|send_email|send)/.test(n)) return "uploading";
  if (/(agent|delegate|spawn|subagent|task)/.test(n)) return "delegating";
  if (/(transcrib|embed|model|infer|compute|analy)/.test(n)) return "computing";
  return "working";
}

export function agentPresence(target: Target, opts: { typingIdleMs?: number } = {}) {
  const set = (s: string) => {
    if (typeof target === "function") target(s);
    else for (const a of Array.isArray(target) ? target : [target]) a.setState(s);
  };
  const each = (fn: (a: BotAvatar) => void) => { if (typeof target !== "function") for (const a of Array.isArray(target) ? target : [target]) fn(a); };
  let current = "idle", typingTimer: ReturnType<typeof setTimeout> | undefined;
  const go = (s: string) => { current = s; set(s); };
  return {
    get state() { return current; },
    /** the user is typing; returns to idle after a pause */
    typing() {
      if (current === "idle" || current === "listening" || current === "sleeping" || current === "bored") { if (current !== "listening") go("listening"); }
      clearTimeout(typingTimer); typingTimer = setTimeout(() => { if (current === "listening") go("idle"); }, opts.typingIdleMs ?? 1600);
    },
    dictating(on = true) { go(on ? "dictating" : "idle"); },
    sent() { clearTimeout(typingTimer); go("sending"); },
    thinking() { go("thinking"); },
    /** a tool call started; the state is guessed from its name unless you pass one */
    tool(name: string, state?: StateName) { go(state ?? stateForTool(name)); },
    streaming() { go("streaming"); },
    waiting() { go("waiting"); },
    needsInput() { go("blocked"); },
    approved() { go("approving"); },
    done() { go("finished"); },
    error() { go("failed"); },
    idle() { go("idle"); },
    offline() { go("unavailable"); },
    online() { go("waking"); },
    react(name: string) { each((a) => a.react(name)); },
    set: go,
  };
}
