class AdobeTargetDebugger {
  constructor() {
    this.activities = new Map(); // tabId -> activities array
    this.debuggingSessions = new Map(); // tabId -> boolean
    this.pendingRequests = new Map(); // requestId -> request info
    
    this.init();
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

    // Clear activities when tab navigates and start debugging on complete
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        console.log('🔄 DEBUGGER: Tab loading, clearing activities:', tabId);
        this.clearTabActivities(tabId);
      }
      if (changeInfo.status === 'complete') {
        console.log('🔄 DEBUGGER: Tab complete, starting debugging with delay:', tabId);
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          this.startDebugging(tabId);
        }, 1000);
      }
    });

    // Handle debugger detachment
    chrome.debugger.onDetach.addListener((source, reason) => {
      console.log('🔌 DEBUGGER: Debugger detached from tab:', source.tabId, 'Reason:', reason);
      this.debuggingSessions.delete(source.tabId);
    });

    // Handle tab removal to clean up resources
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      console.log('🗑️ DEBUGGER: Tab removed, cleaning up:', tabId);
      this.activities.delete(tabId);
      this.debuggingSessions.delete(tabId);
      
      // Clear pending requests for this tab
      this.pendingRequests.forEach((request, requestId) => {
        if (request.tabId === tabId) {
          this.pendingRequests.delete(requestId);
        }
      });
      
      console.log('✅ DEBUGGER: Cleanup completed for tab:', tabId);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    const tabId = message.tabId || sender.tab?.id;
    console.log('📨 DEBUGGER: Received message:', message.type, 'for tab:', tabId);
    
    switch (message.type) {
      case 'START_MONITORING':
        console.log('🎯 DEBUGGER: Starting monitoring for tab:', tabId);
        await this.startDebugging(tabId);
        sendResponse({ success: true, method: 'debugger' });
        break;

      case 'GET_ACTIVITIES':
        console.log('📋 DEBUGGER: Getting activities for tab:', tabId);
        const activities = this.activities.get(tabId) || [];
        console.log(`📊 DEBUGGER: Found ${activities.length} activities for tab:`, tabId);
        sendResponse({ activities });
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

  async startDebugging(tabId) {
    console.log('🔧 DEBUGGER: Starting debugging session for tab:', tabId);
    
    // Skip if already debugging this tab
    if (this.debuggingSessions.has(tabId)) {
      console.log('⚠️ DEBUGGER: Already debugging tab:', tabId);
      return;
    }

    // Validate tab exists
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.log('⚠️ DEBUGGER: Skipping system tab:', tab?.url);
        return;
      }
    } catch (error) {
      console.error('❌ DEBUGGER: Invalid tab ID:', tabId);
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
      console.error('❌ DEBUGGER: Error attaching debugger:', error.message);
      
      if (error.message.includes('already attached') || error.message.includes('Another debugger')) {
        console.log('🔧 DEBUGGER: DevTools conflict detected - creating fallback activity');
        // Create a fallback activity to show the extension is working
        this.createFallbackActivity(tabId);
      } else if (error.message.includes('No tab with given id')) {
        console.log('⚠️ DEBUGGER: Tab no longer exists:', tabId);
      } else {
        console.log('🔧 DEBUGGER: Unexpected error - creating fallback activity');
        this.createFallbackActivity(tabId);
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
    const isDeliveryCall = url.includes('tt.omtrdc.net/rest/v1/delivery');
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
      console.log('🎯 DEBUGGER: Adobe Target call detected:', url);
      
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
        callType: isDeliveryCall ? 'delivery' : 'interact'
      };
      
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
        console.error('❌ DEBUGGER: Unexpected error:', error);
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
      console.error('❌ DEBUGGER: Error parsing at.js response:', error);
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
      
      // Extract activities from alloy.js interact response
      if (responseData.handle && Array.isArray(responseData.handle)) {
        responseData.handle.forEach((handleItem, handleIndex) => {
          if (handleItem.type === 'personalization:decisions' && handleItem.payload) {
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
                });
              }
            });
          }
        });
      }
      
    } catch (error) {
      console.error('❌ DEBUGGER: Error parsing alloy.js response:', error);
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
    console.log('🧹 DEBUGGER: Cleared activities for tab:', tabId);
  }
}

// Initialize the debugger
const targetDebugger = new AdobeTargetDebugger();
console.log('🚀 DEBUGGER: Adobe Target Activity Inspector initialized');