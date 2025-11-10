# Test State Persistence Fix

## Issue

The snippet test was not collecting any metrics, showing the error:

```
⚠️ FLICKER TEST: Skipping collection - not in test or tab mismatch
```

This meant that when `collectFlickerTestMetrics` was called (either automatically via `webNavigation.onCompleted` or manually), it couldn't find the test state in storage.

## Root Cause

**Critical Bug in `popup.js` line 2099:**

The test flow was:
1. **Line 2073-2083**: Set test state including `flickerTestTabId`
2. **Line 2099**: Immediately REMOVE `flickerTestTabId` as part of cleanup
3. Page reloads and tries to collect metrics
4. **background.js line 997**: Check fails because `flickerTestTabId` is missing

The cleanup line was removing the very state it just set:

```javascript
// Store test state
await chrome.storage.local.set({
  flickerTestState: 'test_with_snippet',
  flickerTestTabId: this.currentTabId,  // ✅ Set
  // ... other state
});

// Immediately remove it! ❌
await chrome.storage.local.remove(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl']);
```

### Secondary Issue

**Phase 2 missing `flickerTestTabId`** (line 2131-2136):

Phase 2 was updating `flickerTestState` to `'test_without_snippet'` but wasn't re-setting `flickerTestTabId`, so if it got cleared, it would remain missing for Phase 2.

## Solution

### 1. Fixed Cleanup Logic (popup.js line 2099)

**Before:**
```javascript
await chrome.storage.local.remove(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl']);
```

**After:**
```javascript
// Clear previous test RESULTS (but keep current test state)
await chrome.storage.local.remove(['flickerTestResults', 'flickerTestUrl']);
```

Now the cleanup only removes old test *results*, not the current test *state*.

### 2. Ensured Tab ID in Phase 2 (popup.js line 2131-2140)

**Before:**
```javascript
await chrome.storage.local.set({
  flickerTestState: 'test_without_snippet',
  blockPrehidingSnippet: testContext.pageHasSnippet,
  injectPrehidingSnippet: false
});
```

**After:**
```javascript
const phase2StateData = {
  flickerTestState: 'test_without_snippet',
  flickerTestTabId: this.currentTabId,  // ✅ Explicitly set
  blockPrehidingSnippet: testContext.pageHasSnippet,
  injectPrehidingSnippet: false
};

await chrome.storage.local.set(phase2StateData);
console.log('✅ SNIPPET TEST: Stored test state for Phase 2:', phase2StateData);
```

### 3. Enhanced Logging (background.js line 997-1009)

Added comprehensive logging when the test state check fails:

```javascript
if (!testState.flickerTestState || testState.flickerTestTabId !== tabId) {
  console.warn('⚠️ FLICKER TEST: Skipping collection - not in test or tab mismatch');
  console.warn('   - flickerTestState:', testState.flickerTestState);
  console.warn('   - Expected Tab ID:', testState.flickerTestTabId);
  console.warn('   - Current Tab ID:', tabId);
  console.warn('   - State exists?', !!testState.flickerTestState);
  console.warn('   - Tab ID matches?', testState.flickerTestTabId === tabId);
  
  // Dump ALL storage to debug
  const allStorage = await chrome.storage.local.get(null);
  console.warn('   - FULL STORAGE:', allStorage);
  
  return;
}
```

### 4. Added Confirmation Logging (popup.js)

**Phase 1** (line 2073-2084):
```javascript
const testStateData = {
  flickerTestState: 'test_with_snippet',
  flickerTestTabId: this.currentTabId,
  flickerTestStartTime: Date.now(),
  pageHasSnippet: hasSnippet,
  blockPrehidingSnippet: false,
  injectPrehidingSnippet: !hasSnippet
};

await chrome.storage.local.set(testStateData);
console.log('✅ SNIPPET TEST: Stored test state for Phase 1:', testStateData);
```

**Phase 2** (line 2131-2140):
```javascript
const phase2StateData = {
  flickerTestState: 'test_without_snippet',
  flickerTestTabId: this.currentTabId,
  blockPrehidingSnippet: testContext.pageHasSnippet,
  injectPrehidingSnippet: false
};

await chrome.storage.local.set(phase2StateData);
console.log('✅ SNIPPET TEST: Stored test state for Phase 2:', phase2StateData);
```

## Test State Lifecycle (Fixed)

### Phase 1: WITH Snippet
1. ✅ Set `flickerTestState: 'test_with_snippet'` and `flickerTestTabId`
2. ✅ Clear old RESULTS (but keep STATE)
3. ✅ Reload page
4. ✅ Content scripts check `injectPrehidingSnippet` flag
5. ✅ `webNavigation.onCompleted` finds test state in storage
6. ✅ Collect metrics and store as `withSnippet`

### Phase 2: WITHOUT Snippet
1. ✅ Update `flickerTestState: 'test_without_snippet'` and keep `flickerTestTabId`
2. ✅ Reload page
3. ✅ Content scripts check `blockPrehidingSnippet` flag
4. ✅ `webNavigation.onCompleted` finds test state in storage
5. ✅ Collect metrics and store as `withoutSnippet`

### Cleanup
1. ✅ Both phases complete
2. ✅ Save final results with `flickerTestResults`, `flickerTestTabId`, `flickerTestUrl`
3. ✅ Remove test state flags: `flickerTestState`, `flickerTestTabId`, etc.

## Storage Keys (Clarified)

### During Test (temporary state)
- `flickerTestState` - Current phase: 'test_with_snippet' | 'test_without_snippet'
- `flickerTestTabId` - Tab ID being tested
- `flickerTestStartTime` - When test started
- `pageHasSnippet` - Whether page had snippet initially
- `blockPrehidingSnippet` - Flag for snippet-blocker.js
- `injectPrehidingSnippet` - Flag for snippet-injector.js

### After Test (persistent results)
- `flickerTestResults` - Object with `{withSnippet: {...}, withoutSnippet: {...}}`
- `flickerTestTabId` - Tab ID where results belong (for persistence check)
- `flickerTestUrl` - URL where results belong (for persistence check)

The distinction is crucial: test STATE is temporary (only during active test), test RESULTS are persistent (until cleared or replaced).

## What to Expect After Fix

### Console Logs (Phase 1)
```
✅ SNIPPET TEST: Stored test state for Phase 1: {flickerTestState: 'test_with_snippet', flickerTestTabId: 123456789, ...}
🧪 FLICKER TEST: Collecting metrics for state: test_with_snippet
📊 FLICKER TEST: Final metrics: {activityTime: 1234, fcp: 456, ...}
✅ FLICKER TEST: Stored WITH snippet metrics
```

### Console Logs (Phase 2)
```
✅ SNIPPET TEST: Stored test state for Phase 2: {flickerTestState: 'test_without_snippet', flickerTestTabId: 123456789, ...}
🧪 FLICKER TEST: Collecting metrics for state: test_without_snippet
📊 FLICKER TEST: Final metrics: {activityTime: 1234, fcp: 456, ...}
✅ FLICKER TEST: Stored WITHOUT snippet metrics
🎉 FLICKER TEST: Both tests complete, results saved
```

### UI Results
- **WITH Snippet**: Real values for FCP, Page Load, Activity Time, Flicker
- **WITHOUT Snippet**: Real values for FCP, Page Load, Activity Time, Flicker
- **Difference**: Calculated impact
- **Analysis**: Recommendations based on actual data

## Files Modified

1. **popup.js**:
   - Line 2099: Removed `flickerTestTabId` from cleanup
   - Line 2073-2084: Added confirmation logging for Phase 1
   - Line 2131-2140: Added `flickerTestTabId` and confirmation logging for Phase 2

2. **background.js**:
   - Line 997-1009: Enhanced debugging logs for test state check

3. **chrome-store-package/**: Synced both files

## Testing Steps

1. **Reload the extension** in `chrome://extensions/`
2. **Open console** (F12) and filter for "FLICKER TEST" or "SNIPPET TEST"
3. Go to the **Activities tab** and scan for activities
4. Click **"Test Prehiding Snippet Impact"**
5. Watch the console logs:
   - Should see "✅ SNIPPET TEST: Stored test state for Phase 1"
   - Should see "🧪 FLICKER TEST: Collecting metrics for state: test_with_snippet"
   - Should NOT see "⚠️ FLICKER TEST: Skipping collection"
6. Wait for both phases to complete
7. Check the **Snippet Test tab** for real results

## Related Documentation

- `SNIPPET_RESULTS_PERSISTENCE_FIX.md` - How results persist across tabs
- `SNIPPET_INJECTION_FIX.md` - Inject vs block logic
- `CSP_OBSERVER_FIX.md` - CSP violation fix

---

**Fix Date**: November 3, 2025  
**Status**: ✅ Completed and Synced to Chrome Store Package

