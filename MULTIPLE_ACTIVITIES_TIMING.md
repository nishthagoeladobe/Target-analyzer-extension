# 📊 How We Calculate Activity Time with Multiple Activities

## ❓ **The Question**

When a page has **multiple Adobe Target activities**, which timestamp do we use for "Activity Applied" and flicker calculation?

---

## 🎯 **The Answer: We Use LATEST Activity**

### **Why LATEST?**

**Flicker = User sees content change**

When multiple activities exist:
```
Activity A loads at 1500ms → User sees FIRST change
Activity B loads at 2000ms → User sees SECOND change
Activity C loads at 2500ms → User sees THIRD change
```

The user experiences flicker **until the LAST activity applies** (2500ms).

**Formula:**
```javascript
Flicker = LATEST Activity - FCP
       = 2500ms - 300ms  
       = 2200ms of visual instability
```

---

## 🔍 **Detection & Calculation**

### **Step 1: Find All Target API Calls**

We scan `window.performance.getEntriesByType('resource')` for:

```javascript
const targetCalls = allResources.filter(r => {
  const url = r.name.toLowerCase();
  
  // Alloy.js / Web SDK (interact calls)
  const isInteract = url.includes('/ee/v1/interact') ||
                     url.includes('adobedc.demdex.net/ee/');
  
  // at.js (delivery calls)
  const isDelivery = url.includes('tt.omtrdc.net') && url.includes('/delivery');
  
  return isInteract || isDelivery;
});
```

**Result:** Array of all Target API calls with their timings

---

### **Step 2: Calculate Earliest & Latest**

```javascript
const activityTimes = targetCalls.map(c => c.responseEnd);

earliestActivity = Math.min(...activityTimes);  // First activity delivered
latestActivity = Math.max(...activityTimes);    // Last activity delivered
activitySpread = latestActivity - earliestActivity;  // Time between first & last
```

**Example Output:**
```javascript
{
  totalApiCalls: 3,
  earliestActivity: 1500ms,
  latestActivity: 2500ms,
  activitySpread: 1000ms,
  allDeliveryTimes: [1500, 2000, 2500]
}
```

---

### **Step 3: Use LATEST for Flicker**

```javascript
activityTime = latestActivity;  // 2500ms
flicker = activityTime - fcp;   // 2500 - 300 = 2200ms
```

**Rationale:** This represents when the user **finally sees the complete, fully personalized page** without further content changes.

---

## 📊 **Console Logging**

When multiple activities are detected, you'll see:

```
📊 FLICKER TEST: Activity delivery analysis:
{
  totalApiCalls: 3,
  earliestActivity: "1500ms",
  latestActivity: "2500ms",
  activitySpread: "1000ms",
  allDeliveryTimes: [1500, 2000, 2500]
}

⚠️ FLICKER TEST: Multiple activities detected (3 API calls)!
   Using LATEST delivery time for flicker calculation (when all personalization complete).
```

---

## 🤔 **Alternative Approaches (We DON'T Use)**

### **Option A: Use EARLIEST Activity**
```javascript
activityTime = earliestActivity;  // 1500ms
flicker = 1500 - 300 = 1200ms
```

**Problem:** Doesn't account for ADDITIONAL flicker from later activities!
- User sees change at 1500ms (Activity A)
- User sees ANOTHER change at 2000ms (Activity B)
- User sees ANOTHER change at 2500ms (Activity C)
- Total flicker experience: 2200ms, not 1200ms!

### **Option B: Use AVERAGE**
```javascript
activityTime = average([1500, 2000, 2500]) = 2000ms
```

**Problem:** Doesn't represent reality! User never sees "average" state.

---

## 🎨 **Visual Timeline Example**

```
0ms ─────────────────────────────────────────────────────> Time

     300ms              1500ms         2000ms         2500ms
      │                  │              │              │
      FCP           Activity A      Activity B     Activity C
      👀            🎨 Change 1    🎨 Change 2    🎨 Change 3
   User sees         (Button)      (Header)       (Footer)
   content

      └────────────────────────────────────────────┘
                  Flicker = 2200ms
          (User saw content change 3 times)
```

---

## 📊 **What Users See in UI**

### **Single Activity:**
```
Activity Applied: 1500ms
(1 Target API call detected)
```

### **Multiple Activities:**
```
Activity Applied: 2500ms
(3 Target API calls detected)

Note: Using LATEST delivery time 
(when all personalization complete)
```

---

## 💡 **Why This Matters**

### **Scenario 1: Well-Optimized Page**
```
Activity A: 1500ms
Activity B: 1505ms
Activity C: 1510ms
Activity Spread: 10ms

✅ Good: All activities load close together
✅ User sees one "batch" of changes
```

### **Scenario 2: Poorly-Optimized Page**
```
Activity A: 1500ms
Activity B: 3000ms
Activity C: 5000ms
Activity Spread: 3500ms

❌ Bad: Activities load far apart
❌ User sees multiple separate changes (jarring!)
❌ High flicker duration: 5000ms
```

**The `activitySpread` metric helps identify this!**

---

## 🔧 **Technical Implementation**

### **Updated Code (background.js)**

**Before:**
```javascript
const activityTime = targetCalls[0].responseEnd;  // Only first call
```

**After:**
```javascript
if (targetCalls.length > 0) {
  const activityTimes = targetCalls.map(c => c.responseEnd);
  earliestActivity = Math.min(...activityTimes);
  latestActivity = Math.max(...activityTimes);
  
  // Use LATEST for flicker calculation
  activityTime = latestActivity;
  
  if (targetCalls.length > 1) {
    console.log(`Multiple activities (${targetCalls.length} calls)`);
    console.log('Using LATEST for flicker calculation');
  }
}
```

---

## 📝 **Additional Metrics Returned**

We now return:
```javascript
{
  fcp: 300,
  activityTime: 2500,              // LATEST activity
  flicker: 2200,                   // Based on LATEST
  targetCallsFound: 3,             // How many API calls
  earliestActivity: 1500,          // First activity (NEW!)
  latestActivity: 2500,            // Last activity (NEW!)
  activitySpread: 1000             // Time between first & last (future)
}
```

---

## 🎯 **Summary**

**For multiple activities:**
- ✅ We detect ALL Target API calls
- ✅ We log ALL delivery times
- ✅ We use **LATEST** activity for flicker calculation
- ✅ We show warning if multiple activities detected
- ✅ We explain this in the UI

**This gives users:**
- Accurate flicker measurement (full experience)
- Understanding of activity loading pattern
- Insights into optimization opportunities

---

## 🔍 **How to See This**

### **1. Test on Page with Multiple Activities**

### **2. Check Console Logs**
You'll see:
```
📊 FLICKER TEST: Activity delivery analysis:
  totalApiCalls: X
  earliestActivity: XXXms
  latestActivity: XXXms
  activitySpread: XXXms
  allDeliveryTimes: [...]
```

### **3. Check Results**
```
Activity Applied: 2500ms ← LATEST activity time
Flicker: 2200ms ← Based on LATEST
```

---

## 🚀 **Future Enhancements**

Could add UI to show:
```
Activity Timeline:
├─ Activity 1: 1500ms
├─ Activity 2: 2000ms (+500ms)
└─ Activity 3: 2500ms (+500ms)

Total Spread: 1000ms
⚠️ Staggered delivery may cause multiple flickers
```

But for now, we focus on **most important metric**: When is personalization COMPLETE?

**Answer: LATEST activity time!**

