# Adobe Library Detection & Timing

## Overview
The Performance tab now **specifically identifies and labels** each Adobe library, so you know exactly which library's timing you're seeing.

## 🏷️ **Adobe Libraries Detected**

### 1. **Adobe Launch/Tags** (Modern Tag Management)
**Format**: `https://assets.adobedtm.com/{propertyId}/{environment}/launch-{hash}.min.js`

**Example**: 
```
https://assets.adobedtm.com/5ef092d1efb5/f38b177be962/launch-00d562a66670.min.js
```

**What it does**:
- Main tag management container
- Loads Target, Analytics, and other Adobe solutions
- Replaces legacy DTM (Dynamic Tag Management)
- Modern Adobe Experience Platform Data Collection

**Shown as**: `📦 Adobe Launch/Tags`

---

### 2. **at.js** (Adobe Target - Legacy)
**Formats**: 
- `at.js` (version 1.x)
- `at-2.js` or `at.2.js` (version 2.x)

**Example**: 
```
https://yourdomain.com/at.js
https://assets.adobedtm.com/.../at.js
```

**What it does**:
- Standalone Adobe Target library
- Handles activity delivery and personalization
- Can be loaded independently or via Launch

**Shown as**: 
- `📦 at.js (Target)` for v1.x
- `📦 at.js v2 (Target)` for v2.x

---

### 3. **alloy.js** (AEP Web SDK - Modern)
**Format**: `alloy.js` or contains "alloy" in filename

**Example**: 
```
https://cdn1.adoberesources.net/alloy/2.19.0/alloy.min.js
```

**What it does**:
- Modern unified SDK for ALL Adobe products
- Single library for Target, Analytics, Audience Manager, etc.
- Part of Adobe Experience Platform
- Replaces at.js, AppMeasurement, and Visitor ID Service

**Shown as**: `📦 alloy.js (AEP Web SDK)`

---

### 4. **AppMeasurement.js** (Adobe Analytics)
**Format**: `AppMeasurement.js`

**Example**: 
```
https://yourdomain.com/AppMeasurement.js
```

**What it does**:
- Adobe Analytics tracking library
- Sends analytics data to Adobe servers
- Can be loaded independently or via Launch

**Shown as**: `📦 AppMeasurement.js (Analytics)`

---

## 📊 **Timing Table Output**

### Example: Modern Implementation with Launch
```
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #3 📦 Adobe Launch/Tags            │ 642ms      │ 156ms    │ 798ms    │ ← Launch container
│ #4 🎯 Target Activity Delivery 🌐  │ 850ms      │ 224ms    │ 1074ms   │ ← API call
│ #5 ✅ DOM Complete                 │ 0ms        │ 4.31s    │ 4.31s    │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

**Analysis**:
- Launch loads at 642ms
- Target API call happens at 850ms (after Launch finishes)
- Launch contains Target, so this is correct sequence

---

### Example: Legacy Implementation with at.js
```
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #3 📦 at.js v2 (Target)            │ 520ms      │ 45ms     │ 565ms    │ ← at.js loads
│ #4 🎯 Target Activity Delivery 🌐  │ 600ms      │ 180ms    │ 780ms    │ ← API call
│ #5 ✅ DOM Complete                 │ 0ms        │ 2.5s     │ 2.5s     │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

**Analysis**:
- Standalone at.js loads at 520ms
- Target API call at 600ms (after at.js finishes)
- Faster than Launch because it's just Target

---

### Example: Modern AEP Web SDK Implementation
```
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #3 📦 alloy.js (AEP Web SDK)       │ 480ms      │ 38ms     │ 518ms    │ ← Modern SDK
│ #4 🎯 Target Activity Delivery 🌐  │ 550ms      │ 120ms    │ 670ms    │ ← API call
│ #5 ✅ DOM Complete                 │ 0ms        │ 2.2s     │ 2.2s     │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

**Analysis**:
- Alloy.js is fastest (smallest unified library)
- Target API call uses `/interact` endpoint (not `/delivery`)
- Best performance of all implementations

---

### Example: Multiple Libraries (Analytics + Target)
```
┌────────────────────────────────────┬────────────┬──────────┬──────────┐
│ Event                              │ Start Time │ Duration │ End Time │
├────────────────────────────────────┼────────────┼──────────┼──────────┤
│ #1 🎨 First Paint                  │ 0ms        │ 300ms    │ 300ms    │
│ #2 📦 AppMeasurement.js (Analytics)│ 450ms      │ 52ms     │ 502ms    │ ← Analytics
│ #3 🎨 First Contentful Paint       │ 0ms        │ 450ms    │ 450ms    │
│ #4 📦 at.js (Target)               │ 520ms      │ 45ms     │ 565ms    │ ← Target
│ #5 🎯 Target Activity Delivery 🌐  │ 600ms      │ 180ms    │ 780ms    │
│ #6 ✅ DOM Complete                 │ 0ms        │ 2.8s     │ 2.8s     │
└────────────────────────────────────┴────────────┴──────────┴──────────┘
```

**Analysis**:
- Both Analytics and Target libraries detected
- Shows complete Adobe stack timing
- Can identify if one library is slowing down the other

---

## 🔍 **Detection Logic**

### How Libraries Are Identified

```javascript
// Adobe Launch/Tags
if (url.includes('assets.adobedtm.com') && url.includes('launch-')) {
  libraryType = 'Adobe Launch/Tags';
}

// at.js v2
else if (url.includes('at-2.js') || url.includes('at.2.')) {
  libraryType = 'at.js v2 (Target)';
}

// at.js v1
else if (url.includes('at.js')) {
  libraryType = 'at.js (Target)';
}

// Alloy.js (AEP Web SDK)
else if (url.includes('alloy')) {
  libraryType = 'alloy.js (AEP Web SDK)';
}

// AppMeasurement.js
else if (url.includes('appmeasurement')) {
  libraryType = 'AppMeasurement.js (Analytics)';
}
```

## 📈 **Why This Matters**

### 1. **Accurate Performance Analysis**
Before: "Adobe Target Library: 156ms"
- Which library? Launch contains Target, Analytics, Audience Manager...
- Can't tell what's actually loading

After: "Adobe Launch/Tags: 156ms"
- Clear it's the Launch container (tag management)
- Helps understand why it might be larger/slower

---

### 2. **Implementation Type Identification**
Knowing which libraries load tells you:
- **Launch + Target API** = Modern Launch implementation
- **at.js + Target API** = Legacy standalone Target
- **alloy.js + Target API** = Modern AEP Web SDK
- **Launch + at.js** = Hybrid (Launch loading at.js)

---

### 3. **Optimization Recommendations**
Different libraries have different optimization strategies:

**Adobe Launch (156ms+)**
- Contains multiple Adobe solutions
- Can be bloated with many extensions
- Optimize: Reduce extensions, use async loading
- Consider: Remove unused rules/data elements

**at.js (45ms)**
- Standalone Target library
- Relatively lightweight
- Optimize: Use CDN, async loading, prehiding snippet
- Consider: Upgrade to Web SDK if using multiple Adobe products

**alloy.js (38ms)**
- Unified SDK (smallest)
- Best performance
- Optimize: Already optimal, just ensure edge network
- Consider: This is the recommended approach

**AppMeasurement.js (52ms)**
- Analytics tracking
- Can be slow with many plugins
- Optimize: Remove unused plugins, use Web SDK
- Consider: Migrate to alloy.js

---

## 🎯 **Timeline Chart Label**

The visual timeline chart shows the **primary Target library**:

```
Library Load: 156ms (Adobe Launch/Tags)
```

**Priority Order**:
1. at.js (if present) - Most specific to Target
2. alloy.js (if present) - Contains Target functionality
3. Launch (if present) - May contain Target

This helps you quickly see which library is responsible for Target timing.

---

## 💡 **Use Cases**

### Use Case 1: "My Target is slow - which library?"
**Question**: "Target activity takes 500ms, but which library is causing it?"

**Answer from table**:
```
#3 📦 Adobe Launch/Tags    → 420ms (this is slow!)
#4 🎯 Target Activity      → 500ms (API call duration)
```

**Conclusion**: Launch is the culprit (420ms), not the API (500ms is total, API is fast).

---

### Use Case 2: "Should I migrate to Web SDK?"
**Current State**:
```
#3 📦 Adobe Launch/Tags         → 256ms
#4 📦 AppMeasurement.js          → 89ms
#5 📦 at.js v2 (Target)          → 67ms
Total library load time: 412ms
```

**After migrating to Web SDK**:
```
#3 📦 alloy.js (AEP Web SDK)     → 45ms
Total library load time: 45ms
```

**ROI**: Save 367ms (89% reduction) 🎉

---

### Use Case 3: "Why is my page slow?"
**Timeline shows**:
```
#3 📦 Adobe Launch/Tags          → 1.2s (!)
```

**Investigation**:
- Launch is loading 1.2 seconds
- This is WAY too slow (should be <200ms)
- Likely has too many extensions or rules

**Action**: Audit Launch configuration, remove unused extensions

---

## 🚀 **Testing Different Implementations**

### Test on Your Sites
1. **Launch + Target**: Modern tag management
2. **Standalone at.js**: Legacy Target only
3. **alloy.js**: Modern unified SDK
4. **Hybrid setups**: Launch loading at.js

### Compare Timings
Track across different implementations to find fastest approach for your use case.

---

## 📝 **Summary**

**Before**: Generic "Adobe Target Library" label
**After**: Specific labels:
- 📦 Adobe Launch/Tags
- 📦 at.js (Target) 
- 📦 at.js v2 (Target)
- 📦 alloy.js (AEP Web SDK)
- 📦 AppMeasurement.js (Analytics)

**Benefit**: Know exactly which library you're optimizing!

---

## 🎓 **Quick Reference**

| Library Type | Typical Load Time | What To Check |
|-------------|-------------------|---------------|
| **Adobe Launch** | 150-300ms | Too many extensions? Async loading? |
| **at.js v2** | 40-80ms | CDN location? Prehiding snippet? |
| **alloy.js** | 30-60ms | Already optimal, check edge network |
| **AppMeasurement** | 50-100ms | Too many plugins? Consider Web SDK |

**Goal**: Launch <200ms, at.js <80ms, alloy.js <60ms for good performance

---

**Now you can tell clients**: 
- "Your Adobe Launch library takes 420ms - let's optimize it"
- "Migrating from at.js to Web SDK will save 200ms"
- "Your Launch container is loading 8 extensions - do you need them all?"

All with **specific, accurate library identification**! 🎯

