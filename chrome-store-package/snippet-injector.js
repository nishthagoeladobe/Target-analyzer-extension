// Snippet Injector - Injects Adobe Target prehiding snippet if page doesn't have one
// This runs at document_start to inject BEFORE page renders

console.log('🔧 SNIPPET INJECTOR: Script loaded');

(async function() {
  try {
    // Check if we should inject snippet
    const storage = await chrome.storage.local.get(['injectPrehidingSnippet']);
    
    if (!storage.injectPrehidingSnippet) {
      console.log('🔧 SNIPPET INJECTOR: Injection not needed, skipping');
      return;
    }
    
    console.log('💉 SNIPPET INJECTOR: Injecting prehiding snippet...');
    
    // Inject prehiding style DIRECTLY (no inline script to avoid CSP issues)
    // This mimics what Adobe Target prehiding snippet does
    const prehidingStyle = document.createElement('style');
    prehidingStyle.id = 'alloy-prehiding';
    prehidingStyle.textContent = 'body { opacity: 0 !important; }';
    
    // Insert at the very beginning of <head>
    const targetElement = document.head || document.documentElement;
    if (targetElement) {
      targetElement.insertBefore(prehidingStyle, targetElement.firstChild);
      console.log('✅ SNIPPET INJECTOR: Prehiding style injected successfully');
      console.log('📊 PREHIDING ACTIVE: Body will be hidden when it loads');
      
      // Remove prehiding function (can be called by events or timeout)
      let styleRemoved = false;
      const removePrehidingStyle = (reason) => {
        if (styleRemoved) return; // Already removed, skip
        
        const element = document.getElementById('alloy-prehiding');
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
          styleRemoved = true;
          console.log(`✅ PREHIDING REMOVED: ${reason}`);
          
          // Clean up event listeners
          document.removeEventListener('at-content-rendering-succeeded', atRenderSuccess);
          document.removeEventListener('at-content-rendering-failed', atRenderFailed);
          document.removeEventListener('at-library-loaded', atLibraryLoaded);
        }
      };
      
      // at.js event listeners (for at.js-based Target implementations)
      const atRenderSuccess = () => removePrehidingStyle('at.js content rendered successfully');
      const atRenderFailed = () => removePrehidingStyle('at.js content rendering failed');
      const atLibraryLoaded = () => removePrehidingStyle('at.js library loaded');
      
      document.addEventListener('at-content-rendering-succeeded', atRenderSuccess);
      document.addEventListener('at-content-rendering-failed', atRenderFailed);
      document.addEventListener('at-library-loaded', atLibraryLoaded);
      
      console.log('👂 PREHIDING: Listening for at.js events for early removal...');
      
      // Alloy.js detection (for Web SDK implementations)
      // Alloy removes prehiding automatically if configured, but we add extra check
      const checkAlloyComplete = () => {
        // Check if Alloy has signaled completion
        if (window.alloy && window.__alloy_prehiding_removed) {
          removePrehidingStyle('Alloy.js signaled completion');
        }
      };
      
      // Check for Alloy periodically (it might signal completion)
      const alloyCheckInterval = setInterval(() => {
        checkAlloyComplete();
        if (styleRemoved) {
          clearInterval(alloyCheckInterval);
        }
      }, 100); // Check every 100ms
      
      // Fallback timeout (if Target never loads or fires events)
      setTimeout(() => {
        clearInterval(alloyCheckInterval);
        if (!styleRemoved) {
          removePrehidingStyle('Timeout fallback (3000ms)');
        }
      }, 3000);
      
      console.log('⏰ PREHIDING: Fallback timeout set to 3000ms');
      
    } else {
      console.error('❌ SNIPPET INJECTOR: Cannot inject - no head or documentElement');
    }
    
  } catch (error) {
    console.error('❌ SNIPPET INJECTOR: Error:', error);
  }
})();

// Clean up injection flag when page loads
window.addEventListener('load', () => {
  chrome.storage.local.remove(['injectPrehidingSnippet']);
  console.log('🧹 SNIPPET INJECTOR: Cleaned up injection flag');
});

