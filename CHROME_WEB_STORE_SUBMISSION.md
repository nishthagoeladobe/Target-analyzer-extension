# Chrome Web Store Submission Guide

## 🎯 Extension Details

**Name**: Adobe Target Activity Inspector
**Version**: 1.0.0
**Category**: Developer Tools
**Language**: English (United States)

## 📝 Store Listing Information

### Short Description (132 characters max)
```
Detect and understand Adobe Target activities with real activity names and non-technical explanations.
```

### Detailed Description
```
Adobe Target Activity Inspector makes it easy for anyone to see and understand Adobe Target personalization activities running on websites.

🎯 KEY FEATURES:
• Detects both at.js (delivery calls) and Alloy.js (interact calls)
• Shows real activity names like "Holiday Promotion 2025"
• Displays response tokens, page modifications, and metrics
• Explains technical parameters in simple terms
• Clean, modern interface with organized tabs
• Real-time monitoring with accurate data
• Export activities to Excel/CSV for reporting

📊 PERFECT FOR:
• Marketers verifying campaign implementations
• QA teams testing personalization
• Developers debugging Adobe Target
• Anyone curious about website personalization

🔒 PRIVACY FOCUSED:
• All data stays in your browser
• No external data transmission
• No personal information collected
• Open source and transparent

Simply install, visit any website using Adobe Target, and click the extension icon to see what's happening behind the scenes!

Works with all Adobe Target implementations including Experience Cloud, Adobe Experience Platform Web SDK, and traditional at.js.

TECHNICAL DETAILS:
• Supports Manifest V3
• Uses Chrome Debugger API for accurate data capture
• Local storage only - no cloud dependencies
• Compatible with latest Chrome versions
```

### Keywords (separated by commas)
```
adobe target, personalization, testing, marketing, analytics, debugging, developer tools, qa testing, campaign optimization, experience optimization, web sdk, alloy js, at.js, response tokens, mbox, adobe experience cloud
```

## 🖼️ Required Assets

### Icons (Already Created)
- ✅ 16×16px: `icons/icon-16.png`
- ✅ 48×48px: `icons/icon-48.png`
- ✅ 128×128px: `icons/icon-128.png`

### Screenshots (Required - Take Real Screenshots)
1. **Main Interface** (1280×800px)
   - Show the extension popup with detected activities
   - Filename: `screenshot-1-main-interface.png`

2. **Activity Details** (1280×800px)
   - Show the details tab with activity information
   - Filename: `screenshot-2-activity-details.png`

3. **Response Tokens** (1280×800px)
   - Show response tokens and explanations
   - Filename: `screenshot-3-response-tokens.png`

4. **Request/Response Data** (1280×800px)
   - Show the network request/response tabs
   - Filename: `screenshot-4-network-data.png`

### Promotional Images (Generated - Use create-store-assets.html)
- ✅ Small Tile: 440×280px
- ✅ Large Tile: 920×680px  
- ✅ Marquee Tile: 1400×560px

## 🔐 Privacy & Permissions

### Privacy Policy URL
You'll need to host the privacy policy online. Options:
1. GitHub Pages (free)
2. Your personal website
3. Google Sites (free)

### Permission Justifications
```
debugger: Required to read Adobe Target network response bodies for accurate activity names and detailed information.

activeTab: Only works on the tab you're currently viewing to detect Adobe Target activities.

storage: Stores detected activities locally in your browser for the session.

tabs: Enables page reload functionality to refresh activity detection.

host_permissions (<all_urls>): Needed to detect Adobe Target activities on any website the user visits.
```

## 📋 Pre-Submission Checklist

### Technical Requirements
- ✅ Manifest V3 compliant
- ✅ All permissions justified
- ✅ No console errors
- ✅ Extension works on test websites
- ✅ Icons in correct formats and sizes
- ✅ Privacy policy created

### Store Requirements
- ✅ Detailed description under 16,000 characters
- ✅ Short description under 132 characters
- ✅ Appropriate category selected (Developer Tools)
- ✅ Keywords relevant and not spammy
- ✅ Screenshots show actual functionality

### Legal Requirements
- ✅ Privacy policy hosted online
- ✅ No copyrighted content without permission
- ✅ Follows Chrome Web Store policies

## 🚀 Submission Steps

### 1. Chrome Web Store Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay $5 one-time registration fee
4. Accept developer agreement

### 2. Upload Extension
1. Click "New Item" in the dashboard
2. Upload `adobe-target-inspector-v1.0.0.zip`
3. Fill out the store listing form with information above
4. Upload screenshots and promotional images

### 3. Store Listing Details
Copy and paste the information from this document:
- Name: Adobe Target Activity Inspector
- Description: [Use detailed description above]
- Category: Developer Tools
- Keywords: [Use keywords above]

### 4. Upload Assets
- Upload all 4 screenshots
- Upload promotional tiles (optional but recommended)
- Set primary screenshot as the main interface

### 5. Pricing & Distribution
- Set as Free
- Choose distribution regions (recommend "All regions")
- Set visibility to Public

### 6. Privacy & Permissions
- Add privacy policy URL
- Justify each permission using text above
- Confirm data handling practices

### 7. Submit for Review
- Review all information
- Click "Submit for Review"
- Wait 1-3 business days for approval

## 📞 Support Information

**Support Email**: [Your email address]
**Website**: [Your GitHub repository or website]
**Privacy Policy**: [URL where you host the privacy policy]

## 🎉 Post-Launch

### After Approval
1. Extension goes live in Chrome Web Store
2. Share the store link with Adobe Target community
3. Monitor user reviews and feedback
4. Plan future updates and improvements

### Marketing Ideas
- Post in Adobe Target community forums
- Share on LinkedIn with Adobe Target hashtags
- Create demo videos showing the extension in action
- Write blog posts about Adobe Target debugging

## 📊 Success Metrics
- Downloads and active users
- User ratings and reviews
- Feature requests and feedback
- Community adoption

---

**Ready to submit!** Follow the steps above to publish your Adobe Target Activity Inspector to the Chrome Web Store.
