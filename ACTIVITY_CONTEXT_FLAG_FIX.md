# Activity Context Flag Persistence Fix

## Issue

The Snippet Test tab was always showing:
```
✅ Ready to Test!
Detected 13 Adobe Target activities.
```

Even when:
- Opening the extension on a fresh page
- Not coming from the Activities tab
- The activity count was from a previous session

## Root Cause

**Two bugs were causing this issue:**

### 1. Variable Name Mismatch (lines 264 & 1819)

**Setting the flag** (line 264 in Activities tab button handler):
```javascript
await chrome.storage.local.set({
  snippetTestWithActivities: true,  // ✅ Correct name
  snippetTestActivitiesCount: this.activities.length
});
```

**Reading the flag** (line 1819 in `showFlickerTestReady()`):
```javascript
const testContext = await chrome.storage.local.get([
  'flickerTestWithActivities',  // ❌ Wrong name! (missing 'snippet')
  'flickerTestActivitiesCount'
]);
```

Because the names didn't match, the check at line 1823 was looking for a non-existent key, which could have been set by an older version or different code path, causing unexpected behavior.

### 2. Flags Never Cleared on Popup Open

The activity context flags (`snippetTestWithActivities`, `snippetTestActivitiesCount`) were:
- ✅ Set when clicking "Test Prehiding Snippet Impact" button
- ✅ Cleared after test completes (line 2178)
- ❌ **NOT** cleared when popup opens on a new session

This meant:
1. User scans 13 activities on Page A
2. Clicks "Test Prehiding Snippet Impact"
3. Closes popup without running test
4. Navigates to Page B (different page entirely)
5. Opens popup → Snippet Test tab
6. Still shows "Detected 13 Adobe Target activities" ❌ (stale data from Page A!)

## Solution

### Fix 1: Corrected Variable Names

**Line 1819** - Fixed `get()` call:
```javascript
const testContext = await chrome.storage.local.get([
  'snippetTestWithActivities',   // ✅ Now matches
  'snippetTestActivitiesCount'   // ✅ Already correct
]);
```

**Line 1823** - Fixed condition check:
```javascript
if (testContext.snippetTestWithActivities && testContext.snippetTestActivitiesCount > 0) {
  // ✅ Now checking correct variable names
```

### Fix 2: Clear Flags on Popup Open

**Line 61-64** in `clearStaleSnippetResults()`:
```javascript
// Clear activity context flags when popup opens (they're only valid for immediate transitions)
// The "Test Prehiding Snippet Impact" button will set them fresh before switching tabs
await chrome.storage.local.remove(['snippetTestWithActivities', 'snippetTestActivitiesCount']);
console.log('🧹 Cleared activity context flags (will be reset if coming from Activities tab)');
```

This ensures:
- Every time the popup opens, activity context flags are cleared
- They're only set fresh when the user actively clicks the button
- They don't persist across popup sessions or page navigations

### Fix 3: Ensure Cleanup After Test

**Line 2178** - Added flags to cleanup:
```javascript
await chrome.storage.local.remove([
  'flickerTestState', 
  'flickerTestTabId', 
  'flickerTestStartTime', 
  'blockPrehidingSnippet', 
  'injectPrehidingSnippet', 
  'pageHasSnippet',
  'snippetTestWithActivities',      // ✅ Added
  'snippetTestActivitiesCount'      // ✅ Added
]);
```

## Expected Flow After Fix

### Scenario 1: Direct Access to Snippet Test Tab
1. User opens popup
2. `init()` → `clearStaleSnippetResults()` → Clears activity context flags
3. User clicks Snippet Test tab
4. `showFlickerTestReady()` → Checks flags → Not found
5. Shows **default warning message**: "Go to Activities tab first..."

### Scenario 2: Coming from Activities Tab
1. User opens popup
2. `init()` → `clearStaleSnippetResults()` → Clears activity context flags
3. User goes to Activities tab
4. Scans and finds 13 activities
5. Clicks "Test Prehiding Snippet Impact" button
6. Button handler sets fresh flags:
   ```javascript
   snippetTestWithActivities: true
   snippetTestActivitiesCount: 13
   ```
7. Immediately switches to Snippet Test tab (same popup session)
8. `showFlickerTestReady()` → Checks flags → Found!
9. Shows **success message**: "✅ Ready to Test! Detected 13 Adobe Target activities."

### Scenario 3: After Test Completes
1. Test runs successfully
2. Results displayed
3. Cleanup at line 2178 removes all flags
4. Next time popup opens → Back to default warning message

### Scenario 4: Closing Popup Before Test
1. User clicks "Test Prehiding Snippet Impact"
2. Flags are set, switches to Snippet Test tab
3. User closes popup without running test
4. Next time popup opens → Flags are cleared immediately
5. Shows default warning message (not stale "13 activities" from before)

## Storage Keys Lifecycle

### Activity Context Flags (Ephemeral - cleared on popup open)
- `snippetTestWithActivities` - Boolean indicating Activities tab context
- `snippetTestActivitiesCount` - Number of activities detected

**Lifetime**: 
- Set: When clicking "Test Prehiding Snippet Impact"
- Cleared: On popup open (line 63) OR after test completes (line 2178)

### Test State Flags (Active during test)
- `flickerTestState` - Current test phase
- `flickerTestTabId` - Tab being tested
- `blockPrehidingSnippet` - Content script flag
- `injectPrehidingSnippet` - Content script flag

**Lifetime**:
- Set: During test execution
- Cleared: After test completes

### Test Results (Persistent until replaced or invalidated)
- `flickerTestResults` - Complete test results
- `flickerTestTabId` - Which tab results belong to
- `flickerTestUrl` - Which URL results belong to

**Lifetime**:
- Set: After test completes
- Cleared: When results are for different tab/URL

## Testing Checklist

1. ✅ **Fresh Open**: Open popup → Go to Snippet Test tab → Should show warning (not success message)

2. ✅ **Activities Flow**: Activities tab → Scan → Click button → Should show success with correct count

3. ✅ **After Test**: Complete test → Close popup → Reopen → Snippet Test tab → Should show warning

4. ✅ **Different Page**: Set context on Page A → Close popup → Navigate to Page B → Open popup → Should show warning

5. ✅ **Console Logs**: Check for "🧹 Cleared activity context flags" message on popup open

## Console Logs to Expect

**On popup open:**
```
🧹 Cleared activity context flags (will be reset if coming from Activities tab)
```

**When clicking "Test Prehiding Snippet Impact":**
```
(Flags are set silently - no specific log)
```

**On Snippet Test tab when context exists:**
```
(Shows ✅ Ready to Test! banner in UI)
```

**On Snippet Test tab when context missing:**
```
(Shows ⚠️ Important banner in UI)
```

## Files Modified

1. **popup.js**:
   - Line 1819: Fixed `get()` to use `snippetTestWithActivities`
   - Line 1823: Fixed condition to check `snippetTestWithActivities`
   - Line 61-64: Clear flags on popup open
   - Line 2178: Ensure flags cleared after test completes

2. **chrome-store-package/popup.js**: Synced

## Related Issues

- **TEST_STATE_PERSISTENCE_FIX.md** - Fixed `flickerTestTabId` being removed prematurely
- **SNIPPET_RESULTS_PERSISTENCE_FIX.md** - How test results persist correctly
- **PREHIDING_SNIPPET_TEST_REDESIGN.md** - Overall snippet test design

---

**Fix Date**: November 3, 2025  
**Status**: ✅ Completed and Synced to Chrome Store Package

