#!/usr/bin/env bash
# Prepare Curly's photos and reels for the site. Needs ffmpeg and ImageMagick.
#
#   tools/media.sh menu  <photo>  <slug>          -> public/media/menu-<slug>.webp (4:5, 800x1000)
#   tools/media.sh reel  <video>  <slug> [start]  -> public/media/reel-<slug>.mp4 (9s silent loop)
#                                                    + public/media/reel-<slug>.webp (poster)
#
# Menu slugs the page looks for: steak-box, surf-n-turf, crispy-chicken, wraps, burrito, shakes
# Reel slugs: big-boxes, surf-n-turf, eighteen
# A file only shows on the page once it exists, so add them one at a time if you like.
set -euo pipefail
kind="${1:-}"; src="${2:-}"; name="${3:-}"
out="$(cd "$(dirname "$0")/.." && pwd)/public/media"
[ -n "$kind" ] && [ -f "$src" ] && [ -n "$name" ] || { sed -n '2,10p' "$0"; exit 1; }

# A touch of warmth and contrast so phone photos sit with the cream and orange.
grade="eq=contrast=1.06:saturation=1.08,colorbalance=rm=0.03:bm=-0.03"

case "$kind" in
  menu)
    convert "$src" -auto-orient -resize "800x1000^" -gravity center -extent 800x1000 \
      -modulate 100,108 -sigmoidal-contrast 2,50% -quality 80 "$out/menu-$name.webp"
    ls -lh "$out/menu-$name.webp"
    ;;
  reel)
    start="${4:-0}"
    ffmpeg -loglevel error -y -ss "$start" -t 9 -i "$src" -an \
      -vf "scale=540:-2,$grade,fps=30" -c:v libx264 -profile:v main -crf 27 -preset slow \
      -pix_fmt yuv420p -movflags +faststart "$out/reel-$name.mp4"
    ffmpeg -loglevel error -y -ss "$start" -i "$src" -frames:v 1 -vf "scale=540:-2,$grade" \
      -q:v 80 "$out/reel-$name.webp"
    ls -lh "$out/reel-$name.mp4" "$out/reel-$name.webp"
    ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
