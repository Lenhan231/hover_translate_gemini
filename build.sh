#!/bin/bash

# Build script for Quick Translate to Vietnamese extension

echo "🔨 Building extension for Firefox/Zen Browser..."

# Remove old build
rm -f quick-translate-vi.xpi

# Create XPI package (Firefox extension format)
zip -r -FS quick-translate-vi.xpi \
  manifest.json \
  background.js \
  content.js \
  options.js \
  options.html \
  overlay.css \
  icons/ \
  --exclude '*.git*' \
  --exclude 'node_modules/*' \
  --exclude '.env' \
  --exclude '.gitignore' \
  --exclude '*.md' \
  --exclude 'build.sh'

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo "📦 Package: quick-translate-vi.xpi"
  echo ""
  echo "To install:"
  echo "1. Open Zen/Firefox"
  echo "2. Go to about:addons"
  echo "3. Click ⚙️ > Install Add-on From File..."
  echo "4. Select quick-translate-vi.xpi"
else
  echo "❌ Build failed!"
  exit 1
fi
