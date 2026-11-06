// Custom state names get autocomplete through module augmentation; a plain string still works
// everywhere (see consumer.tsx). This augmentation is visible to the whole type-test program.
import type { StateName } from "awesome-agent-avatars";

declare module "awesome-agent-avatars" {
  interface CustomStateNames { party: true; "deep-thought": true }
}

export const mine: StateName[] = ["party", "deep-thought", "idle"];
// @ts-expect-error neither built in nor declared above
export const notMine: StateName = "disco";
