# Adobe Target Activity Inspector

<p align="center">
  <img src="icons/icon-128.png" alt="Adobe Target Inspector Logo" width="128" height="128">
</p>

<p align="center">
  <a href="https://chrome.google.com/webstore"><img src="https://img.shields.io/badge/Chrome%20Web%20Store-Available-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Web Store"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-orange" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Version-1.0.4-blue" alt="Version 1.0.4">
</p>

<p align="center">
  <strong>A powerful Chrome extension that detects, analyzes, and explains Adobe Target activities in real-time.</strong>
</p>

<p align="center">
  Perfect for marketers, developers, QA teams, and anyone working with Adobe Target personalization and A/B testing.
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start Guide](#quick-start-guide)
- [Feature Documentation](#feature-documentation)
  - [Activities Tab](#activities-tab)
  - [Events Tab](#events-tab)
  - [IDs Tab](#ids-tab)
  - [Performance Tab](#performance-tab)
  - [Snippet Test Tab](#snippet-test-tab)
  - [Help Tab](#help-tab)
- [Technical Specifications](#technical-specifications)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Support](#support)
- [Version History](#version-history)

---

## Overview

Adobe Target Activity Inspector provides **real-time visibility** into Adobe Target activities running on any webpage. It eliminates the need for manual DevTools debugging and makes complex Target data accessible to both technical and non-technical users.

### Who Is This For?

| Role | Benefits |
|------|----------|
| **Marketers** | See all running A/B tests and personalization campaigns instantly |
| **Developers** | Debug Target implementations without opening DevTools |
| **QA Teams** | Verify campaign implementations and targeting rules |
| **Analysts** | Export comprehensive reports for stakeholder presentations |
| **Product Managers** | Understand what personalization is running on any page |

### Why Use This Extension?

- **Save Time**: What used to take 30-60 minutes of DevTools debugging now takes 2-3 minutes
- **No Technical Expertise Required**: Plain English explanations of complex Target data
- **Real Data**: All metrics come from browser Performance APIs, not estimates
- **Privacy First**: 100% local processing, no data sent to external servers

---

## Key Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🎯 **Activity Detection** | Automatically identifies both at.js (delivery) and Alloy.js (interact) calls |
| 📊 **Real Activity Names** | Shows actual campaign names like "Holiday Promotion 2025" |
| 📡 **Network Monitoring** | Captures all Adobe Target network requests in real-time |
| 🆔 **Visitor IDs** | Displays ECID, tntId, and other visitor identifiers |
| ⚡ **Performance Analysis** | Measures Target's impact on page load times |
| 🧪 **Flicker Testing** | A/B tests prehiding snippet effectiveness |
| 📊 **Excel Export** | Download comprehensive audit reports |
| 📚 **Plain English Explanations** | Understand what every parameter means |

### Supported Implementations

- ✅ **at.js** (v1.x and v2.x) — Traditional Adobe Target
- ✅ **Alloy.js / Web SDK** — Modern Adobe Experience Platform
- ✅ **Adobe Launch/Tags** — Tag management container
- ✅ **Server-side** — Detects server-side Target calls
- ✅ **Hybrid setups** — Mixed at.js and Alloy.js on same page
- ✅ **CNAME domains** — Custom domain implementations

---

## Installation

### Option 1: Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for **"Adobe Target Activity Inspector"**
3. Click **"Add to Chrome"**
4. Confirm installation

### Option 2: Manual Installation (Development)

```bash
# Clone the repository
git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
cd Target-analyzer-extension

# Load in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode" (toggle in top-right)
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

### System Requirements

- **Browser**: Google Chrome 88+ or any Chromium-based browser (Edge, Brave, etc.)
- **Manifest**: V3 compatible
- **OS**: Windows, macOS, Linux

---

## Quick Start Guide

### Step-by-Step Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Start       │ ──► │  2. Detect      │ ──► │  3. Analyze     │
│  Monitoring     │     │  Activities     │     │  Data           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Navigate** to any website using Adobe Target
2. **Click** the extension icon in your toolbar
3. **Click** "🔍 Start Monitoring" button
4. **Wait** for page to reload and activities to be detected
5. **Explore** the detected activities, events, and performance data

### 2-Minute Demo Flow

| Step | Action | What You'll See |
|------|--------|-----------------|
| 1 | Open extension → **Activities** tab | All Target activities with names and experiences |
| 2 | Switch to **Events** tab | Complete network request history |
| 3 | Switch to **IDs** tab | Visitor identifiers (ECID, tntId) |
| 4 | Switch to **Performance** tab | Timing metrics and flicker analysis |
| 5 | Click **📊 Download Report** | Professional CSV audit report |

---

## Feature Documentation

### Activities Tab

**Purpose**: View all detected Adobe Target activities

<details>
<summary><strong>Features & Usage</strong></summary>

**What You'll See**:
- Activity list with names, experiences, and IDs
- Implementation type badges (at.js / Alloy.js)
- Summary cards showing total activities and mboxes

**How to Use**:
1. Click "🔍 Start Monitoring" to begin detection
2. Wait for activities to be detected
3. Click any activity to view detailed information
4. Use action buttons:
   - ⚡ **Analyze Performance** — Jump to performance analysis
   - 🧪 **Test Snippet Impact** — Run flicker A/B test
   - 📊 **Download Report** — Export to CSV

**Controls**:
- **Clear** — Remove all detected activities
- **Start Monitoring** — Begin/restart activity detection

</details>

### Events Tab

**Purpose**: View all Adobe Target network requests

<details>
<summary><strong>Features & Usage</strong></summary>

**What You'll See**:
- Complete list of network events
- Event type (Interact vs Delivery calls)
- Timestamp and request details

**Summary Cards**:
- **Total Events**: All captured network requests
- **Interact Calls**: Alloy.js API calls
- **Delivery Calls**: at.js API calls

**Use Cases**:
- Debug network timing issues
- Verify API calls are being made
- Inspect request/response data

</details>

### IDs Tab

**Purpose**: Display visitor identifiers

<details>
<summary><strong>Features & Usage</strong></summary>

**What You'll See**:
- **ECID** (Experience Cloud ID)
- **tntId** (Target visitor ID)
- **Marketing Cloud Visitor ID**
- **Session ID**
- **Client Code**

**How to Use**:
1. Start monitoring on Activities tab
2. Switch to IDs tab
3. Click 📋 to copy any ID value

**Use Cases**:
- Debug visitor identification issues
- Verify ECID is properly set
- QA cross-device tracking

</details>

### Performance Tab

**Purpose**: Measure Adobe Target's performance impact

<details>
<summary><strong>Features & Usage</strong></summary>

**Key Metrics**:
| Metric | Description |
|--------|-------------|
| **Page Load Time** | Total time from navigation start to load complete |
| **First Paint (FP)** | When browser first renders any pixels |
| **First Contentful Paint (FCP)** | When first DOM content is rendered |
| **Library Load Time** | Time to download Target library |
| **Activity Delivery Time** | Duration of Target API call |
| **Flicker Duration** | Time users see default content |

**Timing Sequence Table**:
Shows events in chronological order with start time, duration, and end time.

**Example Output**:
```
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #3 📦 Adobe Launch/Tags            │ 642ms      │ 156ms    │ 798ms    │
│ #4 🎯 Target Activity Delivery     │ 850ms      │ 224ms    │ 1074ms   │
│ #5 ✅ DOM Complete                 │ 0ms        │ 4.31s    │ 4.31s    │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

**Impact Analysis**:
- **Target Overhead**: Percentage of page load consumed by Target
- **Flicker Risk**: Low / Medium / High based on timing
- **Optimization Score**: Overall performance rating (0-100)

**Download Audit Report**:
Click "📊 Download Audit Report" to export a comprehensive CSV with all metrics.

</details>

### Snippet Test Tab

**Purpose**: A/B test prehiding snippet effectiveness

<details>
<summary><strong>Features & Usage</strong></summary>

**What is a Prehiding Snippet?**

The prehiding snippet is JavaScript code that temporarily hides page content (`opacity: 0`) while Adobe Target loads personalized content. This prevents **flicker** — the brief moment where visitors see default content before it changes.

**Test Process**:
1. **Test 1 (WITH Snippet)**: Page loads normally, measures flicker
2. **Test 2 (WITHOUT Snippet)**: Snippet blocked, measures flicker
3. **Comparison**: Shows side-by-side results

**Metrics Collected**:
- Flicker Duration
- First Contentful Paint
- Activity Applied Time
- Page Load Time

**How to Interpret Results**:

| Difference | Recommendation |
|------------|----------------|
| **> 100ms benefit** | ✅ Keep the prehiding snippet |
| **0-100ms benefit** | 🤔 Consider other optimizations |
| **Negative benefit** | ⚠️ Review snippet timeout |

**Example Results**:
```
WITH Snippet:    218ms flicker
WITHOUT Snippet: 892ms flicker
─────────────────────────────────
Snippet Prevents: 674ms flicker!
```

</details>

### Help Tab

**Purpose**: Learn what everything means

<details>
<summary><strong>Features & Usage</strong></summary>

**Sections**:
- What is Adobe Target?
- Response Parameters Explained
- Implementation Types (at.js vs Alloy.js)
- Alloy.js Specific Parameters
- Key Differences

**Built-in Support**:
- Report issues directly from the extension
- Automatic context collection (URL, browser info)
- Direct email to support team

</details>

---

## Technical Specifications

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │◄──►│   Background    │◄──►│ Chrome Debugger │
│   (popup.js)    │    │ Service Worker  │    │      API        │
│                 │    │ (background.js) │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    HTML/CSS     │    │  Data Storage   │    │ Network Events  │
│   Interface     │    │   (per tab)     │    │ Response Bodies │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Backend** | Chrome Extension APIs (Manifest v3) |
| **Network** | Chrome Debugger API |
| **Performance** | Navigation Timing, Resource Timing, Paint Timing APIs |
| **Storage** | Chrome Storage API (local) |
| **Build** | No build tools required |

### Network Detection Patterns

| Implementation | URL Pattern |
|----------------|-------------|
| **at.js Delivery** | `tt.omtrdc.net/rest/v1/delivery` |
| **at.js CNAME** | `/rest/v1/delivery` + `client=` |
| **Alloy.js Interact** | `/ee/v1/interact` or `/ee/or2/v1/interact` |
| **Adobe Edge** | `edge.adobedc.net`, `adobedc.demdex.net` |

### Library Detection

| Library | URL Pattern |
|---------|-------------|
| **Adobe Launch/Tags** | `assets.adobedtm.com` + `launch-` |
| **at.js v1** | `at.js` |
| **at.js v2** | `at-2.js` or `at.2.` |
| **Alloy.js** | `alloy` |
| **AppMeasurement** | `appmeasurement` |

### Permissions

| Permission | Purpose |
|------------|---------|
| `debugger` | Read Adobe Target network response bodies |
| `activeTab` | Access current tab only |
| `tabs` | Page reload functionality |
| `scripting` | Execute performance measurement scripts |
| `storage` | Store detected activities locally |
| `browsingData` | Clear cache for flicker tests |
| `webNavigation` | Detect page load completion |

### File Structure

```
Target-analyzer-extension/
├── manifest.json           # Extension configuration
├── background.js           # Core detection logic (service worker)
├── popup.js                # UI management & interaction
├── popup.html              # Interface structure
├── popup.css               # Complete styling system
├── snippet-blocker.js      # Content script for flicker tests
├── snippet-injector.js     # Content script for flicker tests
├── icons/                  # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── README.md               # This file
├── PRIVACY_POLICY.md       # Privacy policy
├── LICENSE                 # MIT license
└── chrome-store-package/   # Chrome Web Store distribution
```

---

## Privacy & Security

### Privacy-First Design

**What We Collect**:
- ✅ Adobe Target network requests (monitored locally)
- ✅ Activity data from Target responses
- ✅ Performance timing from browser APIs

**What We DO NOT Collect**:
- ❌ Personal information
- ❌ Browsing history outside Target activities
- ❌ Passwords or form data
- ❌ Data from non-Target network requests
- ❌ **Any data sent to external servers**

### Data Processing

- **100% Local**: All processing happens in your browser
- **No Cloud Storage**: Nothing stored on remote servers
- **Tab Isolation**: Each tab's data is completely separate
- **Auto Cleanup**: Data cleared when tab closes

### Security

- **Open Source**: Code can be reviewed for transparency
- **Manifest V3**: Latest Chrome extension security model
- **Minimal Permissions**: Only essential permissions requested
- **No External Dependencies**: Pure vanilla JavaScript

📄 **Full Privacy Policy**: [View Privacy Policy](https://nishthagoeladobe.github.io/Target-analyzer-extension/)

---

## Troubleshooting

### Common Issues

<details>
<summary><strong>"No activities detected"</strong></summary>

**Possible Causes**:
1. Page doesn't have Adobe Target implemented
2. Debugger permission wasn't granted
3. DevTools is open (conflicts with debugger)
4. Target activities don't match your targeting criteria

**Solutions**:
- Click "Start Monitoring & Reload" on Activities tab
- Accept the debugger permission prompt
- Close DevTools if open
- Verify Target library is loaded in Network tab

</details>

<details>
<summary><strong>"DevTools Conflict"</strong></summary>

**Cause**: Chrome only allows one debugger per tab.

**Solution**: Close DevTools or detach its debugger. The extension will show a warning if DevTools is interfering.

</details>

<details>
<summary><strong>"Performance metrics not showing"</strong></summary>

**Possible Causes**:
1. Page hasn't fully loaded
2. Performance API not available
3. Script execution blocked

**Solutions**:
- Wait for page to fully load
- Click "🔄 Refresh Metrics"
- Verify Chrome version is 88+

</details>

<details>
<summary><strong>"Extension not working"</strong></summary>

**Solutions**:
1. Reload the extension (`chrome://extensions` → Reload)
2. Check console for errors (right-click popup → Inspect)
3. Verify all permissions are granted
4. Try on a different website with Adobe Target

</details>

### Debugging Tips

**View Console Logs**:
1. Right-click extension popup → Inspect
2. Go to Console tab
3. Click buttons to see detailed logs

**Verify Detection**:
1. Open DevTools (F12) → Network tab
2. Reload page
3. Filter by "tt.omtrdc" or "interact"
4. Compare with extension output

---

## Development

### Local Development

```bash
# Clone repository
git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
cd Target-analyzer-extension

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension folder

# Make changes and test
# - Edit files
# - Click "Reload" in chrome://extensions
# - Test on websites with Adobe Target
```

### Code Quality Standards

- **ES6+ Classes**: Modern class-based architecture
- **Async/Await**: Proper asynchronous handling
- **Error Boundaries**: Comprehensive error handling
- **Memory Management**: Automatic cleanup and resource management
- **CSP Compliance**: Content Security Policy adherence

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Guidelines**:
- Keep the UI simple and user-friendly
- Maintain privacy-first approach
- Test with both at.js and Alloy.js
- Follow Chrome Extension best practices

---

## Support

### Getting Help

| Method | Use For |
|--------|---------|
| **Built-in Report** | Use "🐛 Report Error" in Help tab |
| **GitHub Issues** | [Create an issue](https://github.com/nishthagoeladobe/Target-analyzer-extension/issues) |
| **Email** | nishtha.venice@gmail.com |

### When Reporting Issues

Please include:
1. Website URL (if shareable)
2. What you were doing
3. What happened vs. expected
4. Screenshots (if applicable)
5. Console errors (F12 → Console)
6. Browser version

---

## Version History

### v1.0.4 (Current)
- ✅ Events Tab: Complete network request monitoring
- ✅ IDs Tab: Visitor identifier display
- ✅ Download Audit Report: Comprehensive CSV export
- ✅ Workflow Steps: Visual progress indicator
- ✅ Enhanced UI: Modern sidebar navigation

### v1.0.3
- ✅ Flicker Test Feature: A/B test prehiding snippet
- ✅ Enhanced Performance Analysis: Timing sequence
- ✅ Improved Library Detection: Specific labels

### v1.0.0
- ✅ Initial release
- ✅ Activity detection (at.js and Alloy.js)
- ✅ Excel export functionality
- ✅ Built-in error reporting
- ✅ Privacy policy

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Credits

**Made with ❤️ for the Adobe Target community**

### Built With
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+)
- Performance API (Navigation, Resource, Paint Timing)
- Chrome Debugger Protocol

### Related Resources
- [Adobe Target Documentation](https://experienceleague.adobe.com/docs/target/using/target-home.html)
- [Adobe Experience Platform Web SDK](https://experienceleague.adobe.com/docs/experience-platform/edge/home.html)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

---

<p align="center">
  <a href="#installation">Install</a> •
  <a href="#quick-start-guide">Quick Start</a> •
  <a href="#feature-documentation">Features</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#support">Support</a>
</p>

<p align="center">
  <strong>Questions?</strong> Check <a href="#troubleshooting">Troubleshooting</a> or <a href="#support">contact support</a>!
</p>
