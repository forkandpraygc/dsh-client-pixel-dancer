# dsh-client-pixel-dancer

[![License: MIT](https://img.shields.io/badge/license-MIT-2ea44f)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-client%20plugin-4f7cff)](#installation)

A tiny pixel girl who dances in the bottom-right corner of the DeepSeek Harness
web client: she bounces to the beat, sways her hips, raises her arms in turn,
taps her feet, and is surrounded by floating stars and music notes.

![Dance](preview/dancer.gif)

Everything is drawn in code on a `<canvas>`: no images, dependencies, or network
requests. The overlay is pointer-transparent and never gets in the way of the UI.

## Features

- a 40×46 sprite at 3× scale (120×138 CSS px), crisp on both light and dark themes;
- a continuous dance: beat-synced hops, hip sway, arm waves, steps, and swinging
  twin tails;
- twinkling stars and rising music notes around her;
- `prefers-reduced-motion` support: a static pose instead of the animation;
- the `requestAnimationFrame` loop stops with the plugin, and DPR is capped.

## Requirements

- DeepSeek Harness Desktop (web client) with the `desktop` profile;
- nothing else: this is a regular DSH client package with no build step.

## Installation

1. Clone this repository or download and unpack the archive.
2. Put the package into your profile.

**Windows (PowerShell):**

```powershell
$src  = "C:\path\to\dsh-client-pixel-dancer"
$dest = "$env:USERPROFILE\.dsh\profiles\desktop\packages\dsh-client-pixel-dancer"
New-Item -ItemType Directory -Force -Path "$dest\lib" | Out-Null
Copy-Item "$src\package.json" $dest -Force
Copy-Item "$src\lib\index.js" "$dest\lib" -Force
Copy-Item "$src\lib\client.js" "$dest\lib" -Force
```

**macOS / Linux:**

```bash
dest="$HOME/.dsh/profiles/desktop/packages/dsh-client-pixel-dancer"
mkdir -p "$dest/lib"
cp package.json "$dest/"
cp lib/index.js lib/client.js "$dest/lib/"
```

3. Add an entry to `cordis.patch.yml` in the same profile
   (`%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` on Windows):

```yaml
- insert:
    - id: pixel-dancer
      name: './packages/dsh-client-pixel-dancer/lib/index.js'
```

4. The profile reloads live. If the window does not pick the plugin up, press
   `Ctrl+R` in the Harness window or restart the app.

If your profile is not named `desktop`, adjust the directory in the paths.

## Verifying

After installation the dancing girl appears in the bottom-right corner.
Client-plugin load errors show up in the client console and in the DSH logs; a
broken plugin does not stop the rest of the UI.

## Configuration

Everything lives in `lib/client.js`:

- **position and size** — `right`, `bottom` on the wrapper and the `PIXEL` constant;
- **tempo** — the `Math.sin(...)` coefficients in `drawScene`;
- **looks** — the `HAIR`, `HOODIE`, `SKIRT` palettes and the `paintHead`,
  `paintArm`, `paintLeg`, `paintTail` helpers;
- **decorations** — the `twinkle` (stars) and `note` blocks at the end of
  `drawScene`; remove them if you want a quieter scene.

## How it works

The package declares `dsh.client` in `package.json` (`platform: "web"`, an empty
`external` list) and exports the browser bundle as `./client`. The bundle
registers itself in the `shell.overlay` slot under the id `pixel-dancer` and
paints a single fixed-size `<canvas>`. The host half (`lib/index.js`) is empty:
the Loader only needs a row to mount.

The plugin never talks to the model, makes no network requests, and keeps no
state.

## Development

```bash
node preview/check.mjs
```

A browser-free check: the bundle registers under the right id, `apply()` takes
the `shell.overlay` slot, the component renders a canvas, and `drawScene()` stays
inside the grid and never throws across 40 frames.

The previews in `preview/` are generated from the real `drawScene()` by
`render.py`, `animate.py`, and `poster.py` (Python 3, Pillow, and numpy required):

```bash
node preview/render.mjs preview/frames.json 0 0.125 0.25 0.375 0.5 0.625 0.75 0.875
python preview/render.py preview/frames.json 4
python preview/animate.py preview/anim.json
```

## Uninstall

Remove the `pixel-dancer` entry from `cordis.patch.yml` and delete the
`packages/dsh-client-pixel-dancer` directory.

## License

[MIT](LICENSE). This project is not affiliated with DeepSeek; "DeepSeek Harness"
is a DeepSeek product. The plugin only uses the public client-plugin API.
