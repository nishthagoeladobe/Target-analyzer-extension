# Performance Metrics - Calculations Explained

## 📊 **All Formulas Now Visible in UI**

Every metric now shows **HOW it was calculated** directly in the Performance tab!

---

## 🎯 **Impact Analysis Metrics**

### 1. Target Overhead

**What it shows**: `47%`

**Formula displayed in UI**:
```
Formula:
(Target Duration / Page Load) × 100
= (2032ms / 4310ms) × 100
= 47%

What it means: Target consumed 47% of total page load time
```

**Components**:
- **Target Duration** = Time for Target API call to complete (from Resource Timing API)
- **Page Load** = Total page load time (from Navigation Timing API)

**Thresholds**:
- < 10% = ✅ Minimal Impact
- 10-20% = ⚠️ Moderate Impact  
- > 20% = ❌ High Impact

**Your example**: 47% is HIGH - Target is using almost half your page load time!

---

### 2. Flicker Risk

**What it shows**: `218ms`

**Formula displayed in UI**:
```
Formula:
Activity End Time - First Contentful Paint
= 1074ms - 856ms
= 218ms

What it means: User saw wrong content for 218ms before Target personalized it
```

**Components**:
- **Activity End Time** = When Target API response received and applied (from Resource Timing API)
- **First Contentful Paint (FCP)** = When user first saw content (from Paint Timing API)

**Timeline**:
```
  0ms ─────────────────→ Page starts loading
856ms ─────────────────→ FCP (user sees DEFAULT content) 👁️
  |
  | ⚡⚡⚡ FLICKER = 218ms (user sees WRONG content)
  |
1074ms ────────────────→ Activity delivered (user sees PERSONALIZED content) ✅
```

**Thresholds**:
- 0ms = ✅ No flicker (perfect!)
- < 300ms = ✅ Low Risk (barely noticeable)
- 300-500ms = ⚠️ Medium Risk (users may notice)
- > 500ms = ❌ High Risk (very visible flash)

**Your example**: 218ms is LOW RISK ✅ - Good performance!

---

### 3. Optimization Score

**What it shows**: `70`

**Formula displayed in UI**:
```
Formula:
100 - Flicker Penalty - Overhead Penalty
= 100 - 0 - 30
= 70

Penalties:
• Flicker >500ms: -30 | 300-500ms: -15
• Overhead >20%: -30 | 10-20%: -15
```

**Breakdown**:
- **Start**: 100 points (perfect score)
- **Flicker Penalty**: 
  - Your flicker = 218ms (< 300ms) = -0 points ✅
- **Overhead Penalty**:
  - Your overhead = 47% (> 20%) = -30 points ❌
- **Final Score**: 100 - 0 - 30 = **70**

**Thresholds**:
- 80-100 = ✅ Excellent
- 60-79 = ⚠️ Good (Your score!)
- < 60 = ❌ Needs Improvement

**Your analysis**:
- ✅ Great flicker control (218ms)
- ❌ High Target overhead (47%)
- 💡 Recommendation: Optimize Target API response time to improve score

---

## 📋 **All Calculations Visible**

### In Impact Analysis Section

Each card now shows:
```
┌─────────────────────────────────────┐
│ TARGET OVERHEAD                     │
│                                     │
│        47%                          │
│    ❌ High                          │
│                                     │
│ Formula:                            │
│ (Target Duration / Page Load) × 100│
│ = (2032ms / 4310ms) × 100          │
│ = 47%                              │
│                                     │
│ What it means: Target consumed     │
│ 47% of total page load time        │
└─────────────────────────────────────┘
```

**No black box!** Every calculation is transparent.

---

## 🔬 **Per-Activity Formulas**

### In Individual Activity Cards

When coming from Activities tab, each activity shows:

```
┌──────────────────────────────────────────────┐
│ #1 Homepage Hero Personalization             │
│                                              │
│ Experience: Variant B                        │
│ Delivered At: 1074ms (10:45:23 AM)          │
│ API Call Duration: 224ms 🌐 network         │
│ Flicker Impact: 218ms ✅ Low                │
│                                              │
│ Flicker = Activity Delivered (1074ms)       │
│         - FCP (856ms)                        │
│         = 218ms                              │
└──────────────────────────────────────────────┘
```

**Shows**:
- ✅ Exact delivery time
- ✅ API duration
- ✅ Flicker calculation with formula
- ✅ What the numbers mean

---

## 📐 **All Formulas Reference**

### Page Load Metrics (Always Available)

| Metric | Source | Formula |
|--------|--------|---------|
| **Page Load Time** | Navigation Timing | `loadEventEnd - navigationStart` |
| **First Paint** | Paint Timing | `paintTiming['first-paint'].startTime` |
| **First Contentful Paint** | Paint Timing | `paintTiming['first-contentful-paint'].startTime` |
| **DOM Interactive** | Navigation Timing | `domInteractive - navigationStart` |
| **DOM Complete** | Navigation Timing | `domComplete - navigationStart` |

### Tag Library Timing (From Resource Timing API)

| Metric | Source | Formula |
|--------|--------|---------|
| **Library Start** | Resource Timing | `resource.startTime` |
| **Library Duration** | Resource Timing | `resource.duration` |
| **Library End** | Calculated | `startTime + duration` |

### Target Activity Metrics (Requires Activities)

| Metric | Formula | Example |
|--------|---------|---------|
| **Activity Delivery** | `resource.duration` for /interact call | `224ms` |
| **Flicker** | `Activity End - FCP` | `1074 - 856 = 218ms` |
| **Target Overhead** | `(Target Duration / Page Load) × 100` | `(2032 / 4310) × 100 = 47%` |
| **Optimization Score** | `100 - Flicker Penalty - Overhead Penalty` | `100 - 0 - 30 = 70` |

---

## 🎓 **Understanding Your Results**

### Your Metrics:
```
Target Overhead: 47% ❌ High
Flicker Risk: 218ms ✅ Low
Optimization Score: 70 ⚠️ Good
```

### Analysis:

**✅ What's Good**:
- Flicker is only 218ms (< 300ms threshold)
- Users barely notice the content flash
- Activity delivery is relatively fast

**❌ What Needs Work**:
- Target overhead is 47% (almost half the page load!)
- This is dragging down your optimization score
- 47% means 2032ms out of 4310ms page load is Target

**💡 Recommendations**:
1. **Reduce Target API response time** (currently 2032ms is HIGH)
   - Use edge servers closer to users
   - Simplify audience targeting rules
   - Consider serverState for SSR

2. **Why overhead is high but flicker is low**:
   - Target API takes 2032ms total
   - But delivers at 1074ms (after FCP at 856ms)
   - So flicker = 218ms (good!)
   - But overhead = 47% (bad!)
   - This means Target starts early but takes long overall

---

## 🔍 **Formulas in Context**

### Timeline Breakdown:
```
0ms        →  Page starts
856ms      →  FCP (user sees content) - Target hasn't delivered yet!
           ⚡ FLICKER STARTS (user sees default content)
1074ms     →  Target delivers (personalization applied)
           ⚡ FLICKER ENDS
           
Flicker = 1074 - 856 = 218ms ✅

... but Target API continues processing ...

2032ms     →  Target API fully complete
           
Overhead = (2032 / 4310) × 100 = 47% ❌
```

**Insight**: Target delivers content relatively fast (218ms flicker is good) but the overall API processing takes too long (2032ms total).

---

## 📊 **How Penalties Are Calculated**

### Optimization Score Breakdown

```
Starting Score: 100

Flicker Penalties:
  >500ms → -30 points
  300-500ms → -15 points
  <300ms → -0 points (your case ✅)

Overhead Penalties:
  >20% → -30 points (your case ❌)
  10-20% → -15 points
  <10% → -0 points

Your Score:
  100 - 0 (flicker) - 30 (overhead) = 70 ⚠️ Good
```

**To improve to 80+ (Excellent)**:
- Reduce overhead from 47% to <20%
- This means Target API needs to complete in <862ms (20% of 4310ms)
- Currently at 2032ms, need to save 1170ms!

---

## 🚀 **Where to See Formulas**

### In UI (No Console Needed!)

**Impact Analysis Cards**:
```
Each card shows:
1. Metric value (47%)
2. Status (❌ High)
3. Formula box with:
   - Complete calculation
   - Actual numbers used
   - What it means in plain English
```

**Individual Activity Cards** (when from Activities tab):
```
Each activity shows:
- Delivered at: 1074ms
- Flicker: 218ms
- Formula: 1074 - 856 = 218ms
- Explanation: User saw wrong content for 218ms
```

---

## 💡 **Key Insights**

### Your Site Performance:

**Good** ✅:
- Low flicker (218ms) - users barely notice
- Fast visual feedback
- Content appears smooth

**Needs Optimization** ❌:
- Very high Target overhead (47%)
- Target API takes 2032ms total
- Almost half of page load is Target processing

**Action Items**:
1. Investigate why Target API takes 2032ms
2. Check if using edge locations
3. Review audience complexity
4. Consider async Target delivery
5. Implement prehiding snippet if not already

**Expected Impact**:
- Reduce Target duration from 2032ms → 800ms
- New overhead: 18% (good!)
- New score: 85 (excellent!)

---

## 🎯 **Summary**

**Before**: Just numbers (47%, 218ms, 70)
**After**: Complete formulas with:
- ✅ Exact calculation shown
- ✅ Numbers used
- ✅ What it means
- ✅ Visible in UI (not just console)

**All metrics are now transparent and verifiable!** 📊✅

---

## 📁 **Files Updated**

✅ `popup.html` - Formula display divs
✅ `popup.css` - Formula styling
✅ `popup.js` - Formula population logic
✅ All synced to chrome-store-package

---

**Test now!** Every metric shows its calculation directly in the UI! 🎉

