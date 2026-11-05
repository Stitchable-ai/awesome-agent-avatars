# States

Generated from the default motion pack (`scripts/gen-docs.mjs`). 58 states in 5 groups.
Set one with `avatar.setState(id)` or `<AgentAvatar state={id} />`.

## Lifecycle

| id | Looks like | Typical trigger | Props | Next |
|---|---|---|---|---|
| `idle` | breathes, glances around, blinks (sometimes twice) | nothing running |  |  |
| `listening` | leans in, nods, head tilted | the user is typing | ear |  |
| `thinking` | eyes up and away, thought dots | reasoning tokens streaming | dots |  |
| `streaming` | talks: mouth moves, explaining gestures | answer text streaming | lines |  |
| `searching` | scans left and right, radar ping | web or file search tool | radar |  |
| `reading` | turns to a page and reads along the lines | read/fetch/get tool | doc |  |
| `working` | headphones on, types at a laptop, glances up | any long-running tool | laptop, headphones |  |
| `coding` | types, code brackets rise beside it | write/edit/patch tool | laptop, code |  |
| `running` | types, a terminal prompt blinks | shell/exec tool | laptop, term |  |
| `computing` | leans in to the screen, gears turn | local model or heavy job | laptop, gears |  |
| `controlling` | its eyes follow its own cursor | computer-use / browser tool | cursor |  |
| `waiting` | sways, dots orbit its head | waiting on a sub-agent or remote job | orbit |  |
| `blocked` | raises a hand, ? bubble; drowsy after 2 min | approval or question for the user | ask, hand | drowsy after 120 s |
| `finished` | double spin and bounce, sparkles, then idle | turn completed | sparkle | idle after its clips |
| `failed` | droops and sighs; idle after 6 s | error or cancelled turn | oops | idle after 6 s |
| `sleeping` | eyes shut, slow breathing, zzz | no activity for a while | zzz |  |
| `waking` | stretches and yawns, then idle | user returns |  | idle after 1.6 s |
| `unavailable` | grey and asleep | offline or signed out |  |  |

## Reactions

| id | Looks like | Typical trigger | Props | Next |
|---|---|---|---|---|
| `happy` | little hops | user says thanks |  |  |
| `excited` | fast bounces, sparkles | big task done | sparkle |  |
| `laughing` | head back, shakes with laughter | a joke |  |  |
| `proud` | chin up, a glint | something shipped | shine |  |
| `curious` | head tilt, leans in | new file or link attached |  |  |
| `playful` | side-to-side dance, wink | easter egg |  |  |
| `shy` | turns away, blushes, peeks back | complimented | blush |  |
| `surprised` | jolts back, eyes wide | unexpected result |  |  |
| `suspicious` | squints, side-eyes left and right | risky command flagged |  |  |
| `angry` | shakes, steam | poked too many times | steam |  |
| `confused` | head tilts side to side, ? | ambiguous request | huh |  |
| `sad` | droops, a tear | something went wrong for the user | oops |  |
| `drowsy` | nods off and jerks awake | left waiting too long |  |  |
| `bored` | heavy lids, sighs, looks around; then sleeps | idle a while |  | sleeping after 60 s |
| `scared` | trembles, sweat drop | destructive action proposed | sweat |  |
| `celebrate` | party hat, poppers, confetti | first success, milestone | confetti, popper, hat |  |
| `approving` | two nods and a tick, then idle | the user approves | check | idle after its clips |

## Indicators

| id | Looks like | Typical trigger | Props | Next |
|---|---|---|---|---|
| `orbit` | dots orbit the head | checking or polling | orbit |  |
| `radar` | radar ping | scanning | radar |  |
| `progress` | progress ring fills | download or render with a percentage | progress |  |
| `spawning` | little copies pop out and gather | sub-agents launched | gather |  |
| `loading` | spinner | loading a project | spinner |  |
| `dictating` | listens; a recording badge with live bars beside it | voice input | mic |  |
| `sending` | nods, a paper plane flies off | message submitted | send | thinking after 1.6 s |
| `receiving` | an envelope lands beside it | file dropped in | receive |  |
| `uploading` | an arrow rises into a cloud | upload | dock |  |
| `writing` | a pencil scribbles, eyes follow | drafting a document | pencil |  |
| `alerting` | startles, ! badge | warning | bang |  |
| `bouncing` | bounces a ball, eyes follow it | playful idle | ball |  |
| `powering-down` | sinks, eyes close, standby icon | restarting or shutting down | standby |  |

## Moments

| id | Looks like | Typical trigger | Props | Next |
|---|---|---|---|---|
| `waving` | waves hello | app opens; greeting | hand |  |
| `making` | holds a glowing crystal | generating an image or video | crystal |  |
| `delegating` | watches little helpers work | waiting for sub-agents | helpers |  |
| `milestone` | a cape appears in a flash, chin up | streaks, 10th task | flash, cape |  |
| `humming` | sways to a tune, notes | background job while the user is elsewhere | notes |  |
| `notifying` | pops up, a bell with a dot | a background task finished | bell |  |
| `dragging` | dangles and swings from the pointer | the user drags the avatar |  |  |

## Showcase

| id | Looks like | Typical trigger | Props | Next |
|---|---|---|---|---|
| `intro` | spins to face you, badge | splash or about screen | badge |  |
| `showcase` | poses: three-quarter left, chin up, right, wink | style picker preview |  |  |
| `turntable` | slow full turn (the back shows as a silhouette) | avatar editor preview |  |  |

## Reactions

Short moments layered over any state: `avatar.react(name)`. Each sets a face (with fallbacks), a body pose, lids, props and pokes, so it reads on every style.

| Reaction | Props | Pokes |
|---|---|---|
| `happy` | sparkle | bounce |
| `laughing` | sparkle |  |
| `surprised` | bang | jolt |
| `sad` | oops |  |
| `angry` | steam | shake |
| `confused` | huh |  |
| `scared` | sweat | jolt |
| `wink` | sparkle | wiggle |
| `love` | hearts, blush |  |
| `sleepy` | zzz |  |
| `shy` | blush, hearts | wiggle |
