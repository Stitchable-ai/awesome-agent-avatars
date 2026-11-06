// Type-level tests for the authoring entry, compiled through the published exports like consumer.tsx.
import { applyEdit, carryTraits, composeStyle, deriveStyle, describeStyle, fillGradient, lintStyle, sanitizeArt, renderStill, resolveColor, checkRecipe, styleFromSpec, TRAITS, WEARABLES, RECIPE_SCHEMA } from "awesome-agent-avatars/author";
import type { EditPatch, EditResult, StyleDescription, StyleSpecFile, LintIssue, ComposeLayer } from "awesome-agent-avatars/author";
import type { AvatarRecipe, AvatarStyle, TraitName, TraitMap } from "awesome-agent-avatars";
import { createAvatar } from "awesome-agent-avatars";
import { micah } from "awesome-agent-avatars/styles/micah";
import { avataaars } from "awesome-agent-avatars/styles/avataaars";
import { gaze } from "awesome-agent-avatars/styles/gaze";

const patch: EditPatch = { traits: { hairColor: "blue", hat: "cap", glasses: "none" }, fields: { shirtColor: "#dc2626" }, wear: ["cap"] };
const result: EditResult = applyEdit(micah, micah.defaults(), patch, { styles: [micah, avataaars, gaze], palette: { "brand purple": "#7C3AED" } });
const names: string[] = result.applied.map((c) => c.label).concat(result.rejected.map((r) => r.reason));
// @ts-expect-error traits are a closed vocabulary
applyEdit(micah, micah.defaults(), { traits: { hairLength: "long" } });

const d: StyleDescription = describeStyle(avataaars);
const t: TraitName | undefined = (Object.keys(TRAITS) as TraitName[])[0];
const map: TraitMap = { hairColor: "hairColor" };
const carried: TraitName[] = carryTraits(micah, result.options, avataaars).carried;

const themed: AvatarStyle = deriveStyle(gaze, { id: "gradient", name: "Gradient", drop: ["bodyColor"], art: (a) => fillGradient(a, "#7c3aee", ["#7C3AED", "#EC4899"]) });
const layer: ComposeLayer = { from: avataaars, part: "top", field: "topVariant", key: "hat", fit: "crown", hides: ["hair"], trait: "hat" };
// @ts-expect-error fit is one of crown | eyes | face
const badLayer: ComposeLayer = { from: avataaars, part: "top", field: "topVariant", fit: "chin" };
const hats: AvatarStyle = composeStyle({ id: "micah-hats", name: "Micah with hats", base: micah, layers: [layer] });
const spec: StyleSpecFile = { kind: "derive", id: "sunset", name: "Sunset", from: "gaze", gradient: { replace: "#7c3aee", stops: ["#f97316", "#ec4899"] } };
const fromSpec: AvatarStyle = styleFromSpec(spec, (id) => [micah, gaze].find((s) => s.id === id));

async function checks(el: HTMLElement): Promise<void> {
  const issues: LintIssue[] = await lintStyle(hats);
  const svg: string = await renderStill(themed, undefined, "happy");
  const recipe: AvatarRecipe = { v: 1, style: "micah", options: result.options, wear: result.wear };
  const ok: boolean = checkRecipe(recipe, micah).ok;
  const avatar = createAvatar(el, sanitizeArt(await micah.render(micah.defaults())), { wear: recipe.wear });
  avatar.setWear(["beanie"]);
  const worn: readonly string[] = avatar.wear;
  void [issues, svg, ok, worn];
}
const color: string | null = resolveColor("dark blue");
const wearable: string[] = Object.keys(WEARABLES);
const schemaTitle: string = RECIPE_SCHEMA.title;
void [names, d, t, map, carried, badLayer, fromSpec, checks, color, wearable, schemaTitle];
