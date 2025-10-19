#!/bin/bash

# Find the AppImage file
APPIMAGE=$(ls dist/*.AppImage 2>/dev/null | head -n 1)

if [ -z "$APPIMAGE" ]; then
  echo "❌ No AppImage found in dist/"
  echo "Run ./build-linux.sh first"
  exit 1
fi

echo "🚀 Running $APPIMAGE"
echo ""

# Make executable
chmod +x "$APPIMAGE"

# Run with --no-sandbox to avoid SUID sandbox errors
"$APPIMAGE" --no-sandbox

# Alternative: Run with --disable-gpu-sandbox
# "$APPIMAGE" --disable-gpu-sandbox
