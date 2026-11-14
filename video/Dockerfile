# Throwaway authoring image for the videos in this folder. Not part of the app:
# the app only ships the rendered MP4, poster and subtitle files. See VIDEO.md.
FROM node:22-trixie-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ffmpeg ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
ENV HYPERFRAMES_NO_UPDATE_CHECK=1 \
  HYPERFRAMES_NO_AUTO_INSTALL=1 \
  HYPERFRAMES_SKIP_SKILLS=1 \
  HYPERFRAMES_NO_TELEMETRY=1 \
  DO_NOT_TRACK=1 \
  HYPERFRAMES_BROWSER_PATH=/usr/bin/chromium \
  PUPPETEER_SKIP_DOWNLOAD=1
RUN npm install -g hyperframes@0.8.173 \
  && mkdir -p /opt/capture && cd /opt/capture && npm init -y >/dev/null \
  && npm install playwright-core@1.65.0
WORKDIR /video
