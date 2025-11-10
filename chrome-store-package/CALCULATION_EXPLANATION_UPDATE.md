# ✅ Calculation Explanation Added to Snippet Test Tab

## Summary

Added a comprehensive "How We Calculate Flicker" section directly in the Snippet Test tab UI to explain:
- The flicker calculation formula
- What each metric means (FCP, Activity Applied, Flicker Duration)
- How we detect both Alloy.js and at.js calls
- Visual timeline showing the flicker gap
- Why it matters for user experience

---

## Changes Made

### 1. **popup.html** - Added New Section

**Location:** Between "Recommendations" and "Help Section"

**New Section Includes:**

#### **📐 Formula Box**
```
Flicker = Activity Time - FCP
= Time user saw wrong content before Target changed it
```

#### **🎯 FCP Explanation**
- What: Time when user first sees content
- How: `window.performance.getEntriesByType('paint')`

#### **📦 Activity Applied Explanation**
- What: Time when Adobe Target delivered personalized content
- How: Detects both:
  - **Alloy.js:** `adobedc.demdex.net/ee/v1/interact`
  - **at.js:** `tt.omtrdc.net/rest/v1/delivery`

#### **⚡ Flicker Duration Explanation**
- Visual timeline showing the gap
- Good vs Bad thresholds (< 300ms vs > 300ms)
- Real example: FCP 180ms → Activity 4344ms = 4164ms flicker

#### **💡 Why This Matters**
Explains that prehiding snippet prevents users from seeing content changes by hiding the page until Target is ready.

---

### 2. **popup.css** - Added Styling

**New Classes:**
```css
.calculation-section        /* Main container */
.calculation-formula        /* Formula box with blue border */
.formula-box               /* Formula content */
.formula-var               /* Variable highlighting (blue background) */
.metric-explanations       /* Grid of explanations */
.metric-explain            /* Individual metric card */
.flicker-visual            /* Yellow timeline box */
.timeline                  /* Visual timeline display */
.calculation-note          /* Blue info box at bottom */
```

**Responsive Design:**
- Mobile-friendly layout
- Timeline adjusts for small screens
- Cards stack vertically on narrow displays

---

## Visual Preview

When users scroll down in the Snippet Test tab after running a test, they'll see:

```
┌─────────────────────────────────────────────────┐
│ 📐 How We Calculate Flicker                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Flicker Duration Formula:               │   │
│  │                                         │   │
│  │   Flicker = Activity Time - FCP        │   │
│  │                                         │   │
│  │   = Time user saw wrong content        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎯 FCP (First Contentful Paint):       │   │
│  │ Time when user first sees content      │   │
│  │ window.performance.getEntriesByType()  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📦 Activity Applied:                   │   │
│  │ Time when Target delivered content     │   │
│  │ • Alloy.js: interact calls             │   │
│  │ • at.js: delivery calls                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚡ Flicker Duration:                    │   │
│  │ Gap between user seeing page           │   │
│  │                                         │   │
│  │  📍 FCP (180ms) ──── 📍 Activity       │   │
│  │  ⚡ Flicker = 4164ms                   │   │
│  │                                         │   │
│  │  ✅ Good: < 300ms                      │   │
│  │  ⚠️  Bad: > 300ms                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 💡 Why This Matters:                   │   │
│  │ High flicker means users see default   │   │
│  │ content change. Prehiding snippet      │   │
│  │ prevents this (opacity: 0).            │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Code Details

### Activity Time Detection (background.js)

**Confirms we handle BOTH at.js and Alloy.js:**

```javascript
// Lines 1059-1074 in background.js
const targetCalls = allResources.filter(r => {
  const url = r.name.toLowerCase();
  
  // Alloy.js / Web SDK (interact calls)
  const isInteract = url.includes('adobedc.demdex.net/ee/v1/interact') ||
                     url.includes('adobedc.demdex.net/ee/or2/v1/interact') ||
                     url.includes('adobedc.demdex.net/ee/') ||
                     url.includes('edge.adobedc.net/ee/') ||
                     (url.includes('/ee/') && url.includes('interact'));
  
  // at.js (delivery calls)
  const isDelivery = (url.includes('tt.omtrdc.net') && url.includes('/delivery')) ||
                    (url.includes('tt.omtrdc.net') && url.includes('/rest/v1/delivery')) ||
                    (url.includes('/rest/v1/delivery') && url.includes('client=')) ||
                    (url.includes('mboxedge') && url.includes('/delivery'));
  
  return isInteract || isDelivery;
});
```

**✅ Detection Coverage:**
- ✅ Alloy.js interact calls (all patterns)
- ✅ at.js delivery calls (all patterns)
- ✅ CNAME implementations
- ✅ Edge network variations
- ✅ Legacy mboxedge endpoints

---

## Files Modified

1. **popup.html**
   - Added `<div class="flicker-section calculation-section">` section
   - Lines 450-514 (65 new lines)
   - Location: After "Recommendations", before "Help Section"

2. **popup.css**
   - Added calculation section styles
   - Lines 3205-3419 (215 new lines)
   - Includes responsive design for mobile

3. **chrome-store-package/***
   - Synced both files

---

## How to See It

### 1. Reload Extension
```
chrome://extensions/ → Click 🔄
```

### 2. Run Test
- Go to Activities tab
- Scan activities
- Click "🧪 Test Prehiding Snippet Impact"
- Wait for results

### 3. Scroll Down in Snippet Test Tab
You'll see the new **"📐 How We Calculate Flicker"** section explaining everything!

---

## User Benefits

### **Before:**
- Users didn't understand what "flicker" meant
- No explanation of how metrics were calculated
- Didn't know we support both at.js and Alloy.js
- Had to ask "what does this mean?"

### **After:**
- ✅ Clear formula shown directly in UI
- ✅ Each metric explained with context
- ✅ Visual timeline makes it intuitive
- ✅ Shows we detect both at.js and Alloy.js
- ✅ Explains why it matters (UX impact)
- ✅ No need to read external docs

---

## Next Steps

✅ All changes complete and synced to `chrome-store-package/`

The extension is now fully documented within the UI itself! Users can understand:
- What flicker is
- How it's calculated
- Why it matters
- What we're detecting (both at.js and Alloy.js)

🎉 **Ready for use!**

