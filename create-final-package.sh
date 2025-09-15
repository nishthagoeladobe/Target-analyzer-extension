#!/bin/bash

echo "🚀 Creating final Chrome Web Store submission package..."

# Create publication directory
mkdir -p publication
rm -rf publication/*

echo "📂 Copying core extension files..."
cp manifest.json publication/
cp background.js publication/
cp popup.html publication/
cp popup.js publication/
cp popup.css publication/
cp -r icons publication/

echo "📄 Copying documentation..."
cp README.md publication/
cp PRIVACY_POLICY.md publication/

echo "📋 Creating submission checklist..."
cat > publication/SUBMISSION_CHECKLIST.txt << 'EOF'
CHROME WEB STORE SUBMISSION CHECKLIST
=====================================

BEFORE SUBMITTING:
□ 1. Host privacy policy online and get URL
□ 2. Take 4 real screenshots of extension working (1280x800px)
□ 3. Generate promotional images using create-store-assets.html
□ 4. Create Chrome Web Store developer account ($5 fee)
□ 5. Test extension thoroughly on different websites

SUBMISSION STEPS:
□ 1. Go to https://chrome.google.com/webstore/devconsole/
□ 2. Click "New Item" and upload adobe-target-inspector-publication.zip
□ 3. Fill store listing with info from CHROME_WEB_STORE_SUBMISSION.md
□ 4. Upload screenshots and promotional images
□ 5. Add privacy policy URL
□ 6. Set as Free, Public, All regions
□ 7. Submit for review

EXPECTED TIMELINE:
- Review: 1-3 business days
- Approval: Extension goes live immediately
- Rejection: Fix issues and resubmit

SUPPORT NEEDED:
- Privacy policy hosting URL
- Screenshots of extension in action
- Optional: Promotional images from create-store-assets.html
EOF

echo "🗜️ Creating final submission package..."
cd publication
zip -r ../adobe-target-inspector-publication.zip . -x "*.DS_Store"
cd ..

echo "✅ Final publication package created!"
echo ""
echo "📁 Files created:"
echo "   • adobe-target-inspector-publication.zip (upload this to Chrome Web Store)"
echo "   • publication/ directory with all files"
echo "   • SUBMISSION_CHECKLIST.txt (follow these steps)"
echo ""
echo "🎯 Next steps:"
echo "1. Open create-store-assets.html in browser to generate promotional images"
echo "2. Take screenshots of your extension working on real websites"  
echo "3. Host privacy policy online (GitHub Pages, Google Sites, etc.)"
echo "4. Follow CHROME_WEB_STORE_SUBMISSION.md for complete submission guide"
echo ""
echo "🚀 Ready for Chrome Web Store submission!"
