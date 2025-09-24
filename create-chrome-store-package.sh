#!/bin/bash

echo "🧹 Creating clean Chrome Web Store package..."

# Create clean extension directory
rm -rf chrome-store-package
mkdir -p chrome-store-package

echo "📂 Copying core extension files..."
# Copy only the essential extension files
cp manifest.json chrome-store-package/
cp background.js chrome-store-package/
cp popup.html chrome-store-package/
cp popup.js chrome-store-package/
cp popup.css chrome-store-package/
cp -r icons chrome-store-package/

echo "📄 Adding documentation..."
cp README.md chrome-store-package/
cp PRIVACY_POLICY.md chrome-store-package/

echo "🗜️ Creating Chrome Web Store submission package..."
cd chrome-store-package
zip -r ../adobe-target-inspector-chrome-store.zip . -x "*.DS_Store"
cd ..

echo "✅ Clean Chrome Web Store package created!"
echo ""
echo "📁 Files in package:"
ls -la chrome-store-package/
echo ""
echo "🎯 Ready for submission:"
echo "   • adobe-target-inspector-chrome-store.zip (upload this to Chrome Web Store)"
echo ""
echo "🚀 Next steps:"
echo "1. Go to https://chrome.google.com/webstore/devconsole/"
echo "2. Click 'New Item' and upload adobe-target-inspector-chrome-store.zip"
echo "3. Follow CHROME_WEB_STORE_SUBMISSION.md for complete details"
