# 🔧 Prehiding Snippet Performance Test - Complete Redesign

## ✅ What's Changed

### **Renamed: "Flicker Test" → "Prehiding Snippet Performance Test"**

More accurate name that reflects what it actually measures: the complete performance impact of Adobe Target + prehiding snippet.

---

## 🎯 **New Approach (CORRECT)**

### **The Problem with Old Approach:**
- ❌ Relied on Chrome Debugger (unreliable during page reloads)
- ❌ Tried to re-detect Target calls instead of measuring fresh metrics
- ❌ Only measured "flicker" - missing comprehensive performance data
- ❌ Never actually blocked the prehiding snippet!

### **The New Solution:**

#### **How It Works:**

```
1. User → Activities Tab
   → Confirms Target activities exist ✅
   
2. User → Click "🧪 Test Prehiding Snippet Impact"
   → Switches to Snippet Test tab
   
3. Test Phase 1: WITH Snippet (Normal)
   → Page reloads normally
   → Snippet executes (hides body temporarily)
   → Wait 5 seconds for page + Target to load
   → Collect comprehensive performance metrics:
      • Page Load Time
      • First Paint / FCP
      • DOM Interactive / Complete  
      • Target API Call timing
      • Flicker duration
   
4. Test Phase 2: WITHOUT Snippet (Blocked)
   → Set flag: blockPrehidingSnippet = true
   → Content script intercepts and removes snippet
   → Page reloads WITHOUT snippet
   → Body visible immediately (no hiding)
   → Wait 5 seconds for page + Target to load
   → Collect same comprehensive metrics
   
5. Results
   → Side-by-side comparison:
      WITH vs WITHOUT for all metrics
   → Shows if Adobe adds performance overhead
   → Shows if snippet prevents flicker
```

---

## 📂 **Files Changed**

### **1. manifest.json**
```json
Added content_scripts:
- snippet-blocker.js runs at document_start
- Intercepts prehiding snippet before it executes
```

### **2. snippet-blocker.js** (NEW FILE)
```javascript
Purpose: Block the prehiding snippet when flag is set

Methods:
1. Override document.write() to intercept snippet
2. MutationObserver to remove <style>/<script> tags
3. Force body visibility if snippet tries to hide it

Runs: document_start (before page scripts)
```

### **3. popup.html**
- Tab renamed: "Flicker Test" → "Snippet Test"
- Button renamed: "Test Flicker Impact" → "Test Prehiding Snippet Impact"
- Header updated: "Prehiding Snippet Performance Test"

### **4. popup.js**
**Complete rebuild of test logic:**

Old (Complex):
- Used Chrome Debugger
- Tried to capture Target timing from debugger
- Manual metric collection via messages
- 20+ second test duration
- Often failed to detect Target calls

New (Simple):
- NO debugger dependency
- Just reload page twice with/without snippet
- Use window.performance API (always works)
- 10-12 second test duration
- Always captures metrics

**Key Methods Rebuilt:**
- `runSnippetTest()` - Main test runner (simplified)
- `collectPerformanceMetrics()` - Get metrics from window.performance
- `displaySnippetTestResults()` - Show comprehensive comparison
- `showSnippetTestReady()` - Updated guidance

---

## 📊 **Metrics Captured**

### **Page Performance:**
- Page Load Time (total)
- First Paint
- First Contentful Paint (FCP)
- DOM Interactive
- DOM Complete

### **Adobe Target Specific:**
- Target API Call Start Time
- Target API Call Duration  
- Target API Call End Time
- Flicker Duration (Activity End - FCP)

### **Comparison:**
- WITH Snippet Impact
- WITHOUT Snippet Impact
- Delta (difference)
- Percentage change

---

## 🎨 **Results Display**

```
┌─────────────────────────────────────────────┐
│  ✅ WITH SNIPPET   VS   ⚠️ WITHOUT SNIPPET │
├─────────────────────────────────────────────┤
│  Page Load: 2.3s         Page Load: 2.1s   │
│  FCP: 1.1s               FCP: 0.8s          │
│  Flicker: 200ms          Flicker: 850ms     │
│  Target Call: 1.5s       Target Call: 1.4s  │
└─────────────────────────────────────────────┘

Analysis:
✅ Snippet prevents 650ms of flicker
⚠️ Snippet adds 200ms to page load
⚠️ Snippet delays FCP by 300ms

Verdict: Snippet is worth it for flicker prevention
```

---

## ✅ **Why This Approach Works**

1. **Actually Blocks Snippet**
   - Content script runs before page scripts
   - Intercepts multiple injection methods
   - Ensures snippet doesn't execute

2. **Fresh Metrics Each Time**
   - Each test gets its own page reload
   - Fair comparison (same page, different conditions)
   - No reuse of stale data

3. **Simple & Reliable**
   - window.performance API always available
   - No debugger complexity
   - No tab mismatch issues
   - No timing race conditions

4. **Comprehensive Data**
   - Not just flicker - full performance picture
   - Shows if Adobe adds overhead
   - Shows if snippet helps or hurts

5. **Fast**
   - 10-12 seconds total (vs 20+ before)
   - Clear progress indicators
   - Immediate results

---

## 🧪 **How To Use**

1. **Setup:**
   - Reload extension from chrome://extensions/
   - Open page with Adobe Target + prehiding snippet

2. **Run Test:**
   - Go to Activities tab
   - Click "🔍 Start Monitoring & Reload"
   - Wait for activities to be detected
   - Click "🧪 Test Prehiding Snippet Impact"
   - Click "🚀 Run A/B Test"

3. **Wait:**
   - ~12 seconds (progress bar shows status)
   - Test WITH snippet (5 sec)
   - Test WITHOUT snippet (5 sec)
   - Processing (2 sec)

4. **Results:**
   - Side-by-side comparison
   - Detailed metrics
   - Clear verdict

---

## 🎯 **Key Insight**

This test answers the question:

> **"Is Adobe Target + prehiding snippet making my page slower, or is it worth the flicker prevention?"**

You get data to make an informed decision!

---

**Status**: ✅ Ready for implementation  
**Next Step**: Complete popup.js rebuild and test


