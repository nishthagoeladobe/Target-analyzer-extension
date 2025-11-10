# How We Identify Adobe Libraries from Performance API

## ❓ **Your Critical Question**

**"Which Adobe library loaded and at what time - that's not in window.performance object!"**

**You're 100% correct!** The Performance API gives us:
- ✅ URL of resource
- ✅ Timing data (start, duration, end)
- ❌ **NOT** "this is Adobe Launch" or "this is at.js"

**We have to identify libraries by parsing the URL!**

---

## 🔍 **How Library Detection Actually Works**

### Step 1: Get All Resources from Browser
```javascript
const resources = window.performance.getEntriesByType('resource');

// Browser gives us raw data like:
[
  {
    name: "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js",
    startTime: 642.89,
    duration: 156.20,
    transferSize: 245678,
    initiatorType: "script"
  },
  {
    name: "https://edge.adobedc.net/ee/v1/interact?configId=xyz...",
    startTime: 850.45,
    duration: 224.12,
    transferSize: 2834,
    initiatorType: "xmlhttprequest"
  }
  // ... hundreds more resources
]
```

**Browser doesn't say**: "This is Adobe Launch" or "This is a Target API call"
**Browser only says**: "Here's the URL and timing"

---

### Step 2: Parse URLs to Identify Adobe Libraries

```javascript
resources.forEach(resource => {
  const url = resource.name.toLowerCase();
  
  // PATTERN MATCHING to identify library
  if (url.includes('assets.adobedtm.com') && url.includes('launch-')) {
    console.log('✅ DETECTED: Adobe Launch/Tags');
    console.log('   URL:', resource.name);
    console.log('   Pattern: URL contains "assets.adobedtm.com" + "launch-"');
    console.log('   Timing:', {
      startTime: resource.startTime,
      duration: resource.duration,
      endTime: resource.startTime + resource.duration
    });
  }
});
```

---

## 📋 **URL Pattern Matching Rules**

### 1. Adobe Launch/Tags
**Pattern**: URL contains **both** `assets.adobedtm.com` **AND** `launch-`

**Example URLs**:
```
✅ https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
✅ https://assets.adobedtm.com/abc123/def456/launch-xyz789.min.js
❌ https://assets.adobedtm.com/abc123/at.js (no "launch-")
❌ https://cdn.example.com/launch.js (not adobedtm.com)
```

**Detection Logic**:
```javascript
if (url.includes('assets.adobedtm.com') && url.includes('launch-')) {
  libraryType = 'Adobe Launch/Tags';
}
```

---

### 2. at.js v2 (Adobe Target)
**Pattern**: URL contains `at-2.js` **OR** `at.2.`

**Example URLs**:
```
✅ https://yoursite.com/at-2.11.3.js
✅ https://cdn.yoursite.com/libs/at.2.js
✅ https://assets.adobedtm.com/at-2.js
❌ https://yoursite.com/at.js (not version 2)
```

**Detection Logic**:
```javascript
if (url.includes('at-2.js') || url.includes('at.2.')) {
  libraryType = 'at.js v2 (Target)';
}
```

---

### 3. at.js v1 (Adobe Target - Legacy)
**Pattern**: URL contains `at.js` (but not at-2.js)

**Example URLs**:
```
✅ https://yoursite.com/at.js
✅ https://cdn.yoursite.com/libs/at.1.8.0.js → Contains "at.js"
✅ https://example.com/target/at.js
❌ https://yoursite.com/at-2.js (this is v2, caught by previous rule)
```

**Detection Logic**:
```javascript
else if (url.includes('at.js')) {
  libraryType = 'at.js (Target)';
}
```

---

### 4. alloy.js (AEP Web SDK)
**Pattern**: URL contains `alloy`

**Example URLs**:
```
✅ https://cdn1.adoberesources.net/alloy/2.19.0/alloy.min.js
✅ https://yoursite.com/alloy.js
✅ https://cdn.example.com/libs/alloy-2.19.0.js
```

**Detection Logic**:
```javascript
else if (url.includes('alloy')) {
  libraryType = 'alloy.js (AEP Web SDK)';
}
```

---

### 5. AppMeasurement.js (Adobe Analytics)
**Pattern**: URL contains `appmeasurement`

**Example URLs**:
```
✅ https://yoursite.com/AppMeasurement.js
✅ https://cdn.example.com/s_code/AppMeasurement-2.22.0.js
```

**Detection Logic**:
```javascript
else if (url.includes('appmeasurement')) {
  libraryType = 'AppMeasurement.js (Analytics)';
}
```

---

## 🎯 **Target API Call Detection**

### at.js API Calls
**Pattern**: URL contains `tt.omtrdc.net` **AND** `/delivery`

**Example URLs**:
```
✅ https://yourcompany.tt.omtrdc.net/rest/v1/delivery?client=yourcompany&sessionId=xyz
✅ https://custom.tt.omtrdc.net/rest/v1/delivery?client=custom&...
```

**Detection**:
```javascript
if (url.includes('tt.omtrdc.net') && url.includes('/delivery')) {
  apiType = 'at.js Delivery API';
}
```

---

### alloy.js API Calls  
**Pattern**: URL contains `/interact`

**Example URLs**:
```
✅ https://edge.adobedc.net/ee/v1/interact?configId=xyz...
✅ https://edge.adobedc.net/ee/or2/v1/interact?...
✅ https://custom-edge.adobe.net/ee/v1/interact?...
```

**Detection**:
```javascript
if (url.includes('/interact')) {
  apiType = 'alloy.js Interact API';
}
```

---

## 🔬 **Console Output - See Detection in Action**

### When You Click "Refresh Metrics"

**Console shows EXACTLY how we detected each library**:

```javascript
✅ DETECTED: Adobe Launch/Tags
   URL: https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
   Pattern: URL contains: "assets.adobedtm.com" + "launch-"

🎯 DETECTED TARGET API CALL: alloy.js Interact API
   URL: https://edge.adobedc.net/ee/v1/interact?configId=abc123...
   Timing: {
     startTime: 850ms,
     duration: 224ms,
     endTime: 1074ms,
     cached: NO (🌐 network),
     transferSize: 2834 bytes
   }

🔍 RESOURCE TIMING - HOW LIBRARIES WERE IDENTIFIED
  📋 All Resources from window.performance.getEntriesByType("resource"):
  [
    {
      url: "https://assets.adobedtm.com/.../launch-00d562a66670.min.js",
      identifiedAs: "Adobe Launch/Tags",
      matchedPattern: 'URL contains "assets.adobedtm.com" AND "launch-" → Adobe Launch/Tags',
      timing: { start: 642, duration: 156, end: 798 }
    }
  ]
```

---

## 📊 **Real Example - Your Site**

### What Browser Records (Raw)
```javascript
window.performance.getEntriesByType('resource')

// Returns hundreds of entries, including:
{
  name: "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js",
  startTime: 642.89,
  duration: 156.20,
  transferSize: 245678,
  // Browser doesn't know this is "Adobe Launch"! ❌
}
```

### How Extension Identifies It
```javascript
const url = "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js";
const lowerUrl = url.toLowerCase();

// Pattern check
if (lowerUrl.includes('assets.adobedtm.com') && lowerUrl.includes('launch-')) {
  libraryType = 'Adobe Launch/Tags'; // ✅ Identified!
}
```

### What You See in Extension
```
📦 Adobe Launch/Tags
   Start: 642ms
   Duration: 156ms
   End: 798ms
```

---

## 🎓 **How to Verify Detection is Correct**

### Test 1: Check Console Logs

**Open popup console** (right-click popup → Inspect → Console)

**Click "Refresh Metrics"**

**Look for**:
```
✅ DETECTED: Adobe Launch/Tags
   URL: https://assets.adobedtm.com/.../launch-00d562a66670.min.js
   Pattern: URL contains: "assets.adobedtm.com" + "launch-"
```

**Verify**:
- ✅ URL matches what's on your site?
- ✅ Pattern makes sense?
- ✅ Library type is correct?

---

### Test 2: Compare with DevTools

**DevTools Network Tab**:
```
1. Open Network tab
2. Reload page
3. Find Launch library
4. Check URL
```

**DevTools shows**:
```
Name: launch-00d562a66670.min.js
URL: https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
```

**Extension should detect**: `Adobe Launch/Tags` ✅

---

### Test 3: Verify on Page Itself

**Browser console on the page**:
```javascript
// Run this on YOUR page
const resources = performance.getEntriesByType('resource');
const adobeLibs = resources.filter(r => 
  r.name.includes('adobedtm') || 
  r.name.includes('at.js') || 
  r.name.includes('alloy')
);

console.table(adobeLibs.map(r => ({
  url: r.name,
  startTime: Math.round(r.startTime),
  duration: Math.round(r.duration),
  transferSize: r.transferSize
})));
```

**Compare this output with extension** → Should match! ✅

---

## 🚨 **Common Detection Issues**

### Issue 1: "Extension shows at.js but I use alloy.js"

**Cause**: URL might contain both strings
```
❌ https://cdn.example.com/alloy-at.js
```

**This would match**: `url.includes('at.js')` even though it's alloy!

**Fix**: Check patterns in order (alloy BEFORE at.js)
```javascript
if (url.includes('alloy')) {
  return 'alloy.js';  // ✅ Caught first
}
else if (url.includes('at.js')) {
  return 'at.js';     // Won't match if already matched alloy
}
```

---

### Issue 2: "No library detected but I see Launch in Network tab"

**Cause**: URL pattern doesn't match our rules

**Example**: Custom-hosted Launch
```
❌ https://mycdn.example.com/adobe-tag-manager.js
```

**This doesn't match**: `assets.adobedtm.com` (different domain!)

**Solution**: Extension can't detect non-standard URLs
**Workaround**: Check console to see what URL patterns exist

---

### Issue 3: "Wrong API type shown"

**Cause**: URL pattern ambiguity

**Example**: CNAME implementation
```
https://custom.mysite.com/delivery?client=mysite...
```

**This might not match**: `tt.omtrdc.net` (using CNAME!)

**Solution**: Add more patterns or check console for actual URLs

---

## 📚 **Complete Detection Reference**

### Libraries Detected

| Library Type | URL Pattern | Example URL |
|-------------|-------------|-------------|
| **Adobe Launch** | `assets.adobedtm.com` + `launch-` | `https://assets.adobedtm.com/.../launch-abc.min.js` |
| **at.js v2** | `at-2.js` or `at.2.` | `https://site.com/at-2.11.3.js` |
| **at.js v1** | `at.js` | `https://site.com/at.js` |
| **alloy.js** | `alloy` | `https://cdn1.adoberesources.net/alloy/2.19.0/alloy.min.js` |
| **AppMeasurement** | `appmeasurement` | `https://site.com/AppMeasurement.js` |

### API Calls Detected

| API Type | URL Pattern | Example URL |
|----------|-------------|-------------|
| **at.js Delivery** | `tt.omtrdc.net` + `/delivery` | `https://company.tt.omtrdc.net/rest/v1/delivery?...` |
| **alloy.js Interact** | `/interact` | `https://edge.adobedc.net/ee/v1/interact?...` |
| **Adobe Edge** | `adobe` + `/ee/` | `https://edge.adobedc.net/ee/or2/v1/...` |

---

## 🎯 **Real Example: Your Site**

### What Browser Sees (Raw Performance API)
```javascript
window.performance.getEntriesByType('resource')

// Returns:
{
  name: "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js",
  startTime: 642.89,
  duration: 156.20,
  transferSize: 245678,
  initiatorType: "script",
  entryType: "resource"
}
```

**Browser knows**: URL, timing, size
**Browser doesn't know**: "This is Adobe Launch" ❌

---

### How Extension Identifies It
```javascript
const url = "https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js";

// Step 1: Check URL pattern
url.toLowerCase().includes('assets.adobedtm.com')  // ✅ true
url.toLowerCase().includes('launch-')              // ✅ true

// Step 2: Both conditions met → Adobe Launch!
libraryType = 'Adobe Launch/Tags';

// Step 3: Extract timing (already from Performance API)
timing = {
  startTime: 642ms,
  duration: 156ms,
  endTime: 798ms
};
```

---

### Console Output Shows Detection
```javascript
✅ DETECTED: Adobe Launch/Tags
   URL: https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
   Pattern: URL contains: "assets.adobedtm.com" + "launch-"
   Timing: { startTime: 642ms, duration: 156ms, endTime: 798ms }
```

**You can verify**:
1. ✅ URL is correct (matches your site)
2. ✅ Pattern matching logic is shown
3. ✅ Timing is from Performance API
4. ✅ Detection is transparent

---

## 🔍 **How to Debug Detection**

### Step 1: Open Popup Console
```
1. Open extension popup
2. Right-click → Inspect
3. Console tab
```

### Step 2: Click "Refresh Metrics"

### Step 3: Look for Detection Logs
```javascript
// You'll see logs like:
✅ DETECTED: Adobe Launch/Tags
   URL: https://assets.adobedtm.com/.../launch-00d562a66670.min.js
   Pattern: URL contains: "assets.adobedtm.com" + "launch-"

🎯 DETECTED TARGET API CALL: alloy.js Interact API
   URL: https://edge.adobedc.net/ee/v1/interact?configId=...
   Timing: {
     startTime: 850ms,
     duration: 224ms,
     endTime: 1074ms,
     cached: NO (🌐 network),
     transferSize: 2834 bytes
   }
```

### Step 4: Verify URLs Match Your Site
```
1. DevTools → Network tab
2. Find same resources
3. Compare URLs
→ Should match exactly! ✅
```

---

## 💡 **Why We Do URL Pattern Matching**

### Option 1: Parse URL (What We Do) ✅
```javascript
const url = resource.name;
if (url.includes('launch-')) {
  type = 'Adobe Launch';
}
```

**Pros**:
- ✅ Works with Resource Timing API
- ✅ No extra network calls needed
- ✅ Instant detection
- ✅ Catches all resources

**Cons**:
- ⚠️ Might miss custom-hosted libraries
- ⚠️ Requires pattern maintenance

---

### Option 2: Check Window Objects (Not Reliable) ❌
```javascript
if (window.adobe && window.adobe.target) {
  type = 'at.js is loaded';
}
```

**Pros**:
- ✅ Knows library is actually loaded

**Cons**:
- ❌ Doesn't give timing (when did it load?)
- ❌ Doesn't show URL
- ❌ Can't detect if loaded but failed
- ❌ Doesn't work for all libraries

---

### Why Resource Timing + URL Parsing is Best
```
Resource Timing gives us:
  ✅ URL (we parse to identify type)
  ✅ Start time (when download began)
  ✅ Duration (how long it took)
  ✅ Transfer size (cached or network)
  ✅ All resources (even if JS didn't execute)

Window object checking gives us:
  ✅ Library is loaded and functional
  ❌ No timing data
  ❌ No URL
  ❌ Misses failed loads
```

**Best approach**: Resource Timing + URL pattern matching ✅

---

## 🎯 **Transparency Features**

### Console Logs Show:
1. ✅ **Raw URL** from Performance API
2. ✅ **Pattern matched** (how we identified it)
3. ✅ **Library type** assigned
4. ✅ **Timing data** from Performance API
5. ✅ **Cache status** from transferSize

**Example**:
```javascript
🔍 RESOURCE TIMING - HOW LIBRARIES WERE IDENTIFIED

📋 All Resources from window.performance.getEntriesByType("resource"):
[
  {
    url: "https://assets.adobedtm.com/.../launch-00d562a66670.min.js",
    identifiedAs: "Adobe Launch/Tags",
    matchedPattern: 'URL contains "assets.adobedtm.com" AND "launch-" → Adobe Launch/Tags',
    timing: { start: 642, duration: 156, end: 798 }
  }
]

🎯 Target API Calls (filtered by URL pattern):
[
  {
    url: "https://edge.adobedc.net/ee/v1/interact?configId=...",
    matchedPattern: 'URL contains "/interact" → alloy.js Target API call',
    timing: { start: 850, duration: 224, end: 1074 },
    cached: false
  }
]
```

---

## ✅ **Data Flow Summary**

### What Happens When You Click "Refresh Metrics"

```
1. Extension runs script on page:
   window.performance.getEntriesByType('resource')
   ↓
   Returns: Array of ALL resources with URLs and timing

2. Extension filters Adobe resources:
   resources.filter(r => 
     r.name.includes('adobedtm') ||
     r.name.includes('at.js') ||
     r.name.includes('alloy')
   )
   ↓
   Keeps only: Adobe-related URLs

3. Extension identifies library type by URL:
   if (url.includes('launch-')) → 'Adobe Launch/Tags'
   if (url.includes('at.js')) → 'at.js (Target)'
   if (url.includes('alloy')) → 'alloy.js (Web SDK)'
   ↓
   Assigns: Library type label

4. Extension displays:
   Timing Table shows:
   📦 Adobe Launch/Tags → 642-798ms (156ms duration)
   ↓
   Timing from: window.performance (REAL ✅)
   Library type from: URL pattern matching (ACCURATE ✅)
```

---

## 🚀 **Verify This Right Now**

### On Your Page Console
```javascript
// Run this on YOUR page (not extension console)
const resources = performance.getEntriesByType('resource');
const adobeLibs = resources.filter(r => 
  r.name.toLowerCase().includes('adobedtm') ||
  r.name.toLowerCase().includes('launch-')
);

console.log('Adobe libraries detected:');
adobeLibs.forEach(lib => {
  console.log({
    url: lib.name,
    startTime: Math.round(lib.startTime),
    duration: Math.round(lib.duration),
    endTime: Math.round(lib.startTime + lib.duration)
  });
});
```

**Compare output with extension** → URLs and timing should match! ✅

---

## 📝 **Summary**

**Your Question**: "Which Adobe library loaded at what time - that's not in Performance API!"

**Answer**: 
1. ✅ **Timing IS in Performance API** (startTime, duration, endTime)
2. ✅ **URL IS in Performance API** (resource.name)
3. ❌ **Library type is NOT in Performance API** (browser doesn't label it)
4. ✅ **We identify library type by parsing the URL** (pattern matching)

**The Process**:
```
Browser Performance API → Gives us URL + Timing
Extension URL Parser → Identifies library type
Extension Display → Shows "Adobe Launch/Tags" with timing
```

**All timing is REAL from Performance API** ✅
**Library identification is from URL pattern matching** ✅
**Console shows EXACTLY how we detected each library** ✅

---

**Test it now and check the console!** You'll see every URL and how we identified it! 🔍

