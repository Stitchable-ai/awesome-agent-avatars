// Regenerates docs/states.md and the skill's state reference from the motion pack.
import { copyFileSync, writeFileSync } from "node:fs";
import { defaultMotion, REACTIONS } from "../packages/awesome-agent-avatars/dist/index.js";

const root = new URL("..", import.meta.url).pathname;
const S = defaultMotion.states;
let md = `# States\n\nGenerated from the default motion pack (\`scripts/gen-docs.mjs\`). ${Object.keys(S).length} states in ${defaultMotion.groups.length} groups.\nSet one with \`avatar.setState(id)\` or \`<AgentAvatar state={id} />\`.\n`;
for (const g of defaultMotion.groups) {
  md += `\n## ${g}\n\n| id | Looks like | Typical trigger | Props | Next |\n|---|---|---|---|---|\n`;
  for (const [id, r] of Object.entries(S)) if (r.group === g) {
    const props = [].concat(r.prop || [], r.wear || []).join(", ");
    const next = r.next ? `${r.next}${r.hold != null ? ` after ${r.hold} s` : " after its clips"}` : "";
    md += `| \`${id}\` | ${r.doc[1]} | ${r.doc[2]} | ${props} | ${next} |\n`;
  }
}
md += `\n## Reactions\n\nShort moments layered over any state: \`avatar.react(name)\`. Each sets a face (with fallbacks), a body pose, lids, props and pokes, so it reads on every style.\n\n| Reaction | Props | Pokes |\n|---|---|---|\n`;
for (const [n, r] of Object.entries(REACTIONS)) md += `| \`${n}\` | ${(r.props || []).join(", ")} | ${(r.pokes || []).join(", ")} |\n`;
writeFileSync(root + "docs/states.md", md);
writeFileSync(root + "skills/awesome-agent-avatars/references/states.md", md);
for (const f of ["styles.md", "motion.md", "frameworks.md"]) copyFileSync(root + "docs/" + f, root + "skills/awesome-agent-avatars/references/" + f);
console.log("wrote docs/states.md and the skill references");
