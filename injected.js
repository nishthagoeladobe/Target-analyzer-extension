// Adobe Target Response Reader - Direct Approach
(function() {
  'use strict';

  console.log('🔍 Adobe Target response reader injected');

  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch with better error handling
  window.fetch = function(resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // Only intercept Adobe Target delivery calls
    if (url && url.includes('tt.omtrdc.net') && url.includes('/delivery')) {
      console.log('🎯 INTERCEPTING Adobe Target delivery call:', url);
      console.log('🎯 Options:', options);
      
      // Call original fetch
      return originalFetch.call(this, resource, options)
        .then(response => {
          console.log('📨 Adobe Target response received:', response.status, response.statusText);
          
          if (response.ok) {
            // Clone the response so we can read it
            const responseClone = response.clone();
            
            // Read the response as text
            responseClone.text()
              .then(responseText => {
                console.log('✅ Successfully read response, length:', responseText.length);
                console.log('📋 Response sample:', responseText.substring(0, 200));
                
                try {
                  // Try to parse as JSON to validate
                  const jsonData = JSON.parse(responseText);
                  console.log('✅ Valid JSON response:', !!jsonData.execute);
                  
                  // Send to content script immediately
                  window.postMessage({
                    type: 'ADOBE_TARGET_RESPONSE_READY',
                    url: url,
                    responseData: responseText,
                    status: response.status,
                    timestamp: Date.now()
                  }, '*');
                  
                } catch (parseError) {
                  console.error('❌ Failed to parse JSON:', parseError);
                  console.log('Raw response:', responseText);
                }
              })
              .catch(textError => {
                console.error('❌ Failed to read response text:', textError);
              });
          } else {
            console.error('❌ Response not OK:', response.status, response.statusText);
          }
          
          // Return the original response
          return response;
        })
        .catch(fetchError => {
          console.error('❌ Fetch error:', fetchError);
          throw fetchError;
        });
    }
    
    // For non-Adobe Target calls, use original fetch
    return originalFetch.call(this, resource, options);
  };

  console.log('✅ Adobe Target response reader ready');

})(); 