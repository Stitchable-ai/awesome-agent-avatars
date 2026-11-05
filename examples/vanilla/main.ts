// No framework: the same code runs in a browser tab, a Tauri v2 webview or an Electron renderer.
import { createAvatar, agentPresence } from "awesome-agent-avatars";
import type { AvatarStyle } from "awesome-agent-avatars";
import { micah } from "awesome-agent-avatars/styles/micah";
import { gaze } from "awesome-agent-avatars/styles/gaze";

const styles: AvatarStyle<any>[] = [micah, gaze];
const arts = await Promise.all(styles.map((s) => s.render(s.defaults())));
const avatar = createAvatar(document.getElementById("bot")!, arts[0], { state: "waving" });
const bot = agentPresence(avatar);

for (const s of ["idle", "thinking", "working", "streaming", "blocked", "finished", "sleeping"]) {
  const b = document.createElement("button"); b.textContent = s; b.onclick = () => avatar.setState(s);
  document.getElementById("states")!.append(b);
}
const ask = document.getElementById("ask") as HTMLInputElement;
ask.oninput = () => bot.typing();
ask.onkeydown = async (e) => {
  if (e.key !== "Enter") return;
  ask.value = ""; bot.sent();
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await wait(1200); bot.thinking(); await wait(2000); bot.tool("web_search"); await wait(2000);
  bot.streaming(); await wait(2500); bot.done();
};
let i = 0;
document.getElementById("swap")!.onclick = () => avatar.setArt(arts[(i = (i + 1) % arts.length)]);
