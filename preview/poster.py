"""Render one large poster frame of the dancer."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import render  # noqa: E402
from PIL import Image  # noqa: E402

W, H = 400, 470
BG = (24, 19, 31, 255)


def main():
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    frame = payload["frames"][0]
    render.SCALE = 8
    sprite = render.render_frame(frame["ops"], (payload["w"] * 8, payload["h"] * 8), (0, 0, 0, 0))
    image = Image.new("RGBA", (W, H), BG)
    image.alpha_composite(sprite, ((W - sprite.width) // 2, (H - sprite.height) // 2))
    out = Path(__file__).parent / "hero.png"
    image.convert("RGB").save(out)
    print(f"wrote {out.name} {image.size}")


if __name__ == "__main__":
    main()
