# 🚀 Quick Start: Flicker Test Feature

## Overview
Test the real impact of your prehiding snippet in **2 automated page reloads**!

---

## Steps to Run Test

### 1. **Open Extension**
- Click the extension icon
- Navigate to **"Flicker Test"** tab

### 2. **Check Snippet Status**
The extension automatically detects if a prehiding snippet exists on the page:
- ✅ **Detected**: Shows timeout, style, and location
- ❌ **Not Found**: You can still run the test to baseline performance

### 3. **Run the Test**
Click **"🚀 Run A/B Test (2 page reloads)"**

The test will:
1. Start monitoring
2. Reload page **WITH** snippet (measures flicker)
3. Reload page **WITHOUT** snippet (measures flicker)
4. Compare results

### 4. **View Results**
After ~10 seconds, see side-by-side comparison:

```
┌───────────────────────────────┐
│  ✅ WITH    VS    ⚠️ WITHOUT  │
├───────────────────────────────┤
│  218ms           892ms        │
│  Flicker         Flicker      │
│                               │
│  Prevents: 674ms flicker!     │
└───────────────────────────────┘
```

### 5. **Read Recommendations**
Scroll down to see:
- **Detailed Analysis**: What the numbers mean
- **Recommendations**: Should you keep/remove/adjust the snippet?

---

## Tips for Accurate Results

### ✅ DO:
- Clear cache before testing (click **"🧹 Clear Cache & Reload"**)
- Run test **3 times** and average results
- Test during similar network conditions
- Test on pages with active Target activities

### ❌ DON'T:
- Run test with slow/inconsistent network
- Compare results from different times of day
- Test on pages without Target activities
- Have other network-heavy tasks running

---

## Understanding Results

### Flicker Duration
Time between when user first sees content (FCP) and when Target activity is applied.

**Low Flicker**: < 300ms (✅ Good UX)  
**High Flicker**: > 500ms (⚠️ Poor UX)

### Snippet Benefit
Difference between flicker WITH vs WITHOUT snippet.

**Large Benefit (>100ms)**: Keep snippet  
**Small Benefit (0-100ms)**: Consider other optimizations  
**Negative Benefit (<0ms)**: Review snippet timeout  

---

## Common Scenarios

### ✅ Snippet is Working Well
```
WITH: 218ms | WITHOUT: 892ms | Benefit: 674ms
→ Keep the snippet! It's preventing significant flicker.
```

### ⚠️ Snippet Timeout Too Long
```
WITH: 850ms | WITHOUT: 420ms | Benefit: -430ms
→ Snippet timeout (3000ms) is longer than Target response (400ms).
→ Reduce timeout to 1000ms or 1500ms.
```

### 🤔 Marginal Benefit
```
WITH: 280ms | WITHOUT: 340ms | Benefit: 60ms
→ Small improvement. Consider if complexity is worth it.
→ Alternatively, focus on speeding up Target delivery.
```

### ❌ No Snippet Needed
```
WITH: 150ms | WITHOUT: 155ms | Benefit: 5ms
→ No significant difference. Snippet may not be necessary.
```

---

## Troubleshooting

### Test Never Completes
**Problem**: Spinner keeps running, no results  
**Solution**:
- Ensure page has Adobe Target activities
- Check console for errors
- Try manual reload and re-run test

### "No snippet detected" Error
**Problem**: You know snippet exists but extension says no  
**Solution**:
- Snippet might be in external JS file
- Search page source manually for `opacity: 0`
- Snippet might use non-standard pattern

### Results Don't Make Sense
**Problem**: Wildly different results each run  
**Solution**:
- Clear cache between tests
- Check network tab for cached resources
- Run test multiple times and average
- Test during stable network conditions

---

## Next Steps

After running the test:

1. **Keep Snippet** (if benefit > 100ms)
   - Document the benefit for stakeholders
   - Monitor over time to ensure consistency

2. **Adjust Timeout** (if negative benefit)
   - Reduce timeout from 3000ms → 1500ms
   - Test again to find optimal value

3. **Remove Snippet** (if benefit < 50ms)
   - Test for 1 week without snippet
   - Monitor user experience metrics

4. **Optimize Target Delivery** (if benefit 0-100ms)
   - Review activity complexity
   - Optimize audience targeting
   - Consider edge caching

---

## Example Test Flow

```
1. User opens "Flicker Test" tab
   ↓
2. Extension detects: ✅ Snippet found (timeout: 3000ms)
   ↓
3. User clicks "Run A/B Test"
   ↓
4. Test Phase 1: Reload WITH snippet
   - Measures flicker: 218ms
   ↓
5. Test Phase 2: Reload WITHOUT snippet
   - Measures flicker: 892ms
   ↓
6. Results show: Snippet prevents 674ms flicker
   ↓
7. Recommendation: Keep snippet, it's working well!
```

---

## Video Tutorial (Coming Soon)
- How to run the test
- Interpreting results
- Common scenarios
- Best practices

---

## Need Help?

- **Report Issue**: Use "Explanation" tab → "Report Error or Issue"
- **View Console Logs**: Right-click extension → Inspect → Console
- **Documentation**: See [FLICKER_TEST_FEATURE.md](./FLICKER_TEST_FEATURE.md)

---

**Remember**: This test provides real, measurable data to make informed decisions about your prehiding snippet!

Happy testing! 🎉

