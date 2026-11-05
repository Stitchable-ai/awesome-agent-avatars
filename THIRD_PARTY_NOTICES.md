# Third-party notices

The `awesome-agent-avatars` package contains no third-party art. Its style modules import art from the packages below (optional peer dependencies the app installs) or load it from the original source at runtime. The demo images in `media/` and the website show that art; each item keeps its own licence.

| Work | Creator | Licence | How it is used |
|---|---|---|---|
| [DiceBear](https://github.com/dicebear/dicebear) (`@dicebear/core`) | Florian Körner and contributors | MIT | peer dependency; renders DiceBear styles |
| [DiceBear styles](https://github.com/dicebear/styles) (`@dicebear/styles`) | various, per style | per style, see below | peer dependency; style definitions |
| Micah: remix of “[Avatar Illustration System](https://www.figma.com/community/file/829741575478342595)” | [Micah Lanier](https://dribbble.com/micahlanier) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `awesome-agent-avatars/styles/micah`. **Attribution required**: “Remix of ‘Avatar Illustration System’ by Micah Lanier, licensed under CC BY 4.0.” |
| Avataaars: remix of “[Avataaars](https://avataaars.com/)” | [Pablo Stanley](https://twitter.com/pablostanley) | [Free for personal and commercial use](https://avataaars.com/) | `awesome-agent-avatars/styles/avataaars` |
| Gaze | [DiceBear](https://www.dicebear.com) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `awesome-agent-avatars/styles/gaze` |
| [react-nice-avatar](https://github.com/dapi-labs/react-nice-avatar) | Dapi (dapi-labs) | MIT | peer dependency; `awesome-agent-avatars/styles/nice` |
| [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | Microsoft | MIT | `awesome-agent-avatars/styles/fluent` loads images from jsDelivr at a pinned commit (or your own `baseUrl`) |

Development and website tooling (not shipped in the package): Vite, esbuild, React, React DOM, TypeScript, Playwright, each under its own licence.

If you are a creator listed here and want anything changed, please open an issue.
