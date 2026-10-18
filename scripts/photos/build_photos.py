"""Builds the field photo set of the website from the founder's original files.

Usage: python3 scripts/photos/build_photos.py <folder with the original files>

Reads data/field/manifest.json, finds each original by its file name (a prefix added by an upload
tool is tolerated), straightens it from its metadata, trims the black bars of phone screenshots and
writes two WebP sizes to site/img/field/: <id>.webp (1600 px on the long side, for the viewer) and
<id>-s.webp (560 px, for grids). Dimensions and an average colour go to site/data/photos.json.
"""
import json
import os
import sys

from PIL import Image, ImageOps

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(REPO, 'site', 'img', 'field')
LARGE, SMALL = 1600, 560


def find(folder, name):
    hits = [f for f in os.listdir(folder) if f == name or f.endswith('-' + name)]
    if not hits:
        raise SystemExit(f'missing original: {name}')
    return os.path.join(folder, sorted(hits)[0])


def trim_bars(im):
    """Removes the black bands a phone adds above and below a photo shown full screen."""
    g = im.convert('L')
    w, h = g.size
    px = g.load()
    step = max(1, w // 60)

    def dark(y):
        return max(px[x, y] for x in range(0, w, step)) < 24

    top, bot = 0, h - 1
    while top < h // 3 and dark(top):
        top += 1
    while bot > 2 * h // 3 and dark(bot):
        bot -= 1
    return im.crop((0, top, w, bot + 1)) if top or bot < h - 1 else im


def fit(im, side):
    im = im.copy()
    im.thumbnail((side, side), Image.LANCZOS)
    return im


def main(folder):
    manifest = json.load(open(os.path.join(REPO, 'data', 'field', 'manifest.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for p in manifest['photos']:
        im = ImageOps.exif_transpose(Image.open(find(folder, p['src']))).convert('RGB')
        im = trim_bars(im)
        big, small = fit(im, LARGE), fit(im, SMALL)
        big.save(os.path.join(OUT, p['id'] + '.webp'), 'WEBP', quality=74, method=6)
        small.save(os.path.join(OUT, p['id'] + '-s.webp'), 'WEBP', quality=68, method=6)
        r, g, b = small.resize((1, 1), Image.BOX).getpixel((0, 0))
        meta[p['id']] = {'w': big.size[0], 'h': big.size[1], 'sw': small.size[0], 'sh': small.size[1],
                         'c': '#%02x%02x%02x' % (r, g, b), 'plate': p['plate'], 'panel': p['panel'], 'date': p['date']}
    with open(os.path.join(REPO, 'site', 'data', 'photos.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, separators=(',', ':'))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'{len(meta)} photos, {total / 1e6:.1f} MB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
