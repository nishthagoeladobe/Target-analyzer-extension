class AdobeTargetDebugger {
  constructor() {
    this.activities = new Map(); // tabId -> activities array
    this.debuggingSessions = new Map(); // tabId -> boolean
    this.pendingRequests = new Map(); // requestId -> request info
    this.debuggerCancelledTabs = new Map(); // tabId -> timestamp when user cancelled debugger
    this.autoDebuggerDisabled = new Set(); // tabs where auto-debugger was disabled by user action
    this.performanceData = new Map(); // tabId -> performance metrics
    this.flickerTestData = new Map(); // tabId -> { withSnippet: {}, withoutSnippet: {} }
    this.networkEvents = new Map(); // tabId -> network events array
    
    this.init();
  }

  // Utility method to check if a tab is debuggable
  isTabDebuggable(url) {
    if (!url) return false;
    
    const systemUrls = [
      'chrome://', 'chrome-extension://', 'edge://', 'moz-extension://',
      'about:', 'file://', 'chrome-search://', 'chrome-native://', 'devtools://'
    ];
    
    const protectedPages = [
      'chrome.google.com/webstore', 'addons.mozilla.org', 'microsoftedge.microsoft.com'
    ];
    
    const isSystemTab = systemUrls.some(prefix => url.startsWith(prefix));
    const isProtectedPage = protectedPages.some(domain => url.includes(domain));
    
    return !isSystemTab && !isProtectedPage;
  }

  init() {
    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for debugger events
    chrome.debugger.onEvent.addListener((source, method, params) => {
      this.handleDebuggerEvent(source.tabId, method, params);
    });

    // Only clear activities when tab navigates - NO automatic debugging
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        console.log('🔄 DEBUGGER: Tab loading, clearing activities:', tabId);
        this.clearTabActivities(tabId);
        // Clear cancelled status on navigation to new page (fresh start)
        this.debuggerCancelledTabs.delete(tabId);
        this.autoDebuggerDisabled.delete(tabId);
      }
      // REMOVED: No automatic debugger attachment on page complete
      // Debugger will only be attached when user explicitly requests it
    });

    // Handle debugger detachment
    chrome.debugger.onDetach.addListener((source, reason) => {
      console.log('🔌 DEBUGGER: Debugger detached from tab:', source.tabId, 'Reason:', reason);
      this.debuggingSessions.delete(source.tabId);
      
      // If user cancelled, track it to avoid re-attempting immediately
      if (reason === 'canceled_by_user') {
        console.log('👤 DEBUGGER: User cancelled debugger for tab:', source.tabId);
        this.debuggerCancelledTabs.set(source.tabId, Date.now());
        this.autoDebuggerDisabled.add(source.tabId);
      }
    });

    // Handle tab removal to clean up resources
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      console.log('🗑️ DEBUGGER: Tab removed, cleaning up:', tabId);
      this.activities.delete(tabId);
      this.debuggingSessions.delete(tabId);
      this.debuggerCancelledTabs.delete(tabId);
      this.autoDebuggerDisabled.delete(tabId);
      
      // Clear pending requests for this tab
      this.pendingRequests.forEach((request, requestId) => {
        if (request.tabId === tabId) {
          this.pendingRequests.delete(requestId);
        }
      });
      
      console.log('✅ DEBUGGER: Cleanup completed for tab:', tabId);
    });

    // Listen for flicker test state changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.flickerTestState) {
        console.log('🧪 FLICKER TEST: State changed:', changes.flickerTestState.newValue);
      }
    });

    // Listen for page load complete to collect flicker test metrics
    chrome.webNavigation.onCompleted.addListener(async (details) => {
      if (details.frameId === 0) { // Main frame only
        // Check if this is during a flicker test
        const testState = await chrome.storage.local.get(['flickerTestState', 'flickerTestTabId']);
        if (testState.flickerTestState && testState.flickerTestTabId === details.tabId) {
          console.log('🧪 FLICKER TEST: Page loaded during test, re-enabling Network monitoring...');
          
          // Re-enable Network domain after page reload (critical for Target detection!)
          try {
            if (this.debuggingSessions.has(details.tabId)) {
              await chrome.debugger.sendCommand({ tabId: details.tabId }, 'Network.enable');
              console.log('✅ FLICKER TEST: Network monitoring re-enabled');
            } else {
              console.warn('⚠️ FLICKER TEST: Debugger not attached! Re-attaching...');
              await this.startDebugging(details.tabId, 'flicker_test');
            }
          } catch (e) {
            console.error('❌ FLICKER TEST: Error re-enabling Network:', e);
          }
        }
        
        await this.collectFlickerTestMetrics(details.tabId);
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    const tabId = message.tabId || sender.tab?.id;
    console.log('📨 DEBUGGER: Received message:', message.type, 'for tab:', tabId);
    
    switch (message.type) {
      case 'START_MONITORING':
        console.log('🎯 DEBUGGER: Starting monitoring for tab:', tabId);
        await this.startDebugging(tabId, 'manual');
        sendResponse({ success: true, method: 'debugger' });
        break;

      case 'ENABLE_AUTO_DEBUGGING':
        console.log('🎯 DEBUGGER: Re-enabling auto-debugging for tab:', tabId);
        this.autoDebuggerDisabled.delete(tabId);
        this.debuggerCancelledTabs.delete(tabId);
        await this.startDebugging(tabId, 'manual');
        sendResponse({ success: true, enabled: true });
        break;

      case 'GET_ACTIVITIES':
        console.log('📋 DEBUGGER: Getting activities for tab:', tabId);
        const activities = this.activities.get(tabId) || [];
        const isDebugging = this.debuggingSessions.has(tabId);
        const isDisabled = this.autoDebuggerDisabled.has(tabId);
        console.log(`📊 DEBUGGER: Found ${activities.length} activities for tab:`, tabId);
        sendResponse({ 
          activities, 
          isDebugging, 
          debuggerDisabled: isDisabled 
        });
        break;

      case 'GET_EVENTS':
        console.log('📡 DEBUGGER: Getting network events for tab:', tabId);
        const events = this.networkEvents.get(tabId) || [];
        console.log(`📊 DEBUGGER: Found ${events.length} network events for tab:`, tabId);
        sendResponse({ 
          events,
          count: events.length
        });
        break;

      case 'GET_PERFORMANCE':
        console.log('⚡ DEBUGGER: Getting performance data for tab:', tabId);
        const perfData = this.performanceData.get(tabId) || null;
        sendResponse({ performanceData: perfData });
        break;

      case 'COLLECT_FLICKER_METRICS':
        console.log('📨 DEBUGGER: Manual flicker metrics collection requested for tab:', tabId);
        this.collectFlickerTestMetrics(tabId).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('❌ Error collecting flicker metrics:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response

      case 'CLEAR_FLICKER_TEST_DATA':
        console.log('🧹 FLICKER TEST: Clearing test data for tab:', tabId);
        if (this.flickerTestData.has(tabId)) {
          this.flickerTestData.delete(tabId);
        }
        sendResponse({ success: true });
        break;

      case 'CLEAR_ACTIVITIES':
        console.log('🧹 DEBUGGER: Clearing activities for tab:', tabId);
        this.clearTabActivities(tabId);
        sendResponse({ success: true });
        break;

      case 'TEST_CONNECTION':
        console.log('🔗 DEBUGGER: Connection test');
        sendResponse({ 
          success: true, 
          message: 'Background script is running (debugger mode)',
          timestamp: Date.now(),
          debuggingSessions: this.debuggingSessions.size,
          totalActivities: Array.from(this.activities.values()).reduce((sum, acts) => sum + acts.length, 0),
          method: 'debugger'
        });
        break;

      default:
        console.log('❓ DEBUGGER: Unknown message type:', message.type);
        sendResponse({ error: 'Unknown message type' });
    }
  }

  async startDebugging(tabId, trigger = 'auto') {
    console.log('🔧 DEBUGGER: Starting debugging session for tab:', tabId, 'trigger:', trigger);
    
    // Skip if already debugging this tab
    if (this.debuggingSessions.has(tabId)) {
      console.log('⚠️ DEBUGGER: Already debugging tab:', tabId);
      return;
    }

    // If this is auto-trigger and user has cancelled before, skip
    if (trigger === 'auto' && this.autoDebuggerDisabled.has(tabId)) {
      console.log('⚠️ DEBUGGER: Auto-debugging disabled for tab:', tabId);
      return;
    }

    // Validate tab exists and is debuggable
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab) {
        console.log('⚠️ DEBUGGER: Tab not found:', tabId);
        return;
      }
      
      if (!this.isTabDebuggable(tab.url)) {
        console.log('⚠️ DEBUGGER: Skipping system/protected tab:', tab.url.substring(0, 50) + '...');
        return;
      }
      
    } catch (error) {
      console.log('ℹ️ DEBUGGER: Tab not accessible:', tabId, error.message);
      return;
    }

    try {
      console.log('🔗 DEBUGGER: Attempting to attach debugger to tab:', tabId);
      
      // First, try to detach any existing debugger (graceful conflict handling)
      try {
        await chrome.debugger.detach({ tabId });
        console.log('🔄 DEBUGGER: Detached existing debugger from tab:', tabId);
        await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause
      } catch (detachError) {
        console.log('ℹ️ DEBUGGER: No existing debugger to detach (normal)');
      }
      
      // Now attach our debugger
      await chrome.debugger.attach({ tabId }, '1.3');
      console.log('✅ DEBUGGER: Successfully attached to tab:', tabId);
      
      this.debuggingSessions.set(tabId, true);

      // Enable Network domain
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
      console.log('🌐 DEBUGGER: Network domain enabled for tab:', tabId);

      // Clear any pending requests for this tab
      this.pendingRequests.forEach((request, requestId) => {
        if (request.tabId === tabId) {
          this.pendingRequests.delete(requestId);
        }
      });
      console.log('🧹 DEBUGGER: Cleared pending requests for tab:', tabId);

    } catch (error) {
      // Handle specific error types gracefully (these are expected in many scenarios)
      if (error.message.includes('already attached') || error.message.includes('Another debugger')) {
        console.log('ℹ️ DEBUGGER: DevTools is open - extension will work with limited data');
        // This is normal when DevTools is open, don't log as error
      } else if (error.message.includes('No tab with given id') || error.message.includes('Invalid tab ID')) {
        console.log('ℹ️ DEBUGGER: Tab closed before debugger could attach');
        // This is normal when tabs are closed quickly
      } else if (error.message.includes('extensions gallery cannot be scripted') || 
                 error.message.includes('Cannot attach to') ||
                 error.message.includes('Cannot access') ||
                 error.message.includes('chrome://') ||
                 error.message.includes('chrome-extension://')) {
        console.log('ℹ️ DEBUGGER: Protected/system page - debugger not allowed (normal)');
        // This is normal for Chrome system pages
      } else if (error.message.includes('Target closed') || 
                 error.message.includes('Session does not exist') ||
                 error.message.includes('Detached while handling command')) {
        console.log('ℹ️ DEBUGGER: Tab/session closed during operation (normal)');
        // This is normal when tabs are navigated or closed
      } else if (error.message.includes('canceled') || error.message.includes('Canceled') || error.message.includes('cancelled')) {
        console.log('👤 DEBUGGER: User cancelled debugger attachment for tab:', tabId);
        // Mark this tab so we don't keep trying automatically
        this.debuggerCancelledTabs.set(tabId, Date.now());
        if (trigger === 'auto') {
          this.autoDebuggerDisabled.add(tabId);
          console.log('🔕 DEBUGGER: Auto-debugging disabled for tab:', tabId);
        }
      } else {
        // Only log unexpected errors, but don't make them look alarming
        console.log('ℹ️ DEBUGGER: Debugger attachment skipped:', error.message);
        // For auto-triggered debugging, be more conservative with retries
        if (trigger === 'auto') {
          this.debuggerCancelledTabs.set(tabId, Date.now());
          console.log('⏸️ DEBUGGER: Auto-debugging paused for tab due to error:', tabId);
        }
      }
      
      this.debuggingSessions.delete(tabId);
    }
  }

  createFallbackActivity(tabId) {
    const fallbackActivity = {
      id: `fallback-activity-${Date.now()}`,
      timestamp: Date.now(),
      url: 'chrome://devtools-conflict',
      method: 'GET',
      type: 'fallback',
      statusCode: 200,
      name: 'DevTools Conflict Detected',
      experience: 'Close DevTools for detailed activity names',
      activityId: 'devtools-conflict',
      implementationType: 'fallback',
      details: {
        responseTokens: { 
          'conflict.reason': 'Chrome DevTools is open',
          'solution': 'Close DevTools and refresh to see real activities',
          'status': 'Extension working but limited by DevTools'
        },
        pageModifications: [{
          type: 'conflict',
          selector: 'devtools',
          content: 'Close DevTools to see real Adobe Target activity details'
        }],
        metrics: [],
        mboxes: ['devtools-conflict'],
        clientCode: 'Extension Limited',
        requestId: 'devtools-conflict'
      },
      requestDetails: {
        url: 'chrome://devtools-conflict',
        method: 'GET',
        headers: [],
        payload: null
      },
      responseDetails: {
        statusCode: 200,
        note: 'Close Chrome DevTools to enable full debugger API access for real activity names'
      }
    };
    
    this.storeActivity(tabId, fallbackActivity);
    console.log('📦 DEBUGGER: Created fallback activity due to DevTools conflict');
  }

  handleDebuggerEvent(tabId, method, params) {
    if (!this.debuggingSessions.has(tabId)) return;
    
    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleRequestWillBeSent(tabId, params);
        break;
      case 'Network.responseReceived':
        this.handleResponseReceived(tabId, params);
        break;
      case 'Network.loadingFinished':
        this.handleLoadingFinished(tabId, params);
        break;
    }
  }

  handleRequestWillBeSent(tabId, params) {
    const url = params.request.url;
    
    // Check if this is an Adobe Target call (at.js delivery or alloy.js interact)
    // Support both standard tt.omtrdc.net and CNAME implementations
    const isDeliveryCall = url.includes('tt.omtrdc.net/rest/v1/delivery') || 
                          (url.includes('/rest/v1/delivery') && url.includes('client='));
    const isInteractCall = url.includes('/ee/or2/v1/interact') || 
                          url.includes('/ee/v1/interact') || 
                          url.includes('aem.playstation.com/ee/');
    
    // Log all requests for debugging
    console.log('📤 DEBUGGER: Request sent:', {
      tabId,
      requestId: params.requestId,
      url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
      method: params.request.method,
      isDeliveryCall,
      isInteractCall
    });

    if (isDeliveryCall || isInteractCall) {
      const detectionType = url.includes('tt.omtrdc.net') ? 'standard' : 'CNAME';
      console.log('🎯 DEBUGGER: Adobe Target call detected:', {
        url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
        type: isDeliveryCall ? 'delivery' : 'interact',
        detection: detectionType
      });
      
      // Store request info for later processing
      console.log('🔍 DEBUGGER: Storing request with POST data:', {
        requestId: params.requestId,
        method: params.request.method,
        hasPostData: !!params.request.postData,
        postDataKeys: params.request.postData ? Object.keys(params.request.postData) : [],
        postDataText: params.request.postData?.text,
        postDataEntries: params.request.postData?.postDataEntries
      });
      
      const requestInfo = {
        tabId,
        url,
        method: params.request.method,
        headers: params.request.headers,
        postData: params.request.postData,
        timestamp: Date.now(),
        implementationType: isDeliveryCall ? 'at.js' : 'alloy.js',
        callType: isDeliveryCall ? 'delivery' : 'interact',
        requestId: params.requestId
      };
      
      // Store network event for Events tab
      this.storeNetworkEvent(tabId, {
        id: params.requestId,
        type: isDeliveryCall ? 'delivery' : 'interact',
        eventType: this.extractEventType(params.request),
        url: url,
        method: params.request.method,
        timestamp: Date.now(),
        requestInfo: requestInfo,
        status: 'pending'
      });
      
      // Try to get POST data using Network.getRequestPostData if method is POST
      if (params.request.method === 'POST' && !params.request.postData?.text) {
        console.log('🔍 DEBUGGER: Attempting to get POST data via Network.getRequestPostData');
        this.getRequestPostData(tabId, params.requestId, requestInfo);
      }
      
      this.pendingRequests.set(params.requestId, requestInfo);
    }
  }

  async getRequestPostData(tabId, requestId, requestInfo) {
    try {
      console.log('📡 DEBUGGER: Attempting to get POST data for request:', requestId);
      const postData = await chrome.debugger.sendCommand({ tabId }, 'Network.getRequestPostData', { requestId });
      
      if (postData && postData.postData) {
        console.log('✅ DEBUGGER: Successfully retrieved POST data:', postData.postData.substring(0, 200));
        // Update the stored request info with the POST data
        requestInfo.postData = { text: postData.postData };
        this.pendingRequests.set(requestId, requestInfo);
      }
    } catch (error) {
      console.log('⚠️ DEBUGGER: Could not get POST data:', error.message);
    }
  }

  handleResponseReceived(tabId, params) {
    const requestId = params.requestId;
    const pendingRequest = this.pendingRequests.get(requestId);
    
    if (pendingRequest) {
      console.log('📥 DEBUGGER: Response received for Adobe Target call:', {
        tabId,
        requestId,
        status: params.response.status,
        mimeType: params.response.mimeType
      });
      
      // Update pending request with response info
      pendingRequest.responseStatus = params.response.status;
      pendingRequest.responseHeaders = params.response.headers;
      pendingRequest.mimeType = params.response.mimeType;
      
      // Update network event status
      this.updateNetworkEventStatus(tabId, requestId, {
        status: params.response.status,
        responseHeaders: params.response.headers,
        timing: params.response.timing
      });
    }
  }

  async handleLoadingFinished(tabId, params) {
    const requestId = params.requestId;
    const pendingRequest = this.pendingRequests.get(requestId);
    
    if (!pendingRequest) return;
    
    console.log('✅ DEBUGGER: Loading finished for Adobe Target call:', {
      tabId,
      requestId,
      implementationType: pendingRequest.implementationType
    });

    // Track performance timing for Adobe Target delivery
    const activityDeliveryTime = Date.now();
    this.updatePerformanceData(tabId, {
      activityDeliveryTimestamp: activityDeliveryTime,
      targetCallDuration: activityDeliveryTime - pendingRequest.timestamp
    });

    // CRITICAL: Check if we're in a flicker test - store timing for current test phase
    const testState = await chrome.storage.local.get(['flickerTestState', 'flickerTestTabId']);
    
    console.log('🔍 FLICKER TEST: Checking test state:', {
      currentState: testState.flickerTestState,
      expectedTab: testState.flickerTestTabId,
      actualTab: tabId,
      match: testState.flickerTestState && testState.flickerTestTabId === tabId
    });
    
    if (testState.flickerTestState && testState.flickerTestTabId === tabId) {
      console.log('✅ FLICKER TEST: Target call detected during test:', testState.flickerTestState);
      
      if (!this.flickerTestData.has(tabId)) {
        this.flickerTestData.set(tabId, {});
      }
      
      const testData = this.flickerTestData.get(tabId);
      const phaseKey = testState.flickerTestState === 'test_with_snippet' ? 'withSnippetTargetTime' : 'withoutSnippetTargetTime';
      testData[phaseKey] = activityDeliveryTime;
      
      console.log(`✅ FLICKER TEST: Stored Target timing for ${testState.flickerTestState}:`, {
        phaseKey,
        timestamp: activityDeliveryTime,
        flickerTestData: testData
      });
    } else {
      console.log('⚠️ FLICKER TEST: Not in a flicker test or tab mismatch, Target timing NOT stored');
    }

    try {
      // Get the response body
      const response = await chrome.debugger.sendCommand(
        { tabId }, 
        'Network.getResponseBody', 
        { requestId }
      );
      
      console.log('📦 DEBUGGER: Got response body for:', pendingRequest.implementationType);
      
      // Parse and create activity based on implementation type
      if (pendingRequest.implementationType === 'at.js') {
        this.createActivityFromResponse(tabId, pendingRequest, response.body);
      } else {
        this.createActivityFromAlloyResponse(tabId, pendingRequest, response.body);
      }
      
    } catch (error) {
      console.log('⚠️ DEBUGGER: Error getting response body:', error.message);
      
      // Handle specific errors gracefully
      if (error.message.includes('No resource with given identifier found') || 
          error.message.includes('-32000')) {
        console.log('ℹ️ DEBUGGER: Response body not available (normal for some requests)');
        // Create basic activity without response body
        this.createBasicActivity(tabId, pendingRequest);
      } else {
        console.log('ℹ️ DEBUGGER: Unexpected error (continuing):', error.message);
        // Create basic activity as fallback
        this.createBasicActivity(tabId, pendingRequest);
      }
    } finally {
      // Clean up
      this.pendingRequests.delete(requestId);
    }
  }

  createActivityFromResponse(tabId, requestInfo, responseBody) {
    try {
      const responseData = JSON.parse(responseBody);
      console.log('🔍 DEBUGGER: Parsed at.js response:', responseData);
      
      // Extract activities from at.js delivery response
      if (responseData.execute && responseData.execute.mboxes) {
        responseData.execute.mboxes.forEach((mbox, index) => {
          if (mbox.options && mbox.options.length > 0) {
            mbox.options.forEach((option, optionIndex) => {
              const activity = this.createActivityFromMboxOption(
                tabId, 
                requestInfo, 
                responseData, 
                mbox, 
                option, 
                `${index}-${optionIndex}`
              );
              this.storeActivity(tabId, activity);
            });
          }
        });
      }
      
      // Handle pageLoad mbox
      if (responseData.execute && responseData.execute.pageLoad && 
          responseData.execute.pageLoad.options && 
          responseData.execute.pageLoad.options.length > 0) {
        responseData.execute.pageLoad.options.forEach((option, optionIndex) => {
          const activity = this.createActivityFromPageLoadOption(
            tabId, 
            requestInfo, 
            responseData, 
            option, 
            optionIndex
          );
          this.storeActivity(tabId, activity);
        });
      }
      
    } catch (error) {
      console.log('ℹ️ DEBUGGER: Could not parse at.js response (using fallback):', error.message);
      this.createBasicActivity(tabId, requestInfo);
    }
  }

  createActivityFromMboxOption(tabId, requestInfo, responseData, mbox, option, uniqueId) {
    // Extract response tokens
    const responseTokens = option.responseTokens || {};
    
    // Extract activity details
    const activityName = responseTokens['activity.name'] || 'Unknown Activity';
    const experienceName = responseTokens['experience.name'] || 'Unknown Experience';
    const activityId = responseTokens['activity.id'] || 'unknown';
    const experienceId = responseTokens['experience.id'] || 'unknown';
    
    return {
      id: `at-${activityId}-${experienceId}-${uniqueId}-${Date.now()}`,
      timestamp: Date.now(),
      url: requestInfo.url,
      method: requestInfo.method,
      type: requestInfo.callType,
      statusCode: requestInfo.responseStatus || 200,
      name: activityName,
      experience: experienceName,
      activityId: activityId,
      implementationType: 'at.js',
      details: {
        responseTokens,
        pageModifications: this.extractPageModifications(option),
        metrics: option.metrics || [],
        mboxes: [mbox.name],
        clientCode: this.extractClientCode(requestInfo.url),
        requestId: requestInfo.url.match(/sessionId=([^&]*)/)?.[1] || 'unknown'
      },
      requestDetails: {
        url: requestInfo.url,
        method: requestInfo.method,
        headers: requestInfo.headers || [],
        payload: this.extractPostData(requestInfo.postData)
      },
      responseDetails: {
        statusCode: requestInfo.responseStatus || 200,
        headers: requestInfo.responseHeaders || [],
        mbox: mbox.name,
        option: option,
        responseTokens: responseTokens
      }
    };
  }

  createActivityFromPageLoadOption(tabId, requestInfo, responseData, option, optionIndex) {
    // Extract response tokens
    const responseTokens = option.responseTokens || {};
    
    // Extract activity details
    const activityName = responseTokens['activity.name'] || 'PageLoad Activity';
    const experienceName = responseTokens['experience.name'] || 'PageLoad Experience';
    const activityId = responseTokens['activity.id'] || 'pageload';
    const experienceId = responseTokens['experience.id'] || `pageload-${optionIndex}`;
    
    return {
      id: `at-pageload-${activityId}-${experienceId}-${optionIndex}-${Date.now()}`,
      timestamp: Date.now(),
      url: requestInfo.url,
      method: requestInfo.method,
      type: requestInfo.callType,
      statusCode: requestInfo.responseStatus || 200,
      name: activityName,
      experience: experienceName,
      activityId: activityId,
      implementationType: 'at.js',
      details: {
        responseTokens,
        pageModifications: this.extractPageModifications(option),
        metrics: option.metrics || [],
        mboxes: ['target-global-mbox'],
        clientCode: this.extractClientCode(requestInfo.url),
        requestId: requestInfo.url.match(/sessionId=([^&]*)/)?.[1] || 'unknown'
      },
      requestDetails: {
        url: requestInfo.url,
        method: requestInfo.method,
        headers: requestInfo.headers || [],
        payload: this.extractPostData(requestInfo.postData)
      },
      responseDetails: {
        statusCode: requestInfo.responseStatus || 200,
        headers: requestInfo.responseHeaders || [],
        mbox: 'target-global-mbox',
        option: option,
        responseTokens: responseTokens
      }
    };
  }

  createActivityFromAlloyResponse(tabId, requestInfo, responseBody) {
    try {
      const responseData = JSON.parse(responseBody);
      console.log('🔍 DEBUGGER: Parsed alloy.js response:', responseData);
      console.log('🔍 DEBUGGER: Response handle array:', responseData.handle);
      
      let activitiesFound = 0;
      
      // Extract activities from alloy.js interact response
      if (responseData.handle && Array.isArray(responseData.handle)) {
        responseData.handle.forEach((handleItem, handleIndex) => {
          console.log(`🔍 DEBUGGER: Processing handle item type: "${handleItem.type}"`);
          
          // Handle personalization:decisions (standard)
          if (handleItem.type === 'personalization:decisions' && handleItem.payload) {
            console.log('  ✅ Found personalization:decisions with', handleItem.payload.length, 'decisions');
            handleItem.payload.forEach((decision, decisionIndex) => {
              if (decision.items && decision.items.length > 0) {
                decision.items.forEach((item, itemIndex) => {
                  const activity = this.createActivityFromAlloyDecision(
                    tabId, 
                    requestInfo, 
                    responseData, 
                    decision, 
                    item, 
                    `${handleIndex}-${decisionIndex}-${itemIndex}`
                  );
                  this.storeActivity(tabId, activity);
                  activitiesFound++;
                });
              }
            });
          }
        });
      }
      
      console.log(`🔍 DEBUGGER: Total activities created from alloy.js response: ${activitiesFound}`);
      
      // If no activities found but response exists, log full response for debugging
      if (activitiesFound === 0) {
        console.warn('⚠️ DEBUGGER: No activities extracted from alloy.js response!');
        console.log('Full response structure:', JSON.stringify(responseData, null, 2));
      }
      
    } catch (error) {
      console.log('ℹ️ DEBUGGER: Could not parse alloy.js response (using fallback):', error.message);
      this.createBasicActivity(tabId, requestInfo);
    }
  }

  createActivityFromAlloyDecision(tabId, requestInfo, responseData, decision, item, uniqueId) {
    // Extract activity details from the item
    const activityName = item.meta?.['activity.name'] || 
                        decision.meta?.['activity.name'] || 
                        'Alloy Activity';
    const experienceName = item.meta?.['experience.name'] || 
                          decision.meta?.['experience.name'] || 
                          'Alloy Experience';
    const activityId = item.meta?.['activity.id'] || 
                      decision.meta?.['activity.id'] || 
                      item.data?.content?.activityId ||
                      decision.scopeDetails?.activity?.id ||
                      decision.id || 
                      'unknown';
    const experienceId = item.meta?.['experience.id'] || 
                        item.id || 
                        `alloy-exp-${uniqueId}`;

    // Extract response tokens from meta
    const responseTokens = {
      ...item.meta,
      ...decision.meta,
      'decision.scope': decision.scope,
      'decision.id': decision.id
    };

    return {
      id: `alloy-${activityId}-${experienceId}-${uniqueId}-${Date.now()}`,
      timestamp: Date.now(),
      url: requestInfo.url,
      method: requestInfo.method,
      type: requestInfo.callType,
      statusCode: requestInfo.responseStatus || 200,
      name: activityName,
      experience: experienceName,
      activityId: activityId,
      implementationType: 'alloy.js',
      details: {
        responseTokens,
        pageModifications: this.extractAlloyPageModifications(item),
        metrics: item.metrics || [],
        mboxes: [decision.scope],
        clientCode: this.extractClientCode(requestInfo.url),
        requestId: responseData.requestId || 'unknown'
      },
      requestDetails: {
        url: requestInfo.url,
        method: requestInfo.method,
        headers: requestInfo.headers || [],
        payload: this.extractPostData(requestInfo.postData)
      },
      responseDetails: {
        statusCode: requestInfo.responseStatus || 200,
        headers: requestInfo.responseHeaders || [],
        decision: decision,
        item: item,
        handle: [{
          type: 'personalization:decisions',
          payload: [decision]
        }]
      }
    };
  }

  createBasicActivity(tabId, requestInfo) {
    const activity = {
      id: `basic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: requestInfo.url,
      method: requestInfo.method,
      type: requestInfo.callType,
      statusCode: requestInfo.responseStatus || 'detected',
      name: `${requestInfo.implementationType} Activity Detected`,
      experience: 'Response body not available',
      activityId: 'basic-detection',
      implementationType: requestInfo.implementationType,
      details: {
        responseTokens: {
          'detection.method': 'Request URL only',
          'response.status': 'Body not accessible',
          'note': 'Activity detected but response details unavailable'
        },
        pageModifications: [],
        metrics: [],
        mboxes: [requestInfo.implementationType === 'at.js' ? 'target-global-mbox' : 'web-sdk-scope'],
        clientCode: this.extractClientCode(requestInfo.url),
        requestId: 'basic-detection'
      },
      requestDetails: {
        url: requestInfo.url,
        method: requestInfo.method,
        headers: requestInfo.headers || [],
        payload: this.extractPostData(requestInfo.postData)
      },
      responseDetails: {
        statusCode: requestInfo.responseStatus || 'detected',
        note: 'Response body was not accessible for this request'
      }
    };
    
    this.storeActivity(tabId, activity);
    console.log('📦 DEBUGGER: Created basic activity (response body not available)');
  }

  extractPageModifications(option) {
    const modifications = [];
    
    if (option.content) {
      modifications.push({
        type: 'setHtml',
        selector: 'body',
        content: option.content
      });
    }
    
    if (option.actions) {
      option.actions.forEach(action => {
        modifications.push({
          type: action.type,
          selector: action.selector,
          content: action.content
        });
      });
    }
    
    return modifications;
  }

  extractAlloyPageModifications(item) {
    const modifications = [];
    
    if (item.data && item.data.content) {
      modifications.push({
        type: 'setHtml',
        selector: item.data.selector || 'body',
        content: item.data.content
      });
    }
    
    return modifications;
  }

  extractPostData(postData) {
    console.log('🔍 DEBUGGER: Extracting POST data:', postData);
    
    if (!postData) {
      console.log('⚠️ DEBUGGER: No POST data provided');
      return null;
    }
    
    try {
      // Try to get text from postData
      if (postData.text) {
        console.log('✅ DEBUGGER: Found POST data text, parsing JSON');
        return JSON.parse(postData.text);
      }
      
      // Try to get data from postDataEntries
      if (postData.postDataEntries && postData.postDataEntries.length > 0) {
        console.log('✅ DEBUGGER: Found POST data entries, converting bytes');
        const entry = postData.postDataEntries[0];
        if (entry.bytes) {
          // Convert bytes to string and parse
          const decoder = new TextDecoder();
          const text = decoder.decode(new Uint8Array(entry.bytes));
          console.log('✅ DEBUGGER: Converted bytes to text:', text.substring(0, 200));
          return JSON.parse(text);
        }
      }
      
      // If postData is already an object, return it
      if (typeof postData === 'object' && postData !== null) {
        console.log('✅ DEBUGGER: POST data is already an object');
        return postData;
      }
      
      console.log('⚠️ DEBUGGER: No usable POST data format found');
      return null;
    } catch (e) {
      console.log('⚠️ DEBUGGER: Error parsing POST data:', e.message);
      return null;
    }
  }

  extractClientCode(url) {
    const match = url.match(/client=([^&]*)/);
    return match ? match[1] : 'unknown';
  }

  storeActivity(tabId, activity) {
    if (!this.activities.has(tabId)) {
      this.activities.set(tabId, []);
    }
    
    const activities = this.activities.get(tabId);
    
    // Check for duplicates based on activityId and experienceName
    const isDuplicate = activities.some(existing => 
      existing.activityId === activity.activityId && 
      existing.experience === activity.experience
    );
    
    if (!isDuplicate) {
      activities.push(activity);
      console.log(`📊 DEBUGGER: Stored activity for tab ${tabId}:`, {
        name: activity.name,
        experience: activity.experience,
        type: activity.implementationType,
        totalActivities: activities.length
      });
    } else {
      console.log(`⚠️ DEBUGGER: Duplicate activity ignored:`, activity.name);
    }
  }

  clearTabActivities(tabId) {
    this.activities.delete(tabId);
    this.performanceData.delete(tabId);
    this.networkEvents.delete(tabId);
    console.log('🧹 DEBUGGER: Cleared activities, performance data, and network events for tab:', tabId);
  }

  extractEventType(request) {
    // Try to extract event type from POST data or URL
    const postData = request.postData?.text;
    if (postData) {
      try {
        const data = JSON.parse(postData);
        
        // Check for Alloy.js event types (most common structure)
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          const eventTypes = [];
          
          data.events.forEach(event => {
            // Try multiple paths to find the event type
            const eventType = 
              event.xdm?.eventType ||           // Standard XDM path
              event.xdm?.web?.webInteraction?.name ||  // Web interaction name
              event.type ||                      // Direct type field
              event.eventType ||                 // Root level eventType
              null;
            
            if (eventType) {
              eventTypes.push(eventType);
            }
          });
          
          if (eventTypes.length > 0) {
            return eventTypes.join(' | ');
          }
        }
        
        // Check for XDM event type at root level
        if (data.xdm && data.xdm.eventType) {
          return data.xdm.eventType;
        }
        
        // Check for web interaction name
        if (data.xdm?.web?.webInteraction?.name) {
          return data.xdm.web.webInteraction.name;
        }
        
      } catch (e) {
        console.log('⚠️ DEBUGGER: Error parsing POST data for event type:', e.message);
      }
    }
    return 'web.webpagedetails.pageViews'; // default for page views
  }

  storeNetworkEvent(tabId, event) {
    if (!this.networkEvents.has(tabId)) {
      this.networkEvents.set(tabId, []);
    }
    const events = this.networkEvents.get(tabId);
    events.push(event);
    console.log('📡 DEBUGGER: Stored network event:', {
      tabId,
      eventId: event.id,
      eventType: event.eventType,
      type: event.type,
      totalEvents: events.length
    });
  }

  updateNetworkEventStatus(tabId, requestId, responseInfo) {
    if (!this.networkEvents.has(tabId)) return;
    
    const events = this.networkEvents.get(tabId);
    const event = events.find(e => e.id === requestId);
    
    if (event) {
      event.status = responseInfo.status >= 200 && responseInfo.status < 300 ? 'success' : 'error';
      event.statusCode = responseInfo.status;
      event.responseHeaders = responseInfo.responseHeaders;
      event.timing = responseInfo.timing;
      event.duration = event.timing ? (event.timing.receiveHeadersEnd - event.timing.sendStart) : null;
      
      console.log('✅ DEBUGGER: Updated network event status:', {
        tabId,
        requestId,
        status: event.status,
        statusCode: event.statusCode
      });
    }
  }

  updatePerformanceData(tabId, data) {
    if (!this.performanceData.has(tabId)) {
      this.performanceData.set(tabId, {
        libraryLoadTimestamp: null,
        activityDeliveryTimestamp: null,
        targetCallDuration: null,
        firstTargetCall: null,
        totalTargetCalls: 0
      });
    }
    
    const perfData = this.performanceData.get(tabId);
    
    // Update with new data
    Object.assign(perfData, data);
    
    // Track first Target call timing
    if (!perfData.firstTargetCall && data.activityDeliveryTimestamp) {
      perfData.firstTargetCall = data.activityDeliveryTimestamp;
    }
    
    // Increment total calls
    if (data.activityDeliveryTimestamp) {
      perfData.totalTargetCalls++;
    }
    
    console.log('⚡ DEBUGGER: Updated performance data for tab:', tabId, perfData);
  }

  /* ========================================
     FLICKER TEST METHODS
     ======================================== */

  async collectFlickerTestMetrics(tabId) {
    try {
      // Check if we're in a flicker test
      const testState = await chrome.storage.local.get(['flickerTestState', 'flickerTestTabId']);
      
      console.log('🔍 FLICKER TEST: collectFlickerTestMetrics called for tabId:', tabId);
      console.log('🔍 FLICKER TEST: Current test state:', testState);
      
      if (!testState.flickerTestState || testState.flickerTestTabId !== tabId) {
        console.warn('⚠️ FLICKER TEST: Skipping collection - not in test or tab mismatch');
        console.warn('   - flickerTestState:', testState.flickerTestState);
        console.warn('   - Expected Tab ID:', testState.flickerTestTabId);
        console.warn('   - Current Tab ID:', tabId);
        console.warn('   - State exists?', !!testState.flickerTestState);
        console.warn('   - Tab ID matches?', testState.flickerTestTabId === tabId);
        
        // Dump ALL storage to debug
        const allStorage = await chrome.storage.local.get(null);
        console.warn('   - FULL STORAGE:', allStorage);
        
        return; // Not in a flicker test for this tab
      }

      console.log('🧪 FLICKER TEST: Collecting metrics for state:', testState.flickerTestState);

      // Wait for page to load and Target to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Collect performance metrics using scripting API
      console.log('🔍 FLICKER TEST: About to execute script on tab:', tabId);
      
      let result;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            console.log('🔍 FLICKER TEST: Starting performance measurement...');
          
          const perfData = window.performance;
          
          // Get paint metrics
          const paintEntries = perfData.getEntriesByType('paint');
          console.log('🎨 FLICKER TEST: Paint entries:', paintEntries.map(p => ({ name: p.name, startTime: p.startTime })));
          
          // Get FCP (First Contentful Paint)
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;
          
          // Get page load time using MODERN Navigation Timing API Level 2
          let pageLoad = null;
          const navEntries = perfData.getEntriesByType('navigation');
          
          if (navEntries && navEntries.length > 0) {
            const navEntry = navEntries[0];
            pageLoad = navEntry.loadEventEnd > 0 ? Math.round(navEntry.loadEventEnd) : null;
            console.log('📊 FLICKER TEST: Navigation timing (modern):', {
              loadEventEnd: navEntry.loadEventEnd,
              domContentLoadedEventEnd: navEntry.domContentLoadedEventEnd,
              responseEnd: navEntry.responseEnd
            });
          } else {
            // Fallback to deprecated API if modern one not available
            const navTiming = perfData.timing;
            if (navTiming && navTiming.loadEventEnd > 0 && navTiming.navigationStart > 0) {
              pageLoad = Math.round(navTiming.loadEventEnd - navTiming.navigationStart);
            }
            console.log('📊 FLICKER TEST: Navigation timing (legacy):', {
              loadEventEnd: navTiming?.loadEventEnd,
              navigationStart: navTiming?.navigationStart,
              calculated: pageLoad
            });
          }
          
          // Get ALL resources for debugging
          const allResources = perfData.getEntriesByType('resource');
          console.log('🔍 FLICKER TEST: Total resources loaded:', allResources.length);
          
          // Get Target API call timing - ULTRA COMPREHENSIVE DETECTION
          console.log('🔍 FLICKER TEST: Scanning all resources for Target patterns...');
          
          const targetCalls = allResources.filter(r => {
            const url = r.name.toLowerCase();
            
            // Check for interact calls (alloy.js / Web SDK) - ALL patterns
            const isInteract = url.includes('/ee/v1/interact') || 
                              url.includes('/ee/v2/interact') ||
                              url.includes('/ee/or2/v1/interact') ||
                              url.includes('adobedc.demdex.net/ee/') ||
                              url.includes('edge.adobedc.net/ee/') ||
                              (url.includes('/ee/') && url.includes('interact'));
            
            // Check for delivery calls (at.js) - ALL patterns
            const isDelivery = (url.includes('tt.omtrdc.net') && url.includes('/delivery')) ||
                              (url.includes('tt.omtrdc.net') && url.includes('/rest/v1/delivery')) ||
                              (url.includes('/rest/v1/delivery') && url.includes('client=')) ||
                              (url.includes('mboxedge') && url.includes('/delivery'));
            
            const matched = isInteract || isDelivery;
            
            if (matched) {
              console.log('✅ FLICKER TEST: Matched Target URL:', {
                url: r.name.substring(0, 120),
                type: isInteract ? 'interact' : 'delivery',
                startTime: Math.round(r.startTime),
                responseEnd: Math.round(r.responseEnd),
                duration: Math.round(r.duration)
              });
            }
            
            return matched;
          });
          
          console.log('🎯 FLICKER TEST: Total Target API calls found:', targetCalls.length);
          
          if (targetCalls.length === 0) {
            // Enhanced debugging - show ALL URLs with adobe/target/omtrdc
            console.warn('⚠️ FLICKER TEST: NO Target API calls found!');
            console.log('🔍 FLICKER TEST: Searching for ANY adobe-related URLs...');
            
            const adobeUrls = allResources
              .filter(r => {
                const url = r.name.toLowerCase();
                return url.includes('adobe') || url.includes('target') || 
                       url.includes('omtrdc') || url.includes('demdex') ||
                       url.includes('tt.') || url.includes('edge');
              })
              .map(r => ({
                url: r.name.substring(0, 200),
                startTime: Math.round(r.startTime),
                responseEnd: Math.round(r.responseEnd)
              }));
            
            console.log('🔍 FLICKER TEST: Adobe-related URLs found:', adobeUrls.length);
            adobeUrls.forEach((item, index) => {
              console.log(`  ${index + 1}. ${item.url}`);
            });
          }
          
          // Calculate activity time based on number of calls
          let activityTime = null;
          let earliestActivity = null;
          let latestActivity = null;
          
          if (targetCalls.length > 0) {
            // Get all activity delivery times
            const activityTimes = targetCalls.map(c => Math.round(c.responseEnd));
            earliestActivity = Math.min(...activityTimes);
            latestActivity = Math.max(...activityTimes);
            
            // For flicker calculation, use LATEST activity (when all changes are complete)
            // This represents when the user finally sees the FINAL personalized state
            activityTime = latestActivity;
            
            console.log('📊 FLICKER TEST: Activity delivery analysis:', {
              totalApiCalls: targetCalls.length,
              earliestActivity: earliestActivity + 'ms',
              latestActivity: latestActivity + 'ms',
              activitySpread: (latestActivity - earliestActivity) + 'ms',
              allDeliveryTimes: activityTimes
            });
            
            if (targetCalls.length > 1) {
              console.log(`⚠️ FLICKER TEST: Multiple activities detected (${targetCalls.length} API calls)!`);
              console.log('   Using LATEST delivery time for flicker calculation (when all personalization complete).');
            }
          }
          
          // Calculate flicker (Activity Applied - FCP)
          const flicker = (activityTime && fcp) ? Math.max(0, activityTime - fcp) : null;
          
          console.log('📊 FLICKER TEST: Calculated metrics:', {
            fcp,
            activityTime,
            flicker,
            pageLoad
          });
          
          return {
            fcp,
            pageLoad,
            activityTime,
            flicker,
            targetCallsFound: targetCalls.length,
            earliestActivity,
            latestActivity
          };
        }
        });
        
        console.log('✅ FLICKER TEST: Script execution completed, results:', results);
        
        if (!results || results.length === 0) {
          console.error('❌ FLICKER TEST: No results returned from script execution');
          return;
        }
        
        result = results[0];
        
        if (!result || !result.result) {
          console.error('❌ FLICKER TEST: Result object is missing or empty:', result);
          return;
        }
        
      } catch (scriptError) {
        console.error('❌ FLICKER TEST: Script execution failed:', scriptError);
        console.error('   Tab ID:', tabId);
        console.error('   Error details:', scriptError.message);
        return;
      }

      const metrics = result.result;
      console.log('📊 FLICKER TEST: Collected metrics from window.performance:', metrics);
      
      if (!metrics) {
        console.error('❌ FLICKER TEST: Metrics object is null or undefined');
        return;
      }

      // CRITICAL FIX: Use debugger timing if available (more reliable than window.performance)
      const testData = this.flickerTestData.get(tabId);
      const targetTimeKey = testState.flickerTestState === 'test_with_snippet' ? 'withSnippetTargetTime' : 'withoutSnippetTargetTime';
      const debuggerTargetTime = testData?.[targetTimeKey];
      
      if (debuggerTargetTime) {
        // Get page navigation start time
        const navTiming = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const navEntries = window.performance.getEntriesByType('navigation');
            if (navEntries && navEntries.length > 0) {
              // Modern API: return absolute timestamp of navigation start
              return performance.timeOrigin;
            }
            // Fallback: legacy API
            return window.performance.timing.navigationStart;
          }
        });
        
        const pageStartTime = navTiming[0].result;
        const relativeActivityTime = debuggerTargetTime - pageStartTime;
        
        metrics.activityTime = Math.round(relativeActivityTime);
        metrics.flicker = (metrics.activityTime && metrics.fcp) ? Math.max(0, metrics.activityTime - metrics.fcp) : null;
        
        console.log('✅ FLICKER TEST: Used debugger timing (RELIABLE):', {
          debuggerAbsoluteTime: debuggerTargetTime,
          pageStartTime: pageStartTime,
          calculatedActivityTime: metrics.activityTime,
          fcp: metrics.fcp,
          calculatedFlicker: metrics.flicker
        });
      } else {
        console.warn('⚠️ FLICKER TEST: No debugger timing available for this phase. Activity detection may have failed.');
      }

      // CRITICAL VALIDATION: Check if REAL activities exist (not just API calls)
      const realActivities = this.activities.get(tabId) || [];
      const hasRealActivities = realActivities.length > 0;
      
      console.log('🔍 FLICKER TEST: Activity validation:', {
        apiCallsDetected: metrics.targetCallsFound,
        realActivitiesDetected: realActivities.length,
        hasRealActivities: hasRealActivities
      });
      
      // If no real activities, set activity time to null (even if API calls were detected)
      if (!hasRealActivities) {
        console.warn('⚠️ FLICKER TEST: API calls detected but NO actual activities delivered!');
        console.warn('   Setting activityTime and flicker to null');
        metrics.activityTime = null;
        metrics.flicker = null;
      }

      console.log('📊 FLICKER TEST: Final metrics:', metrics);

      // Store metrics based on test state
      if (testState.flickerTestState === 'test_with_snippet') {
        // First test (WITH snippet)
        if (!this.flickerTestData.has(tabId)) {
          this.flickerTestData.set(tabId, {});
        }
        
        // Check if we already collected this phase (prevent duplicate collection)
        const testData = this.flickerTestData.get(tabId);
        if (testData.withSnippet) {
          console.log('⚠️ FLICKER TEST: WITH snippet metrics already collected, skipping duplicate');
          return;
        }
        
        testData.withSnippet = metrics;
        console.log('✅ FLICKER TEST: Stored WITH snippet metrics');
        
      } else if (testState.flickerTestState === 'test_without_snippet') {
        // Second test (WITHOUT snippet)
        
        // Check if we already have complete results saved (prevent overwriting)
        const existingResults = await chrome.storage.local.get(['flickerTestResults']);
        if (existingResults.flickerTestResults?.withSnippet && existingResults.flickerTestResults?.withoutSnippet) {
          console.log('⚠️ FLICKER TEST: Complete results already saved, skipping duplicate collection');
          return;
        }
        
        if (!this.flickerTestData.has(tabId)) {
          this.flickerTestData.set(tabId, {});
        }
        
        // Check if we already collected this phase (prevent duplicate collection)
        const testData = this.flickerTestData.get(tabId);
        if (testData.withoutSnippet) {
          console.log('⚠️ FLICKER TEST: WITHOUT snippet metrics already collected in memory, skipping duplicate');
          return;
        }
        
        testData.withoutSnippet = metrics;
        console.log('✅ FLICKER TEST: Stored WITHOUT snippet metrics');
        
        // Both tests complete - save results with tab info
        const finalResults = this.flickerTestData.get(tabId);
        
        // Get current tab URL for validation
        let tabUrl = '';
        try {
          const tab = await chrome.tabs.get(tabId);
          tabUrl = tab.url || '';
        } catch (error) {
          console.warn('Could not get tab URL:', error);
        }
        
        await chrome.storage.local.set({ 
          flickerTestResults: finalResults,
          flickerTestTabId: tabId,
          flickerTestUrl: tabUrl
        });
        console.log('🎉 FLICKER TEST: Both tests complete, results saved:', finalResults);
        
        // DON'T delete the map yet - wait for manual collection to verify
        // The popup.js will clear it when displaying results
      }

    } catch (error) {
      console.error('❌ FLICKER TEST: Error collecting metrics:', error);
    }
  }

  async enableScriptBlocking(tabId) {
    try {
      // Enable Fetch domain to intercept requests
      await chrome.debugger.sendCommand(
        { tabId },
        'Fetch.enable',
        {
          patterns: [{
            urlPattern: '*',
            requestStage: 'Response'
          }]
        }
      );
      console.log('🛡️ FLICKER TEST: Script blocking enabled for tab:', tabId);
    } catch (error) {
      console.error('❌ FLICKER TEST: Error enabling script blocking:', error);
    }
  }

  async blockPrehidingSnippet(tabId, requestId, responseBody) {
    try {
      // Check if this is an HTML response with prehiding snippet
      if (responseBody && typeof responseBody === 'string') {
        if (responseBody.includes('prehiding') || 
            responseBody.includes('body { opacity: 0') ||
            responseBody.includes('body{opacity:0')) {
          
          console.log('🚫 FLICKER TEST: Prehiding snippet detected, blocking...');
          
          // Remove prehiding snippet from response
          const modifiedBody = responseBody.replace(
            /<script[^>]*>[\s\S]*?(prehiding|opacity.*0)[\s\S]*?<\/script>/gi,
            '<!-- Prehiding snippet blocked by Flicker Test -->'
          );
          
          return modifiedBody;
        }
      }
      
      return responseBody; // No modification needed
      
    } catch (error) {
      console.error('❌ FLICKER TEST: Error blocking snippet:', error);
      return responseBody;
    }
  }
}

// Initialize the debugger
const targetDebugger = new AdobeTargetDebugger();
console.log('🚀 DEBUGGER: Adobe Target Activity Inspector initialized');