# Adobe Target Prehiding Snippets Reference

## Overview
Adobe Target uses "prehiding snippets" to hide page content temporarily while personalized content loads. This prevents users from seeing default content before it changes (flicker).

There are **two different snippets** depending on your implementation:

---

## 1. at.js Prehiding Snippet (Legacy)

### Code:
```html
<script>
  !function(e,a,n,t){
    var i=e.head;
    if(i){
      if (a) return;
      var o=e.createElement("style");
      o.id="at-body-style",
      o.innerHTML=n,
      i.appendChild(o),
      t&&setTimeout(function(){var e=document.getElementById("at-body-style");e&&i.removeChild(e)},t)
    }
  }(document,document.body,"body{opacity:0 !important}",3000);
</script>
```

### Characteristics:
- **CSS Applied**: `body { opacity: 0 !important; }`
- **Default Timeout**: 3000ms (3 seconds)
- **Style ID**: `at-body-style`
- **Location**: Usually in `<head>` before at.js library loads
- **Used by**: Sites using **at.js** (older Adobe Target implementation)

### Detection Pattern:
- Look for: `body{opacity:0 !important}` or `at-body-style`
- Usually paired with `/tt.omtrdc.net/rest/v1/delivery` API calls

---

## 2. Alloy.js (Web SDK) Prehiding Snippet (Modern)

### Code:
```html
<script>
  !function(e,a,n,t,i){
    if(!a){e.head||e.documentElement;var o=e.head||e.documentElement,r=e.createElement("style");r.innerHTML='body{opacity:0 !important}',r.id="alloy-prehiding",o.insertBefore(r,o.firstChild),setTimeout(function(){o.removeChild(r)},t)}}(document,!1,"",3000);
</script>
```

### Characteristics:
- **CSS Applied**: `body { opacity: 0 !important; }`
- **Default Timeout**: 3000ms (3 seconds)
- **Style ID**: `alloy-prehiding`
- **Location**: Usually in `<head>` before alloy.js or Adobe Launch loads
- **Used by**: Sites using **Alloy.js / Web SDK** (modern Adobe Experience Platform)

### Detection Pattern:
- Look for: `alloy-prehiding` or `body{opacity:0 !important}`
- Usually paired with `/ee/v1/interact` or `/ee/v2/interact` API calls

---

## 3. Launch/Tags Embedded Version

Some sites using **Adobe Launch (Tags)** have the prehiding snippet embedded directly in the Launch library.

### Characteristics:
- **Not visible as separate `<script>` tag**
- **Executed by Launch before extensions run**
- **Location**: Inside the Launch library file itself (e.g., `launch-xxxxx.min.js`)
- **Used by**: Sites using Adobe Launch/Tags with "prehiding" enabled in Target extension settings

### Detection Pattern:
- Look inside: `assets.adobedtm.com/*/launch-*.min.js`
- Search for: `opacity:0` or `prehiding` within the minified code

---

## What Our Extension Does

### Detection (popup.js - `detectPrehidingSnippet`)
We scan for these patterns:
1. `prehiding` keyword
2. `body { opacity: 0` or `body{opacity:0`
3. Combined presence of: `opacity` + `setTimeout` + `adobe`

### Blocking (snippet-blocker.js)
When `blockPrehidingSnippet` is true, we:

1. **Override `document.write`**: Intercept and block snippet injection
2. **Mutation Observer**: Watch for `<style>` tags that hide body
3. **Force Visibility**: Continuously ensure `body { opacity: 1 }`

This works for **both** at.js and Alloy.js snippets!

---

## Activity Type Correlation

### For at.js Activities:
- **API Call**: `tt.omtrdc.net/rest/v1/delivery`
- **Prehiding Snippet**: at.js version (`at-body-style`)
- **Call Type**: `delivery`

### For Alloy.js (Web SDK) Activities:
- **API Call**: `adobedc.demdex.net/ee/v1/interact` or `/ee/v2/interact`
- **Prehiding Snippet**: Alloy.js version (`alloy-prehiding`)
- **Call Type**: `interact`

---

## Why This Matters for Testing

Our **Prehiding Snippet Performance Test** needs to:

1. **Detect the correct snippet type** (at.js vs Alloy.js)
2. **Block it appropriately** during the "WITHOUT" test phase
3. **Measure impact accurately** for the specific implementation

The flicker calculation is the same for both:
```
Flicker Duration = Activity Applied Time - First Contentful Paint (FCP)
```

But the **absolute values** will differ based on:
- Which snippet is used
- Timeout value (usually 3000ms, but configurable)
- Network speed for library and API calls

---

## References

- [at.js Prehiding Snippet Documentation](https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/functions-overview/targetglobalsettings.html#bodyHidingEnabled)
- [Alloy.js Prehiding Snippet Documentation](https://experienceleague.adobe.com/docs/experience-platform/edge/personalization/manage-flicker.html)
- [Adobe Launch Target Extension](https://experienceleague.adobe.com/docs/experience-platform/tags/extensions/adobe/target/overview.html)

