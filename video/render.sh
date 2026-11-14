#!/bin/sh
# Renders every video in this folder. Run inside the authoring container from /video:
#   sh render.sh
# The walkthroughs go to /media (mount web/public/media there); teasers go to out/.
set -eu
media="${MEDIA_DIR:-/media}"
mkdir -p out
for language in en sv; do
  target="$media/fire-demo/$language"
  mkdir -p "$target"
  (cd "fire-demo/$language" && hyperframes check && hyperframes render --fps 24 --quality high --output "/video/out/fire-demo.$language.mp4")
  cp "out/fire-demo.$language.mp4" "$target/video.mp4"
  ffmpeg -v error -y -ss 4 -i "$target/video.mp4" -frames:v 1 -c:v libwebp -quality 80 "$target/poster.webp"
  cp "fire-demo/$language"/assets/fire-demo.*.vtt "$target/"
  (cd "fire-features/$language" && hyperframes check && hyperframes render --fps 24 --quality high --output "/video/out/fire-features.$language.mp4")
done
