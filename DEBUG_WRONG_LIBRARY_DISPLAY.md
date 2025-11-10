# Debug Guide: "Seeing at.js When It's Not in URL List"

## 🚨 **Your Bug Report**

**"I don't see at.js in URL list, but UI is showing at.js!"**

This is a **critical bug** - the UI should ONLY show libraries that are detected in Resource Timing API.

---

## 🔍 **How to Debug This**

### Step 1: Open Console
```
1. Open extension popup
2. Right-click popup → Inspect
3. Go to Console tab
4. Click "Refresh Metrics" on Performance tab
```

### Step 2: Check What Was Detected

Look for this console output:

```javascript
🔍 RESOURCE TIMING - HOW LIBRARIES WERE IDENTIFIED

📋 ALL Resources from window.performance.getEntriesByType("resource"):
[
  {
    url: "https://assets.adobedtm.com/.../launch-00d562a66670.min.js",
    identifiedAs: "Adobe Launch/Tags",
    matchedPattern: 'URL contains "assets.adobedtm.com" AND "launch-" → Adobe Launch/Tags',
    timing: { start: 642, duration: 156, end: 798 },
    isLibrary: true
  }
]

🏷️ LIBRARIES IDENTIFIED (what will be shown in UI):
   ✅ Adobe Launch/Tags
      URL: https://assets.adobedtm.com/.../launch-00d562a66670.min.js
      Timing: 642ms → 798ms (156ms)
```

**Question**: Is "at.js" mentioned here?
- **NO** → Then UI should NOT show at.js! ✅
- **YES** → Then there's an at.js URL in Resource Timing

---

### Step 3: Check Timing Table Display

Look for:
```javascript
📊 TIMING TABLE - WHAT WILL BE DISPLAYED IN UI
  Total events to display: 5
  
  Row #1: 🎨 First Paint
    Start: 0ms | Duration: 300ms | End: 300ms
  
  Row #2: 🎨 First Contentful Paint
    Start: 0ms | Duration: 450ms | End: 450ms
  
  Row #3: 📦 Adobe Launch/Tags
    Start: 642ms | Duration: 156ms | End: 798ms
  
  Row #4: 🎯 Target Activity Delivery 🌐
    Start: 850ms | Duration: 224ms | End: 1074ms
```

**Question**: What does Row #3 say?
- Should match what's in "LIBRARIES IDENTIFIED" above ✅
- Should NOT say "at.js" if Launch is what was detected

---

### Step 4: Compare with Actual UI

Now look at the **actual timing table** in the extension popup.

**Does it match the console output?**
- ✅ **YES** → No bug, UI is correct
- ❌ **NO** → There's a bug! UI showing different data than console

---

## ⚠️ **Warning Message Added**

The console now shows:
```
⚠️ NOTE: If you see "at.js" in UI but not in this list, there is a BUG!
   UI should ONLY show libraries from Resource Timing API above.
```

**If this warning applies to you**, take a screenshot showing:
1. Console output (what libraries were detected)
2. UI display (what libraries are shown)
3. The mismatch

---

## 🐛 **Possible Causes**

### Cause 1: Timeline Bar Label (Not Table)

The **timeline bar** at the bottom might show "Library Load Time" without specifying which library.

**Check**:
- Is it the **timing table** showing "at.js"? (the table with rows)
- OR the **timeline bar** saying "Library Load"? (visual bar chart)

**Timeline bar should say**:
```
Library Load: 156ms (Adobe Launch/Tags)  ← Specific library type!
```

Not just:
```
Library Load: 156ms  ← Missing library type
```

---

### Cause 2: Cached Data from Previous Page

Your browser might have old Performance API data from a previous page.

**Solution**:
```
1. Hard reload page (Ctrl+Shift+R)
2. Wait for page to fully load
3. Open extension → Performance tab
4. Click "Refresh Metrics"
5. Check console again
```

---

### Cause 3: Window Object Detection (Line 1194)

There's code that checks `window.adobe.target` which might exist even with alloy.js!

**This data should NOT be used for display**, but let me verify.

**Console should show**:
```javascript
perfData.targetLibrary: {
  version: "2.11.3",
  loaded: true,
  note: "Detected via window.adobe.target - may be at.js OR alloy.js"
}
```

**Important**: This is INFORMATIONAL only, NOT used for timing table!

---

## ✅ **What Console Should Show**

### Example: Your Site (Launch + alloy.js)

```javascript
🏷️ LIBRARIES IDENTIFIED (what will be shown in UI):
   ✅ Adobe Launch/Tags
      URL: https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
      Timing: 642ms → 798ms (156ms)

📊 TIMING TABLE - WHAT WILL BE DISPLAYED IN UI
  Row #3: 📦 Adobe Launch/Tags
    Start: 642ms | Duration: 156ms | End: 798ms

⚠️ NOTE: If you see "at.js" in UI but not in this list, there is a BUG!
```

**If UI shows "at.js"** → BUG! Report with console screenshot

---

## 🎯 **Correct Scenarios**

### Scenario 1: Modern Site (Launch + alloy.js)
```
Resources Detected:
  ✅ Adobe Launch/Tags (assets.adobedtm.com/.../launch-*.js)
  
API Calls Detected:
  ✅ alloy.js Interact API (/ee/v1/interact)

UI Should Show:
  📦 Adobe Launch/Tags
  🎯 Target Activity Delivery

UI Should NOT Show:
  ❌ at.js (not detected!)
  ❌ AppMeasurement (not detected!)
```

---

### Scenario 2: Legacy Site (Standalone at.js)
```
Resources Detected:
  ✅ at.js v2 (Target) (at-2.11.3.js)
  
API Calls Detected:
  ✅ at.js Delivery API (tt.omtrdc.net/delivery)

UI Should Show:
  📦 at.js v2 (Target)
  🎯 Target Activity Delivery

UI Should NOT Show:
  ❌ Adobe Launch (not detected!)
  ❌ alloy.js (not detected!)
```

---

## 🔬 **Verification Command**

Run this **on the actual page** (not extension console):

```javascript
// Get all Adobe-related resources
const resources = performance.getEntriesByType('resource');
const adobeResources = resources.filter(r => {
  const url = r.name.toLowerCase();
  return url.includes('adobedtm') ||
         url.includes('at.js') ||
         url.includes('alloy') ||
         url.includes('appmeasurement') ||
         url.includes('tt.omtrdc.net') ||
         url.includes('interact');
});

// Show what browser actually recorded
console.table(adobeResources.map(r => ({
  FileName: r.name.split('/').pop(),
  FullURL: r.name,
  StartTime: Math.round(r.startTime) + 'ms',
  Duration: Math.round(r.duration) + 'ms',
  TransferSize: r.transferSize + ' bytes'
})));
```

**Compare this with extension's detection** → Should match exactly!

---

## 📝 **Reporting the Bug**

If UI shows "at.js" when console doesn't:

**Provide**:
1. Screenshot of console showing "LIBRARIES IDENTIFIED"
2. Screenshot of UI timing table
3. Screenshot of DevTools Network tab (showing actual resources)

**Expected**:
- Console, UI, and Network tab should ALL show same libraries ✅
- If different → BUG that needs fixing

---

## 🚀 **Quick Test**

1. **Reload extension** (`chrome://extensions` → Reload)
2. **Open Performance tab**
3. **Right-click → Inspect → Console**
4. **Click "Refresh Metrics"**
5. **Read console section**: "🏷️ LIBRARIES IDENTIFIED (what will be shown in UI)"
6. **Compare with UI timing table**

**They should match exactly!**

If they don't, the enhanced console logging will show us where the bug is! 🔍

---

**Files Updated**: Synced with enhanced debugging ✅

**Next Step**: Test and share the console output so I can see exactly what's being detected vs displayed!

