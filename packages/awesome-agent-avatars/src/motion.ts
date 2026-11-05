// The default motion pack: plain data, no DOM. A pack maps each agent state to
// keyframe clips, a face, props and an optional automatic hand-off.
//
// Units: x/y in px on a 200 px stage (y down); rot = [pitch, yaw, roll] in degrees
// (pitch + looks up, yaw + looks to the viewer's right, roll + leans clockwise);
// sq = [scaleX, scaleY]; gaze = eye direction -1..1 (y + up); lid 0 open .. 1 shut.
// A key's ease shapes the segment that ends at that key.
import type { BuiltinStateName, Clip, MotionPack, StateRecipe } from "./types.js";

/** Every state in the default pack, in the order the docs list them. `BuiltinStateName` is derived from it. */
export const STATE_NAMES = [
  "idle", "listening", "thinking", "streaming", "searching", "reading", "working", "coding", "running",
  "computing", "controlling", "waiting", "blocked", "finished", "failed", "sleeping", "waking", "unavailable",
  "happy", "excited", "laughing", "proud", "curious", "playful", "shy", "surprised", "suspicious", "angry",
  "confused", "sad", "drowsy", "bored", "scared", "celebrate", "approving",
  "orbit", "radar", "progress", "spawning", "loading", "dictating", "sending", "receiving", "uploading",
  "writing", "alerting", "bouncing", "powering-down",
  "waving", "making", "delegating", "milestone", "humming", "notifying", "dragging",
  "intro", "showcase", "turntable",
] as const;

const R = (p: number, y: number, r: number): [number, number, number] => [p, y, r];
const C: Record<string, Clip> = {};
const PI2 = Math.PI * 2;

// ---------- idle ----------
C.idleA = { dur: 6, tracks: {
  rot: [[0, R(0, 0, 0)], [1.4, R(1, 7, 1.2)], [2.6, R(1, 7, 1.2)], [3.6, R(0, 0, 0)], [4.6, R(0, -6, -1)], [5.4, R(0, -6, -1)], [6, R(0, 0, 0)]],
  gaze: [[0, [0, 0]], [1.3, [0.55, 0.05]], [2.7, [0.55, 0.05]], [3.5, [0, 0]], [4.5, [-0.5, 0]], [5.5, [-0.5, 0]], [6, [0, 0]]],
  face: [[3.1, "blink"]] } };
C.idleB = { dur: 4, tracks: { rot: [[0, R(0, 0, 0)], [2, R(0, 0, 1.2)], [4, R(0, 0, 0)]], pos: [[0, [0, 0]], [2, [0, -0.8]], [4, [0, 0]]] } };
C.idleC = { dur: 6, tracks: {
  rot: [[0, R(0, 0, 0)], [1.5, R(6, -3, -2)], [3.2, R(6, -3, -2)], [4.2, R(0, 0, 0)], [6, R(0, 0, 0)]],
  gaze: [[0, [0, 0]], [1.4, [-0.25, 0.6]], [3.3, [-0.25, 0.6]], [4.2, [0, 0]]],
  face: [[3.6, "blink"], [3.86, "blink"]] } };
C.idleD = { dur: 5, tracks: {
  pos: [[0, [0, 0]], [1.2, [3, 0]], [2.6, [3, 0]], [3.8, [-2, 0]], [5, [0, 0]]],
  rot: [[0, R(0, 0, 0)], [1.2, R(0, 2, 2.5)], [2.6, R(0, 2, 2.5)], [3.8, R(0, -2, -2)], [5, R(0, 0, 0)]] } };

// ---------- conversation ----------
C.listenA = { dur: 3.2, tracks: {
  rot: [[0, R(-4, 0, 3)], [0.5, R(-4, 0, 3)], [0.85, R(-10, 0, 3), "out"], [1.2, R(-4, 0, 3)], [2.0, R(-4, 0, 3)], [2.35, R(-10, 0, 3), "out"], [2.7, R(-4, 0, 3)], [3.2, R(-4, 0, 3)]],
  zoom: [[0, 1.03]], gaze: [[0, [0, 0.05]]] } };
C.listenB = { dur: 4, tracks: {
  rot: [[0, R(-4, 0, 3)], [1.2, R(-3, 4, 6)], [2.8, R(-3, 4, 6)], [4, R(-4, 0, 3)]], zoom: [[0, 1.03]],
  gaze: [[0, [0, 0.05]], [1.2, [0.15, 0.05]], [2.8, [0.15, 0.05]], [4, [0, 0.05]]] } };
const THINK = R(7, -5, -4);
C.thinkA = { dur: 4, tracks: { rot: [[0, THINK], [2, R(8, -7, -5)], [4, THINK]], pos: [[0, [0, -1]]],
  gaze: [[0, [-0.55, 0.65]], [1.2, [-0.4, 0.72]], [2.6, [-0.62, 0.6]], [4, [-0.55, 0.65]]] } };
C.thinkB = { dur: 4.6, tracks: { rot: [[0, THINK], [0.9, R(6, 6, 3)], [2.4, R(6, 6, 3)], [3.4, THINK], [4.6, THINK]], pos: [[0, [0, -1]]],
  gaze: [[0, [-0.55, 0.65]], [0.8, [0.5, 0.6]], [2.4, [0.5, 0.6]], [3.3, [-0.55, 0.65]], [4.6, [-0.55, 0.65]]] } };
C.streamA = { dur: 2.6, tracks: {
  rot: [[0, R(0, 0, 0)], [0.6, R(-2, 5, 1.5)], [1.3, R(1, -3, -1)], [2, R(-3, 4, 1)], [2.6, R(0, 0, 0)]],
  pos: [[0, [0, 0]], [0.3, [0, -1.2]], [0.6, [0, 0]], [1.0, [0, -1]], [1.4, [0, 0]], [2.0, [0, -1.2]], [2.6, [0, 0]]] } };
C.streamB = { dur: 2.6, tracks: { rot: [[0, R(0, 0, 0)], [0.7, R(2, -2, 0)], [0.95, R(-8, 0, 0), "out"], [1.3, R(0, 0, 0)], [2.6, R(0, 0, 0)]], face: [[0.6, "surprised"], [1.4, null]] } };
C.streamC = { dur: 2.4, tracks: { rot: [[0, R(0, 0, 0)], [1.2, R(-1, -7, -2)], [2.4, R(0, 0, 0)]], gaze: [[0, [0, 0]], [1.2, [-0.35, 0]], [2.4, [0, 0]]], face: [[0.2, "focused"], [2.0, null]] } };
C.searchA = { dur: 3.6, tracks: {
  rot: [[0, R(2, 0, 0)], [0.9, R(2, -10, -2)], [1.8, R(2, -10, -2)], [2.7, R(2, 10, 2)], [3.6, R(2, 0, 0)]],
  gaze: [[0, [0, 0.2]], [0.9, [-0.75, 0.2]], [1.8, [-0.75, 0.2]], [2.7, [0.75, 0.2]], [3.6, [0, 0.2]]] } };
// the page is held low on the left: the head turns to it and the eyes read across it
C.readA = { dur: 4.2, tracks: { rot: [[0, R(-8, -7, -2)]], zoom: [[0, 1.02]],
  gaze: [[0, [-0.95, -0.45]], [1.1, [-0.2, -0.45], "lin"], [1.25, [-0.95, -0.58]], [2.35, [-0.2, -0.58], "lin"], [2.5, [-0.95, -0.7]], [3.6, [-0.2, -0.7], "lin"], [4.2, [-0.95, -0.45]]] } };

// ---------- busy ----------
const DESK = R(-6, 0, 0);
const typing = (t: number) => ({ y: 0.9 * Math.abs(Math.sin(PI2 * t / 0.42)), gx: 0.35 * Math.sin(PI2 * t / 1.9) });
C.workA = { dur: 6.5, fn: (t) => (t > 4.6 && t < 5.7 ? {} : typing(t)), tracks: {
  rot: [[0, DESK], [4.6, DESK], [4.9, R(1, 3, 0)], [5.5, R(1, 3, 0)], [5.8, DESK], [6.5, DESK]],
  gaze: [[0, [0, -0.7]], [4.6, [0, -0.7]], [4.85, [0.12, 0.05]], [5.5, [0.12, 0.05]], [5.8, [0, -0.7]]] } };
C.workB = { dur: 4.8, fn: (t) => (t < 0.8 || t > 3.6 ? typing(t) : {}), tracks: {
  rot: [[0, DESK], [0.8, DESK], [1.4, R(-10, 0, 0)], [3.2, R(-10, 0, 0)], [3.8, DESK], [4.8, DESK]],
  zoom: [[0, 1], [0.8, 1], [1.4, 1.05], [3.2, 1.05], [3.8, 1]],
  gaze: [[0, [0, -0.7]], [1.4, [0.1, -0.6]], [3.2, [0.1, -0.6]], [3.8, [0, -0.7]]],
  face: [[1.3, "focused"], [2.5, "surprised"], [3.1, null]] } };
C.workC = { dur: 6, fn: (t) => ({ ...typing(t), roll: 2.5 * Math.sin(PI2 * t / 1.0) }), tracks: { rot: [[0, DESK]], gaze: [[0, [0, -0.7]]] } };
C.workD = { dur: 5, fn: (t) => (t < 0.7 || t > 3.3 ? typing(t) : {}), tracks: {
  rot: [[0, DESK], [0.7, DESK], [1.2, R(5, 7, 3)], [2.7, R(5, 7, 3)], [3.3, DESK], [5, DESK]],
  gaze: [[0, [0, -0.7]], [1.2, [0.5, 0.55]], [2.7, [0.5, 0.55]], [3.3, [0, -0.7]]] } };
// computer use: the eyes follow the app-drawn cursor (see the engine's cursorAt)
C.watchA = { dur: 6, fn: (t, a) => { const c = a.cursorAt(t); return { gx: c.x * 0.9, gy: -c.y * 0.9, yaw: 6 * c.x, pitch: -3 - 3 * c.y }; } };
C.makeA = { dur: 3.2, tracks: {
  rot: [[0, R(-5, 0, 0)], [0.8, R(-5, 3, 3)], [1.6, R(-5, 0, 0)], [2.4, R(-5, -3, -3)], [3.2, R(-5, 0, 0)]],
  pos: [[0, [0, 0]], [0.8, [0, -1.5]], [1.6, [0, 0]], [2.4, [0, -1.5]], [3.2, [0, 0]]], gaze: [[0, [0, -0.55]]] } };
C.watchHelpers = { dur: 4.4, tracks: {
  rot: [[0, R(-3, -9, -2)], [1.2, R(-3, -9, -2)], [1.6, R(-3, 9, 2)], [2.8, R(-3, 9, 2)], [3.2, R(-2, 0, 0)], [4.4, R(-3, -9, -2)]],
  gaze: [[0, [-0.75, -0.3]], [1.2, [-0.75, -0.3]], [1.5, [0.75, -0.3]], [2.8, [0.75, -0.3]], [3.1, [0, -0.15]], [4.0, [0, -0.15]], [4.4, [-0.75, -0.3]]] } };
C.waitA = { dur: 4.4, tracks: {
  rot: [[0, R(0, 0, 0)], [1.1, R(0, 3, 5)], [2.2, R(0, 0, 0)], [3.3, R(0, -3, -5)], [4.4, R(0, 0, 0)]],
  gaze: [[0, [0, 0.2]], [1.1, [0.4, 0.35]], [2.2, [0, 0.2]], [3.3, [-0.4, 0.35]], [4.4, [0, 0.2]]] } };
C.blockedA = { dur: 3, tracks: {
  rot: [[0, R(2, 0, 7)], [0.25, R(5, 0, 7), "out"], [0.6, R(2, 0, 7)], [3, R(2, 0, 7)]],
  pos: [[0, [0, 0]], [0.25, [0, -3], "out"], [0.6, [0, 0], "in"], [3, [0, 0]]], gaze: [[0, [0, 0.05]]] } };

// ---------- outcomes ----------
C.doneA = { dur: 2.2, tracks: {
  pos: [[0, [0, 0]], [0.15, [0, 2]], [0.42, [0, -10], "out"], [0.7, [0, 0], "in"], [0.95, [0, -4], "out"], [1.2, [0, 0], "in"], [2.2, [0, 0]]],
  sq: [[0, [1, 1]], [0.15, [1.06, 0.92]], [0.3, [0.95, 1.07]], [0.6, [1, 1]], [0.72, [1.05, 0.94]], [0.85, [1, 1]], [1.22, [1.03, 0.97]], [1.4, [1, 1]]],
  rot: [[0, R(0, 0, 0)], [0.42, R(5, 0, -4)], [0.95, R(4, 0, 4)], [1.5, R(0, 0, 0)]] } };
C.doneB = { dur: 1.8, tracks: {
  sq: [[0, [1, 1]], [0.2, [1.07, 0.93]], [0.45, [0.96, 1.05]], [0.7, [1, 1]], [0.9, [1.05, 0.95]], [1.1, [0.98, 1.02]], [1.4, [1, 1]]],
  rot: [[0, R(0, 0, 0)], [0.45, R(4, 0, 3)], [1.1, R(3, 0, -3)], [1.8, R(0, 0, 0)]] } };
const DROOP = R(-8, 0, -3);
C.droopA = { dur: 3.2, tracks: { rot: [[0, DROOP], [1.6, R(-10, -3, -4)], [3.2, DROOP]], pos: [[0, [0, 4]]],
  sq: [[0, [1.01, 0.975]], [1.4, [1.02, 0.955]], [2.0, [1.01, 0.975]]], gaze: [[0, [0.1, -0.5]], [1.6, [-0.2, -0.55]], [3.2, [0.1, -0.5]]] } };
const SLEEP = R(-6, 0, 5);
C.sleepA = { dur: 4.4, breath: 2.2, tracks: { rot: [[0, SLEEP], [2.2, R(-7, 0, 5.5)], [4.4, SLEEP]], pos: [[0, [0, 4]]], lid: [[0, 1]], gaze: [[0, [0, -0.25]]] } };
C.offA = { dur: 4.4, breath: 0, tracks: { rot: [[0, SLEEP]], pos: [[0, [0, 4]]], lid: [[0, 1]] } };
C.wakeA = { dur: 1.6, tracks: {
  pos: [[0, [0, 4]], [0.4, [0, -3], "out"], [1.6, [0, 0]]],
  sq: [[0, [1, 1]], [0.4, [0.96, 1.07]], [0.9, [0.96, 1.07]], [1.25, [1.02, 0.98]], [1.6, [1, 1]]],
  rot: [[0, SLEEP], [0.4, R(7, 0, -3)], [0.9, R(7, 0, 3)], [1.6, R(0, 0, 0)]], lid: [[0, 1], [0.35, 0.15], [1.6, 0]] } };

// ---------- reactions ----------
C.happyA = { dur: 1.8, tracks: {
  pos: [[0, [0, 0]], [0.2, [0, -7], "out"], [0.4, [0, 0], "in"], [0.6, [0, -4], "out"], [0.8, [0, 0], "in"], [1.8, [0, 0]]],
  sq: [[0, [1, 1]], [0.4, [1.05, 0.95]], [0.5, [1, 1]], [0.8, [1.03, 0.97]], [0.9, [1, 1]]],
  rot: [[0, R(0, 0, 0)], [0.2, R(3, 0, -4)], [0.6, R(3, 0, 4)], [1.0, R(0, 0, 0)]] } };
C.excitedA = { dur: 1.2, tracks: {
  pos: [[0, [0, 0]], [0.15, [0, -6], "out"], [0.3, [0, 0], "in"], [0.45, [0, -6], "out"], [0.6, [0, 0], "in"], [0.75, [0, -6], "out"], [0.9, [0, 0], "in"], [1.05, [0, -6], "out"], [1.2, [0, 0], "in"]],
  rot: [[0, R(3, 0, 0)], [0.3, R(3, 0, -6)], [0.6, R(3, 0, 6)], [0.9, R(3, 0, -6)], [1.2, R(3, 0, 0)]], zoom: [[0, 1.03]] } };
C.laughA = { dur: 1.4, fn: (t) => ({ y: -1.4 * Math.abs(Math.sin(PI2 * t / 0.18)), sy: 1 + 0.02 * Math.sin(PI2 * t / 0.18) }), tracks: { rot: [[0, R(7, 0, 0)], [0.7, R(8, 0, -2)], [1.4, R(7, 0, 0)]] } };
C.proudA = { dur: 3, tracks: { rot: [[0, R(9, 0, 0)], [1.6, R(9, 0, 0)], [1.85, R(4, 0, 0), "out"], [2.2, R(9, 0, 0)], [3, R(9, 0, 0)]], pos: [[0, [0, -2]]], sq: [[0, [1.01, 1.03]]], gaze: [[0, [0, 0.25]]] } };
C.curiousA = { dur: 3.6, tracks: { rot: [[0, R(-4, 8, 11)], [1.4, R(-5, 9, 14)], [2.4, R(-5, 9, 14)], [3.6, R(-4, 8, 11)]], zoom: [[0, 1.03]], gaze: [[0, [0.45, 0.1]], [1.8, [0.3, 0.15]], [3.6, [0.45, 0.1]]] } };
C.playfulA = { dur: 2, tracks: {
  pos: [[0, [0, 0]], [0.25, [6, -3]], [0.5, [0, 0]], [0.75, [-6, -3]], [1, [0, 0]], [1.25, [6, -3]], [1.5, [0, 0]], [1.75, [-6, -3]], [2, [0, 0]]],
  rot: [[0, R(0, 0, 0)], [0.25, R(2, 6, 7)], [0.5, R(0, 0, 0)], [0.75, R(2, -6, -7)], [1, R(0, 0, 0)], [1.25, R(2, 6, 7)], [1.5, R(0, 0, 0)], [1.75, R(2, -6, -7)], [2, R(0, 0, 0)]] } };
C.shyA = { dur: 3.2, tracks: {
  rot: [[0, R(-6, -12, -6)], [1.4, R(-6, -12, -6)], [1.7, R(-3, -3, -3)], [2.3, R(-3, -3, -3)], [2.6, R(-6, -12, -6)], [3.2, R(-6, -12, -6)]],
  pos: [[0, [-3, 1]]], gaze: [[0, [-0.5, -0.45]], [1.4, [-0.5, -0.45]], [1.65, [0.15, 0]], [2.35, [0.15, 0]], [2.6, [-0.5, -0.45]]] } };
C.suspiciousA = { dur: 4.4, tracks: {
  rot: [[0, R(-3, 0, 0)], [0.6, R(-3, -6, -2)], [1.9, R(-3, -6, -2)], [2.5, R(-3, 6, 2)], [3.8, R(-3, 6, 2)], [4.4, R(-3, 0, 0)]],
  pos: [[0, [0, 0]], [0.6, [-2, 0]], [1.9, [-2, 0]], [2.5, [2, 0]], [3.8, [2, 0]], [4.4, [0, 0]]],
  gaze: [[0, [0, 0]], [0.5, [-0.85, 0]], [1.9, [-0.85, 0]], [2.4, [0.85, 0]], [3.8, [0.85, 0]], [4.4, [0, 0]]] } };
C.angryA = { dur: 1.6, fn: (t) => (t < 0.6 ? { roll: 3 * Math.sin(PI2 * t / 0.12) * (1 - t / 0.6) } : {}), tracks: { rot: [[0, R(-5, 0, 0)]], pos: [[0, [0, 1]]], sq: [[0, [1.025, 0.975]]], gaze: [[0, [0, 0.05]]] } };
C.confusedA = { dur: 3.2, tracks: {
  rot: [[0, R(0, 3, 10)], [1.2, R(0, 3, 10)], [1.6, R(0, -3, -10)], [2.8, R(0, -3, -10)], [3.2, R(0, 3, 10)]],
  gaze: [[0, [0.3, 0.3]], [1.2, [0.3, 0.3]], [1.6, [-0.3, 0.3]], [2.8, [-0.3, 0.3]], [3.2, [0.3, 0.3]]] } };
C.drowsyA = { dur: 3.2, tracks: {
  lid: [[0, 0.5], [1.8, 0.9], [2.1, 0.96], [2.3, 0.25, "out"], [3.2, 0.5]],
  rot: [[0, R(-2, 0, 2)], [1.8, R(-10, 0, 4)], [2.1, R(-13, 0, 4)], [2.3, R(1, 0, 0), "out"], [3.2, R(-2, 0, 2)]],
  pos: [[0, [0, 2]], [2.1, [0, 4]], [2.3, [0, -1], "out"], [3.2, [0, 2]]] } };
C.boredA = { dur: 5, tracks: { rot: [[0, R(-3, 0, -4)], [2.5, R(-2, 0, 3)], [5, R(-3, 0, -4)]], lid: [[0, 0.38]],
  sq: [[0, [1, 1]], [1.8, [1, 1]], [2.2, [1.02, 0.955]], [2.9, [1, 1]]], gaze: [[0, [-0.4, 0.3]], [2.5, [0.3, 0.35]], [5, [-0.4, 0.3]]] } };
C.scaredA = { dur: 1.2, fn: (t) => ({ x: 0.9 * Math.sin(PI2 * t / 0.07), roll: 0.8 * Math.sin(PI2 * t / 0.09) }), tracks: { rot: [[0, R(-4, 0, 0)]], pos: [[0, [0, 3]]], sq: [[0, [1.02, 0.96]]] } };
C.celebrateA = { dur: 2.4, tracks: {
  pos: [[0, [0, 0]], [0.3, [0, -8], "out"], [0.6, [0, 0], "in"], [0.9, [0, -8], "out"], [1.2, [0, 0], "in"], [2.4, [0, 0]]],
  rot: [[0, R(6, 0, 0)], [0.3, R(8, 0, -6)], [0.9, R(8, 0, 6)], [1.4, R(6, 0, 0)], [2.4, R(6, 0, 0)]], sq: [[0, [1, 1.02]]] } };
C.approveA = { dur: 1.6, tracks: { rot: [[0, R(0, 0, 0)], [0.2, R(-11, 0, 0), "out"], [0.42, R(1, 0, 0)], [0.64, R(-11, 0, 0), "out"], [0.9, R(0, 0, 0)], [1.6, R(0, 0, 0)]] } };

// ---------- indicators ----------
C.sendA = { dur: 1.6, tracks: { rot: [[0, R(0, 0, 0)], [0.3, R(-7, 4, 2), "out"], [0.8, R(3, 6, 2)], [1.6, R(0, 0, 0)]], pos: [[0, [0, 0]], [0.3, [2, -2]], [1.6, [0, 0]]], gaze: [[0, [0, 0]], [0.5, [0.7, 0.6]], [1.3, [0.7, 0.6]], [1.6, [0, 0]]] } };
C.receiveA = { dur: 1.8, tracks: { rot: [[0, R(0, 0, 0)], [0.35, R(6, 0, 0), "out"], [1.2, R(-5, 6, 0)], [1.8, R(0, 0, 0)]], gaze: [[0, [0.6, 0.6]], [0.5, [0.5, 0.3]], [1.2, [0.6, -0.4]], [1.8, [0, 0]]] } };
C.writeA = { dur: 3, fn: (t) => ({ gx: -0.25 + 0.4 * ((t % 1.5) / 1.5), gy: -0.6 + 0.05 * Math.sin(PI2 * t / 0.3) }), tracks: { rot: [[0, R(-8, -4, -3)]] } };
C.ballA = { dur: 1.4, fn: (t) => { const b = Math.abs(Math.sin(Math.PI * t / 0.7)); return { y: -3 * (1 - b) * (1 - b), gy: 0.25 + 0.6 * b, pitch: 2 + 6 * b }; } };
C.powerA = { dur: 2.2, end: "hold", tracks: { pos: [[0, [0, 0]], [2.2, [0, 6]]], rot: [[0, R(0, 0, 0)], [2.2, R(-9, 0, 3)]], lid: [[0, 0], [1.2, 0.4], [2.2, 1]], sq: [[0, [1, 1]], [2.2, [1.01, 0.97]]] } };
C.alertA = { dur: 2, tracks: { rot: [[0, R(0, 0, 0)], [0.12, R(8, 0, 0), "out"], [0.6, R(3, 0, 0)], [2, R(3, 0, 0)]], pos: [[0, [0, 0]], [0.12, [0, -4], "out"], [0.6, [0, -1]], [2, [0, -1]]], gaze: [[0, [0, 0.05]]] } };

// ---------- moments & showcase ----------
C.humA = { dur: 3.2, tracks: {
  rot: [[0, R(2, 0, -4)], [0.8, R(3, 0, 4)], [1.6, R(2, 0, -4)], [2.4, R(3, 0, 4)], [3.2, R(2, 0, -4)]],
  pos: [[0, [0, 0]], [0.4, [0, -1.5]], [0.8, [0, 0]], [1.2, [0, -1.5]], [1.6, [0, 0]], [2.0, [0, -1.5]], [2.4, [0, 0]], [2.8, [0, -1.5]], [3.2, [0, 0]]],
  gaze: [[0, [-0.2, 0.4]], [1.6, [0.2, 0.4]], [3.2, [-0.2, 0.4]]] } };
C.notifyA = { dur: 2.4, tracks: { pos: [[0, [0, 0]], [0.15, [0, -6], "out"], [0.35, [0, 0], "in"], [2.4, [0, 0]]], sq: [[0, [1, 1]], [0.35, [1.06, 0.94]], [0.5, [1, 1]]],
  rot: [[0, R(0, 0, 0)], [0.15, R(6, 0, 0)], [0.6, R(3, 6, 2)], [2.4, R(0, 0, 0)]], gaze: [[0.5, [0.6, 0.6]], [1.8, [0.6, 0.6]], [2.4, [0, 0]]] } };
C.dangleA = { dur: 3, tracks: { rot: [[0, R(4, 0, 0)]], gaze: [[0, [0, -0.6]], [1.5, [0, -0.5]], [3, [0, -0.6]]], sq: [[0, [0.98, 1.04]]] } };
C.introA = { dur: 4, tracks: { rot: [[0, R(0, 0, 0)], [0.8, R(4, 0, 0)], [4, R(4, 0, 0)]], zoom: [[0, 1], [0.8, 1.05], [4, 1.05]], gaze: [[0, [0, 0.05]]] } };
C.showcaseA = { dur: 8, tracks: {
  rot: [[0, R(0, -16, -3)], [1.6, R(0, -16, -3)], [2.2, R(6, 0, 0)], [3.8, R(6, 0, 0)], [4.4, R(0, 16, 3)], [6, R(0, 16, 3)], [6.6, R(-3, 0, 6)], [7.6, R(-3, 0, 6)], [8, R(0, -16, -3)]],
  gaze: [[0, [0.35, 0]], [1.6, [0.35, 0]], [2.2, [0, 0.2]], [3.8, [0, 0.2]], [4.4, [-0.35, 0]], [6, [-0.35, 0]], [6.6, [0, 0]], [8, [0.35, 0]]],
  face: [[0, "happy"], [2.2, null], [4.4, "calm"], [6.6, "wink"], [7.6, "happy"]] } };
C.turntableA = { dur: 10, breath: 0, noScale: true, fn: (t) => ({ yaw: 360 * t / 10 }) };
C.waveA = { dur: 2.6, tracks: { rot: [[0, R(2, 4, 5)], [1.3, R(3, 5, 7)], [2.6, R(2, 4, 5)]], pos: [[0, [-2, 0]]], gaze: [[0, [0, 0.05]]] } };
C.capeA = { dur: 3, tracks: { rot: [[0, R(9, 0, 0)], [1.5, R(10, 0, 2)], [3, R(9, 0, 0)]], pos: [[0, [0, -3]]], sq: [[0, [1.02, 1.04]]], gaze: [[0, [0, 0.3]]] } };

const WORK = ["workA", "workB", "workC", "workD"];
const S = {} as Record<BuiltinStateName, StateRecipe>;
// doc: [label, what it looks like, a typical agent event that triggers it]
const st = (id: BuiltinStateName, group: string, rec: Omit<StateRecipe, "group" | "doc">, doc: [string, string, string]) => { S[id] = { group, ...rec, doc }; };

// Lifecycle: what the agent is doing
st("idle", "Lifecycle", { clips: ["idleB", "idleA", "idleB", "idleC", "idleD"], compact: ["idleB"], face: "neutral", glance: true }, ["Idle", "breathes, glances around, blinks (sometimes twice)", "nothing running"]);
st("listening", "Lifecycle", { clips: ["listenA", "listenB"], face: "calm", prop: "ear" }, ["Listening", "leans in, nods, head tilted", "the user is typing"]);
st("thinking", "Lifecycle", { clips: ["thinkA", "thinkB"], face: "focused", prop: "dots" }, ["Thinking", "eyes up and away, thought dots", "reasoning tokens streaming"]);
st("streaming", "Lifecycle", { clips: ["streamA", "streamB", "streamC"], face: "neutral", talk: true, prop: "lines" }, ["Streaming", "talks: mouth moves, explaining gestures", "answer text streaming"]);
st("searching", "Lifecycle", { clips: ["searchA"], face: "focused", prop: "radar" }, ["Searching", "scans left and right, radar ping", "web or file search tool"]);
st("reading", "Lifecycle", { clips: ["readA"], face: "focused", prop: "doc" }, ["Reading", "turns to a page and reads along the lines", "read/fetch/get tool"]);
st("working", "Lifecycle", { clips: WORK, face: "focused", prop: "laptop", wear: ["headphones"] }, ["Working", "headphones on, types at a laptop, glances up", "any long-running tool"]);
st("coding", "Lifecycle", { clips: WORK, face: "focused", prop: ["laptop", "code"] }, ["Coding", "types, code brackets rise beside it", "write/edit/patch tool"]);
st("running", "Lifecycle", { clips: WORK, face: "focused", prop: ["laptop", "term"] }, ["Running", "types, a terminal prompt blinks", "shell/exec tool"]);
st("computing", "Lifecycle", { clips: ["workB", "workD"], face: "focused", prop: ["laptop", "gears"] }, ["Computing", "leans in to the screen, gears turn", "local model or heavy job"]);
st("controlling", "Lifecycle", { clips: ["watchA"], face: "focused", prop: "cursor" }, ["Controlling", "its eyes follow its own cursor", "computer-use / browser tool"]);
st("waiting", "Lifecycle", { clips: ["waitA"], face: "neutral", prop: "orbit" }, ["Waiting", "sways, dots orbit its head", "waiting on a sub-agent or remote job"]);
st("blocked", "Lifecycle", { clips: ["blockedA"], face: "neutral", prop: "ask", wear: ["hand"], next: "drowsy", hold: 120 }, ["Needs you", "raises a hand, ? bubble; drowsy after 2 min", "approval or question for the user"]);
st("finished", "Lifecycle", { clips: ["doneB", "doneA"], face: "happy", prop: "sparkle", next: "idle", pokes: [["spin", { turns: 2 }], "bounce"] }, ["Finished", "double spin and bounce, sparkles, then idle", "turn completed"]);
st("failed", "Lifecycle", { clips: ["droopA"], face: "sad", prop: "oops", next: "idle", hold: 6 }, ["Failed", "droops and sighs; idle after 6 s", "error or cancelled turn"]);
st("sleeping", "Lifecycle", { clips: ["sleepA"], face: "sleepy", prop: "zzz", dim: "sleep", follow: 0 }, ["Sleeping", "eyes shut, slow breathing, zzz", "no activity for a while"]);
st("waking", "Lifecycle", { clips: ["wakeA"], face: "surprised", next: "idle", hold: 1.6 }, ["Waking", "stretches and yawns, then idle", "user returns"]);
st("unavailable", "Lifecycle", { clips: ["offA"], face: "sleepy", dim: "off", follow: 0 }, ["Unavailable", "grey and asleep", "offline or signed out"]);
// Reactions: how the agent feels
st("happy", "Reactions", { clips: ["happyA", "idleB"], face: "happy" }, ["Happy", "little hops", "user says thanks"]);
st("excited", "Reactions", { clips: ["excitedA"], face: "laughing", prop: "sparkle" }, ["Excited", "fast bounces, sparkles", "big task done"]);
st("laughing", "Reactions", { clips: ["laughA"], face: "laughing" }, ["Laughing", "head back, shakes with laughter", "a joke"]);
st("proud", "Reactions", { clips: ["proudA"], face: "calm", prop: "shine" }, ["Proud", "chin up, a glint", "something shipped"]);
st("curious", "Reactions", { clips: ["curiousA"], face: "focused" }, ["Curious", "head tilt, leans in", "new file or link attached"]);
st("playful", "Reactions", { clips: ["playfulA"], face: "wink" }, ["Playful", "side-to-side dance, wink", "easter egg"]);
st("shy", "Reactions", { clips: ["shyA"], face: "calm", wear: ["blush"] }, ["Shy", "turns away, blushes, peeks back", "complimented"]);
st("surprised", "Reactions", { clips: ["idleB"], face: "surprised", pokes: ["jolt"] }, ["Surprised", "jolts back, eyes wide", "unexpected result"]);
st("suspicious", "Reactions", { clips: ["suspiciousA"], face: "squinted" }, ["Suspicious", "squints, side-eyes left and right", "risky command flagged"]);
st("angry", "Reactions", { clips: ["angryA"], face: "angry", prop: "steam" }, ["Angry", "shakes, steam", "poked too many times"]);
st("confused", "Reactions", { clips: ["confusedA"], face: "confused", prop: "huh" }, ["Confused", "head tilts side to side, ?", "ambiguous request"]);
st("sad", "Reactions", { clips: ["droopA"], face: "sad", prop: "oops" }, ["Sad", "droops, a tear", "something went wrong for the user"]);
st("drowsy", "Reactions", { clips: ["drowsyA"], face: "neutral" }, ["Drowsy", "nods off and jerks awake", "left waiting too long"]);
st("bored", "Reactions", { clips: ["boredA"], face: "neutral", next: "sleeping", hold: 60 }, ["Bored", "heavy lids, sighs, looks around; then sleeps", "idle a while"]);
st("scared", "Reactions", { clips: ["scaredA"], face: "scared", prop: "sweat", pokes: ["jolt"] }, ["Scared", "trembles, sweat drop", "destructive action proposed"]);
st("celebrate", "Reactions", { clips: ["celebrateA"], face: "laughing", prop: ["confetti", "popper"], wear: ["hat"], pokes: [["spin", { turns: 1 }]] }, ["Celebrate", "party hat, poppers, confetti", "first success, milestone"]);
st("approving", "Reactions", { clips: ["approveA"], face: "happy", prop: "check", next: "idle" }, ["Approving", "two nods and a tick, then idle", "the user approves"]);
// Indicators: progress-style activities drawn beside the avatar
st("orbit", "Indicators", { clips: ["waitA"], face: "neutral", prop: "orbit" }, ["Orbit", "dots orbit the head", "checking or polling"]);
st("radar", "Indicators", { clips: ["searchA"], face: "focused", prop: "radar" }, ["Radar", "radar ping", "scanning"]);
st("progress", "Indicators", { clips: ["idleB"], face: "focused", prop: "progress" }, ["Progress", "progress ring fills", "download or render with a percentage"]);
st("spawning", "Indicators", { clips: ["watchHelpers"], face: "happy", prop: "gather" }, ["Spawning", "little copies pop out and gather", "sub-agents launched"]);
st("loading", "Indicators", { clips: ["idleB"], face: "neutral", prop: "spinner" }, ["Loading", "spinner", "loading a project"]);
st("dictating", "Indicators", { clips: ["listenA"], face: "calm", prop: "mic" }, ["Dictating", "listens; a recording badge with live bars beside it", "voice input"]);
st("sending", "Indicators", { clips: ["sendA"], face: "neutral", prop: "send", next: "thinking", hold: 1.6, pokes: ["nod"] }, ["Sending", "nods, a paper plane flies off", "message submitted"]);
st("receiving", "Indicators", { clips: ["receiveA"], face: "surprised", prop: "receive" }, ["Receiving", "an envelope lands beside it", "file dropped in"]);
st("uploading", "Indicators", { clips: ["idleB"], face: "focused", prop: "dock" }, ["Uploading", "an arrow rises into a cloud", "upload"]);
st("writing", "Indicators", { clips: ["writeA"], face: "focused", prop: "pencil" }, ["Writing", "a pencil scribbles, eyes follow", "drafting a document"]);
st("alerting", "Indicators", { clips: ["alertA"], face: "surprised", prop: "bang" }, ["Alerting", "startles, ! badge", "warning"]);
st("bouncing", "Indicators", { clips: ["ballA"], face: "happy", prop: "ball" }, ["Bouncing", "bounces a ball, eyes follow it", "playful idle"]);
st("powering-down", "Indicators", { clips: ["powerA"], face: "sleepy", prop: "standby", dim: "sleep" }, ["Powering down", "sinks, eyes close, standby icon", "restarting or shutting down"]);
// Moments: named moments, several with worn props
st("waving", "Moments", { clips: ["waveA"], face: "happy", wear: ["hand"], wave: true }, ["Waving", "waves hello", "app opens; greeting"]);
st("making", "Moments", { clips: ["makeA"], face: "focused", wear: ["crystal"] }, ["Making", "holds a glowing crystal", "generating an image or video"]);
st("delegating", "Moments", { clips: ["watchHelpers"], face: "neutral", prop: "helpers" }, ["Delegating", "watches little helpers work", "waiting for sub-agents"]);
st("milestone", "Moments", { clips: ["capeA"], face: "happy", wear: ["cape"], prop: "flash", pokes: ["bounce"] }, ["Milestone", "a cape appears in a flash, chin up", "streaks, 10th task"]);
st("humming", "Moments", { clips: ["humA"], face: "calm", prop: "notes" }, ["Humming", "sways to a tune, notes", "background job while the user is elsewhere"]);
st("notifying", "Moments", { clips: ["notifyA"], face: "surprised", prop: "bell" }, ["Notifying", "pops up, a bell with a dot", "a background task finished"]);
st("dragging", "Moments", { clips: ["dangleA"], face: "surprised", follow: 0 }, ["Dragging", "dangles and swings from the pointer", "the user drags the avatar"]);
// Showcase: for previews and editors
st("intro", "Showcase", { clips: ["introA"], face: "happy", prop: "badge", pokes: [["spin", { turns: 1 }]] }, ["Intro", "spins to face you, badge", "splash or about screen"]);
st("showcase", "Showcase", { clips: ["showcaseA"], face: "neutral" }, ["Showcase", "poses: three-quarter left, chin up, right, wink", "style picker preview"]);
st("turntable", "Showcase", { clips: ["turntableA"], face: "neutral", follow: 0 }, ["Turntable", "slow full turn (the back shows as a silhouette)", "avatar editor preview"]);

export const GROUPS = ["Lifecycle", "Reactions", "Indicators", "Moments", "Showcase"] as const;
export const defaultMotion: MotionPack = { clips: C, states: S, groups: [...GROUPS] };

/** Make a new pack from a base: add or override clips and states (shallow per state). */
export function extendMotion(base: MotionPack, patch: { clips?: Record<string, Clip>; states?: Record<string, Partial<StateRecipe>>; groups?: string[] }): MotionPack {
  const states: Record<string, StateRecipe> = { ...base.states };
  for (const [id, rec] of Object.entries(patch.states || {})) states[id] = { ...(states[id] || { clips: ["idleB"], face: "neutral", group: "Custom" }), ...rec } as StateRecipe;
  const groups = [...(patch.groups || base.groups)];
  for (const r of Object.values(states)) if (!groups.includes(r.group)) groups.push(r.group);
  return { clips: { ...base.clips, ...(patch.clips || {}) }, states, groups };
}
