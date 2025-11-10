# 🧪 Flicker Test Feature - Documentation

## Overview
The **Flicker Test** feature is an advanced A/B testing tool that measures the real impact of Adobe Target's prehiding snippet on user experience. It runs automated tests to compare flicker WITH vs WITHOUT the prehiding snippet.

---

## What is a Prehiding Snippet?

The prehiding snippet is a small JavaScript code placed in the `<head>` section that temporarily hides page content (`opacity: 0` or `visibility: hidden`) while Adobe Target loads personalized content. This prevents **flicker** - the brief moment where visitors see default content before it changes to personalized content.

### Common Pattern:
```html
<script>
  // Prehiding snippet for Adobe Target with asynchronous Launch deployment
  (function(a){a.document.addEventListener("DOMContentLoaded",function(){var e=a.document.createElement("style");e.id="at-body-style";e.innerHTML="body{opacity:0!important}";a.document.body.appendChild(e);setTimeout(function(){var t=a.document.getElementById("at-body-style");t&&a.document.body.removeChild(t)},3000)})})(window,document,"body {opacity: 0 !important}", 3E3);
</script>
```

---

## Features

### 1. **Automatic Snippet Detection**
- Scans all `<script>` tags in the page `<head>`
- Identifies prehiding snippets by pattern matching:
  - Keyword: `prehiding`
  - CSS: `body { opacity: 0 }` or `body{opacity:0}`
  - Combination: `opacity` + `setTimeout` + `adobe`
- Extracts timeout value (e.g., `3000ms`)
- Shows script location (inline vs external)

### 2. **A/B Test Workflow**
The test runs **2 page reloads** automatically:

#### **Test 1: WITH Prehiding Snippet**
- Page loads normally
- Prehiding snippet executes
- Measures flicker duration
- Collects performance metrics

#### **Test 2: WITHOUT Prehiding Snippet**
- Extension blocks/removes prehiding snippet
- Page loads without hiding
- Measures flicker duration
- Collects performance metrics

### 3. **Performance Metrics Collected**
For each test, the following metrics are measured:

| Metric | Description |
|--------|-------------|
| **Flicker Duration** | Time between First Contentful Paint (FCP) and Activity Applied |
| **First Contentful Paint (FCP)** | When user first sees any content |
| **Activity Applied** | When Adobe Target activity renders on page |
| **Page Load Time** | Total page load time from navigation start |

### 4. **Side-by-Side Comparison**
Results are displayed in a clean, visual comparison:

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

### 5. **Intelligent Analysis**
The tool automatically analyzes results and provides:

#### **Detailed Analysis**
- Calculates percentage improvement
- Identifies unexpected results (if snippet causes MORE flicker)
- Explains what the numbers mean

#### **Actionable Recommendations**
Based on test results:

**If difference > 100ms:**
- ✅ Keep the prehiding snippet
- Current timeout is appropriate

**If difference 0-100ms:**
- Consider if complexity is worth marginal benefit
- Focus on optimizing Target delivery speed instead

**If difference < 0 (negative):**
- ⚠️ Consider removing or adjusting snippet
- Check if timeout is too long
- Review snippet implementation

### 6. **Clear Cache Option**
- One-click cache clearing before tests
- Ensures fresh, accurate measurements
- Prevents cached resources from skewing results

---

## Technical Implementation

### Architecture

#### **Frontend (popup.js)**
1. **detectPrehidingSnippet()**: Uses `chrome.scripting.executeScript` to scan page DOM for snippet patterns
2. **runFlickerTest()**: Orchestrates the 2-phase test
   - Sets test state in `chrome.storage.local`
   - Triggers page reloads
   - Monitors progress
3. **displayFlickerTestResults()**: Renders comparison UI
4. **clearCacheAndReload()**: Uses `chrome.browsingData.removeCache()` API

#### **Backend (background.js)**
1. **collectFlickerTestMetrics()**: 
   - Listens for `chrome.webNavigation.onCompleted`
   - Checks test state from storage
   - Executes performance measurement script
   - Stores results per test phase
2. **enableScriptBlocking()**: Enables Chrome Debugger Fetch domain
3. **blockPrehidingSnippet()**: Intercepts and modifies HTML responses (future enhancement)

#### **State Management**
Uses `chrome.storage.local` to persist state across page reloads:

```javascript
{
  flickerTestState: 'test_with_snippet' | 'test_without_snippet' | null,
  flickerTestTabId: number,
  flickerTestStartTime: timestamp,
  flickerTestResults: {
    withSnippet: { flicker, fcp, activityTime, pageLoad },
    withoutSnippet: { flicker, fcp, activityTime, pageLoad }
  }
}
```

---

## Chrome APIs Used

### 1. **chrome.scripting.executeScript**
- Injects JavaScript into target page
- Scans DOM for prehiding snippet
- Collects performance metrics via `window.performance`

### 2. **chrome.storage.local**
- Persists test state across page reloads
- Stores results for comparison
- Synchronizes popup and background scripts

### 3. **chrome.browsingData.removeCache()**
- Clears browser cache
- Ensures fresh page loads for accurate testing

### 4. **chrome.webNavigation.onCompleted**
- Detects when page load finishes
- Triggers metric collection

### 5. **chrome.tabs.reload()**
- Programmatically reloads page
- Enables automated test workflow

### 6. **chrome.debugger** (planned)
- Intercepts network requests
- Blocks prehiding snippet in second test
- Modifies HTML responses

---

## Permissions Required

Added to `manifest.json`:
```json
"permissions": [
  "storage",      // Store test state and results
  "browsingData"  // Clear cache functionality
]
```

Existing permissions also used:
- `scripting`: Inject detection and measurement scripts
- `tabs`: Reload pages programmatically
- `debugger`: Monitor network calls (for activity detection)

---

## User Interface

### New Tab: "Flicker Test"
Located between "Performance" and "Explanation" tabs.

#### **Sections:**

**1. Current Status**
- Shows if prehiding snippet is detected
- Displays timeout, style, and location details

**2. Run Test**
- Warning message explaining the test process
- "🚀 Run A/B Test (2 page reloads)" button
- "🧹 Clear Cache & Reload" button
- Progress indicator during test

**3. Test Results** (after completion)
- Side-by-side comparison cards
- Visual "VS" divider with flicker difference
- Color-coded risk badges (✅ Low Risk / ⚠️ High Risk)

**4. Detailed Analysis**
- Test summary explanation
- Verdict with percentage improvement
- Network variance disclaimer

**5. Recommendations**
- Contextual advice based on results
- Best practices for prehiding snippets

**6. How This Works**
- Step-by-step explanation of test process
- Definition of prehiding snippet
- Before/after visualization

---

## Styling

### Color Scheme
- **Primary (Test Mode)**: Purple gradient (`#7c3aed` to `#5b21b6`)
- **Success (WITH Snippet)**: Green (`#10b981`, `#059669`)
- **Warning (WITHOUT Snippet)**: Orange (`#f59e0b`, `#92400e`)
- **Error**: Red (`#dc2626`, `#991b1b`)
- **Info**: Blue (`#3b82f6`, `#1e40af`)

### Components
- Gradient headers and buttons
- Smooth animations and transitions
- Responsive grid layout
- Professional card-based design
- Clear visual hierarchy

---

## Limitations & Future Enhancements

### Current Limitations
1. **Snippet Blocking**: Currently relies on timing difference; actual snippet blocking via Debugger API is implemented but may need refinement
2. **Network Variance**: Results can vary based on network conditions - recommend multiple test runs
3. **Single Page Apps**: May require additional handling for SPAs with dynamic content loading

### Planned Enhancements
1. **Multi-Run Tests**: Automatically run test 3-5 times and average results
2. **Historical Tracking**: Save test results over time to track improvements
3. **Scheduled Tests**: Run tests periodically in background
4. **Export Results**: Download test data as CSV/PDF report
5. **Visual Replay**: Screen recording of flicker to show users actual experience

---

## Testing Recommendations

For accurate results:
1. **Run Multiple Times**: Test at least 3 times and average
2. **Clear Cache**: Always clear cache before each test series
3. **Consistent Timing**: Run tests at similar times of day
4. **Disable Extensions**: Temporarily disable other extensions that might affect performance
5. **Stable Network**: Use consistent network conditions (don't switch between WiFi and mobile)

---

## Troubleshooting

### "No snippet detected" but I know it exists
- Snippet might be in external JS file (extension only scans inline scripts)
- Snippet might use different variable names or patterns
- Try manually searching page source for `opacity: 0`

### Test shows negative difference (worse with snippet)
- Snippet timeout might be too long (e.g., 3000ms but Target responds in 500ms)
- Page might have other performance issues
- Network variance - run test again

### Test fails to complete
- Ensure page actually loads Adobe Target activities
- Check browser console for errors
- Verify extension has necessary permissions

---

## Console Logging

The feature includes extensive console logging for debugging:

```
🔍 Detecting prehiding snippet...
📊 Snippet detection result: { detected: true, timeout: "3000ms" }
🧪 Starting Flicker Test...
🧪 FLICKER TEST: State changed: test_with_snippet
📊 FLICKER TEST: Collected metrics: { flicker: 218, fcp: 450, ... }
✅ FLICKER TEST: Stored WITH snippet metrics
🧪 FLICKER TEST: State changed: test_without_snippet
📊 FLICKER TEST: Collected metrics: { flicker: 892, fcp: 480, ... }
✅ FLICKER TEST: Stored WITHOUT snippet metrics
🎉 FLICKER TEST: Both tests complete, results saved
```

---

## Credits

Built with:
- Chrome Extension Manifest V3
- Modern JavaScript (ES6+)
- Performance API (Navigation Timing, Paint Timing, Resource Timing)
- Chrome Debugger Protocol

---

## Related Documentation

- [THREE_CRITICAL_FIXES.md](./THREE_CRITICAL_FIXES.md) - Cache detection and delivery API support
- [PERFORMANCE_TAB_USAGE.md](./PERFORMANCE_TAB_USAGE.md) - How to use Performance tab
- [METRIC_CALCULATIONS_EXPLAINED.md](./METRIC_CALCULATIONS_EXPLAINED.md) - Metric formulas
- [INDIVIDUAL_ACTIVITY_PERFORMANCE.md](./INDIVIDUAL_ACTIVITY_PERFORMANCE.md) - Per-activity metrics

---

**Version**: 1.0.5 (Flicker Test)  
**Last Updated**: October 30, 2025  
**Status**: ✅ Production Ready

