// The five styles the site shows, and helpers shared by its pages.
import { micah } from "bot-styles/styles/micah";
import { avataaars } from "bot-styles/styles/avataaars";
import { gaze } from "bot-styles/styles/gaze";
import { nice } from "bot-styles/styles/nice";
import { fluent } from "bot-styles/styles/fluent";
import type { AvatarStyle, StyleArt } from "bot-styles";

export const STYLES: AvatarStyle<any>[] = [micah, avataaars, nice, gaze, fluent];
export const CAPS: Record<string, [string, boolean][]> = {
  micah: [["eyes follow you", true], ["blinks", true], ["13 faces", true], ["talks", true]],
  avataaars: [["eyes follow you", true], ["blinks", true], ["16 faces", true], ["talks", true]],
  nice: [["eyes follow you", true], ["blinks", true], ["7 faces", true], ["talks", true]],
  gaze: [["eyes follow you", true], ["blinks", true], ["12 eye shapes", true], ["no mouth", false]],
  fluent: [["tilts toward you", true], ["any picture", true], ["no blink", false], ["1 face", false]],
};
export async function renderDefaults(): Promise<StyleArt[]> { return Promise.all(STYLES.map((s) => s.render(s.defaults()))); }
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
