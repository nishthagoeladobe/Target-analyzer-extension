#!/bin/bash

# Chrome Web Store Screenshot Resizer
# Resizes screenshots to meet Chrome Web Store requirements (1280x800)

echo "🖼️  Chrome Web Store Screenshot Resizer"
echo "======================================="

# Check if screenshot file exists
if [ ! -f "screenshots/screenshot-original.png" ] && [ ! -f "screenshots/screenshot-original.jpg" ]; then
    echo "❌ No screenshot found!"
    echo ""
    echo "Please save your screenshot as one of these:"
    echo "  • screenshots/screenshot-original.png"
    echo "  • screenshots/screenshot-original.jpg"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Determine input file
INPUT_FILE=""
if [ -f "screenshots/screenshot-original.png" ]; then
    INPUT_FILE="screenshots/screenshot-original.png"
elif [ -f "screenshots/screenshot-original.jpg" ]; then
    INPUT_FILE="screenshots/screenshot-original.jpg"
fi

echo "📁 Found input file: $INPUT_FILE"

# Get original dimensions
ORIGINAL_SIZE=$(sips -g pixelWidth -g pixelHeight "$INPUT_FILE" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
echo "📏 Original size: $ORIGINAL_SIZE pixels"

# Chrome Web Store requirements
TARGET_WIDTH=1280
TARGET_HEIGHT=800
OUTPUT_FILE="screenshots/screenshot-chrome-store-1280x800.png"

echo "🎯 Target size: ${TARGET_WIDTH}x${TARGET_HEIGHT} pixels"

# Resize image maintaining aspect ratio and centering
sips -z $TARGET_HEIGHT $TARGET_WIDTH "$INPUT_FILE" --out "$OUTPUT_FILE" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Screenshot resized successfully!"
    echo "📄 Output file: $OUTPUT_FILE"
    
    # Get file size
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "💾 File size: $FILE_SIZE"
    
    # Verify dimensions
    NEW_SIZE=$(sips -g pixelWidth -g pixelHeight "$OUTPUT_FILE" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
    echo "🔍 Final size: $NEW_SIZE pixels"
    
    echo ""
    echo "🎉 Ready for Chrome Web Store upload!"
    echo "📤 Use this file: $OUTPUT_FILE"
else
    echo "❌ Failed to resize screenshot"
    exit 1
fi
