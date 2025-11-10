# 🐛 Debugging Empty Results ("-" Values)

## Issue
Snippet test runs but shows "-" for all metrics instead of actual values.

## Root Cause
Metrics collection script is failing silently. Need to check background service worker logs to see exact error.

## Enhanced Error Logging

I've added comprehensive error logging to help diagnose the issue.

### New Error Messages You Might See:

```javascript
❌ FLICKER TEST: No results returned from script execution
❌ FLICKER TEST: Result object is missing or empty
❌ FLICKER TEST: Script execution failed: [error details]
❌ FLICKER TEST: Metrics object is null or undefined
```

## How to Get Diagnostic Logs

### Step 1: Open Background Service Worker Console

1. Go to: `chrome://extensions/`
2. Find "Adobe Target Activity Inspector"
3. Click the blue **"Service worker"** link
4. You'll see a new DevTools window open

### Step 2: Clear Console & Run Test

1. In the Service Worker console, click **"Clear console"** button (🚫)
2. Go back to the website
3. Open extension → Snippet Test tab
4. Click "Run Prehiding Snippet Test"
5. Wait for test to complete

### Step 3: Copy ALL Logs

Look for logs starting with:
- `🔍 FLICKER TEST:`
- `📊 FLICKER TEST:`
- `✅ FLICKER TEST:`
- `❌ FLICKER TEST:` ← **MOST IMPORTANT** (errors)

Copy the entire console output.

## Common Issues & Solutions

### Issue 1: Tab ID Mismatch
```
⚠️ FLICKER TEST: Skipping collection - not in test or tab mismatch
```

**Cause:** Extension lost track of which tab is being tested

**Solution:** Close and reopen extension, try again

### Issue 2: Script Execution Failed
```
❌ FLICKER TEST: Script execution failed: Cannot access contents of url
```

**Cause:** Extension doesn't have permission for this website

**Solution:** 
- Check if you clicked "Allow" when extension requested permissions
- Try reloading extension
- Try a different website first (like https://example.com)

### Issue 3: No Results Returned
```
❌ FLICKER TEST: No results returned from script execution
```

**Cause:** The injected script couldn't execute or return data

**Possible reasons:**
- Page loaded too quickly/slowly
- CSP blocks script execution
- Tab was closed/navigated away during test

### Issue 4: Performance API Not Available
```
Cannot read properties of undefined (reading 'getEntriesByType')
```

**Cause:** `window.performance` API not available on this page

**Solution:** Try a different website - some pages don't expose performance API

## Temporary Diagnostic Test

Try this simple test to verify basics are working:

### Test on example.com

1. Navigate to: `https://example.com`
2. Open extension
3. Go to Snippet Test tab
4. Run test

**Expected:** At minimum, should collect FCP and Page Load metrics (even if no Target activities)

If this works → Issue is specific to Macy's or complex sites
If this fails → Issue is with extension fundamentals

## What to Share

Please share:

1. **Background Service Worker console logs** (full output)
2. **Popup console logs** (right-click extension → Inspect popup)
3. **What website** you're testing on
4. **Did you reload the extension** after latest changes?

## Quick Checklist

Before running test:

- [ ] Extension reloaded from `chrome://extensions/`
- [ ] Background service worker console is open and cleared
- [ ] Popup console is open (right-click icon → Inspect)
- [ ] Website fully loaded before starting test
- [ ] Extension has permission to access the website

## Expected Successful Logs

When working properly, you should see:

```
🔍 FLICKER TEST: collectFlickerTestMetrics called for tabId: 12345
🔍 FLICKER TEST: Current test state: {flickerTestState: "test_with_snippet", ...}
🧪 FLICKER TEST: Collecting metrics for state: test_with_snippet
🔍 FLICKER TEST: About to execute script on tab: 12345
✅ FLICKER TEST: Script execution completed, results: [...]
📊 FLICKER TEST: Collected metrics from window.performance: {fcp: 300, ...}
✅ FLICKER TEST: Stored WITH snippet metrics
```

If you see errors instead, that's what I need to see to fix the issue!

