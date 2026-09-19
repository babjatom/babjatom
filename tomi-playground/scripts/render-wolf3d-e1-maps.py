#!/usr/bin/env python3
"""Render Wolfenstein 3D shareware Episode 1 floor maps from wolf3d.jsdos."""

from __future__ import annotations

import struct
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

MAP_W = MAP_H = 64
CELL = 10
NEARTAG = 0xA7
FARTAG = 0xA8

AREATILE = 107
ELEVATORTILE = 21
AMBUSHTILE = 106
DOOR_LO, DOOR_HI = 90, 101
PUSHWALL_OBJ = 98
PLAYER_LO, PLAYER_HI = 19, 22

# Colors
BG = (18, 18, 22)
FLOOR = (42, 44, 52)
WALL = (160, 160, 168)
DOOR = (90, 140, 220)
ELEVATOR = (220, 80, 80)
SECRET = (255, 200, 40)
PLAYER = (80, 220, 120)
GUARD = (196, 140, 72)
OFFICER = (236, 236, 236)
SS = (70, 110, 200)
DOG = (140, 100, 60)
BOSS = (220, 50, 50)
MUTANT = (80, 180, 80)
GHOST = (180, 120, 220)
LEGEND_BG = (28, 28, 34)
TEXT = (220, 220, 226)

DIRS = {
    0: (0, -1),  # north
    1: (1, 0),  # east
    2: (0, 1),  # south
    3: (-1, 0),  # west
}

REPO = Path(__file__).resolve().parents[1]
JSDOS = REPO / "public" / "games" / "wolf3d" / "wolf3d.jsdos"
OUT_DIR = REPO / "scripts" / "out" / "wolf3d-maps"

# Approximate Wolf3D VGA ramps (gamepal is not stored plainly in the shareware
# bundle). Tuned so VSWAP wall chunks decode as grey stone / blue panel / wood.
def _approx_gamepal() -> list[tuple[int, int, int]]:
    pal: list[tuple[int, int, int]] = [(0, 0, 0)] * 256
    pal[1] = (0, 0, 168)
    pal[2] = (0, 168, 168)
    pal[3] = (168, 0, 0)
    pal[4] = (168, 84, 0)
    pal[5] = (168, 168, 0)
    pal[6] = (84, 84, 84)
    for i in range(7, 32):
        v = int(20 + (i - 7) * (200 / 24))
        pal[i] = (v, v, min(255, v + 8))
    for i in range(32, 64):
        t = (i - 32) / 31
        pal[i] = (int(60 + t * 140), int(40 + t * 80), int(25 + t * 40))
    for i in range(64, 96):
        t = (i - 64) / 31
        pal[i] = (int(20 + t * 60), int(50 + t * 140), int(20 + t * 50))
    for i in range(96, 128):
        t = (i - 96) / 31
        pal[i] = (int(40 + t * 80), int(50 + t * 90), int(40 + t * 70))
    for i in range(128, 160):
        t = (i - 128) / 31
        pal[i] = (int(70 + t * 100), int(45 + t * 55), int(20 + t * 30))
    for i in range(160, 192):
        t = (i - 160) / 31
        pal[i] = (int(100 + t * 120), int(20 + t * 40), int(20 + t * 30))
    for i in range(192, 213):
        t = (i - 192) / 20
        pal[i] = (int(140 + t * 80), int(120 + t * 80), int(30 + t * 40))
    for i in range(213, 224):
        t = (i - 213) / 10
        pal[i] = (int(50 + t * 50), int(60 + t * 70), int(110 + t * 100))
    for i in range(224, 243):
        t = (i - 224) / 18
        pal[i] = (int(80 + t * 60), int(100 + t * 80), int(140 + t * 80))
    for i in range(243, 256):
        t = (i - 243) / 12
        pal[i] = (int(130 + t * 80), int(50 + t * 40), int(45 + t * 50))
    return pal


def load_wall_texture_colors() -> dict[int, tuple[int, int, int]]:
    """Map plane-0 wall tile id -> average RGB of its VSWAP wall texture."""
    with zipfile.ZipFile(JSDOS) as zf:
        vswap = zf.read("VSWAP.WL1")
    chunks, sprite_start, _sound_start = struct.unpack_from("<HHH", vswap, 0)
    offsets = [
        struct.unpack_from("<I", vswap, 6 + i * 4)[0] for i in range(chunks)
    ]
    pal = _approx_gamepal()
    colors: dict[int, tuple[int, int, int]] = {}
    # Map tile N uses VSWAP walls (N-1)*2 and (N-1)*2+1; average the even side.
    wall_chunks = sprite_start
    for tile in range(1, 90):
        tex = (tile - 1) * 2
        if tex >= wall_chunks or not offsets[tex]:
            continue
        data = vswap[offsets[tex] : offsets[tex] + 4096]
        if len(data) < 4096:
            continue
        samples = [pal[p] for p in data if p != 0]
        if not samples:
            samples = [pal[p] for p in data]
        n = len(samples)
        colors[tile] = tuple(sum(c[i] for c in samples) // n for i in range(3))  # type: ignore[misc]
    return colors


def carmack_expand(data: bytes, outlen: int) -> bytes:
    out = bytearray()
    i = 0
    while len(out) < outlen and i < len(data):
        if i + 1 >= len(data):
            break
        count = data[i]
        tag = data[i + 1]
        if tag in (NEARTAG, FARTAG) and count:
            if tag == NEARTAG:
                offset = data[i + 2]
                i += 3
                src = len(out) - 2 * offset
            else:
                offset = struct.unpack_from("<H", data, i + 2)[0]
                i += 4
                src = 2 * offset
            for _ in range(count):
                out.extend(out[src : src + 2])
                src += 2
        elif tag in (NEARTAG, FARTAG) and count == 0:
            out.append(data[i + 2])
            out.append(tag)
            i += 3
        else:
            out.extend(data[i : i + 2])
            i += 2
    return bytes(out[:outlen])


def rlew_expand(data: bytes, tag: int, outlen: int) -> bytes:
    out = bytearray()
    i = 0
    while len(out) < outlen and i + 1 < len(data):
        w = struct.unpack_from("<H", data, i)[0]
        i += 2
        if w == tag:
            count, val = struct.unpack_from("<HH", data, i)
            i += 4
            out += struct.pack("<H", val) * count
        else:
            out += struct.pack("<H", w)
    return bytes(out[:outlen])


def expand_plane(blob: bytes, rlew_tag: int) -> list[int]:
    after_carmack = struct.unpack_from("<H", blob, 0)[0]
    c = carmack_expand(blob[2:], after_carmack)
    final = struct.unpack_from("<H", c, 0)[0]
    r = rlew_expand(c[2:], rlew_tag, final)
    if len(r) != final:
        raise RuntimeError(f"RLEW size mismatch: {len(r)} != {final}")
    return [struct.unpack_from("<H", r, i)[0] for i in range(0, final, 2)]


def load_maps() -> list[dict]:
    with zipfile.ZipFile(JSDOS) as zf:
        maphead = zf.read("MAPHEAD.WL1")
        gamemaps = zf.read("GAMEMAPS.WL1")

    rlew_tag = struct.unpack_from("<H", maphead, 0)[0]
    maps: list[dict] = []
    for idx in range(10):
        offset = struct.unpack_from("<i", maphead, 2 + idx * 4)[0]
        if offset <= 0:
            continue
        plane_offs = struct.unpack_from("<iii", gamemaps, offset)
        plane_lens = struct.unpack_from("<HHH", gamemaps, offset + 12)
        width, height = struct.unpack_from("<HH", gamemaps, offset + 18)
        name = gamemaps[offset + 22 : offset + 38].split(b"\0")[0].decode("ascii", "replace")
        walls = expand_plane(
            gamemaps[plane_offs[0] : plane_offs[0] + plane_lens[0]], rlew_tag
        )
        objs = expand_plane(
            gamemaps[plane_offs[1] : plane_offs[1] + plane_lens[1]], rlew_tag
        )
        maps.append(
            {
                "index": idx,
                "name": name,
                "width": width,
                "height": height,
                "walls": walls,
                "objs": objs,
            }
        )
    return maps


def is_floor(wall: int) -> bool:
    return wall == 0 or wall >= AREATILE or wall == AMBUSHTILE


def is_door(wall: int) -> bool:
    return DOOR_LO <= wall <= DOOR_HI


def is_elevator(wall: int) -> bool:
    return wall == ELEVATORTILE


def is_solid_wall(wall: int) -> bool:
    return not (is_floor(wall) or is_door(wall) or is_elevator(wall))


def walkable(wall: int) -> bool:
    return is_floor(wall) or is_door(wall) or is_elevator(wall)


def classify_enemy(tile: int) -> tuple[str, int] | None:
    """Return (kind, dir0to3) for enemy spawn tiles, including all difficulties."""
    # Collapse hard then medium variants onto easy IDs (matches WL_GAME.C ScanInfoPlane).
    t = tile
    if 180 <= t <= 213:
        t -= 36
    if 144 <= t <= 177:
        t -= 36

    table = [
        (108, 111, "guard"),
        (112, 115, "guard"),
        (116, 119, "officer"),
        (120, 123, "officer"),
        (126, 129, "ss"),
        (130, 133, "ss"),
        (134, 137, "dog"),
        (138, 141, "dog"),
        (216, 223, "mutant"),
        (234, 241, "mutant"),
    ]
    for lo, hi, kind in table:
        if lo <= t <= hi:
            return kind, (t - lo) % 4

    bosses = {
        214: "boss",  # Hans
        197: "boss",  # Gretel
        215: "boss",  # Gift
        179: "boss",  # Fat
        196: "boss",  # Schabbs
        160: "boss",  # Fake Hitler
        178: "boss",  # Hitler
    }
    if tile in bosses:
        return bosses[tile], 0

    return None


def find_player(objs: list[int]) -> tuple[int, int, int] | None:
    for i, tile in enumerate(objs):
        if PLAYER_LO <= tile <= PLAYER_HI:
            return i % MAP_W, i // MAP_W, tile - PLAYER_LO
    return None


def find_pushwalls(objs: list[int]) -> set[tuple[int, int]]:
    """Object plane tile 98 marks each pushwall secret (same as the game's secrettotal)."""
    return {
        (i % MAP_W, i // MAP_W)
        for i, tile in enumerate(objs)
        if tile == PUSHWALL_OBJ
    }


def enemy_color(kind: str) -> tuple[int, int, int]:
    return {
        "guard": GUARD,
        "officer": OFFICER,
        "ss": SS,
        "dog": DOG,
        "boss": BOSS,
        "mutant": MUTANT,
        "ghost": GHOST,
    }[kind]


def filename_for(idx: int, name: str) -> str:
    if idx == 9 or "secret" in name.lower():
        return "e1m10-secret.png"
    if "boss" in name.lower():
        return "e1m9.png"
    return f"e1m{idx + 1}.png"


def title_for(idx: int, name: str) -> str:
    if idx == 9 or "secret" in name.lower():
        return "E1M10 - Secret Floor"
    if idx == 8 or "boss" in name.lower():
        return "E1M9 - Boss"
    return f"E1M{idx + 1} - {name}"


def render_map(
    m: dict, wall_colors: dict[int, tuple[int, int, int]] | None = None
) -> Image.Image:
    walls: list[int] = m["walls"]
    objs: list[int] = m["objs"]
    player = find_player(objs)
    pushwalls = find_pushwalls(objs)
    wall_colors = wall_colors or {}

    legend_h = 52
    img_w = MAP_W * CELL
    img_h = MAP_H * CELL + legend_h
    img = Image.new("RGB", (img_w, img_h), BG)
    draw = ImageDraw.Draw(img)

    # Floor / walls / doors / elevators
    for y in range(MAP_H):
        for x in range(MAP_W):
            t = walls[y * MAP_W + x]
            x0, y0 = x * CELL, y * CELL
            x1, y1 = x0 + CELL - 1, y0 + CELL - 1
            if is_elevator(t):
                color = ELEVATOR
            elif is_door(t):
                color = DOOR
            elif is_solid_wall(t):
                color = wall_colors.get(t, WALL)
            else:
                color = FLOOR
            draw.rectangle([x0, y0, x1, y1], fill=color)

    # Secret pushwalls (object 98) — gold overlay on that tile
    for x, y in pushwalls:
        x0, y0 = x * CELL, y * CELL
        x1, y1 = x0 + CELL - 1, y0 + CELL - 1
        draw.rectangle([x0, y0, x1, y1], fill=SECRET)
        # dark rim so it reads on any neighbor
        draw.rectangle([x0, y0, x1, y1], outline=(120, 80, 0))

    # Enemies
    for i, tile in enumerate(objs):
        classified = classify_enemy(tile)
        if not classified:
            continue
        kind, direction = classified
        x, y = i % MAP_W, i // MAP_W
        cx = x * CELL + CELL // 2
        cy = y * CELL + CELL // 2
        r = 3
        color = enemy_color(kind)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color, outline=(20, 20, 20))
        dx, dy = DIRS[direction]
        draw.line(
            [cx, cy, cx + dx * (CELL // 2 - 1), cy + dy * (CELL // 2 - 1)],
            fill=color,
            width=2,
        )

    # Player start
    if player:
        px, py, pdir = player
        cx = px * CELL + CELL // 2
        cy = py * CELL + CELL // 2
        draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=PLAYER, outline=(10, 40, 20))
        dx, dy = DIRS[pdir]
        draw.line(
            [cx, cy, cx + dx * (CELL // 2), cy + dy * (CELL // 2)],
            fill=PLAYER,
            width=2,
        )

    # Legend
    draw.rectangle([0, MAP_H * CELL, img_w, img_h], fill=LEGEND_BG)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    title = title_for(m["index"], m["name"])
    secrets = len(pushwalls)
    guards = sum(1 for t in objs if classify_enemy(t))
    draw.text((8, MAP_H * CELL + 6), title, fill=TEXT, font=font)
    draw.text(
        (8, MAP_H * CELL + 24),
        f"secrets:{secrets}  enemies:{guards}  walls=texture color  gold=pushwall  red=elev  blue=door",
        fill=(170, 170, 176),
        font=font,
    )

    # Tiny color chips
    chips = [
        (wall_colors.get(1, WALL), "wall"),
        (wall_colors.get(5, WALL), "blue"),
        (DOOR, "door"),
        (ELEVATOR, "elev"),
        (SECRET, "secret"),
        (PLAYER, "you"),
    ]
    x = img_w - 8
    for color, _label in reversed(chips):
        x -= 14
        draw.rectangle([x, MAP_H * CELL + 30, x + 10, MAP_H * CELL + 40], fill=color)

    return img


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wall_colors = load_wall_texture_colors()
    maps = load_maps()
    if len(maps) != 10:
        raise SystemExit(f"expected 10 E1 maps, got {len(maps)}")

    written: list[Path] = []
    for m in maps:
        img = render_map(m, wall_colors)
        path = OUT_DIR / filename_for(m["index"], m["name"])
        img.save(path)
        written.append(path)
        pw = find_pushwalls(m["objs"])
        print(f"{path.name}: {m['name']} secrets={len(pw)} size={img.size}")

    print(f"Wrote {len(written)} maps to {OUT_DIR} ({len(wall_colors)} wall textures)")


if __name__ == "__main__":
    main()
