# Icons

Place your icon files here:

- `icon.png` - 512x512 PNG for Linux
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `tray-icon.png` - 16x16 or 32x32 for system tray

## Generate icons

You can use online tools:
- https://www.icoconverter.com/
- https://cloudconvert.com/png-to-ico

Or use ImageMagick:
```bash
# Create a simple icon
convert -size 512x512 xc:blue -fill white -pointsize 200 -gravity center -annotate +0+0 "QT" icon.png

# Convert to other formats
convert icon.png -resize 256x256 icon.ico
convert icon.png -resize 512x512 icon.icns
convert icon.png -resize 32x32 tray-icon.png
```

## Temporary workaround

If you don't have icons, electron-builder will use default Electron icon (with a warning).
