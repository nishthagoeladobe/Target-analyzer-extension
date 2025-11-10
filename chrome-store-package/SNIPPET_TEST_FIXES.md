# 🐛 Snippet Test Critical Fixes

## Issues Fixed

### **Issue 1: WITH Snippet Shows N/A** ✅ FIXED
**Problem:** Test was collecting data for both phases, but the second (manual) collection was overwriting the saved results.

**Root Cause:**
1. `webNavigation.onCompleted` collects metrics → saves to storage → **deletes in-memory map**
2. Manual `COLLECT_FLICKER_METRICS` runs immediately after
3. Map is gone, so it creates a NEW empty map
4. Saves only WITHOUT snippet data, overwriting the complete results

**Fix:**
- Added check in `background.js` to prevent overwriting if complete results already exist in storage
- Don't delete the in-memory map immediately after saving
- Clear old results at the START of each new test

**Files Changed:**
- `background.js` (line 1201-1206): Added storage check before collecting
- `background.js` (line 1227-1228): Removed immediate map deletion
- `popup.js` (line 2018): Clear storage at test start

---

### **Issue 2: Results Disappear When Clicking Away** ✅ FIXED
**Problem:** When you navigate to another tab and come back, test results are gone.

**Root Cause:**
- Results are saved to `chrome.storage.local` correctly
- BUT the tab click handler wasn't loading saved results
- **Worse:** Tab selector was wrong! HTML uses `snippettest`, JS used `flickertest`

**Fix:**
- Fixed tab selector from `flickertest` to `snippettest`
- Added `loadSavedSnippetTestResults()` function to load from storage
- Tab click now loads saved results automatically

**Files Changed:**
- `popup.js` (line 317): Fixed tab selector
- `popup.js` (line 320): Added call to load saved results
- `popup.js` (line 1947-1978): New function to load saved results

---

## Changes Summary

### `background.js`
```javascript
// BEFORE: Overwrote results with duplicate collection
testData.withoutSnippet = metrics;
await chrome.storage.local.set({ flickerTestResults: finalResults });
this.flickerTestData.delete(tabId); // ❌ Deleted too early!

// AFTER: Check storage first, don't delete map
const existingResults = await chrome.storage.local.get(['flickerTestResults']);
if (existingResults.flickerTestResults?.withSnippet && existingResults.flickerTestResults?.withoutSnippet) {
  return; // ✅ Don't overwrite!
}
// ... save results ...
// ✅ Don't delete map - let next test clear it
```

### `popup.js`
```javascript
// BEFORE: Wrong tab name, no result loading
document.querySelector('[data-tab="flickertest"]')?.addEventListener('click', () => {
  // ❌ Never loaded saved results
});

// AFTER: Correct tab name, loads results
document.querySelector('[data-tab="snippettest"]')?.addEventListener('click', async () => {
  await this.loadSavedSnippetTestResults(); // ✅ Load from storage
  await this.showFlickerTestReady();
  this.detectPrehidingSnippet();
});
```

---

## How to Test

### **1. Reload Extension**
```
chrome://extensions/
```
Click **🔄 Reload** on "Adobe Target Activity Inspector"

### **2. Run the Test**
1. Navigate to a page with Adobe Target activities
2. Open extension → **Activities** tab → **Scan Activities**
3. Click **"🧪 Test Prehiding Snippet Impact"**
4. Wait for test to complete (~20 seconds)

### **3. Verify Fix #1 (WITH Snippet Shows Data)**
**Expected Results:**
```
WITH SNIPPET:
✅ FCP: XXXms (not N/A)
✅ Activity Delivered: XXXms (not N/A)
✅ Page Load: XXXms (not N/A)
✅ Flicker Duration: XXXms (not N/A)

WITHOUT SNIPPET:
✅ All metrics shown
```

**Console Logs Should Show:**
```
✅ FLICKER TEST: Stored WITH snippet metrics
✅ FLICKER TEST: Stored WITHOUT snippet metrics
⚠️ FLICKER TEST: Complete results already saved, skipping duplicate collection
🎉 FLICKER TEST: Both tests complete, results saved: {withSnippet: {...}, withoutSnippet: {...}}
```

### **4. Verify Fix #2 (Results Persist)**
1. After test completes, click **"Activities"** tab
2. Click back to **"Snippet Test"** tab
3. **Expected:** Results are still visible (not disappeared)

**Console Should Show:**
```
📂 Loading saved snippet test results: {withSnippet: {...}, withoutSnippet: {...}}
```

---

## What to Look For

### ✅ **Success Indicators**
- Both WITH and WITHOUT snippet show actual numbers (not N/A)
- Results persist when switching tabs
- Console shows "Complete results already saved, skipping duplicate"
- `withSnippet` object exists in saved results

### ❌ **Still Broken If...**
- WITH snippet still shows N/A values
- Results disappear when navigating away
- Console shows multiple "Both tests complete" messages with different data
- Console error: `Cannot read 'fcp' of undefined`

---

## Technical Details

### Result Storage Structure
```javascript
// Saved in chrome.storage.local as 'flickerTestResults'
{
  withSnippet: {
    fcp: 180,
    pageLoad: 1134,
    activityTime: 4344,
    flicker: 4164,
    targetCallsFound: 15
  },
  withoutSnippet: {
    fcp: 220,
    pageLoad: 1200,
    activityTime: 4500,
    flicker: 4280,
    targetCallsFound: 15
  }
}
```

### Collection Flow
```
1. User clicks "Run Test"
2. Clear old storage + in-memory data
3. Set state: test_with_snippet, blockPrehidingSnippet: false
4. Reload page
5. webNavigation.onCompleted fires → collect metrics
6. Manual COLLECT_FLICKER_METRICS → BLOCKED (duplicate detection)
7. Set state: test_without_snippet, blockPrehidingSnippet: true
8. Reload page
9. webNavigation.onCompleted fires → collect metrics
10. Check storage → already complete → SKIP
11. Manual COLLECT_FLICKER_METRICS → BLOCKED (storage check)
12. Display results from storage
```

---

## Files Modified

1. **popup.js**
   - Fixed tab selector (`flickertest` → `snippettest`)
   - Added `loadSavedSnippetTestResults()` function
   - Clear storage at test start

2. **background.js**
   - Added storage check before collecting WITHOUT snippet phase
   - Removed immediate map deletion
   - Improved duplicate detection

3. **chrome-store-package/***
   - Synced all changes

---

## Next Steps

If the issue persists:
1. Open DevTools → Console tab (both popup and background service worker)
2. Run the test
3. Copy ALL console logs from both consoles
4. Share the complete logs showing:
   - "Stored WITH snippet metrics"
   - "Stored WITHOUT snippet metrics"
   - "Both tests complete, results saved"
   - "Data validity check" from popup.js

