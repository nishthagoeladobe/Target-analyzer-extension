# CSP and Observer Fix for Snippet Injector

## Issue

The snippet injector was encountering two critical errors on strict CSP (Content Security Policy) sites:

### 1. CSP Violation Error
```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'..."
```

### 2. TypeError
```
Uncaught TypeError: Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.
```

## Root Causes

### CSP Violation
- The `MutationObserver` callback was being flagged by strict CSP policies
- Even though the content script is in a separate file, the observer's dynamic callbacks can trigger CSP violations on some sites
- The observer was added for debugging purposes but was causing production issues

### TypeError
- The code tried to access `document.body` via `window.getComputedStyle(document.body)` at `document_start`
- At `document_start`, the `<body>` element doesn't exist yet - only `<head>` or `<html>` is available
- This caused `document.body` to be `null`, which cannot be passed to `getComputedStyle()`

## Solution

### Removed Debugging Observer
Removed the entire `MutationObserver` block that was:
1. Causing CSP violations on strict sites
2. Trying to access `document.body` before it existed
3. Only used for debugging/logging, not core functionality

### Simplified Code
The fix simplifies the snippet injector to only:
1. Create and inject the `<style>` element with prehiding CSS
2. Set a timeout to remove it after 3 seconds (Adobe standard)
3. Use `getElementById()` in the timeout to safely reference the element

## Updated Code

**Before (lines 42-60):**
```javascript
// Add observer to confirm snippet is working
const observer = new MutationObserver(() => {
  const prehidingStyle = document.getElementById('alloy-prehiding');
  if (prehidingStyle) {
    console.log('✅ PREHIDING ACTIVE: Style element found:', prehidingStyle);
    const bodyOpacity = window.getComputedStyle(document.body).opacity; // ❌ Fails!
    console.log('📊 PREHIDING STATUS: Body opacity =', bodyOpacity);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Stop observing after 1 second
setTimeout(() => {
  observer.disconnect();
  console.log('✅ SNIPPET INJECTOR: Observer stopped');
}, 1000);
```

**After (simplified):**
```javascript
// Set timeout to remove prehiding style (3 seconds - Adobe standard)
setTimeout(() => {
  const element = document.getElementById('alloy-prehiding');
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    console.log('⏰ PREHIDING TIMEOUT: Style removed after 3000ms');
  }
}, 3000);
```

## Testing

Test the snippet injector on sites with strict CSP policies:
- ✅ Macy's (macys.com) - Previously failing
- ✅ Bank of America (bankofamerica.com)
- Test on other strict CSP sites

## Key Learnings

1. **Content Scripts and CSP**: Even though content scripts run in a separate context, some dynamic callbacks (like `MutationObserver`) can still trigger CSP violations on very strict sites

2. **document_start Timing**: At `document_start`, only the document structure exists - `document.body` is not yet available. Always check for element existence before accessing it

3. **Keep It Simple**: Debugging/logging code (like the observer) should not be in production if it can cause failures. The core functionality (style injection) works perfectly without it

4. **getElementById is CSP-Safe**: Direct DOM queries like `getElementById()` are safe and don't trigger CSP violations, unlike dynamic callbacks

## Files Modified

- **snippet-injector.js**: Removed MutationObserver, simplified timeout logic
- **chrome-store-package/snippet-injector.js**: Synced with main version

## Related Documentation

- `CSP_FIX.md` - Original CSP fix (inline script → style element)
- `SNIPPET_INJECTION_FIX.md` - Logic for injecting vs blocking snippets
- `PREHIDING_SNIPPETS_REFERENCE.md` - Adobe Target prehiding snippet reference

---

**Fix Date**: November 3, 2025  
**Status**: ✅ Completed and Synced to Chrome Store Package

