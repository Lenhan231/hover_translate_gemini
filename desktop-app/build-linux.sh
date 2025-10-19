#!/bin/bash

echo "🔨 Building Quick Translate for Linux..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build both AppImage and .deb
echo "🏗️  Building AppImage and .deb package..."
npm run build:linux

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "📦 Output files:"
  ls -lh dist/*.AppImage dist/*.deb 2>/dev/null
  echo ""
  echo "🚀 To run AppImage:"
  echo "   chmod +x dist/*.AppImage"
  echo "   ./dist/*.AppImage --no-sandbox"
  echo ""
  echo "   (Use --no-sandbox flag to avoid sandbox errors)"
  echo ""
  echo "📦 To install .deb:"
  echo "   sudo dpkg -i dist/*.deb"
else
  echo "❌ Build failed!"
  exit 1
fi
