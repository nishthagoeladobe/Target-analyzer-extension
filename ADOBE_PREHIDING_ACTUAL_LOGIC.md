# Adobe's Actual Prehiding Snippet Logic

## Your Observation is Correct!

You're absolutely right - Adobe's prehiding snippet doesn't just rely on a fixed timeout. It has **two removal conditions**:

1. ✅ **Early removal** when Target/Alloy loads and applies content
2. ✅ **Timeout fallback** if Target fails to load (3 seconds)

## Adobe's Official at.js Prehiding Snippet

### Code
```html
<script>
  !function(e,a,n,t){
    var i=e.head;
    if(i){
      if(a)return;
      var o=e.createElement("style");
      o.id="alloy-prehiding",
      o.innerText=n,
      i.appendChild(o),
      setTimeout(function(){
        o.parentNode&&o.parentNode.removeChild(o)
      },t)
    }
  }(document, document.location.href.indexOf("mboxEdit")!==-1, "body { opacity: 0 !important }", 3000);
</script>
```

**This version only has timeout-based removal.**

However, **at.js library itself** removes the prehiding style early when it detects:
- `at-content-rendering-succeeded` event
- `at-content-rendering-failed` event  
- `at-library-loaded` event
- Body hiding is managed via `window.targetGlobalSettings.bodyHidingEnabled`

## Adobe's Alloy.js (Web SDK) Prehiding

### Prehiding Snippet
```html
<script>
  !function(e,a,n,t){
    if (a) return;
    var i=e.createElement("style");
    i.id=n,
    i.innerHTML=t,
    e.head.appendChild(i)
  }(document, document.location.href.indexOf("adobe_authoring_enabled") !== -1, "alloy-prehiding", "body { opacity: 0 !important }");
</script>
```

**Note: NO timeout in the snippet itself!**

### Alloy Configuration
```javascript
alloy("configure", {
  "edgeConfigId": "...",
  "prehidingStyle": "body { opacity: 0 !important }"
});
```

**Alloy.js removes the prehiding automatically when:**
1. It finishes fetching and applying offers (early removal)
2. Or after its internal timeout (fallback)

The `prehidingStyle` config tells Alloy what selector to look for and remove.

## Our Current Implementation

### What We Do
```javascript
// ❌ INCOMPLETE: Only timeout, no early removal
setTimeout(() => {
  const element = document.getElementById('alloy-prehiding');
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}, 3000);
```

### What's Missing
1. **No event listeners** for Target/Alloy completion
2. **No early removal** when personalization is applied
3. **Only timeout-based** removal (not optimal)

## The Problem

If Target loads in 500ms and applies content:
- **Adobe's snippet**: Removes prehiding at 500ms ✅ (early removal)
- **Our implementation**: Waits full 3000ms ❌ (unnecessary delay)

Result: User sees blank page for **2.5 seconds longer than needed!**

## The Fix Needed

We need to add event listeners to remove prehiding early:

### For at.js
```javascript
// Listen for at.js events
document.addEventListener('at-content-rendering-succeeded', removeStyle);
document.addEventListener('at-content-rendering-failed', removeStyle);
document.addEventListener('at-library-loaded', removeStyle);

// Fallback timeout
setTimeout(removeStyle, 3000);
```

### For Alloy.js
```javascript
// Listen for custom events or check window.alloy
// Alloy fires custom events when personalization is applied

// Alternative: Check for specific DOM changes
// Or listen for window.__alloy_prehiding_timeout

// Fallback timeout
setTimeout(removeStyle, 3000);
```

### Universal Approach
```javascript
// Listen for BOTH at.js and Alloy events
const removeStyle = () => {
  const element = document.getElementById('alloy-prehiding');
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
    console.log('✅ Prehiding removed (Target loaded)');
    
    // Clean up event listeners
    document.removeEventListener('at-content-rendering-succeeded', removeStyle);
    document.removeEventListener('at-content-rendering-failed', removeStyle);
    // ... remove other listeners
  }
};

// at.js events
document.addEventListener('at-content-rendering-succeeded', removeStyle);
document.addEventListener('at-content-rendering-failed', removeStyle);
document.addEventListener('at-library-loaded', removeStyle);

// Alloy.js might use different events or we can check window.alloy
if (window.alloy) {
  // Hook into Alloy's promise or events
}

// Fallback timeout (if Target never loads)
setTimeout(() => {
  removeStyle();
  console.log('⏰ Prehiding removed (timeout fallback)');
}, 3000);
```

## Impact on Test Results

### Current Implementation (Timeout Only)
- WITH Snippet: User sees blank page for 3000ms
- WITHOUT Snippet: User sees flicker immediately
- **Difference**: Inflated by the unnecessary 3000ms delay

### Correct Implementation (Early Removal)
- WITH Snippet: User sees blank page for ~500ms (when Target loads)
- WITHOUT Snippet: User sees flicker immediately  
- **Difference**: Accurate reflection of snippet's true impact

## Action Required

1. ✅ Add event listeners for at.js events
2. ✅ Add event listeners or checks for Alloy.js
3. ✅ Keep timeout as fallback
4. ✅ Remove listeners after style is removed (prevent duplicates)
5. ✅ Test on pages with both at.js and Alloy.js

## References

- [Adobe Target at.js Events](https://experienceleague.adobe.com/docs/target-dev/developer/client-side/at-js-implementation/functions-overview/adobe-target-trackevent.html)
- [Alloy.js Prehiding Configuration](https://experienceleague.adobe.com/docs/experience-platform/web-sdk/commands/configure/prehidingstyle.html)
- [Content Security Policy and Target](https://experienceleague.adobe.com/docs/target-dev/developer/implementation/privacy/content-security-policy.html)

---

**Status**: 🚨 **NEEDS FIX**  
**Priority**: HIGH - Affects test accuracy  
**User Reported**: November 4, 2025

