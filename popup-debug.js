console.log('🚀 Popup script loaded');

class AdobeTargetPopup {
  constructor() {
    this.activities = [];
    this.currentTabId = null;
    this.init();
  }

  async init() {
    console.log('🔧 Initializing popup');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      console.log('📍 Current tab ID:', this.currentTabId);
      
      this.bindEvents();
      await this.loadActivities();
      this.updateUI();
      
      // Add debug button
      this.addDebugButton();
      
    } catch (error) {
      console.error('❌ Error initializing popup:', error);
    }
  }

  addDebugButton() {
    const debugButton = document.createElement('button');
    debugButton.textContent = '🧪 Add Test Activity';
    debugButton.style.cssText = 'width: 100%; margin: 10px 0; padding: 10px; background: #ff6b35; color: white; border: none; border-radius: 5px;';
    
    debugButton.onclick = () => {
      console.log('🧪 Adding test activity');
      chrome.runtime.sendMessage({ 
        type: 'FORCE_ADD_ACTIVITY' 
      }, (response) => {
        console.log('🧪 Test activity response:', response);
        setTimeout(() => this.loadActivities(), 500);
      });
    };
    
    document.querySelector('.footer').prepend(debugButton);
  }

  bindEvents() {
    const startBtn = document.getElementById('startMonitoring');
    const clearBtn = document.getElementById('clearActivities');
    
    if (startBtn) {
      startBtn.onclick = () => {
        console.log('🚀 Start monitoring clicked');
        chrome.runtime.sendMessage({ type: 'START_MONITORING' }, (response) => {
          console.log('🚀 Start monitoring response:', response);
        });
      };
    }
    
    if (clearBtn) {
      clearBtn.onclick = () => {
        console.log('🗑️ Clear activities clicked');
        this.activities = [];
        this.updateActivityList();
        this.updateSummary();
      };
    }
  }

  async loadActivities() {
    console.log('📊 Loading activities for tab:', this.currentTabId);
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_ACTIVITIES' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Runtime error:', chrome.runtime.lastError);
          resolve();
          return;
        }
        
        console.log('📊 Activities response:', response);
        
        if (response && response.activities) {
          this.activities = response.activities;
          console.log(`📊 Loaded ${this.activities.length} activities`);
          this.updateActivityList();
          this.updateSummary();
        } else {
          console.log('📊 No activities found');
        }
        
        resolve();
      });
    });
  }

  updateActivityList() {
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    
    console.log(`🎨 Updating activity list with ${this.activities.length} activities`);

    if (this.activities.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (activityList) activityList.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    
    if (activityList) {
      activityList.innerHTML = this.activities
        .slice(0, 10)
        .map(activity => this.createActivityHTML(activity))
        .join('');
    }
  }

  createActivityHTML 