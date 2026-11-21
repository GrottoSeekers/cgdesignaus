#!/usr/bin/env bash
# Prepare Ryan's photos and reels for the site, matching what's already there:
# black and white, web-sized, written into public/media/.
#
#   tools/grade.sh reel  <video>  <name> [preview-start-seconds]
#     -> public/media/full-<name>.mp4    full reel with sound (plays on tap)
#        public/media/reel-<name>.mp4    9-second silent loop (plays on scroll)
#        public/media/reel-<name>.webp   cover image
#
#   tools/grade.sh photo <image>  <name> [width]
#     -> public/media/<name>.webp
#
# The grey mix leans on the red and blue channels, so footage shot under the
# gym's pink/violet lights doesn't turn muddy. Needs ffmpeg and ImageMagick.
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
out="$here/public/media"
kind="${1:-}"; src="${2:-}"; name="${3:-}"

if [[ -z "$kind" || -z "$src" || -z "$name" || ! -f "$src" ]]; then
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
[[ "$name" =~ ^[a-z0-9-]+$ ]] || { echo "Name must be lowercase letters, numbers and dashes, e.g. leg-day"; exit 1; }

mix="colorchannelmixer=.55:0:.45:0:.55:0:.45:0:.55:0:.45,eq=contrast=1.15:gamma=1.12"

case "$kind" in
  reel)
    start="${4:-2}"
    ffmpeg -loglevel error -y -i "$src" -vf "scale=540:-2,$mix" \
      -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p \
      -c:a aac -b:a 96k -movflags +faststart "$out/full-$name.mp4"
    ffmpeg -loglevel error -y -ss "$start" -t 9 -i "$src" -an -vf "scale=540:-2,$mix,fps=30" \
      -c:v libx264 -profile:v main -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart "$out/reel-$name.mp4"
    ffmpeg -loglevel error -y -ss "$start" -i "$src" -frames:v 1 -vf "scale=540:-2,$mix" -q:v 80 "$out/reel-$name.webp"
    ls -lh "$out/full-$name.mp4" "$out/reel-$name.mp4" "$out/reel-$name.webp"
    ;;
  photo)
    width="${4:-1200}"
    convert "$src" -auto-orient -resize "${width}x>" -fx "(r*0.55+b*0.45)" -colorspace Gray \
      -sigmoidal-contrast 5,45% -level 2%,96% -quality 80 "$out/$name.webp"
    ls -lh "$out/$name.webp"
    ;;
  *)
    echo "First argument must be 'reel' or 'photo'"; exit 1 ;;
esac
