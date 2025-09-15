#!/bin/bash

# Adobe Target Activity Inspector - Package for Chrome Web Store
echo "📦 Packaging Adobe Target Activity Inspector for Chrome Web Store..."

# Create a clean directory for packaging
rm -rf dist
mkdir dist

# Copy essential extension files
echo "📂 Copying extension files..."
cp manifest.json dist/
cp background.js dist/
cp popup.html dist/
cp popup.js dist/
cp popup.css dist/

# Copy icons (make sure these exist)
if [ -d "icons" ]; then
    cp -r icons dist/
    echo "✅ Icons copied"
else
    echo "⚠️ Warning: icons directory not found. You'll need to create icons before submitting."
fi

# Copy documentation
cp README.md dist/
cp PRIVACY_POLICY.md dist/

# Create the zip file
echo "🗜️ Creating extension package..."
cd dist
zip -r "../adobe-target-inspector-v1.0.0.zip" .
cd ..

echo "✅ Extension packaged successfully!"
echo "📁 Package location: adobe-target-inspector-v1.0.0.zip"
echo ""
echo "📋 Next steps:"
echo "1. Create icons (16x16, 48x48, 128x128) and place in icons/ directory"
echo "2. Test the packaged extension by loading it in Chrome"
echo "3. Create Chrome Web Store developer account"
echo "4. Upload the zip file to Chrome Web Store"
echo ""
echo "🎯 Ready for Chrome Web Store submission!"
