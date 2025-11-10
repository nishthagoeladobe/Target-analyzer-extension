# Data Source Truth - What Comes from Where

## 🎯 **Your Critical Question**

**"Which Adobe library loaded at what time - that's not in window.performance!"**

**100% CORRECT!** Let me show you the complete truth about our data sources:

---

## 📊 **What Performance API Actually Gives Us**

### Browser's Performance API Contains:
```javascript
window.performance.getEntriesByType('resource')

// Returns for EACH resource:
{
  name: "https://assets.adobedtm.com/.../launch-00d562a66670.min.js",  // ✅ URL
  startTime: 642.89,          // ✅ When download started
  duration: 156.20,           // ✅ How long it took
  transferSize: 245678,       // ✅ Bytes transferred
  initiatorType: "script",    // ✅ What triggered it
  
  // ❌ Browser does NOT give us:
  libraryType: ???            // Browser doesn't know "Adobe Launch"
  isAdobeLibrary: ???         // Browser doesn't identify vendors
  purpose: ???                // Browser doesn't know what it does
}
```

---

## 🔧 **How We Add Intelligence**

### Data from Browser (100% Real)
```
✅ URL:        From window.performance.getEntriesByType('resource')
✅ Start Time: From resource.startTime
✅ Duration:   From resource.duration
✅ End Time:   Calculated: startTime + duration
✅ Cached:     From resource.transferSize === 0
```

### Data from Our Analysis (Pattern Matching)
```
🔍 Library Type: By parsing URL
   - URL contains "launch-" → Adobe Launch/Tags
   - URL contains "at.js" → at.js (Target)
   - URL contains "alloy" → alloy.js (Web SDK)

🔍 API Type: By parsing URL
   - URL contains "/delivery" → at.js API
   - URL contains "/interact" → alloy.js API
```

---

## 🔬 **Complete Data Flow**

### Your Site: Launch with alloy.js

**Step 1: Browser Records (Automatic)**
```javascript
// When page loads, browser automatically records:
performance.getEntriesByType('resource') = [
  {
    name: "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js",
    startTime: 642.89,
    duration: 156.20,
    transferSize: 245678
  },
  {
    name: "https://edge.adobedc.net/ee/v1/interact?configId=abc123...",
    startTime: 850.45,
    duration: 224.12,
    transferSize: 2834
  }
]
```

**Step 2: Extension Reads (When You Click Refresh)**
```javascript
// Get resources from browser
const resources = window.performance.getEntriesByType('resource');
```

**Step 3: Extension Identifies (URL Pattern Matching)**
```javascript
resources.forEach(resource => {
  const url = resource.name;
  
  // First resource
  if (url.includes('assets.adobedtm.com') && url.includes('launch-')) {
    console.log('✅ DETECTED: Adobe Launch/Tags');
    console.log('   URL:', url);
    console.log('   Pattern: URL contains "assets.adobedtm.com" + "launch-"');
    
    libraryType = 'Adobe Launch/Tags';
    timing = {
      start: resource.startTime,   // From browser ✅
      duration: resource.duration, // From browser ✅
      end: resource.startTime + resource.duration
    };
  }
  
  // Second resource
  if (url.includes('/interact')) {
    console.log('🎯 DETECTED TARGET API CALL: alloy.js Interact API');
    console.log('   URL:', url);
    
    apiType = 'alloy.js Interact';
    timing = {
      start: resource.startTime,   // From browser ✅
      duration: resource.duration, // From browser ✅
      cached: resource.transferSize === 0 // From browser ✅
    };
  }
});
```

**Step 4: Extension Displays**
```
Timing Table:
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 📦 Adobe Launch/Tags            │ 642ms      │ 156ms    │ 798ms    │
│ #2 🎯 Target Activity Delivery 🌐  │ 850ms      │ 224ms    │ 1074ms   │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

---

## 📋 **Data Attribution Table**

| What You See | Data Source | How Determined |
|-------------|-------------|----------------|
| **Start Time: 642ms** | `resource.startTime` from Performance API | Browser measurement ✅ |
| **Duration: 156ms** | `resource.duration` from Performance API | Browser measurement ✅ |
| **End Time: 798ms** | Calculated: `start + duration` | Simple math ✅ |
| **"Adobe Launch/Tags"** | URL pattern matching | We parse the URL ✅ |
| **🌐 network** | `resource.transferSize > 0` | Browser measurement ✅ |
| **⚡ cached** | `resource.transferSize === 0` | Browser measurement ✅ |

---

## 🔍 **How to Verify Our Detection**

### Verification Test

**Run this on YOUR page console**:
```javascript
// 1. Get all resources
const allResources = performance.getEntriesByType('resource');

// 2. Filter Adobe resources
const adobeResources = allResources.filter(r => {
  const url = r.name.toLowerCase();
  return url.includes('adobedtm') || 
         url.includes('at.js') || 
         url.includes('alloy') ||
         url.includes('tt.omtrdc.net') ||
         url.includes('interact');
});

// 3. Show what browser gave us
console.table(adobeResources.map(r => ({
  URL: r.name,
  StartTime: Math.round(r.startTime) + 'ms',
  Duration: Math.round(r.duration) + 'ms',
  EndTime: Math.round(r.startTime + r.duration) + 'ms',
  TransferSize: r.transferSize + ' bytes',
  Cached: r.transferSize === 0 ? 'YES' : 'NO'
})));
```

**Then compare with extension** → Should match! ✅

---

## 🎓 **The Complete Picture**

### What Browser Gives Us (Raw Data)
```
Browser's Performance API:
  ✅ URLs of all resources loaded
  ✅ Timing for each resource (start, duration)
  ✅ Transfer sizes (for cache detection)
  ✅ Resource types (script, xhr, fetch, etc.)
```

### What Browser Does NOT Give Us
```
Browser's Performance API:
  ❌ "This is Adobe Launch" (doesn't identify vendors)
  ❌ "This is a Target API call" (doesn't know purposes)
  ❌ "This is for personalization" (doesn't understand business logic)
```

### What Extension Adds (Intelligence Layer)
```
Extension's URL Pattern Matching:
  🔍 Parses URLs to identify Adobe products
  🔍 Distinguishes between libraries (Launch vs at.js vs alloy)
  🔍 Identifies API call types (delivery vs interact)
  🔍 Labels everything clearly
```

---

## ⚡ **Why Results Are Instant**

### Timeline
```
10:30:42 AM  →  Page loads
             →  Browser records ALL resource timing to memory
             →  URLs, start times, durations all saved

10:35:00 AM  →  You click "Refresh Metrics"
             →  Extension reads window.performance (instant! already in memory)
             →  Extension parses URLs (instant! just string matching)
             →  Extension shows results (instant! all data ready)
```

**The instant response is CORRECT** because:
1. ✅ Browser already recorded everything during page load
2. ✅ We're just reading from memory (instant)
3. ✅ URL parsing is fast (milliseconds)
4. ✅ No network calls needed

---

## 📁 **Files Updated**

✅ `popup.js` - Added detailed URL detection logging
✅ `popup.html` - Added data freshness banner
✅ `popup.css` - Styled freshness indicators
✅ `URL_PATTERN_DETECTION.md` - Complete detection methodology
✅ `DATA_SOURCE_TRUTH.md` - This document

---

## 🎯 **Test Instructions**

### See Detection in Action

1. **Reload extension** (`chrome://extensions` → Reload)
2. **Open Performance tab**
3. **Right-click popup → Inspect → Console**
4. **Click "Refresh Metrics"**

**Console will show**:
```javascript
✅ DETECTED: Adobe Launch/Tags
   URL: https://assets.adobedtm.com/.../launch-00d562a66670.min.js
   Pattern: URL contains: "assets.adobedtm.com" + "launch-"

🎯 DETECTED TARGET API CALL: alloy.js Interact API
   URL: https://edge.adobedc.net/ee/v1/interact?...
   Timing: { startTime: 850ms, duration: 224ms, endTime: 1074ms, cached: NO }
```

**Verify**:
- ✅ URLs match resources in DevTools Network tab
- ✅ Library types make sense for your site
- ✅ Timing values are reasonable
- ✅ No mentions of libraries you don't have (like at.js if you use alloy)

---

**The data is REAL from Performance API!**
**The library labels come from URL pattern matching!**
**The console shows EXACTLY how we detected everything!** 🔍✅

