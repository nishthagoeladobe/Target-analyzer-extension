/**
 * Prehiding Snippet Blocker - Content Script
 * 
 * This script blocks Adobe Target's prehiding snippet by:
 * 1. Running BEFORE page scripts (run_at: document_start)
 * 2. Intercepting and removing prehiding snippet code
 * 3. Allowing the page to render normally without the snippet
 */

console.log('🚫 SNIPPET BLOCKER: Content script loaded');

// Check if we should block the snippet for this page load
chrome.storage.local.get(['blockPrehidingSnippet'], (result) => {
  if (result.blockPrehidingSnippet) {
    console.log('🚫 SNIPPET BLOCKER: Blocking mode ACTIVE');
    
    // Method 1: Override document.write to intercept snippet injection
    const originalWrite = document.write;
    document.write = function(content) {
      // Check if this is a prehiding snippet
      if (content.includes('prehiding') || 
          content.includes('opacity: 0') || 
          content.includes('opacity:0') ||
          (content.includes('body') && content.includes('opacity') && content.includes('setTimeout'))) {
        
        console.log('🚫 SNIPPET BLOCKER: Blocked prehiding snippet via document.write');
        console.log('   Snippet content:', content.substring(0, 200));
        
        // Don't write the snippet - just return
        return;
      }
      
      // Not a prehiding snippet, allow it
      originalWrite.call(document, content);
    };
    
    // Method 2: Watch for <style> tags that hide the body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check for <style> tags with prehiding CSS
          if (node.nodeName === 'STYLE') {
            const styleContent = node.textContent || '';
            if (styleContent.includes('body') && 
                (styleContent.includes('opacity: 0') || styleContent.includes('opacity:0'))) {
              console.log('🚫 SNIPPET BLOCKER: Removed prehiding <style> tag');
              node.remove();
            }
          }
          
          // Check for <script> tags with prehiding logic
          if (node.nodeName === 'SCRIPT' && !node.src) {
            const scriptContent = node.textContent || '';
            if (scriptContent.includes('prehiding') ||
                (scriptContent.includes('opacity') && scriptContent.includes('setTimeout') && scriptContent.includes('body'))) {
              console.log('🚫 SNIPPET BLOCKER: Removed prehiding <script> tag');
              node.remove();
            }
          }
        });
      });
    });
    
    // Start observing as soon as possible
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });
    
    // Method 3: Ensure body is always visible
    const ensureBodyVisible = () => {
      if (document.body) {
        const bodyStyle = window.getComputedStyle(document.body);
        if (bodyStyle.opacity === '0' || bodyStyle.visibility === 'hidden') {
          console.log('🚫 SNIPPET BLOCKER: Forcing body visibility');
          document.body.style.opacity = '1';
          document.body.style.visibility = 'visible';
        }
      }
    };
    
    // Check immediately and repeatedly during page load
    ensureBodyVisible();
    setInterval(ensureBodyVisible, 100);
    
    // Clean up after page loads
    window.addEventListener('load', () => {
      observer.disconnect();
      console.log('✅ SNIPPET BLOCKER: Page loaded, blocking complete');
      
      // Note: We don't clear the blockPrehidingSnippet flag here
      // because the test logic in popup.js manages this flag
    });
    
  } else {
    console.log('✅ SNIPPET BLOCKER: Blocking mode INACTIVE - snippet will run normally');
  }
});

