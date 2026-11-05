"""Build an animated preview of the dancer from recorded canvas operations."""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from render import SCALE, render_frame  # noqa: E402


def main():
    source = Path(sys.argv[1])
    payload = json.loads(source.read_text(encoding="utf-8"))
    frames = payload["frames"]
    size = (payload["w"] * SCALE, payload["h"] * SCALE)
    dark = (30, 24, 38, 255)

    images = [render_frame(frame["ops"], size, dark).convert("RGB") for frame in frames]
    out = Path(__file__).parent / "dancer.gif"
    images[0].save(
        out,
        save_all=True,
        append_images=images[1:],
        duration=50,
        loop=0,
        optimize=False,
        disposal=1,
    )
    print(f"wrote {out.name} ({len(images)} frames, {size[0]}x{size[1]})")


if __name__ == "__main__":
    main()
