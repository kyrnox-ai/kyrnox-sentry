#!/usr/bin/env bash
# Prewarm the PlatformIO toolchain on the demo machine.
# Run once before the hackathon presentation; downloads ~500MB of ESP32 toolchain.
set -euo pipefail

if ! command -v pio >/dev/null 2>&1; then
  echo "PlatformIO Core CLI not found. Install with: pipx install platformio" >&2
  exit 1
fi

echo "==> Installing espressif32 platform"
pio platform install espressif32

echo "==> Building Wokwi mission-pod sketch"
if [ -d "$(dirname "$0")/../wokwi/mission-pod" ]; then
  (cd "$(dirname "$0")/../wokwi/mission-pod" && pio run -e esp32dev)
else
  echo "wokwi/mission-pod not found yet; skipping build prewarm." >&2
fi

echo "==> Done. PlatformIO is prewarmed."
