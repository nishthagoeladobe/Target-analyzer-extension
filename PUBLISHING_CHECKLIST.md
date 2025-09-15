# Chrome Web Store Publishing Checklist

## ✅ Pre-Submission Requirements

### Required Files
- [ ] `manifest.json` (with proper metadata)
- [ ] `background.js` (service worker)
- [ ] `popup.html` (extension UI)
- [ ] `popup.js` (UI logic)
- [ ] `popup.css` (styling)
- [ ] `README.md` (documentation)
- [ ] `PRIVACY_POLICY.md` (required for store)

### Required Assets
- [ ] Icon 16x16 pixels (`icons/icon-16.png`)
- [ ] Icon 48x48 pixels (`icons/icon-48.png`)
- [ ] Icon 128x128 pixels (`icons/icon-128.png`)
- [ ] Screenshots (4-5 images, 1280x800 recommended)
- [ ] Promotional images (optional but recommended)

### Legal Requirements
- [ ] Privacy policy created and hosted online
- [ ] Terms of service (if applicable)
- [ ] Copyright and licensing information

## 📝 Chrome Web Store Account Setup

### Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with Google account
3. Pay $5 one-time registration fee
4. Verify your identity
5. Accept developer agreement

### Store Listing
1. Upload extension zip file
2. Fill out store listing information
3. Add screenshots and promotional images
4. Set pricing (free or paid)
5. Choose distribution regions
6. Submit for review

## 🧪 Testing Before Submission

### Functionality Testing
- [ ] Extension loads without errors
- [ ] Detects Adobe Target activities correctly
- [ ] UI displays data properly
- [ ] All tabs and sections work
- [ ] Explanations are clear and helpful
- [ ] Error handling works gracefully

### Compatibility Testing
- [ ] Test on different websites with Adobe Target
- [ ] Test with at.js implementations
- [ ] Test with Alloy.js implementations
- [ ] Test with Chrome latest version
- [ ] Test permissions work correctly

### Performance Testing
- [ ] Extension doesn't slow down browsing
- [ ] Memory usage is reasonable
- [ ] No console errors or warnings
- [ ] Clean uninstall process

## 📋 Store Review Process

### Review Timeline
- **Initial Review**: 1-3 days for new extensions
- **Updates**: Usually faster, 1-2 days
- **Rejections**: Common reasons and how to fix

### Common Rejection Reasons
1. **Missing privacy policy**
2. **Excessive permissions** 
3. **Unclear functionality**
4. **Poor quality screenshots**
5. **Misleading descriptions**

### After Approval
- [ ] Extension goes live in Chrome Web Store
- [ ] Users can install and rate
- [ ] Monitor reviews and feedback
- [ ] Plan updates and improvements

## 🚀 Post-Launch

### Marketing
- [ ] Share on social media
- [ ] Post in Adobe Target community forums
- [ ] Create blog post or documentation
- [ ] Reach out to Adobe Target users

### Maintenance
- [ ] Monitor user reviews
- [ ] Fix reported bugs
- [ ] Add requested features
- [ ] Keep up with Chrome API changes

## 📞 Support

If you need help during the publishing process:
- Chrome Web Store Help: https://support.google.com/chrome_webstore/
- Developer Documentation: https://developer.chrome.com/docs/webstore/
- Community Forum: https://groups.google.com/a/chromium.org/g/chromium-extensions
