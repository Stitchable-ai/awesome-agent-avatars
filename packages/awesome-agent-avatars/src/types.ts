// Public types. Three contracts meet here:
//   StyleArt     – what a style hands the engine (art + a few hints)
//   AvatarStyle  – an editable style: fields for an editor, defaults, render(options) -> StyleArt
//   MotionPack   – states and keyframe clips (plain data)

/** Face names every style is asked for. A style may omit any but `neutral`; the engine falls back. */
export type FaceName =
  | "neutral" | "happy" | "laughing" | "calm" | "focused" | "surprised" | "sad" | "sleepy"
  | "squinted" | "angry" | "confused" | "scared" | "wink" | "dizzy" | "love" | "shy" | "talk";

/** Where worn props sit, as fractions (0..1) of the art box. Measured from tagged parts when omitted. */
export interface Anchors {
  /** face centre x */ cx: number;
  /** eye line y */ ey: number;
  /** head width */ hw: number;
  /** top of the head (incl. hair) */ crown: number;
  /** mouth y */ my: number;
  /** chin y */ chin: number;
  /** chest y (held props) */ chest?: number;
  /** shoulder (inside the clothes) and the clothes' right edge */ sx?: number; sy?: number; br?: number;
}

/** Everything the engine needs from a style. Faces are HTML/SVG strings. */
export interface StyleArt {
  id: string;
  /** "parts": eyes/mouth/... are tagged `.sa-<part>` and move independently. "picture": one image. */
  tier: "parts" | "picture";
  faces: Partial<Record<FaceName, string>> & { neutral: string };
  /** Parallax depth per tagged part, in px on a 200 px stage (eyes ~ 4-10). */
  parallax?: Record<string, number>;
  /** "px": parallax values are CSS px of the part's own SVG (scaled by stage size). */
  partUnits?: "stage" | "px";
  /** Faces whose art already shows closed eyes (lids are not applied on top). */
  closedFaces?: FaceName[];
  anchors?: Anchors;
  anchorAdjust?: Partial<Anchors>;
  /** CSS selector for the head/face part used to measure anchors. */
  faceSelector?: string;
  /** Skin and sleeve colours for app-drawn hands. */
  skin?: string;
  sleeve?: string;
  /** Scale clip rotations for flat art (a flat card reads badly past ~15°). */
  rot?: { yaw?: number; pitch?: number; roll?: number; x?: number };
  /** Head tilt toward the pointer, degrees per unit. */
  tilt?: { x?: number; y?: number };
  /** Scale hop height. */
  lift?: number;
  /** A head-and-shoulders picture: anchored below the frame so tilts never show the cut. */
  bust?: boolean;
  /** What the art shows below the face, which decides how it waves:
   *  "bust" (head and shoulders; default when `bust` is set): a forearm rises from below the frame;
   *  "head" (a head, face or blob with no neck or body; the default otherwise): a hand only,
   *  floating beside the face the way emoji hold theirs. Never an arm. */
  body?: "bust" | "head";
  /** Override how the arm appears: "forearm", "hand" or "none". Half-body pictures that already
   *  have arms at their sides get "none": adding a raised arm reads as a third arm. */
  arm?: "forearm" | "hand" | "none" | "floating" | "attached";
  /** Hand images for picture styles (same art style as the picture): waving and raised to ask. */
  hands?: { wave?: string; raise?: string };
  /** The art's line, so app-drawn limbs match it (width in a 1000-unit art box). */
  outline?: { color: string; width: number };
}

export interface Credit {
  author: string;
  authorUrl?: string;
  source?: string;
  sourceUrl?: string;
  license: string;
  licenseUrl?: string;
}

/** An editor field. Values are plain JSON so a recipe can be saved anywhere. */
export type Field =
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; group?: string }
  | { key: string; label: string; type: "color"; swatches: string[]; group?: string }
  | { key: string; label: string; type: "toggle"; group?: string }
  | { key: string; label: string; type: "text"; placeholder?: string; group?: string };

export type StyleOptions = Record<string, string | number | boolean>;

/** An avatar style that an editor can customise. */
export interface AvatarStyle<O extends StyleOptions = StyleOptions> {
  id: string;
  name: string;
  tier: "parts" | "picture";
  credit: Credit;
  /** Editor schema (identity only: hair, skin, clothes…; expressions belong to the engine). */
  fields: Field[];
  defaults(seed?: string): O;
  render(options: O): StyleArt | Promise<StyleArt>;
}

/** A saved avatar: which style and which options. Store it anywhere (JSON). */
export interface AvatarRecipe { v: 1; style: string; options: StyleOptions; name?: string }

// ---------------- motion ----------------
export type Ease = "io" | "in" | "out" | "lin" | [number, number, number, number];
export type Key<V> = [number, V] | [number, V, Ease];
export interface Pose { x: number; y: number; pitch: number; yaw: number; roll: number; sx: number; sy: number; zoom: number; gx: number; gy: number; lid: number }
export interface Clip {
  dur: number;
  tracks?: {
    pos?: Key<[number, number]>[];
    rot?: Key<[number, number, number]>[];
    sq?: Key<[number, number]>[];
    zoom?: Key<number>[];
    gaze?: Key<[number, number]>[];
    lid?: Key<number>[];
    /** face changes; "blink" triggers a blink; null returns to the state's face */
    face?: [number, string | null][];
  };
  /** procedural layer: x/y/pitch/yaw/roll/gx/gy/lid add, sx/sy/zoom multiply */
  fn?: (t: number, avatar: { cursorAt(t: number): { x: number; y: number } }) => Partial<Pose>;
  /** breathing amount (default 1) */
  breath?: number;
  /** do not scale rotations by the style's `rot` (e.g. a full turn) */
  noScale?: boolean;
  /** "hold": stay on the last frame instead of looping */
  end?: "hold";
}
export type PokeName = "spin" | "bounce" | "hop" | "nod" | "wiggle" | "shake" | "jolt";
export interface StateRecipe {
  group: string;
  clips: string[];
  /** gentler clips used under 56 px */
  compact?: string[];
  face: FaceName;
  /** props drawn beside the avatar */
  prop?: string | string[];
  /** props worn on the avatar */
  wear?: string[];
  /** hand-off: after `hold` seconds, or after the clips play once when `hold` is omitted */
  next?: string;
  hold?: number;
  pokes?: (PokeName | [PokeName, { turns?: number }])[];
  dim?: "sleep" | "off";
  /** pointer-follow weight (0 disables) */
  follow?: number;
  glance?: boolean;
  /** mouth moves (needs a `talk` face) */
  talk?: boolean;
  lid?: number;
  /** the hand waves rather than staying raised */
  wave?: boolean;
  /** [label, what it looks like, a typical trigger] */
  doc?: [string, string, string];
}
export interface MotionPack { clips: Record<string, Clip>; states: Record<string, StateRecipe>; groups: string[] }

export type StateName =
  | "idle" | "listening" | "thinking" | "streaming" | "searching" | "reading" | "working" | "coding" | "running"
  | "computing" | "controlling" | "waiting" | "blocked" | "finished" | "failed" | "sleeping" | "waking" | "unavailable"
  | "happy" | "excited" | "laughing" | "proud" | "curious" | "playful" | "shy" | "surprised" | "suspicious" | "angry"
  | "confused" | "sad" | "drowsy" | "bored" | "scared" | "celebrate" | "approving"
  | "orbit" | "radar" | "progress" | "spawning" | "loading" | "dictating" | "sending" | "receiving" | "uploading"
  | "writing" | "alerting" | "bouncing" | "powering-down"
  | "waving" | "making" | "delegating" | "milestone" | "humming" | "notifying" | "dragging"
  | "intro" | "showcase" | "turntable";

export type ReactionName = "happy" | "laughing" | "surprised" | "sad" | "angry" | "confused" | "scared" | "wink" | "love" | "sleepy" | "shy";
export type LookDirection = "left" | "right" | "up" | "down" | "center";

export interface AvatarOptions {
  /** initial state (default "idle") */
  state?: StateName | (string & {});
  /** seed for the per-avatar randomness (clip order, blinks, glances) */
  seed?: string;
  motion?: MotionPack;
  /**
   * Built-in pointer behaviour. true (default) = hover gaze, click hop, double-click spin,
   * drag, rub to make it shy, five quick clicks to annoy it. false = none (drive it yourself).
   */
  interactions?: boolean | Partial<InteractionOptions>;
  /** idle → bored → asleep, in seconds. false disables. Default { bored: 45 } (bored → asleep is the motion pack's hold). */
  autoSleep?: false | { bored: number };
  /** "auto" (default) follows prefers-reduced-motion */
  reducedMotion?: boolean | "auto";
  /** inject the stylesheet once (default true). Set false and import awesome-agent-avatars/styles.css under a strict CSP. */
  injectStyles?: boolean;
  /** render one frame and never animate (thumbnails, screenshots) */
  static?: boolean;
  onState?: (state: string) => void;
}
export interface InteractionOptions {
  /** "hover": follow when the pointer is over/near it; "page": follow anywhere (lighter); "none" */
  follow: "hover" | "page" | "none";
  /** how far (in avatar widths) the pointer still pulls the gaze */
  reach: number;
  click: boolean;
  doubleClick: boolean;
  drag: boolean;
  pet: boolean;
  annoy: boolean;
}

/** The live avatar. */
export interface BotAvatar {
  readonly root: HTMLElement;
  readonly state: string;
  setState(state: StateName | (string & {}), opts?: { quiet?: boolean }): void;
  react(reaction: ReactionName | (string & {}), seconds?: number): void;
  poke(name: PokeName, params?: { turns?: number }): void;
  look(direction: LookDirection, seconds?: number): void;
  /** show a face for a while without motion */
  moment(face: FaceName, seconds?: number): void;
  /** pin a face until cleared with null */
  holdFace(face: FaceName | null): void;
  /** pointer position relative to the avatar (-1..1, y up) and how much to follow it (0..1) */
  setPointer(x: number, y: number, weight: number): void;
  grab(x: number, y: number): void;
  dragTo(x: number, y: number): void;
  release(): void;
  /** count as user attention: wakes a sleeping avatar */
  attend(): void;
  setGlow(on: boolean): void;
  setReducedMotion(on: boolean): void;
  /** hot-swap the art (another style or edited options) without losing the state */
  setArt(art: StyleArt): void;
  /** show a prop for a while */
  flash(prop: string, seconds?: number): void;
  /** advance by hand (tests, thumbnails) */
  simulate(seconds: number): void;
  destroy(): void;
}
