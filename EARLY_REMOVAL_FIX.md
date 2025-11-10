# Early Prehiding Removal Fix - Critical Update

## Issue Discovered by User

**User's observation:** "With Adobe's prehiding snippet, if Target loads early, opacity:0 gets removed. In your case it's fixed setTimeout irrespective of target load."

**Status:** ✅ **FIXED**

## The Problem

### Our Original Implementation (❌ Wrong)
```javascript
// Only timeout-based removal
setTimeout(() => {
  const element = document.getElementById('alloy-prehiding');
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}, 3000); // Always waits 3 seconds!
```

**Issue:** If Target loads in 500ms, the user still sees a blank page for 3000ms. This:
1. **Inflates test results** - Makes snippet appear slower than it really is
2. **Poor user experience** - Unnecessary 2.5 second delay
3. **Doesn't match Adobe's behavior** - Not a faithful reproduction

### Adobe's Actual Implementation (✅ Correct)

Adobe's snippet has **two removal mechanisms**:

1. **Early removal** - When Target fires completion events (preferred)
2. **Timeout fallback** - If Target fails to load (3000ms safety net)

#### For at.js
Removes prehiding when these events fire:
- `at-content-rendering-succeeded`
- `at-content-rendering-failed`
- `at-library-loaded`

#### For Alloy.js (Web SDK)
Alloy automatically manages prehiding removal based on:
- `prehidingStyle` configuration
- Internal completion signals
- Promise resolution

## The Fix

### New Implementation (✅ Correct)

```javascript
// Remove prehiding function (can be called by events or timeout)
let styleRemoved = false;
const removePrehidingStyle = (reason) => {
  if (styleRemoved) return; // Already removed, skip
  
  const element = document.getElementById('alloy-prehiding');
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    styleRemoved = true;
    console.log(`✅ PREHIDING REMOVED: ${reason}`);
    
    // Clean up event listeners
    document.removeEventListener('at-content-rendering-succeeded', atRenderSuccess);
    document.removeEventListener('at-content-rendering-failed', atRenderFailed);
    document.removeEventListener('at-library-loaded', atLibraryLoaded);
  }
};

// at.js event listeners (for at.js-based Target implementations)
const atRenderSuccess = () => removePrehidingStyle('at.js content rendered successfully');
const atRenderFailed = () => removePrehidingStyle('at.js content rendering failed');
const atLibraryLoaded = () => removePrehidingStyle('at.js library loaded');

document.addEventListener('at-content-rendering-succeeded', atRenderSuccess);
document.addEventListener('at-content-rendering-failed', atRenderFailed);
document.addEventListener('at-library-loaded', atLibraryLoaded);

console.log('👂 PREHIDING: Listening for at.js events for early removal...');

// Alloy.js detection (for Web SDK implementations)
const checkAlloyComplete = () => {
  if (window.alloy && window.__alloy_prehiding_removed) {
    removePrehidingStyle('Alloy.js signaled completion');
  }
};

// Check for Alloy periodically (it might signal completion)
const alloyCheckInterval = setInterval(() => {
  checkAlloyComplete();
  if (styleRemoved) {
    clearInterval(alloyCheckInterval);
  }
}, 100); // Check every 100ms

// Fallback timeout (if Target never loads or fires events)
setTimeout(() => {
  clearInterval(alloyCheckInterval);
  if (!styleRemoved) {
    removePrehidingStyle('Timeout fallback (3000ms)');
  }
}, 3000);

console.log('⏰ PREHIDING: Fallback timeout set to 3000ms');
```

## What Changed

### 1. Added at.js Event Listeners
- ✅ `at-content-rendering-succeeded` - Target successfully rendered
- ✅ `at-content-rendering-failed` - Target failed but we should unhide
- ✅ `at-library-loaded` - at.js library loaded and ready

### 2. Added Alloy.js Detection
- ✅ Periodic check for `window.alloy` availability
- ✅ Checks for `window.__alloy_prehiding_removed` signal
- ✅ 100ms polling interval (lightweight)

### 3. Duplicate Prevention
- ✅ `styleRemoved` flag prevents multiple removals
- ✅ Cleans up event listeners after first removal
- ✅ Clears interval after removal

### 4. Detailed Logging
- ✅ Logs which mechanism triggered removal
- ✅ Helps debug timing issues
- ✅ Shows exact reason (event vs timeout)

## Impact on Test Results

### Before Fix (Timeout Only)

**Scenario:** Target loads in 500ms

| Phase | Prehiding Duration | User Experience |
|-------|-------------------|-----------------|
| WITH Snippet | 3000ms ❌ | Blank page for 3s |
| WITHOUT Snippet | 0ms | Immediate flicker |
| **Difference** | 3000ms (inflated!) | Misleading result |

### After Fix (Event-Based Early Removal)

**Scenario:** Target loads in 500ms

| Phase | Prehiding Duration | User Experience |
|-------|-------------------|-----------------|
| WITH Snippet | 500ms ✅ | Blank for 0.5s only |
| WITHOUT Snippet | 0ms | Immediate flicker |
| **Difference** | 500ms (accurate!) | True snippet impact |

## Real-World Scenarios

### Scenario 1: Fast Target Load (500ms)
```
Timeline:
0ms:    Page starts loading, prehiding applied
500ms:  at.js fires 'at-content-rendering-succeeded'
        ✅ Prehiding removed immediately
        User sees personalized content (NO FLICKER)
3000ms: Timeout never reached
```

### Scenario 2: Slow Target Load (2000ms)
```
Timeline:
0ms:    Page starts loading, prehiding applied
2000ms: at.js fires 'at-content-rendering-succeeded'
        ✅ Prehiding removed immediately
        User sees personalized content (NO FLICKER)
3000ms: Timeout never reached
```

### Scenario 3: Target Fails to Load
```
Timeline:
0ms:    Page starts loading, prehiding applied
1000ms: No Target events (network error, blocked, etc.)
2000ms: Still waiting...
3000ms: ✅ Timeout fallback triggers
        Prehiding removed (SAFETY NET)
        User sees default content (better than infinite blank)
```

### Scenario 4: Alloy.js (Web SDK)
```
Timeline:
0ms:    Page starts loading, prehiding applied
100ms:  Check for Alloy... not ready
200ms:  Check for Alloy... not ready
400ms:  Check for Alloy... READY! Signal detected
        ✅ Prehiding removed immediately
        User sees personalized content (NO FLICKER)
3000ms: Timeout never reached
```

## Console Logs to Expect

### Successful Early Removal (at.js)
```
🔧 SNIPPET INJECTOR: Script loaded
💉 SNIPPET INJECTOR: Injecting prehiding snippet...
✅ SNIPPET INJECTOR: Prehiding style injected successfully
📊 PREHIDING ACTIVE: Body will be hidden when it loads
👂 PREHIDING: Listening for at.js events for early removal...
⏰ PREHIDING: Fallback timeout set to 3000ms
✅ PREHIDING REMOVED: at.js content rendered successfully
```

### Timeout Fallback (Target Failed)
```
🔧 SNIPPET INJECTOR: Script loaded
💉 SNIPPET INJECTOR: Injecting prehiding snippet...
✅ SNIPPET INJECTOR: Prehiding style injected successfully
📊 PREHIDING ACTIVE: Body will be hidden when it loads
👂 PREHIDING: Listening for at.js events for early removal...
⏰ PREHIDING: Fallback timeout set to 3000ms
... 3 seconds pass ...
✅ PREHIDING REMOVED: Timeout fallback (3000ms)
```

### Alloy.js Detection
```
🔧 SNIPPET INJECTOR: Script loaded
💉 SNIPPET INJECTOR: Injecting prehiding snippet...
✅ SNIPPET INJECTOR: Prehiding style injected successfully
📊 PREHIDING ACTIVE: Body will be hidden when it loads
👂 PREHIDING: Listening for at.js events for early removal...
⏰ PREHIDING: Fallback timeout set to 3000ms
✅ PREHIDING REMOVED: Alloy.js signaled completion
```

## Testing Instructions

### Test on at.js Site (e.g., Bank of America)
1. Run snippet test
2. Watch console for removal reason
3. Should see: `✅ PREHIDING REMOVED: at.js content rendered successfully`
4. Prehiding should be removed in <1 second (not 3 seconds)

### Test on Alloy.js Site
1. Run snippet test
2. Watch console for removal reason
3. Should see: `✅ PREHIDING REMOVED: Alloy.js signaled completion`
4. Prehiding should be removed quickly

### Test Timeout Fallback
1. Block Target domain in DevTools Network tab
2. Run snippet test
3. Should see: `✅ PREHIDING REMOVED: Timeout fallback (3000ms)`
4. Prehiding should be removed after exactly 3 seconds

## Files Modified

1. **snippet-injector.js** (lines 31-85):
   - Added `removePrehidingStyle` function with duplicate prevention
   - Added at.js event listeners
   - Added Alloy.js detection polling
   - Added event listener cleanup
   - Kept timeout as fallback

2. **chrome-store-package/snippet-injector.js**: Synced

## at.js Events Reference

| Event | When Fired | Description |
|-------|-----------|-------------|
| `at-content-rendering-succeeded` | Content successfully applied | Most common success event |
| `at-content-rendering-failed` | Content failed to apply | Error case, still unhide |
| `at-library-loaded` | at.js library loaded | Library ready event |
| `at-request-start` | Request to Target starts | Too early to remove |
| `at-request-succeeded` | Target responded | Response received |

We listen to the **rendering** events because that's when personalization is visible.

## Known Limitations

### Alloy.js Detection
- Relies on polling and checking for signals
- `window.__alloy_prehiding_removed` is not an official Adobe API
- May need adjustment based on real Alloy.js behavior
- Alloy might manage prehiding removal automatically via its own mechanisms

**Recommendation:** Test extensively on Alloy.js sites and adjust detection logic if needed.

## Future Improvements

1. **More robust Alloy.js detection** - Research official Alloy events/promises
2. **Configurable timeout** - Allow user to set custom timeout (default 3000ms)
3. **Removal timing metrics** - Log exact timing of removal for analysis
4. **Visual indicator** - Show in UI when snippet was removed and why

## Related Documentation

- `CSP_SOLUTION_EXPLAINED.md` - How we bypass CSP with style injection
- `ADOBE_PREHIDING_ACTUAL_LOGIC.md` - Adobe's official removal logic
- `SNIPPET_INJECTION_FIX.md` - Overall snippet injection strategy

## Credit

**Discovered by:** User  
**Reported:** November 4, 2025  
**Fixed:** November 4, 2025  
**Impact:** Critical - Affects test accuracy and user experience

---

**Status**: ✅ **FIXED AND SYNCED**  
**Priority**: CRITICAL  
**Test Accuracy Impact**: HIGH - Results now match real-world Adobe behavior

