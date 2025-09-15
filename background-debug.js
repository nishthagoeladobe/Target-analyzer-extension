// Adobe Target Activity Inspector - Debug Version

console.log('🚀 Background script loaded');

class AdobeTargetInspector {
  constructor() {
    this.activities = new Map(); // tabId -> activities[]
    this.sessions = new Map();   // tabId -> session info
    this.init();
  }

  init() {
    console.log('🔧 Initializing inspector');
    
    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Message received:', message.type, 'from tab:', sender.tab?.id);
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Start monitoring all tabs immediately
    this.startMonitoringAllTabs();
  }

  async startMonitoringAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      console.log(`🔍 Found ${tabs.length} tabs to monitor`);
      
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('moz-extension://')) {
          setTimeout(() => this.startMonitoring(tab.id), 500);
        }
      }
    } catch (error) {
      console.error('❌ Error starting monitoring:', error);
    }
  }

  async startMonitoring(tabId) {
    try {
      if (this.sessions.has(tabId)) {
        console.log(`⚠️ Tab ${tabId} already being monitored`);
        return;
      }

      console.log(`🎯 Starting monitoring for tab ${tabId}`);

      // Attach debugger
      await chrome.debugger.attach({ tabId }, '1.3');
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');

      // Create event listener
      const listener = (source, method, params) => {
        if (source.tabId === tabId) {
          this.handleNetworkEvent(tabId, method, params);
        }
      };

      chrome.debugger.onEvent.addListener(listener);
      
      this.sessions.set(tabId, { listener, active: true });
      console.log(`✅ Successfully monitoring tab ${tabId}`);

    } catch (error) {
      console.error(`❌ Failed to monitor tab ${tabId}:`, error);
    }
  }

  handleNetworkEvent(tabId, method, params) {
    if (method === 'Network.responseReceived') {
      const { response } = params;
      
      if (this.isAdobeTargetUrl(response.url)) {
        console.log(`🎯 ADOBE TARGET DETECTED on tab ${tabId}:`, response.url);
        this.createAndStoreActivity(tabId, response);
      }
    }
  }

  isAdobeTargetUrl(url) {
    if (!url) return false;
    
    const patterns = [
      'delivery',
      'tt.omtrdc.net',
      'interact',
      'mbox',
      'adobe',
      'target'
    ];

    const isTarget = patterns.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()));
    
    if (isTarget) {
      console.log(`🔍 URL matched Adobe Target pattern:`, url);
    }
    
    return isTarget;
  }

  createAndStoreActivity(tabId, response) {
    const activity = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      url: response.url,
      type: 'delivery',
      explanation: '🎯 **Adobe Target Activity Detected!**\n\nAdobe Target is delivering personalized content to this page.',
      details: {
        url: response.url,
        status: response.status,
        timestamp: new Date().toLocaleString(),
        mboxes: [
          {
            name: 'Detected Area',
            hasContent: true,
            optionsCount: 1
          }
        ]
      }
    };

    // Store activity
    if (!this.activities.has(tabId)) {
      this.activities.set(tabId, []);
    }
    
    this.activities.get(tabId).push(activity);
    
    console.log(`💾 Stored activity for tab ${tabId}. Total: ${this.activities.get(tabId).length}`);
    
    // Notify content script
    this.notifyContentScript(tabId, activity);
  }

  notifyContentScript(tabId, activity) {
    try {
      chrome.tabs.sendMessage(tabId, {
        type: 'TARGET_ACTIVITY_DETECTED',
        activity: activity
      });
      console.log(`📤 Notified content script for tab ${tabId}`);
    } catch (error) {
      console.error(`❌ Failed to notify content script for tab ${tabId}:`, error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    const tabId = sender.tab?.id;
    
    switch (message.type) {
      case 'GET_ACTIVITIES':
        const activities = this.activities.get(tabId) || [];
        console.log(`📊 Returning ${activities.length} activities for tab ${tabId}`);
        console.log('Activities:', activities);
        sendResponse({ activities, success: true });
        break;
        
      case 'GET_MONITORING_STATUS':
        const isMonitoring = this.sessions.has(tabId);
        console.log(`📈 Monitoring status for tab ${tabId}: ${isMonitoring}`);
        sendResponse({ isMonitoring, success: true });
        break;
        
      case 'START_MONITORING':
        console.log(`🚀 Manual start monitoring for tab ${tabId}`);
        this.startMonitoring(tabId);
        sendResponse({ success: true });
        break;

      case 'FORCE_ADD_ACTIVITY':
        // Debug: manually add an activity
        console.log(`🧪 Force adding test activity for tab ${tabId}`);
        this.createAndStoreActivity(tabId, {
          url: 'https://test.tt.omtrdc.net/delivery',
          status: 200
        });
        sendResponse({ success: true });
        break;
        
      default:
        console.log(`❓ Unknown message type: ${message.type}`);
        sendResponse({ success: false });
    }
  }
}

// Initialize
const inspector = new AdobeTargetInspector();

// Add global debug functions
window.debugInspector = inspector;
window.debugAddActivity = (tabId) => {
  inspector.createAndStoreActivity(tabId || 1, {
    url: 'https://test.tt.omtrdc.net/delivery',
    status: 200
  });
};

console.log('🎯 Adobe Target Inspector ready for debugging'); 