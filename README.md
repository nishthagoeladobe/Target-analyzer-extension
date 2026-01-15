# Adobe Target Activity Inspector

A comprehensive Chrome extension that detects, analyzes, and explains Adobe Target activities on websites. Perfect for marketers, developers, QA teams, and anyone working with Adobe Target personalization.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [Performance Analysis](#performance-analysis)
- [Flicker Test Feature](#flicker-test-feature)
- [Technical Details](#technical-details)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Support](#support)

---

## Overview

Adobe Target Activity Inspector provides real-time visibility into Adobe Target activities running on any webpage. It eliminates the need for manual DevTools debugging and makes complex Target data accessible to both technical and non-technical users.

### Key Benefits

**For Marketers:**
- Instant activity visibility - see all running A/B tests and personalization campaigns
- Non-technical explanations - understand complex response data in plain English
- Campaign verification - confirm activities are running correctly on live pages
- Experience tracking - know exactly which version of a test you're seeing

**For Developers:**
- Real-time debugging - monitor Adobe Target calls without opening DevTools
- Implementation validation - verify both at.js and Alloy.js implementations
- Response analysis - deep dive into request/response data with detailed JSON views
- Network call monitoring - track delivery and interact calls with full payload details

**For Analysts:**
- Data export - generate Excel reports with all activity data for analysis
- Response token analysis - view all targeting criteria and user segments
- Performance monitoring - track activity load times and success rates
- Comprehensive reporting - export structured data for stakeholder presentations

---

## Features

### Core Features

- 🎯 **Activity Detection**: Automatically identifies both at.js (delivery calls) and Alloy.js (interact calls)
- 📊 **Real Activity Names**: Shows actual campaign names like "Holiday Promotion 2025" instead of generic placeholders
- 🔍 **Detailed Information**: Displays response tokens, page modifications, metrics, and more
- 📚 **Non-Technical Explanations**: Explains complex Adobe Target parameters in simple terms
- 🎨 **Clean UI**: Modern, readable interface with organized tabs and sections
- 🔄 **Live Monitoring**: Real-time detection with debugger API for accurate data
- 📊 **Excel Export**: Download detailed reports of all detected activities
- 🐛 **Built-in Support**: Report issues directly from the extension
- 🔒 **Privacy First**: All data stays in your browser - nothing sent to external servers

### Advanced Features

- ⚡ **Performance Analysis**: Measure Target's impact on page load times
- 🧪 **Flicker Test**: A/B test prehiding snippet effectiveness
- 📈 **Timing Sequence**: See when events happen, not just how long they take
- 🏷️ **Library Detection**: Identify which Adobe libraries loaded (Launch, at.js, alloy.js)
- 📊 **Analytics-Grade Metrics**: Real browser measurements, not estimates

---

## Installation

### Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Adobe Target Activity Inspector"
3. Click "Add to Chrome"
4. Confirm installation

### Manual Installation (Development)

```bash
# Clone the repository
git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
cd Target-analyzer-extension

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode" (toggle in top-right)
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

---

## Quick Start

### Basic Usage

1. **Install the extension** from Chrome Web Store
2. **Navigate to any website** that uses Adobe Target
3. **Click the extension icon** in your toolbar
4. **Click "🔍 Start Monitoring & Reload"** on the Activities tab
5. **View detected activities** - see all Target campaigns running on the page

### Quick Demo Flow (2 minutes)

| Step | Action | Key Message |
|------|--------|-------------|
| 1 | Open extension → **Activities** tab | "Instant visibility - see all Target activities in seconds" |
| 2 | Switch to **Details** tab | "Every API call captured - complete network visibility" |
| 3 | Switch to **Performance** tab → Click Refresh | "Measure Target's impact on page performance" |
| 4 | Click **Download Excel Report** | "Professional client-ready documentation in seconds" |

---

## User Guide

### Activities Tab

**Purpose**: View all detected Adobe Target activities

**Features**:
- Activity list with names, experiences, and IDs
- Implementation type badges (at.js / Alloy.js)
- Summary cards showing total activities and mboxes
- Excel export functionality
- Clear activities button

**How to Use**:
1. Navigate to a page with Adobe Target
2. Click "🔍 Start Monitoring & Reload"
3. Wait for activities to be detected
4. Click any activity to view details
5. Use "Download Excel Report" for comprehensive export

### Details Tab

**Purpose**: Deep dive into technical parameters

**Features**:
- Overview panel with activity summary
- Request details (URL, method, headers, payload)
- Response details (status, headers, full JSON)
- Response tokens (all targeting criteria)
- Page modifications (what content changed)

**Sub-tabs**:
- 📊 Overview: Activity summary
- 📤 Request: Full request data
- 📥 Response: Complete response JSON
- 🏷️ Tokens: All response tokens

### Performance Tab

**Purpose**: Measure Target's impact on page performance

**Key Metrics**:
- Page Load Time: Total time from navigation start to page load complete
- First Paint (FP): Time when browser first renders pixels
- First Contentful Paint (FCP): Time when first DOM content is rendered
- Library Load Time: How long it takes to load at.js or alloy.js
- Activity Delivery Time: Duration of Target API call
- Flicker Duration: Estimated time users see page flicker

**Timing Sequence Table**:
Shows events in chronological order with:
- Start Time: When the event began
- Duration: How long it took
- End Time: When it finished
- Sequence numbers (#1, #2, #3...) showing load order

**How to Use**:
1. Go to Activities tab first and detect activities
2. Click "⚡ Analyze Target Performance" button
3. Or manually go to Performance tab and click "🔄 Refresh Metrics"
4. Review timing table and metrics
5. Check recommendations for optimization

**Example Output**:
```
Event Sequence Table:
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #3 📦 Adobe Launch/Tags            │ 642ms      │ 156ms    │ 798ms    │
│ #4 🎯 Target Activity Delivery 🌐  │ 850ms      │ 224ms    │ 1074ms   │
│ #5 ✅ DOM Complete                 │ 0ms        │ 4.31s    │ 4.31s    │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

### Explanation Tab

**Purpose**: Learn what everything means in simple terms

**Features**:
- Parameter definitions
- Implementation type explanations
- Non-technical descriptions
- Built-in error reporting

---

## Performance Analysis

### Understanding Performance Metrics

#### Page Performance Metrics

- **Page Load Time**: Total time from navigation start to page load complete
- **First Paint (FP)**: Time when browser first renders pixels to the screen
- **First Contentful Paint (FCP)**: Time when first DOM content is rendered
- **DNS Lookup Time**: Domain name resolution duration
- **TCP Connection Time**: TCP handshake duration
- **DOM Interactive/Complete**: DOM parsing and completion times

#### Adobe Target Specific Metrics

- **Library Load Time**: How long it takes to load at.js or alloy.js
- **Activity Delivery Time**: Duration of Target API call to deliver activities
- **Flicker Duration**: Estimated time users see page flicker (prehiding duration)
- **Target Overhead**: Percentage of page load time consumed by Target
- **Total Target Calls**: Number of Target API calls made

### Library Detection

The extension identifies Adobe libraries by parsing URLs from the Performance API:

| Library Type | URL Pattern | Example |
|-------------|-------------|---------|
| **Adobe Launch/Tags** | `assets.adobedtm.com` + `launch-` | `https://assets.adobedtm.com/.../launch-abc.min.js` |
| **at.js v2** | `at-2.js` or `at.2.` | `https://site.com/at-2.11.3.js` |
| **at.js v1** | `at.js` | `https://site.com/at.js` |
| **alloy.js** | `alloy` | `https://cdn1.adoberesources.net/alloy/2.19.0/alloy.min.js` |
| **AppMeasurement** | `appmeasurement` | `https://site.com/AppMeasurement.js` |

### Data Source & Accuracy

**All metrics are real browser measurements** from:
- Navigation Timing API (`window.performance.timing`)
- Paint Timing API (`window.performance.getEntriesByType('paint')`)
- Resource Timing API (`window.performance.getEntriesByType('resource')`)

**Why results appear instantly**: The browser automatically records all timing data during page load. When you click "Refresh Metrics", the extension reads this pre-recorded data from memory - it's instant because the data is already there!

**Data Freshness**: The extension shows when data was collected:
- 🟢 Fresh (< 10 seconds): Very recent data
- 🟡 Recent (10s - 1 minute): Reasonably fresh
- 🔴 Stale (> 1 minute): Reload page for fresh data

### Performance Optimization Tips

**If Target Overhead is High (>20%)**:
1. Implement serverState for SSR pages
2. Use edge network/CDN for at.js delivery
3. Simplify audience targeting rules
4. Consider async Target delivery

**If Flicker Duration is High (>500ms)**:
1. Implement proper prehiding snippet
2. Use serverState to prefetch Target content
3. Optimize Target response time
4. Consider reducing audience complexity
5. Use asynchronous at.js deployment

**If Library Load is Slow (>500ms)**:
1. Use CDN closer to user geography
2. Enable HTTP/2 or HTTP/3
3. Implement resource hints (preconnect, dns-prefetch)
4. Consider async library loading

---

## Flicker Test Feature

### Overview

The Flicker Test feature is an advanced A/B testing tool that measures the real impact of Adobe Target's prehiding snippet on user experience. It runs automated tests to compare flicker WITH vs WITHOUT the prehiding snippet.

### What is a Prehiding Snippet?

The prehiding snippet is JavaScript code placed in the `<head>` section that temporarily hides page content (`opacity: 0` or `visibility: hidden`) while Adobe Target loads personalized content. This prevents **flicker** - the brief moment where visitors see default content before it changes to personalized content.

### How to Use

1. **Open Extension**: Click the Adobe Target Inspector icon
2. **Navigate to Flicker Test Tab**: Located between Performance and Explanation tabs
3. **Check Snippet Status**: Extension automatically detects if prehiding snippet exists
4. **Run Test**: Click "🚀 Run A/B Test (2 page reloads)"
5. **View Results**: See side-by-side comparison after ~10 seconds

### Test Process

The test runs **2 page reloads** automatically:

**Test 1: WITH Prehiding Snippet**
- Page loads normally
- Prehiding snippet executes
- Measures flicker duration
- Collects performance metrics

**Test 2: WITHOUT Prehiding Snippet**
- Extension blocks/removes prehiding snippet
- Page loads without hiding
- Measures flicker duration
- Collects performance metrics

### Metrics Collected

For each test phase:
- **Flicker Duration**: Time between First Contentful Paint (FCP) and Activity Applied
- **First Contentful Paint (FCP)**: When user first sees any content
- **Activity Applied**: When Adobe Target activity renders on page
- **Page Load Time**: Total page load time from navigation start

### Understanding Results

**Flicker Duration**:
- Low Flicker: < 300ms (✅ Good UX)
- High Flicker: > 500ms (⚠️ Poor UX)

**Snippet Benefit**:
- Large Benefit (>100ms): Keep snippet
- Small Benefit (0-100ms): Consider other optimizations
- Negative Benefit (<0ms): Review snippet timeout

### Example Results

```
┌─────────────────────────────────────────┐
│ ✅ WITH Snippet  │  VS  │  ⚠️ WITHOUT   │
├─────────────────────────────────────────┤
│ Flicker: 218ms  │      │ Flicker: 892ms │
│ FCP: 450ms      │      │ FCP: 480ms     │
│ Activity: 668ms │      │ Activity: 1372ms│
│ Page Load: 2.1s │      │ Page Load: 2.3s│
└─────────────────────────────────────────┘
         Snippet Prevents: 674ms Flicker!
```

### Tips for Accurate Results

**DO**:
- Clear cache before testing (click "🧹 Clear Cache & Reload")
- Run test **3 times** and average results
- Test during similar network conditions
- Test on pages with active Target activities

**DON'T**:
- Run test with slow/inconsistent network
- Compare results from different times of day
- Test on pages without Target activities
- Have other network-heavy tasks running

---

## Technical Details

### Supported Adobe Target Implementations

- ✅ **at.js** (all versions): Traditional Adobe Target implementation
- ✅ **Alloy.js (Web SDK)**: Modern Adobe Experience Platform implementation
- ✅ **Server-side**: Detects server-side Target calls
- ✅ **Hybrid implementations**: Works with mixed at.js/Alloy setups

### Network Call Detection

**Delivery Calls** (at.js):
- Pattern: `tt.omtrdc.net/rest/v1/delivery` endpoints
- Also detects CNAME domains with `/rest/v1/delivery` + `client=` parameter

**Interact Calls** (Alloy.js):
- Pattern: `/ee/or2/v1/interact` or `/ee/v1/interact` endpoints
- Also detects custom edge domains

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │◄──►│ Background      │◄──►│ Chrome Debugger │
│   (popup.js)    │    │ Service Worker  │    │ API             │
│                 │    │ (background.js) │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Chrome Extension APIs (Manifest v3)
- **Network Layer**: Chrome Debugger API
- **Data Format**: JSON parsing and manipulation
- **Build Process**: No build tools required

### Activity Detection Logic

The extension validates that activities are actually delivered, not just API calls:

```javascript
// Only creates activity if REAL personalization content found
if (responseData.execute && responseData.execute.mboxes) {
  responseData.execute.mboxes.forEach((mbox) => {
    if (mbox.options && mbox.options.length > 0) {  // ← Content exists!
      // Create activity
      this.storeActivity(tabId, activity);
    }
  });
}
```

**Scenarios**:
- ✅ Activity Delivered: API call + content in response
- ⚠️ API Call But No Activity: API call but empty response
- ℹ️ No API Call: No Target library or no API call made

### Performance API Usage

**Navigation Timing API**: Page load metrics
```javascript
const timing = window.performance.timing;
pageLoadTime = timing.loadEventEnd - timing.navigationStart;
```

**Resource Timing API**: Library and API call timing
```javascript
const resources = window.performance.getEntriesByType('resource');
const library = resources.find(r => r.name.includes('launch-'));
```

**Paint Timing API**: First Paint and FCP
```javascript
const paintEntries = window.performance.getEntriesByType('paint');
const fcp = paintEntries.find(e => e.name === 'first-contentful-paint').startTime;
```

### Permissions Explained

- **`debugger`**: Required to read Adobe Target network response bodies for accurate activity names
- **`activeTab`**: Only works on the tab you're currently viewing
- **`storage`**: Stores detected activities locally in your browser
- **`tabs`**: Enables page reload functionality for activity detection
- **`scripting`**: Execute performance measurement scripts in pages
- **`browsingData`**: Clear cache functionality for flicker tests

---

## Privacy & Security

### Privacy-First Design

**Data Collection**:
- ✅ Adobe Target Network Requests: Monitors network calls to Adobe Target servers
- ✅ Activity Data: Information from Adobe Target responses
- ✅ Local Storage: Detected activities stored temporarily in browser

**What We DO NOT Collect**:
- ❌ Personal information (name, email, address, etc.)
- ❌ Browsing history outside of Adobe Target activities
- ❌ Passwords or sensitive form data
- ❌ Data from non-Adobe Target network requests
- ❌ Any data sent to external servers

**Data Usage**:
- Display Activities: Show you Adobe Target activities running on websites
- Provide Explanations: Help you understand what Adobe Target parameters mean
- Local Storage Only: All data stays in your browser and is not transmitted anywhere

**Data Sharing**:
- We do not share any data with third parties
- We do not sell any data
- We do not send any data to external servers
- All processing happens locally in your browser

### Security

- **Local Processing**: All data processing happens in your browser
- **No Network Transmission**: Extension does not send data to any servers
- **Chrome Security**: Benefits from Chrome's extension security model
- **Open Source**: Extension code can be reviewed for transparency

### Your Rights

- **View Data**: All collected data is visible in the extension interface
- **Delete Data**: Clear activities using the extension's "Clear Activities" button
- **Uninstall**: Remove the extension to delete all associated data
- **Control**: You control when and where the extension operates

📄 **Full Privacy Policy**: [View our complete privacy policy](https://nishthagoeladobe.github.io/Target-analyzer-extension/)

---

## Troubleshooting

### Common Issues

**"No activities detected"**
- Ensure page has Adobe Target implemented
- Click "Start Monitoring & Reload" on Activities tab
- Check that debugger permission was granted
- Verify Target library is loaded (check Network tab in DevTools)

**"Unable to collect performance metrics"**
- Ensure the page has fully loaded
- Refresh the page and try again
- Check that the website allows script execution
- Verify Performance API is available (Chrome 88+)

**"Not detected" for Library Load**
- Adobe Target library may not be loaded
- Check if at.js or alloy.js is present on the page
- Verify the library loaded from expected domains
- Library might be loaded from custom domain (CNAME)

**"Not measured" for Activity Delivery**
- No Adobe Target activities were delivered
- Click "Start Monitoring & Reload" on Activities tab first
- Ensure debugger is attached
- Check that activities match your targeting criteria

**DevTools Conflict**
- Chrome only allows one debugger per tab
- Close DevTools or detach its debugger
- Extension will show warning if DevTools is open

**Extension Not Working**
- Reload the extension (`chrome://extensions` → Reload)
- Check console for errors (right-click popup → Inspect)
- Verify all permissions are granted
- Try on a different page with Adobe Target

### Debugging Tips

**View Console Logs**:
1. Right-click extension popup → Inspect
2. Go to Console tab
3. Click buttons in extension to see detailed logs

**Verify Detection**:
1. Open DevTools (F12) → Network tab
2. Reload page
3. Find Adobe Target calls
4. Compare with extension output

**Check Performance Data**:
```javascript
// In browser console on the page
const resources = performance.getEntriesByType('resource');
const adobeLibs = resources.filter(r => 
  r.name.includes('adobedtm') || 
  r.name.includes('at.js') || 
  r.name.includes('alloy')
);
console.table(adobeLibs);
```

---

## Development

### File Structure

```
Target-analyzer-extension/
├── manifest.json                 - Extension configuration
├── background.js                 - Core detection logic
├── popup.js                      - UI management & interaction
├── popup.html                    - Interface structure
├── popup.css                     - Complete styling system
├── icons/                        - Extension icons (16px, 48px, 128px)
├── README.md                     - This file
├── PRIVACY_POLICY.md            - Privacy policy
└── chrome-store-package/         - Chrome Web Store distribution
```

### Development Workflow

```bash
# Clone repository
git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
cd Target-analyzer-extension

# Load in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension folder

# Test on websites with Adobe Target
# - Open any website using Adobe Target
# - Click extension icon
# - Click "Start Monitoring & Reload"
```

### Code Quality Standards

**JavaScript Patterns**:
- ES6+ Classes: Modern class-based architecture
- Async/Await: Proper asynchronous handling
- Error Boundaries: Comprehensive error handling
- Memory Management: Automatic cleanup and resource management

**Security Practices**:
- Input Sanitization: All user inputs are escaped
- CSP Compliance: Content Security Policy adherence
- Minimal Permissions: Only essential permissions requested
- No External Dependencies: Pure vanilla JavaScript

### Contributing

We welcome contributions from the Adobe Target community!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Guidelines**:
- Keep the UI simple and user-friendly
- Maintain privacy-first approach (no external data sending)
- Test with both at.js and Alloy.js implementations
- Follow Chrome Extension best practices

---

## Support

### Built-in Support

- **Report Issues Directly**: Use the "🐛 Report Error or Issue" section in the Explanation tab
- **Automatic Context**: Reports include your current website, browser info, and extension state
- **Direct Email**: Issues are sent directly to our support team

### Other Support Options

- **GitHub Issues**: [Create an issue](https://github.com/nishthagoeladobe/Target-analyzer-extension/issues) for feature requests or detailed bug reports
- **Email**: nishtha.venice@gmail.com for direct support

### Reporting Issues

When reporting issues, please include:
1. **What page were you testing?** (URL)
2. **What were you doing?** (Which feature/button)
3. **What happened?** (Describe the issue)
4. **What did you expect to happen?**
5. **Screenshots** (if applicable)
6. **Console errors** (Press F12, check Console tab, copy any red errors)
7. **Your browser version** (Chrome → Settings → About Chrome)

---

## Version History

### Version 1.0.5 (Current)
- ✅ Flicker Test Feature: A/B test prehiding snippet effectiveness
- ✅ Enhanced Performance Analysis: Timing sequence with start/end times
- ✅ Improved Library Detection: Specific labels for Launch, at.js, alloy.js
- ✅ Activity Validation: Only shows activities when actually delivered

### Version 1.0.4
- ✅ Performance Tab: Comprehensive performance metrics
- ✅ Timing Sequence: See when events happen, not just duration
- ✅ Library Detection: Identify specific Adobe libraries
- ✅ Data Freshness Indicators: Shows when data was collected

### Version 1.0.0
- ✅ Initial release
- ✅ Activity detection for at.js and Alloy.js
- ✅ Excel export functionality
- ✅ Built-in error reporting
- ✅ Privacy policy

---

## License

MIT License - See LICENSE file for details

---

## Credits

**Made with ❤️ for the Adobe Target community** 🎯

Built with:
- Chrome Extension Manifest V3
- Modern JavaScript (ES6+)
- Performance API (Navigation Timing, Paint Timing, Resource Timing)
- Chrome Debugger Protocol

---

## Related Resources

- [Adobe Target Documentation](https://experienceleague.adobe.com/docs/target/using/target-home.html)
- [Adobe Experience Platform Web SDK](https://experienceleague.adobe.com/docs/experience-platform/edge/home.html)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or [contact support](#support)!
