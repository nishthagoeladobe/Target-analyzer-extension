class TargetPopup {
  constructor() {
    this.activities = [];
    this.networkEvents = [];
    this.selectedActivityId = null;
    this.currentTabId = null;
    this.isAfterReload = false;
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      
      // Clear stale snippet test results on init
      await this.clearStaleSnippetResults();
      
      // Bind events first
      this.bindEvents();
      
      // Check if already monitoring this tab (from previous session)
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_ACTIVITIES',
        tabId: this.currentTabId 
      });
      
      if (response && response.activities && response.activities.length > 0) {
        // Already have activities from previous monitoring
        this.activities = response.activities;
        this.isDebugging = response.isDebugging;
        this.updateUI();
      } else {
        // Show manual monitoring option - no automatic debugger attachment
        this.showManualMonitoringState();
      }
      
    } catch (error) {
      this.showError('Failed to initialize extension');
    }
  }

  async clearStaleSnippetResults() {
    try {
      const storage = await chrome.storage.local.get(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl', 'snippetTestWithActivities']);
      
      if (storage.flickerTestResults) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tab.url;
        const currentTabId = tab.id;
        
        // Check if results are for current tab/URL
        const savedUrlBase = storage.flickerTestUrl ? storage.flickerTestUrl.split('?')[0].split('#')[0] : '';
        const currentUrlBase = currentUrl ? currentUrl.split('?')[0].split('#')[0] : '';
        
        if (storage.flickerTestTabId !== currentTabId || savedUrlBase !== currentUrlBase) {
          console.log('🧹 Clearing stale snippet test results from different page');
          await chrome.storage.local.remove(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl']);
        }
      }
      
      // Clear activity context flags when popup opens (they're only valid for immediate transitions)
      // The "Test Prehiding Snippet Impact" button will set them fresh before switching tabs
      await chrome.storage.local.remove(['snippetTestWithActivities', 'snippetTestActivitiesCount']);
      console.log('🧹 Cleared activity context flags (will be reset if coming from Activities tab)');
    } catch (error) {
      console.error('Error clearing stale results:', error);
    }
  }

  async startMonitoring() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'START_MONITORING',
        tabId: this.currentTabId 
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  }

  async loadActivities() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_ACTIVITIES',
        tabId: this.currentTabId 
      });
      
      if (response && response.activities) {
        this.activities = response.activities;
        this.isDebugging = response.isDebugging;
        this.debuggerDisabled = response.debuggerDisabled;
      } else {
        this.activities = [];
        this.isDebugging = false;
        this.debuggerDisabled = false;
      }
      
      this.updateActivityList();
      this.updateDetailsDropdown();
      
      // Auto-select first activity if none selected and activities exist
      if (!this.selectedActivityId && this.activities.length > 0) {
        this.selectActivity(this.activities[0].id);
      }
      
      // Show appropriate state based on debugging status
      if (this.debuggerDisabled && this.activities.length === 0) {
        this.showDebuggerDisabledState();
      }
      
    } catch (error) {
      this.activities = [];
      this.updateActivityList();
    }
  }

  async loadNetworkEvents() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_EVENTS',
        tabId: this.currentTabId 
      });
      
      if (response && response.events) {
        this.networkEvents = response.events;
      } else {
        this.networkEvents = [];
      }
      
      this.displayNetworkEvents();
      
    } catch (error) {
      console.error('Error loading network events:', error);
      this.networkEvents = [];
      this.displayNetworkEvents();
    }
  }

  displayNetworkEvents() {
    const eventsList = document.getElementById('eventsList');
    const totalEventsEl = document.getElementById('totalEvents');
    const interactCallsEl = document.getElementById('interactCalls');
    const deliveryCallsEl = document.getElementById('deliveryCalls');
    
    if (!eventsList) return;

    // Update summary counts
    const interactCount = this.networkEvents.filter(e => e.type === 'interact').length;
    const deliveryCount = this.networkEvents.filter(e => e.type === 'delivery').length;
    
    if (totalEventsEl) totalEventsEl.textContent = this.networkEvents.length;
    if (interactCallsEl) interactCallsEl.textContent = interactCount;
    if (deliveryCallsEl) deliveryCallsEl.textContent = deliveryCount;

    // Display events
    if (this.networkEvents.length === 0) {
      eventsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <h3>No events captured yet</h3>
          <p>Network events will appear here when Adobe Target makes requests.</p>
        </div>
      `;
      return;
    }

    eventsList.innerHTML = this.networkEvents.map(event => {
      const eventTypeClass = event.type === 'interact' ? 'interact' : event.type === 'delivery' ? 'delivery' : 'other';
      const statusClass = event.status === 'success' ? 'success' : event.status === 'error' ? 'error' : 'pending';
      const formattedTimestamp = new Date(event.timestamp).toLocaleTimeString();
      
      return `
        <div class="event-item" data-event-id="${event.id}">
          <div class="event-header">
            <div class="event-type">
              <span class="event-type-badge ${eventTypeClass}">${event.type.toUpperCase()}</span>
              <span class="event-name">${this.escapeHtml(event.eventType)}</span>
            </div>
            <div class="event-meta">
              <span>⏰ ${formattedTimestamp}</span>
              <span class="event-status-badge ${statusClass}">${event.statusCode || event.status}</span>
              <span class="event-expand-icon">▶</span>
            </div>
          </div>
          <div class="event-details">
            <div class="event-details-inner">
              <div class="event-details-section">
                <div class="event-details-title">🌐 URL</div>
                <div class="event-details-content">${this.escapeHtml(event.url)}</div>
              </div>
              
              <div class="event-details-section">
                <div class="event-details-title">📊 Timing</div>
                <div class="event-timing-grid">
                  <div class="event-timing-item">
                    <div class="event-timing-label">Method</div>
                    <div class="event-timing-value">${event.method}</div>
                  </div>
                  <div class="event-timing-item">
                    <div class="event-timing-label">Status</div>
                    <div class="event-timing-value">${event.statusCode || '-'}</div>
                  </div>
                  <div class="event-timing-item">
                    <div class="event-timing-label">Duration</div>
                    <div class="event-timing-value">${event.duration ? event.duration.toFixed(2) + 'ms' : '-'}</div>
                  </div>
                  <div class="event-timing-item">
                    <div class="event-timing-label">Timestamp</div>
                    <div class="event-timing-value">${formattedTimestamp}</div>
                  </div>
                </div>
              </div>
              
              ${event.requestInfo && event.requestInfo.postData && event.requestInfo.postData.text ? `
              <div class="event-details-section">
                <div class="event-details-title">📤 Request Body</div>
                <div class="event-details-content">${this.escapeHtml(JSON.stringify(JSON.parse(event.requestInfo.postData.text), null, 2))}</div>
              </div>
              ` : ''}
              
              ${event.responseHeaders ? `
              <div class="event-details-section">
                <div class="event-details-title">📥 Response Headers</div>
                <div class="event-details-content">${this.escapeHtml(JSON.stringify(event.responseHeaders, null, 2))}</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers for expand/collapse
    eventsList.querySelectorAll('.event-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Toggle expanded state
        item.classList.toggle('expanded');
      });
    });
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Clear activities button
    const clearBtn = document.getElementById('clearActivities');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        // Provide immediate visual feedback
        const originalText = clearBtn.textContent;
        
        clearBtn.textContent = '🧹 Clearing...';
        clearBtn.disabled = true;
        clearBtn.style.opacity = '0.7';
        
        try {
        this.switchTab('activities');
        
        await chrome.runtime.sendMessage({ 
          type: 'CLEAR_ACTIVITIES',
          tabId: this.currentTabId 
        });
          
        this.activities = [];
        this.selectedActivityId = null;
        this.updateUI();
          
          // Show brief success feedback
          clearBtn.textContent = '✅ Cleared!';
          
          setTimeout(() => {
            clearBtn.textContent = originalText;
            clearBtn.disabled = false;
            clearBtn.style.opacity = '1';
          }, 1000);
          
        } catch (error) {
          // Reset button if there's an error
          clearBtn.textContent = originalText;
          clearBtn.disabled = false;
          clearBtn.style.opacity = '1';
          console.error('Error clearing activities:', error);
        }
      });
    }

    // Refresh activities button - ONLY way to start monitoring  
    const refreshBtn = document.getElementById('refreshActivities');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        // Provide immediate visual feedback
        const originalText = refreshBtn.textContent;
        const originalDisabled = refreshBtn.disabled;
        
        // Update button to show it's working
        refreshBtn.textContent = '⏳ Starting Monitoring...';
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.7';
        refreshBtn.style.cursor = 'not-allowed';
        
        try {
          this.isAfterReload = true;
          this.switchTab('activities');
          
          // Show loading with specific message
          this.showReloadingState('Starting Adobe Target monitoring...');
          
          this.activities = [];
          this.selectedActivityId = null;
          this.updateUI();
          
          await chrome.runtime.sendMessage({ 
            type: 'CLEAR_ACTIVITIES',
            tabId: this.currentTabId 
          });
          
          // Start monitoring FIRST (this is when debugger notification appears)
          refreshBtn.textContent = '🔍 Enabling Debugger...';
          this.showReloadingState('Enabling Adobe Target detection...');
          
          await this.startMonitoring();
          
          // Update status before reload
          this.showReloadingState('Reloading page to detect activities...');
          refreshBtn.textContent = '📄 Reloading Page...';
          
          await chrome.tabs.reload(this.currentTabId);
          
          // Update status after reload
          refreshBtn.textContent = '🔍 Scanning for Activities...';
          this.showReloadingState('Page reloaded - scanning for Adobe Target activities...');
          
          setTimeout(async () => {
            this.waitForActivitiesAfterReload();
          }, 2000);
          
          // Reset button after monitoring starts
          setTimeout(() => {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
          }, 5000);
          
        } catch (error) {
          // Reset button if there's an error
          refreshBtn.textContent = originalText;
          refreshBtn.disabled = originalDisabled;
          refreshBtn.style.opacity = '1';
          refreshBtn.style.cursor = 'pointer';
          console.error('Error during monitoring setup:', error);
        }
      });
    }

    // Analyze Target Performance button
    const analyzePerfBtn = document.getElementById('analyzePerformance');
    if (analyzePerfBtn) {
      analyzePerfBtn.addEventListener('click', async () => {
        const originalText = analyzePerfBtn.textContent;
        analyzePerfBtn.textContent = '⏳ Analyzing...';
        analyzePerfBtn.disabled = true;
        
        try {
          await this.analyzeTargetPerformance();
          this.switchTab('performance');
        } catch (error) {
          console.error('Error analyzing performance:', error);
        } finally {
          setTimeout(() => {
            analyzePerfBtn.textContent = originalText;
            analyzePerfBtn.disabled = false;
          }, 500);
        }
      });
    }

    // Test Prehiding Snippet Impact button
    const testSnippetBtn = document.getElementById('testSnippetImpact');
    if (testSnippetBtn) {
      testSnippetBtn.addEventListener('click', async () => {
        const originalText = testSnippetBtn.textContent;
        testSnippetBtn.textContent = '⏳ Preparing Test...';
        testSnippetBtn.disabled = true;
        
        try {
          // Store that we're testing with activities context
          await chrome.storage.local.set({
            snippetTestWithActivities: true,
            snippetTestActivitiesCount: this.activities.length
          });
          
          // Switch to snippet test tab
          this.switchTab('snippettest');
          
          // Auto-detect snippet and show ready state
          setTimeout(() => {
            this.detectPrehidingSnippet();
            this.showFlickerTestReady();
          }, 300);
          
        } catch (error) {
          console.error('Error preparing snippet test:', error);
        } finally {
          setTimeout(() => {
            testSnippetBtn.textContent = originalText;
            testSnippetBtn.disabled = false;
          }, 500);
        }
      });
    }

    // Excel download
    const downloadBtn = document.getElementById('copyAllActivities');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadExcelReport();
      });
    }

    // Performance manual refresh button - shows basic metrics even without activities
    const refreshPerfBtn = document.getElementById('refreshPerformance');
    if (refreshPerfBtn) {
      refreshPerfBtn.addEventListener('click', async () => {
        const originalText = refreshPerfBtn.textContent;
        refreshPerfBtn.textContent = '⏳ Loading...';
        refreshPerfBtn.disabled = true;
        
        try {
          // Always collect basic page metrics (works without activities)
          await this.loadBasicPageMetrics();
        } catch (error) {
          console.error('Error loading metrics:', error);
        } finally {
          setTimeout(() => {
            refreshPerfBtn.textContent = originalText;
            refreshPerfBtn.disabled = false;
          }, 500);
        }
      });
    }

    // Download Audit Report button
    const downloadAuditBtn = document.getElementById('downloadAuditReport');
    if (downloadAuditBtn) {
      downloadAuditBtn.addEventListener('click', async () => {
        const originalText = downloadAuditBtn.textContent;
        downloadAuditBtn.textContent = '⏳ Generating...';
        downloadAuditBtn.disabled = true;
        
        try {
          await this.generateAuditReport();
        } catch (error) {
          console.error('Error generating audit report:', error);
          alert('Error generating audit report. Please try again.');
        } finally {
          setTimeout(() => {
            downloadAuditBtn.textContent = originalText;
            downloadAuditBtn.disabled = false;
          }, 500);
        }
      });
    }

    // Error report submission
    const submitErrorBtn = document.getElementById('submitErrorReport');
    if (submitErrorBtn) {
      submitErrorBtn.addEventListener('click', () => {
        this.submitErrorReport();
      });
    }

    // Events Tab - Refresh Events
    const refreshEventsBtn = document.getElementById('refreshEvents');
    if (refreshEventsBtn) {
      refreshEventsBtn.addEventListener('click', async () => {
        await this.loadNetworkEvents();
      });
    }

    // Events Tab - Clear Events
    const clearEventsBtn = document.getElementById('clearEvents');
    if (clearEventsBtn) {
      clearEventsBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ 
          type: 'CLEAR_ACTIVITIES', // This clears events too
          tabId: this.currentTabId 
        });
        await this.loadNetworkEvents();
      });
    }

    // Flicker Test - Run A/B Test
    const runFlickerTestBtn = document.getElementById('runFlickerTest');
    if (runFlickerTestBtn) {
      runFlickerTestBtn.addEventListener('click', async () => {
        await this.runFlickerTest();
      });
    }

    // Flicker Test - Clear Cache
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        await this.clearCacheAndReload();
      });
    }

    // Events Tab - Auto-load events when tab is opened
    document.querySelector('[data-tab="events"]')?.addEventListener('click', async () => {
      await this.loadNetworkEvents();
    });

    // Snippet Test Tab - Load saved results, auto-detect snippet and show ready state when tab opens
    document.querySelector('[data-tab="snippettest"]')?.addEventListener('click', async () => {
      setTimeout(async () => {
        // Load saved results if they exist
        await this.loadSavedSnippetTestResults();
        
        await this.showFlickerTestReady();
        this.detectPrehidingSnippet();
      }, 100);
    });
  }

  async waitForActivitiesAfterReload() {
    let attempts = 0;
    const maxAttempts = 15;
    
    const loadingContainer = document.getElementById('loadingContainer');
    const loadingText = loadingContainer?.querySelector('p');
    const statusText = document.getElementById('statusText');
    
    const checkForActivities = async () => {
      attempts++;
      
      // Update progress message
      const progressMessage = `Scanning for activities... (${attempts}/${maxAttempts})`;
      if (loadingText) {
        loadingText.textContent = progressMessage;
      }
      if (statusText) {
        statusText.textContent = progressMessage;
      }
      
      await this.loadActivities();
      
      if (this.activities.length > 0) {
        // Success - activities found!
        const successMessage = `✅ Found ${this.activities.length} activities!`;
        if (loadingText) {
          loadingText.textContent = successMessage;
        }
        if (statusText) {
          statusText.textContent = successMessage;
        }
        
        // Brief delay to show success message
        setTimeout(() => {
        this.hideLoading();
        this.updateUI();
        this.isAfterReload = false;
          
          // Reset loading text for next time
        if (loadingText) {
          loadingText.textContent = 'Detecting Adobe Target activities...';
        }
        }, 1000);
        return;
      }
      
      if (attempts >= maxAttempts) {
        // Timeout - no activities found
        const timeoutMessage = '⏰ Scan complete - no activities detected';
        if (loadingText) {
          loadingText.textContent = timeoutMessage;
        }
        if (statusText) {
          statusText.textContent = timeoutMessage;
        }
        
        setTimeout(() => {
        this.hideLoading();
        this.updateUI();
        this.isAfterReload = false;
          
          // Reset loading text for next time
        if (loadingText) {
          loadingText.textContent = 'Detecting Adobe Target activities...';
        }
        }, 2000);
        return;
      }
      
      // Continue checking
      setTimeout(checkForActivities, 1000);
    };
    
    checkForActivities();
  }

  switchTab(tabName) {
    // Check if tab is locked
    const targetButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (targetButton && targetButton.classList.contains('locked')) {
      // Show tooltip explaining why it's locked
      this.showLockedTabNotification(targetButton);
      return;
    }

    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabName);
    });
  }

  showLockedTabNotification(button) {
    const requirement = button.getAttribute('data-requires');
    const tabName = button.getAttribute('data-tab');
    let message = '';
    
    switch(requirement) {
      case 'monitoring':
        message = '⚠️ Please start monitoring first by clicking "🔍 Start Monitoring & Reload" in the Activities tab';
        break;
      case 'activities':
        message = '⚠️ Please detect activities first by monitoring the page';
        break;
      default:
        message = '⚠️ This tab requires prerequisites to be completed first';
    }
    
    // Show temporary notification
    const notification = document.createElement('div');
    notification.className = 'tab-locked-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
      border: 2px solid #fbbf24;
      color: #78350f;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
      max-width: 320px;
      animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  updateWorkflowSteps() {
    const isMonitoring = this.isDebugging;
    const hasActivities = this.activities && this.activities.length > 0;
    
    const step1 = document.querySelector('.workflow-step[data-step="1"]');
    const step2 = document.querySelector('.workflow-step[data-step="2"]');
    const step3 = document.querySelector('.workflow-step[data-step="3"]');
    
    // Update Step 1: Start Monitoring
    if (isMonitoring) {
      step1?.classList.add('completed');
      step1?.classList.remove('active');
    } else {
      step1?.classList.add('active');
      step1?.classList.remove('completed');
    }
    
    // Update Step 2: Detect Activities
    if (hasActivities) {
      step2?.classList.add('completed');
      step2?.classList.remove('active');
    } else if (isMonitoring) {
      step2?.classList.add('active');
      step2?.classList.remove('completed');
    } else {
      step2?.classList.remove('active', 'completed');
    }
    
    // Update Step 3: Analyze Data
    if (hasActivities) {
      step3?.classList.add('active');
      step3?.classList.remove('completed');
    } else {
      step3?.classList.remove('active', 'completed');
    }
  }

  updateTabStates() {
    const isMonitoring = this.isDebugging;
    const hasActivities = this.activities && this.activities.length > 0;
    
    document.querySelectorAll('.tab-button').forEach(button => {
      const requirement = button.getAttribute('data-requires');
      const lockIcon = button.querySelector('.tab-lock');
      
      if (requirement === 'none') {
        // Always available
        button.classList.remove('locked');
        return;
      }
      
      if (requirement === 'monitoring') {
        if (isMonitoring) {
          button.classList.remove('locked');
        } else {
          button.classList.add('locked');
        }
      }
      
      if (requirement === 'activities') {
        if (hasActivities) {
          button.classList.remove('locked');
        } else {
          button.classList.add('locked');
        }
      }
    });
  }

  showManualMonitoringState() {
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    const loadingContainer = document.getElementById('loadingContainer');
    
    // Hide other elements
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (activityList) activityList.style.display = 'none';
    if (activityActions) activityActions.style.display = 'none';
    
    // Show manual monitoring state
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="empty-icon">🎯</div>
        <h3>Ready to detect Adobe Target activities</h3>
        <p>Click <strong>"🔍 Start Monitoring & Reload"</strong> below to begin detecting Adobe Target activities on this page.</p>
        <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; font-size: 13px; color: #0369a1;">
          ℹ️ <strong>Note:</strong> Chrome will show a "debugging" notification when you click Start Monitoring. This happens ONLY when you choose to monitor - never automatically. It's safe to allow.
        </div>
      `;
    }
    
    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Ready to monitor - Click Start Monitoring & Reload';
  }

  showDebuggerDisabledState() {
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    const loadingContainer = document.getElementById('loadingContainer');
    
    // Hide other elements
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (activityList) activityList.style.display = 'none';
    if (activityActions) activityActions.style.display = 'none';
    
    // Show disabled state with option to re-enable
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="empty-icon">🔕</div>
        <h3>Adobe Target monitoring is paused</h3>
        <p>You cancelled the Chrome debugger notification. This is totally fine!<br><br>
        <strong>To detect Adobe Target activities:</strong><br>
        Click "Enable Monitoring" below and accept the Chrome debugger notification.</p>
        <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; font-size: 13px; color: #0369a1;">
          ℹ️ <strong>Why the notification appears:</strong><br>
          Chrome shows this for security when extensions monitor network traffic. It's safe to allow for Adobe Target detection.
        </div>
        <button id="enableDebuggingBtn" class="btn btn-primary" style="margin-top: 16px;">
          ✅ Enable Monitoring
        </button>
      `;
      
      // Bind enable debugging button
      const enableBtn = document.getElementById('enableDebuggingBtn');
      if (enableBtn) {
        enableBtn.onclick = async () => {
          enableBtn.textContent = '⏳ Enabling...';
          enableBtn.disabled = true;
          
          try {
            await chrome.runtime.sendMessage({ 
              type: 'ENABLE_AUTO_DEBUGGING',
              tabId: this.currentTabId 
            });
            
            this.showLoading();
            await this.loadActivities();
            this.updateUI();
          } catch (error) {
            console.error('Error enabling debugging:', error);
            enableBtn.textContent = 'Enable Monitoring';
            enableBtn.disabled = false;
          }
        };
      }
    }
    
    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Monitoring paused - Click Enable to detect activities';
  }

  updateActivityList() {
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    
    if (this.activities.length === 0) {
      if (activityList) activityList.innerHTML = '';
      
      // Check if we need to show debugger disabled state
      if (this.debuggerDisabled) {
        this.showDebuggerDisabledState();
        return;
      }
      
      if (emptyState) emptyState.style.display = 'block';
      if (activityActions) activityActions.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (activityActions) activityActions.style.display = 'block';
    
    if (activityList) {
      activityList.style.display = 'block';
      activityList.innerHTML = this.activities.map(activity => `
        <div class="activity-item" data-activity-id="${activity.id}">
          <div class="activity-content">
            <div class="activity-name">${this.escapeHtml(activity.name)}</div>
            <div class="activity-experience">Experience: ${this.escapeHtml(activity.experience)}</div>
            <div class="activity-id">ID: ${activity.activityId || 'N/A'} | Status: ${activity.statusCode}</div>
          </div>
          <div class="activity-badges">
            <span class="call-type-badge ${activity.type.toLowerCase()}">${activity.type}</span>
            <span class="implementation-badge ${activity.implementationType.toLowerCase()}">${activity.implementationType}</span>
          </div>
        </div>
      `).join('');

      // Add click handlers
      activityList.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
          const activityId = item.dataset.activityId;
          this.selectActivity(activityId);
        });
      });
    }
  }

  selectActivity(activityId) {
    this.selectedActivityId = activityId;
    
    // Update visual selection
    document.querySelectorAll('.activity-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.activityId === activityId);
    });
    
    if (!this.isAfterReload) {
      this.switchTab('details');
    }
    this.updateDetailsView();
  }

  updateDetailsDropdown() {
    const selector = document.getElementById('activitySelector');
    if (!selector) return;

    if (this.activities.length === 0) {
      selector.innerHTML = '<option value="">No activities detected</option>';
      selector.disabled = true;
      return;
    }

    selector.disabled = false;
    selector.innerHTML = this.activities.map(activity => 
      `<option value="${activity.id}">${this.escapeHtml(activity.name)} - ${this.escapeHtml(activity.experience)}</option>`
    ).join('');

    if (this.activities.length > 0 && !this.selectedActivityId) {
      this.selectedActivityId = this.activities[0].id;
    }

    if (this.selectedActivityId) {
      selector.value = this.selectedActivityId;
    }

    selector.addEventListener('change', (e) => {
      this.selectActivity(e.target.value);
    });

    this.updateDetailsView();
  }

  updateDetailsView() {
    const detailsContent = document.getElementById('detailsContent');
    if (!detailsContent) return;

    if (!this.selectedActivityId) {
      detailsContent.innerHTML = '<p class="no-selection">Select an activity to view details</p>';
      return;
    }

    const activity = this.activities.find(a => a.id === this.selectedActivityId);
    if (!activity) {
      detailsContent.innerHTML = '<p class="no-selection">Activity not found</p>';
      return;
    }

    detailsContent.innerHTML = `
      <div class="activity-selector">
        <h3>📋 Activity Details</h3>
        <select id="activitySelector">
          ${this.activities.map(a => 
            `<option value="${a.id}" ${a.id === this.selectedActivityId ? 'selected' : ''}>${this.escapeHtml(a.name)} - ${this.escapeHtml(a.experience)}</option>`
          ).join('')}
        </select>
      </div>

      <div class="detail-tabs">
        <div class="detail-tab-buttons">
          <button class="detail-tab-btn active" data-tab="overview">📊 Overview</button>
          <button class="detail-tab-btn" data-tab="request">📤 Request</button>
          <button class="detail-tab-btn" data-tab="response">📥 Response</button>
          <button class="detail-tab-btn" data-tab="tokens">🏷️ Tokens</button>
        </div>

        <div class="detail-tab-content">
          <div class="detail-tab-panel active" id="overview-panel">
            <div class="overview-grid">
              <div class="overview-section">
                <h4>🎯 Activity Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Activity Name:</span>
                    <span class="info-value">${this.escapeHtml(activity.name)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Experience:</span>
                    <span class="info-value">${this.escapeHtml(activity.experience)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Activity ID:</span>
                    <span class="info-value">${activity.activityId || 'Not Available'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Detected At:</span>
                    <span class="info-value">${new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div class="overview-section">
                <h4>📦 Mbox Information</h4>
                <div class="mbox-list">
                  ${this.formatMboxInfoSimple(activity.details?.mboxes || [])}
                </div>
              </div>

              <div class="overview-section">
                <h4>🎨 Content Changes</h4>
                <div class="modifications-preview">
                  ${this.formatPageModificationsPreview(activity.details?.pageModifications || [])}
                </div>
              </div>
            </div>
          </div>

          <div class="detail-tab-panel" id="request-panel">
            <div class="network-section">
              <h4>🌐 Request Details</h4>
              <div class="network-info">
                <div class="network-item">
                  <span class="network-label">URL:</span>
                  <div class="network-value url-value">${this.escapeHtml(activity.requestDetails?.url || 'Not available')}</div>
                </div>
                <div class="network-item">
                  <span class="network-label">Method:</span>
                  <span class="method-badge">${activity.requestDetails?.method || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div class="payload-section">
              <h4>📋 Request Payload</h4>
              <div class="json-viewer">
                ${this.formatJsonViewer(activity.requestDetails?.payload, 'request')}
              </div>
            </div>
          </div>

          <div class="detail-tab-panel" id="response-panel">
            <div class="network-section">
              <h4>📊 Response Details</h4>
              <div class="network-info">
                <div class="network-item">
                  <span class="network-label">Status Code:</span>
                  <span class="status-badge status-${activity.statusCode}">${activity.statusCode}</span>
                </div>
                <div class="network-item">
                  <span class="network-label">Content Type:</span>
                  <span class="info-value">application/json</span>
                </div>
              </div>
            </div>

            <div class="payload-section">
              <h4>📥 Response Body</h4>
              <div class="json-viewer">
                ${this.formatJsonViewer(activity.responseDetails, 'response')}
              </div>
            </div>
          </div>

          <div class="detail-tab-panel" id="tokens-panel">
            <div class="tokens-section">
              <h4>🏷️ Response Tokens</h4>
              <div class="tokens-grid">
                ${this.formatResponseTokensTable(activity.details?.responseTokens || {})}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-bind dropdown
    const newSelector = document.getElementById('activitySelector');
    if (newSelector) {
      newSelector.addEventListener('change', (e) => {
        this.selectActivity(e.target.value);
      });
    }

    // Bind detail tab switching
    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchDetailTab(tabName);
      });
    });
  }

  switchDetailTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    document.querySelectorAll('.detail-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
  }

  formatJsonViewer(data, type) {
    if (!data) {
      return '<div class="no-data">No data available</div>';
    }

    try {
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      
      return `
        <div class="json-table-container">
          <div class="json-table-header">
            <span class="json-table-title">${type === 'request' ? 'Request' : 'Response'} Data</span>
          </div>
          <div class="json-table">
            ${this.formatJsonAsTable(jsonData, '')}
          </div>
        </div>
      `;
    } catch (e) {
      return `<div class="error-data">Error formatting JSON: ${e.message}</div>`;
    }
  }

  formatJsonAsTable(obj, path = '') {
    if (obj === null || obj === undefined) {
      return '<div class="json-table-row"><div class="json-table-key">null</div><div class="json-table-value">null</div></div>';
    }

    if (typeof obj !== 'object') {
      return `<div class="json-table-row"><div class="json-table-key">${path || 'value'}</div><div class="json-table-value">${this.escapeHtml(String(obj))}</div></div>`;
    }

    let html = '';
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `<div class="json-table-row"><div class="json-table-key">${path}</div><div class="json-table-value">[]</div></div>`;
      }
      
      obj.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `[${index}]`;
        if (typeof item === 'object' && item !== null) {
          html += `<div class="json-table-section"><div class="json-table-section-header">${itemPath}</div>`;
          html += this.formatJsonAsTable(item, '');
          html += '</div>';
        } else {
          html += `<div class="json-table-row"><div class="json-table-key">${itemPath}</div><div class="json-table-value">${this.escapeHtml(String(item))}</div></div>`;
        }
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (value === null || value === undefined) {
          html += `<div class="json-table-row"><div class="json-table-key">${currentPath}</div><div class="json-table-value">null</div></div>`;
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            if (value.length === 0) {
              html += `<div class="json-table-row"><div class="json-table-key">${currentPath}</div><div class="json-table-value">[]</div></div>`;
            } else {
              html += `<div class="json-table-section"><div class="json-table-section-header">${currentPath}</div>`;
              html += this.formatJsonAsTable(value, '');
              html += '</div>';
            }
          } else {
            if (Object.keys(value).length === 0) {
              html += `<div class="json-table-row"><div class="json-table-key">${currentPath}</div><div class="json-table-value">{}</div></div>`;
            } else {
              html += `<div class="json-table-section"><div class="json-table-section-header">${currentPath}</div>`;
              html += this.formatJsonAsTable(value, '');
              html += '</div>';
            }
          }
        } else {
          html += `<div class="json-table-row"><div class="json-table-key">${currentPath}</div><div class="json-table-value">${this.escapeHtml(String(value))}</div></div>`;
        }
      });
    }
    
    return html;
  }

  formatResponseTokensTable(tokens) {
    if (!tokens || Object.keys(tokens).length === 0) {
      return '<div class="no-data">No response tokens available</div>';
    }

    const entries = Object.entries(tokens);
    return `
      <div class="tokens-table">
        <div class="tokens-header">
          <div class="token-key-header">Token Name</div>
          <div class="token-value-header">Value</div>
        </div>
        ${entries.map(([key, value]) => `
          <div class="token-row">
            <div class="token-key">${this.escapeHtml(key)}</div>
            <div class="token-value">${this.escapeHtml(String(value))}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  downloadExcelReport() {
    try {
      const data = this.activities.map((activity, activityIndex) => {
        // Create comprehensive activity data with all available information
        const baseData = {
          // Basic Activity Information
          'Row_Number': activityIndex + 1,
          'Activity_Name': activity.name || '',
          'Experience_Name': activity.experience || '',
          'Activity_ID': activity.activityId || '',
          'Experience_ID': activity.experienceId || '',
          'Implementation_Type': activity.implementationType || '',
          'Call_Type': activity.type || '',
          'Status_Code': activity.statusCode || '',
          'Timestamp': new Date(activity.timestamp).toISOString(),
          'Detection_Time': new Date(activity.timestamp).toLocaleString(),
          
          // Request Information
          'Request_URL': activity.requestDetails?.url || '',
          'Request_Method': activity.requestDetails?.method || '',
          'Request_Headers': JSON.stringify(activity.requestDetails?.headers || {}),
          'Request_Payload': JSON.stringify(activity.requestDetails?.payload || {}),
          
          // Response Information
          'Response_Status': activity.responseDetails?.statusCode || '',
          'Response_Headers': JSON.stringify(activity.responseDetails?.headers || {}),
          'Response_MIME_Type': activity.responseDetails?.mimeType || '',
          
          // Adobe Target Specific Data
          'Client_Code': activity.details?.clientCode || '',
          'Request_ID': activity.details?.requestId || '',
          'Mboxes': (activity.details?.mboxes || []).join('; '),
          'Mbox_Count': (activity.details?.mboxes || []).length,
          
          // Response Tokens (All)
          'Response_Tokens_JSON': JSON.stringify(activity.details?.responseTokens || {}),
          'Response_Tokens_Count': Object.keys(activity.details?.responseTokens || {}).length,
          
          // Page Modifications
          'Page_Modifications_JSON': JSON.stringify(activity.details?.pageModifications || []),
          'Page_Modifications_Count': (activity.details?.pageModifications || []).length,
          
          // Metrics
          'Metrics_JSON': JSON.stringify(activity.details?.metrics || []),
          'Metrics_Count': (activity.details?.metrics || []).length,
        };

        // Add individual response tokens as separate columns
        const responseTokens = activity.details?.responseTokens || {};
        Object.entries(responseTokens).forEach(([key, value]) => {
          const sanitizedKey = `Token_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;
          baseData[sanitizedKey] = String(value || '');
        });

        // Add page modifications details
        const modifications = activity.details?.pageModifications || [];
        modifications.forEach((mod, modIndex) => {
          baseData[`Modification_${modIndex + 1}_Type`] = mod.type || '';
          baseData[`Modification_${modIndex + 1}_Selector`] = mod.selector || '';
          baseData[`Modification_${modIndex + 1}_Content`] = String(mod.content || '').substring(0, 500); // Limit content length
        });

        // Add complete response body for at.js
        if (activity.responseDetails?.option) {
          baseData['AT_JS_Option_JSON'] = JSON.stringify(activity.responseDetails.option);
          baseData['AT_JS_Mbox'] = activity.responseDetails.mbox || '';
        }

        // Add complete response body for Alloy.js
        if (activity.responseDetails?.decision) {
          baseData['Alloy_Decision_JSON'] = JSON.stringify(activity.responseDetails.decision);
          baseData['Alloy_Decision_ID'] = activity.responseDetails.decision?.id || '';
          baseData['Alloy_Decision_Scope'] = activity.responseDetails.decision?.scope || '';
        }

        if (activity.responseDetails?.item) {
          baseData['Alloy_Item_JSON'] = JSON.stringify(activity.responseDetails.item);
          baseData['Alloy_Item_ID'] = activity.responseDetails.item?.id || '';
          baseData['Alloy_Item_Schema'] = activity.responseDetails.item?.schema || '';
        }

        // Complete handle array for Alloy.js
        if (activity.responseDetails?.handle) {
          baseData['Alloy_Handle_JSON'] = JSON.stringify(activity.responseDetails.handle);
        }

        // Add request payload details for better analysis
        const requestPayload = activity.requestDetails?.payload || {};
        if (requestPayload.id) {
          baseData['Request_Visitor_ID'] = JSON.stringify(requestPayload.id);
        }
        if (requestPayload.execute) {
          baseData['Request_Execute_JSON'] = JSON.stringify(requestPayload.execute);
        }
        if (requestPayload.prefetch) {
          baseData['Request_Prefetch_JSON'] = JSON.stringify(requestPayload.prefetch);
        }
        if (requestPayload.experienceCloud) {
          baseData['Request_Experience_Cloud_JSON'] = JSON.stringify(requestPayload.experienceCloud);
        }

        // Add analytics integration data if available
        if (requestPayload.analytics) {
          baseData['Request_Analytics_JSON'] = JSON.stringify(requestPayload.analytics);
        }

        // Add context data
        if (requestPayload.context) {
          baseData['Request_Context_JSON'] = JSON.stringify(requestPayload.context);
        }

        return baseData;
      });

      const csv = this.convertToCSV(data);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      this.downloadCSV(csv, `adobe-target-complete-report-${timestamp}.csv`);
    } catch (error) {
      console.error('Error downloading comprehensive report:', error);
      
      // Fallback to basic report if comprehensive fails
      try {
        const basicData = this.activities.map(activity => ({
          'Activity_Name': activity.name || '',
          'Experience_Name': activity.experience || '',
          'Activity_ID': activity.activityId || '',
          'Status_Code': activity.statusCode || '',
          'Timestamp': new Date(activity.timestamp).toISOString(),
          'Error': 'Comprehensive export failed - basic data only'
        }));
        
        const basicCsv = this.convertToCSV(basicData);
        this.downloadCSV(basicCsv, `adobe-target-basic-report-${Date.now()}.csv`);
      } catch (fallbackError) {
        console.error('Even basic export failed:', fallbackError);
      }
    }
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header] || '';
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` : escaped;
      }).join(',');
    });
    return [csvHeaders, ...csvRows].join('\n');
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


  showLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    
    if (loadingContainer) {
      loadingContainer.style.display = 'flex';
      // Reset to default loading message
      const loadingText = loadingContainer.querySelector('p');
      if (loadingText) {
        loadingText.textContent = 'Detecting Adobe Target activities...';
      }
    }
    
    if (activityList) activityList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (activityActions) activityActions.style.display = 'none';
  }

  showReloadingState(message) {
    const loadingContainer = document.getElementById('loadingContainer');
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    
    // Show loading container with custom message
    if (loadingContainer) {
      loadingContainer.style.display = 'flex';
      const loadingText = loadingContainer.querySelector('p');
      if (loadingText) {
        loadingText.textContent = message;
      }
    }
    
    // Hide other elements
    if (activityList) activityList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (activityActions) activityActions.style.display = 'none';
    
    // Update status text in header
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }

  updateUI() {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');

    if (this.activities.length > 0) {
      if (statusText) statusText.textContent = `${this.activities.length} Activities Detected`;
      if (statusIndicator) statusIndicator.style.background = '#10b981';
    } else if (this.isDebugging) {
      if (statusText) statusText.textContent = 'Monitoring Active - Refresh page to detect activities';
      if (statusIndicator) statusIndicator.style.background = '#ff9800';
    } else {
      if (statusText) statusText.textContent = 'Ready to monitor - Click Start Monitoring & Reload';
      if (statusIndicator) statusIndicator.style.background = '#FA0F00';
    }

    // Update summary cards
    const totalCard = document.querySelector('#activitySummary .summary-number');
    const mboxCard = document.querySelectorAll('#activitySummary .summary-number')[1];
    
    if (totalCard) totalCard.textContent = this.activities.length;
    
    if (mboxCard) {
      const uniqueMboxes = new Set();
      this.activities.forEach(activity => {
        if (activity.details && activity.details.mboxes) {
          activity.details.mboxes.forEach(mbox => uniqueMboxes.add(mbox));
        }
      });
      mboxCard.textContent = uniqueMboxes.size;
    }

    // Update workflow steps and tab states
    this.updateWorkflowSteps();
    this.updateTabStates();

    this.hideLoading();
    this.updateActivityList();
  }

  showError(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = `Error: ${message}`;
  }

  async submitErrorReport() {
    const textarea = document.getElementById('errorReportText');
    const submitBtn = document.getElementById('submitErrorReport');
    const statusSpan = document.getElementById('reportStatus');
    
    const errorText = textarea?.value?.trim();
    
    if (!errorText) {
      this.showReportStatus('Please describe the issue before submitting.', 'error');
      return;
    }
    
    if (submitBtn) submitBtn.disabled = true;
    this.showReportStatus('Sending report...', 'sending');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab?.url || 'Unknown';
      
      const emailData = {
        to: 'nishtha.venice@gmail.com',
        subject: 'Adobe Target Inspector - Error Report',
        body: `Error Report from Adobe Target Inspector Extension

Website: ${currentUrl}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Activities Detected: ${this.activities.length}

Issue Description:
${errorText}

---
This report was automatically generated by the Adobe Target Inspector Chrome Extension.`
      };
      
      const mailtoUrl = `mailto:${encodeURIComponent(emailData.to)}` +
                       `?subject=${encodeURIComponent(emailData.subject)}` +
                       `&body=${encodeURIComponent(emailData.body)}`;
      
      await chrome.tabs.create({ url: mailtoUrl, active: false });
      
      if (textarea) textarea.value = '';
      this.showReportStatus('✅ Email client opened! Please send the email to complete your report.', 'success');
      
    } catch (error) {
      this.showReportStatus('❌ Failed to open email client. Please email nishtha.venice@gmail.com directly.', 'error');
    } finally {
      setTimeout(() => {
        if (submitBtn) submitBtn.disabled = false;
      }, 2000);
    }
  }
  
  showReportStatus(message, type) {
    const statusSpan = document.getElementById('reportStatus');
    if (!statusSpan) return;
    
    statusSpan.textContent = message;
    statusSpan.className = `report-status ${type}`;
    
    if (type !== 'success') {
      setTimeout(() => {
        statusSpan.textContent = '';
        statusSpan.className = 'report-status';
      }, 5000);
    }
  }

  formatMboxInfoSimple(mboxes) {
    if (!mboxes || mboxes.length === 0) {
      return '<div class="no-data">No mbox information available</div>';
    }
    return mboxes.map(mbox => `
      <div class="mbox-tag">${this.escapeHtml(mbox)}</div>
    `).join('');
  }

  formatPageModificationsPreview(modifications) {
    if (!modifications || modifications.length === 0) {
      return '<div class="no-data">No content changes detected</div>';
    }
    
    return modifications.slice(0, 3).map(mod => `
      <div class="modification-item">
        <span class="modification-type">${mod.type || 'Content Change'}</span>
        <span class="modification-selector">${mod.selector || 'Page Element'}</span>
      </div>
    `).join('') + (modifications.length > 3 ? `<div class="more-modifications">+${modifications.length - 3} more</div>` : '');
  }

  async loadBasicPageMetrics() {
    // Load basic page metrics - works WITHOUT activities
    console.log('📊 Loading basic page metrics (no activities required)');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const data = {
            navigation: {},
            paint: {},
            tagLibraries: [],
            targetApiCalls: []
          };
          
          const timing = window.performance?.timing;
          if (timing) {
            const navStart = timing.navigationStart;
            data.navigation = {
              pageLoadTime: timing.loadEventEnd - navStart,
              domInteractive: timing.domInteractive - navStart,
              domComplete: timing.domComplete - navStart,
              dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
              tcpTime: timing.connectEnd - timing.connectStart,
              requestTime: timing.responseStart - timing.requestStart,
              responseTime: timing.responseEnd - timing.responseStart,
              navigationStartTimestamp: navStart
            };
          }
          
          const paintEntries = window.performance?.getEntriesByType('paint') || [];
          data.paint = {
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || null,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || null
          };
          
          const resources = window.performance?.getEntriesByType('resource') || [];
          
          // Tag libraries
          data.tagLibraries = resources
            .filter(r => {
              const url = r.name.toLowerCase();
              return (url.includes('assets.adobedtm.com') && url.includes('launch-')) ||
                     url.includes('tags.tiqcdn.com') || url.includes('utag.js');
            })
            .map(r => ({
              name: r.name,
              type: r.name.toLowerCase().includes('adobedtm') ? 'Adobe Launch/Tags' : 'Tealium iQ',
              startTime: Math.round(r.startTime),
              duration: Math.round(r.duration),
              endTime: Math.round(r.startTime + r.duration),
              cached: r.transferSize === 0
            }));
          
          // Target API calls - Support BOTH /interact AND /delivery
          data.targetApiCalls = resources
            .filter(r => {
              const url = r.name.toLowerCase();
              // alloy.js /interact calls
              const isInteract = url.includes('/ee/v1/interact') || 
                                url.includes('/ee/or2/v1/interact') ||
                                (url.includes('demdex.net') && url.includes('/interact')) ||
                                (url.includes('adobedc.net') && url.includes('/interact'));
              // at.js /delivery calls
              const isDelivery = url.includes('tt.omtrdc.net') && url.includes('/delivery');
              
              return isInteract || isDelivery;
            })
            .map(r => ({
              name: r.name,
              startTime: Math.round(r.startTime),
              duration: Math.round(r.duration),
              endTime: Math.round(r.startTime + r.duration),
              transferSize: r.transferSize,
              // Improved cache detection
              cached: r.transferSize === 0 || r.transferSize < 100,
              apiType: r.name.toLowerCase().includes('/interact') ? 'interact' : 'delivery'
            }));
          
          return data;
        }
      });
      
      // Store with empty activities if none detected yet
      this.performanceData = {
        metrics: results[0].result,
        activities: this.activities, // Use current activities (may be empty)
        analyzedAt: Date.now()
      };
      
      this.displayTargetPerformanceMetrics();
      
    } catch (error) {
      console.error('Error loading basic metrics:', error);
      this.showPerformanceInstructions();
    }
  }

  async analyzeTargetPerformance() {
    console.group('⚡ ANALYZING TARGET PERFORMANCE');
    console.log('Activities detected:', this.activities.length);
    
    if (this.activities.length === 0) {
      console.warn('No activities to analyze');
      console.groupEnd();
      this.showPerformanceInstructions();
      return;
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const data = {
            navigation: {},
            paint: {},
            tagLibraries: [],
            targetApiCalls: []
          };
          
          const timing = window.performance?.timing;
          if (timing) {
            const navStart = timing.navigationStart;
            data.navigation = {
              pageLoadTime: timing.loadEventEnd - navStart,
              domInteractive: timing.domInteractive - navStart,
              domComplete: timing.domComplete - navStart,
              navigationStartTimestamp: navStart
            };
          }
          
          const paintEntries = window.performance?.getEntriesByType('paint') || [];
          data.paint = {
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || null,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || null
          };
          
          const resources = window.performance?.getEntriesByType('resource') || [];
          
          // Tag libraries (Launch or Tealium)
          data.tagLibraries = resources
            .filter(r => {
              const url = r.name.toLowerCase();
              return (url.includes('assets.adobedtm.com') && url.includes('launch-')) ||
                     url.includes('tags.tiqcdn.com') || url.includes('utag.js');
            })
            .map(r => ({
              name: r.name,
              type: r.name.toLowerCase().includes('adobedtm') ? 'Adobe Launch/Tags' : 'Tealium iQ',
              startTime: Math.round(r.startTime),
              duration: Math.round(r.duration),
              endTime: Math.round(r.startTime + r.duration),
              cached: r.transferSize === 0
            }));
          
          // Target API calls - Support BOTH /interact AND /delivery
          data.targetApiCalls = resources
            .filter(r => {
              const url = r.name.toLowerCase();
              // alloy.js calls
              const isInteract = url.includes('/ee/v1/interact') || 
                                url.includes('/ee/or2/v1/interact') ||
                                (url.includes('demdex.net') && url.includes('/interact')) ||
                                (url.includes('adobedc.net') && url.includes('/interact'));
              // at.js calls
              const isDelivery = url.includes('tt.omtrdc.net') && url.includes('/delivery');
              
              return isInteract || isDelivery;
            })
            .map(r => ({
              name: r.name,
              startTime: Math.round(r.startTime),
              duration: Math.round(r.duration),
              endTime: Math.round(r.startTime + r.duration),
              transferSize: r.transferSize,
              // Better cache detection: transferSize === 0 OR very small (< 100 bytes)
              cached: r.transferSize === 0 || r.transferSize < 100,
              apiType: r.name.toLowerCase().includes('/interact') ? 'interact' : 'delivery'
            }));
          
          return data;
        }
      });
      
      this.performanceData = {
        metrics: results[0].result,
        activities: this.activities,
        analyzedAt: Date.now()
      };
      
      console.log('✅ Analysis complete');
      console.groupEnd();
      
      this.displayTargetPerformanceMetrics();
      
    } catch (error) {
      console.error('Error:', error);
      console.groupEnd();
    }
  }

  displayTargetPerformanceMetrics() {
    if (!this.performanceData) return;
    
    const m = this.performanceData.metrics;
    const activities = this.performanceData.activities;
    const hasActivities = activities && activities.length > 0;
    
    // Hide guidance banner when showing metrics
    const guidanceBanner = document.getElementById('performanceGuidanceBanner');
    if (guidanceBanner) {
      guidanceBanner.style.display = 'none';
    }
    
    console.group('📊 DISPLAYING PERFORMANCE WITH ACTIVITIES');
    console.log('Total activities:', activities.length);
    console.log('Activities:', activities.map(a => ({
      name: a.name,
      timestamp: a.timestamp,
      time: new Date(a.timestamp).toLocaleTimeString()
    })));
    console.groupEnd();
    
    // Page metrics
    document.getElementById('pageLoadTime').textContent = 
      m.navigation.pageLoadTime ? `${Math.round(m.navigation.pageLoadTime)}ms` : 'N/A';
    document.getElementById('firstPaint').textContent = 
      m.paint.firstPaint ? `${Math.round(m.paint.firstPaint)}ms` : 'N/A';
    document.getElementById('firstContentfulPaint').textContent = 
      m.paint.firstContentfulPaint ? `${Math.round(m.paint.firstContentfulPaint)}ms` : 'N/A';
    
    // Detailed metrics
    document.getElementById('dnsTime').textContent = 
      m.navigation.dnsTime ? `${Math.round(m.navigation.dnsTime)}ms` : 'N/A';
    document.getElementById('tcpTime').textContent = 
      m.navigation.tcpTime ? `${Math.round(m.navigation.tcpTime)}ms` : 'N/A';
    document.getElementById('requestTime').textContent = 
      m.navigation.requestTime ? `${Math.round(m.navigation.requestTime)}ms` : 'N/A';
    document.getElementById('responseTime').textContent = 
      m.navigation.responseTime ? `${Math.round(m.navigation.responseTime)}ms` : 'N/A';
    document.getElementById('domInteractive').textContent = 
      m.navigation.domInteractive ? `${Math.round(m.navigation.domInteractive)}ms` : 'N/A';
    document.getElementById('domComplete').textContent = 
      m.navigation.domComplete ? `${Math.round(m.navigation.domComplete)}ms` : 'N/A';
    
    // POPULATE TIMING TABLE
    const timingTable = document.getElementById('timingTableBody');
    const events = [];
    
    // Add page events
    if (m.paint.firstPaint) {
      events.push({ name: '🎨 First Paint', start: 0, duration: Math.round(m.paint.firstPaint), end: Math.round(m.paint.firstPaint) });
    }
    if (m.paint.firstContentfulPaint) {
      events.push({ name: '🎨 First Contentful Paint', start: 0, duration: Math.round(m.paint.firstContentfulPaint), end: Math.round(m.paint.firstContentfulPaint) });
    }
    
    // Add tag library
    const tagLib = m.tagLibraries[0];
    if (tagLib) {
      events.push({ name: `📦 ${tagLib.type}`, start: tagLib.startTime, duration: tagLib.duration, end: tagLib.endTime });
      document.getElementById('libraryLoadTime').textContent = `${tagLib.duration}ms (${tagLib.type})`;
    } else {
      document.getElementById('libraryLoadTime').textContent = 'No tag library detected';
    }
    
    // Add DOM events
    if (m.navigation.domInteractive) {
      events.push({ name: '📄 DOM Interactive', start: 0, duration: Math.round(m.navigation.domInteractive), end: Math.round(m.navigation.domInteractive) });
    }
    
    // Add Target API ONLY if activities exist
    const apiCall = m.targetApiCalls[0];
    if (hasActivities && apiCall) {
      // Log cache detection for debugging
      console.log('🌐 TARGET API CACHE DETECTION:', {
        url: apiCall.name,
        apiType: apiCall.apiType,
        transferSize: apiCall.transferSize + ' bytes',
        isCached: apiCall.cached,
        reason: apiCall.transferSize === 0 ? 'transferSize = 0 (browser disk cache)' :
                apiCall.transferSize < 100 ? `transferSize = ${apiCall.transferSize} bytes (likely cached header/redirect)` :
                `transferSize = ${apiCall.transferSize} bytes (real network call)`
      });
      
      const cached = apiCall.cached ? ' ⚡ cached' : ' 🌐 network';
      events.push({ name: `🎯 Target Activity Delivery${cached}`, start: apiCall.startTime, duration: apiCall.duration, end: apiCall.endTime });
      
      const label = apiCall.cached ? ' (cached ⚡)' : ' (network 🌐)';
      document.getElementById('activityDeliveryTime').textContent = `${apiCall.duration}ms${label}`;
      
      // Show individual activities breakdown
      this.displayIndividualActivities(activities, apiCall, m.paint.firstContentfulPaint);
    } else if (apiCall && !hasActivities) {
      document.getElementById('activityDeliveryTime').textContent = 'API call but no activities delivered';
      this.hideActivitiesBreakdown();
    } else {
      document.getElementById('activityDeliveryTime').textContent = 'No Target activities detected';
      this.hideActivitiesBreakdown();
    }
    
    if (m.navigation.domComplete) {
      events.push({ name: '✅ DOM Complete', start: 0, duration: Math.round(m.navigation.domComplete), end: Math.round(m.navigation.domComplete) });
    }
    
    // Sort by start time, then by end time
    events.sort((a, b) => a.start !== b.start ? a.start - b.start : a.end - b.end);
    
    // Populate table
    if (events.length > 0 && timingTable) {
      timingTable.innerHTML = events.map((e, i) => `
        <tr>
          <td><span class="timing-sequence">#${i + 1}</span> ${e.name}</td>
          <td><span class="timing-value">${e.start}ms</span></td>
          <td><span class="timing-value">${e.duration}ms</span></td>
          <td><span class="timing-value">${e.end}ms</span></td>
        </tr>
      `).join('');
    } else if (timingTable) {
      timingTable.innerHTML = '<tr><td colspan="4" class="no-timing-data">No timing data available</td></tr>';
    }
    
    // Flicker
    const fcp = m.paint.firstContentfulPaint;
    const activityEnd = apiCall?.endTime;
    const flicker = (fcp && activityEnd && hasActivities) ? Math.max(0, activityEnd - fcp) : null;
    
    if (flicker !== null) {
      document.getElementById('flickerDuration').textContent = `${Math.round(flicker)}ms`;
    } else {
      document.getElementById('flickerDuration').textContent = hasActivities ? 'N/A' : 'No activities detected';
    }
    
    // Analytics
    this.displayPerformanceAnalytics(m, activities, flicker);
  }

  displayPerformanceAnalytics(metrics, activities, flicker) {
    const recs = [];
    
    if (activities.length === 0) {
      recs.push({
        icon: 'ℹ️',
        title: 'No Target Activities Detected',
        description: 'No personalization was delivered. Check Activities tab for details.',
        severity: 'low'
      });
    }
    
    if (flicker && flicker > 500) {
      recs.push({
        icon: '⚡',
        title: 'High Flicker Risk',
        description: `${Math.round(flicker)}ms flicker detected. Consider prehiding snippet or server-side rendering.`,
        severity: 'high'
      });
    }
    
    const tagLib = metrics.tagLibraries[0];
    if (tagLib && tagLib.duration > 500) {
      recs.push({
        icon: '🏷️',
        title: 'Slow Tag Library',
        description: `${tagLib.type} took ${tagLib.duration}ms. Consider optimization.`,
        severity: 'medium'
      });
    }
    
    const html = recs.length > 0 ? `<div class="recommendation-list">${recs.map(r => `
      <div class="recommendation-item">
        <div class="recommendation-icon">${r.icon}</div>
        <div class="recommendation-content">
          <div class="recommendation-title">${r.title}</div>
          <div class="recommendation-description">${r.description}</div>
          <span class="recommendation-severity ${r.severity}">${r.severity}</span>
        </div>
      </div>
    `).join('')}</div>` : '<div class="analytics-placeholder"><p>✅ No performance issues detected!</p></div>';
    
    const container = document.getElementById('performanceAnalytics');
    if (container) container.innerHTML = html;
    
    // Impact scores with FORMULAS shown
    const pageLoad = metrics.navigation.pageLoadTime || 1;
    const targetDuration = metrics.targetApiCalls[0]?.duration || 0;
    const overhead = targetDuration > 0 ? Math.round((targetDuration / pageLoad) * 100) : 0;
    
    document.getElementById('targetOverhead').textContent = overhead > 0 ? `${overhead}%` : 'N/A';
    document.getElementById('targetOverheadStatus').textContent = 
      overhead === 0 ? 'ℹ️ No Target calls' :
      overhead < 10 ? '✅ Minimal' : overhead < 20 ? '⚠️ Moderate' : '❌ High';
    
    // Show Target Overhead formula
    const overheadFormula = document.getElementById('targetOverheadFormula');
    if (overheadFormula) {
      if (overhead > 0) {
        overheadFormula.innerHTML = `
          <strong>Formula:</strong><br>
          (Target Duration / Page Load) × 100<br>
          = (${targetDuration}ms / ${Math.round(pageLoad)}ms) × 100<br>
          = <strong>${overhead}%</strong><br>
          <br>
          <em>What it means:</em> Target consumed ${overhead}% of total page load time
        `;
      } else {
        overheadFormula.textContent = 'No Target API calls detected';
      }
    }
    
    document.getElementById('flickerRisk').textContent = flicker ? `${Math.round(flicker)}ms` : 'N/A';
    document.getElementById('flickerRiskStatus').textContent = 
      !flicker ? 'ℹ️ No flicker data' :
      flicker === 0 ? '✅ No flicker' :
      flicker < 300 ? '✅ Low' : flicker < 500 ? '⚠️ Medium' : '❌ High';
    
    // Show Flicker formula
    const flickerFormula = document.getElementById('flickerFormula');
    if (flickerFormula) {
      if (flicker !== null && flicker !== undefined && activities.length > 0) {
        const apiCall = metrics.targetApiCalls[0];
        const fcp = metrics.paint.firstContentfulPaint;
        flickerFormula.innerHTML = `
          <strong>Formula:</strong><br>
          Activity End Time - First Contentful Paint<br>
          = ${apiCall.endTime}ms - ${Math.round(fcp)}ms<br>
          = <strong>${Math.round(flicker)}ms</strong><br>
          <br>
          <em>What it means:</em> User saw wrong content for ${Math.round(flicker)}ms before Target personalized it
        `;
      } else {
        flickerFormula.textContent = 'Requires activity detection (go to Activities tab)';
      }
    }
    
    const score = Math.max(0, 100 - (flicker > 500 ? 30 : 0) - (overhead > 20 ? 30 : 0));
    document.getElementById('optimizationScore').textContent = score;
    document.getElementById('optimizationScoreStatus').textContent = 
      score >= 80 ? '✅ Excellent' : score >= 60 ? '⚠️ Good' : '❌ Needs work';
    
    // Show Optimization Score formula
    const scoreFormula = document.getElementById('scoreFormula');
    if (scoreFormula) {
      const flickerDeduction = flicker > 500 ? 30 : flicker > 300 ? 15 : 0;
      const overheadDeduction = overhead > 20 ? 30 : overhead > 10 ? 15 : 0;
      
      scoreFormula.innerHTML = `
        <strong>Formula:</strong><br>
        100 - Flicker Penalty - Overhead Penalty<br>
        = 100 - ${flickerDeduction} - ${overheadDeduction}<br>
        = <strong>${score}</strong><br>
        <br>
        <em>Penalties:</em><br>
        • Flicker >500ms: -30 | 300-500ms: -15<br>
        • Overhead >20%: -30 | 10-20%: -15
      `;
    }
  }

  displayIndividualActivities(activities, apiCall, fcp) {
    const section = document.getElementById('activitiesBreakdownSection');
    const container = document.getElementById('activitiesPerformanceBreakdown');
    
    if (!section || !container) return;
    
    // Update heading with count
    const heading = section.querySelector('h3');
    if (heading) {
      heading.textContent = `🎯 Target Activities Performance (${activities.length} ${activities.length === 1 ? 'activity' : 'activities'})`;
    }
    
    // Show section
    section.style.display = 'block';
    
    // Create activity cards
    const html = activities.map((activity, index) => {
      // Calculate per-activity flicker (all activities delivered at same time in single API call)
      const activityDeliveredAt = apiCall.endTime;
      const flicker = fcp && activityDeliveredAt ? Math.max(0, activityDeliveredAt - fcp) : null;
      const flickerStatus = !flicker ? 'N/A' : 
                           flicker === 0 ? '✅ No flicker' :
                           flicker < 300 ? '✅ Low' : 
                           flicker < 500 ? '⚠️ Medium' : '❌ High';
      
      return `
        <div class="activity-performance-card">
          <div class="activity-perf-header">
            <div class="activity-perf-name">
              <span class="activity-number">#${index + 1}</span>
              ${this.escapeHtml(activity.name)}
            </div>
            <span class="implementation-badge ${activity.implementationType.toLowerCase()}">${activity.implementationType}</span>
          </div>
          <div class="activity-perf-details">
            <div class="perf-detail-row">
              <span class="perf-detail-label">Experience:</span>
              <span class="perf-detail-value">${this.escapeHtml(activity.experience)}</span>
            </div>
            <div class="perf-detail-row">
              <span class="perf-detail-label">Delivered At:</span>
              <span class="perf-detail-value">${activityDeliveredAt}ms (${new Date(activity.timestamp).toLocaleTimeString()})</span>
            </div>
            <div class="perf-detail-row">
              <span class="perf-detail-label">API Call Duration:</span>
              <span class="perf-detail-value">${apiCall.duration}ms ${apiCall.cached ? '⚡ cached' : '🌐 network'}</span>
            </div>
            <div class="perf-detail-row">
              <span class="perf-detail-label">Flicker Impact:</span>
              <span class="perf-detail-value flicker-${flicker > 500 ? 'high' : flicker > 300 ? 'medium' : 'low'}">${flicker ? `${Math.round(flicker)}ms ${flickerStatus}` : 'N/A'}</span>
            </div>
            ${flicker ? `
            <div class="flicker-formula">
              <small>Flicker = Activity Delivered (${activityDeliveredAt}ms) - FCP (${Math.round(fcp)}ms) = ${Math.round(flicker)}ms</small>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = html;
  }

  hideActivitiesBreakdown() {
    const section = document.getElementById('activitiesBreakdownSection');
    if (section) section.style.display = 'none';
  }

  showPerformanceInstructions() {
    const container = document.getElementById('performanceAnalytics');
    if (container) {
      container.innerHTML = `
        <div class="analytics-placeholder">
          <h3>📋 Performance Metrics Options</h3>
          
          <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <strong>Option 1: Basic Page Metrics</strong>
            <p style="margin: 8px 0 0 0; font-size: 13px;">
              Click <strong>"🔄 Refresh Metrics"</strong> above to see:<br>
              ✓ Page load time, First Paint, FCP<br>
              ✓ Tag library (Launch/Tealium) timing<br>
              ✓ DOM timing metrics
            </p>
          </div>
          
          <div style="background: #fef2f2; padding: 12px; border-radius: 6px;">
            <strong>Option 2: Full Target Analysis (with Activities)</strong>
            <p style="margin: 8px 0 0 0; font-size: 13px;">
              For per-activity timing and flicker analysis:<br>
              1. Go to <strong>Activities</strong> tab<br>
              2. Click <strong>"🔍 Start Monitoring & Reload"</strong><br>
              3. Click <strong>"⚡ Analyze Target Performance"</strong> button<br>
              <br>
              <strong>You'll see:</strong><br>
              ✓ Individual breakdown for each activity<br>
              ✓ Per-activity flicker calculation<br>
              ✓ Load timing for each experience
            </p>
          </div>
          
          <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">
            ℹ️ Target-specific metrics require activity detection for accuracy.
          </p>
        </div>
      `;
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ========================================
     FLICKER TEST METHODS
     ======================================== */

  async showFlickerTestReady() {
    // Check if we came from Activities tab with context
    const testContext = await chrome.storage.local.get(['snippetTestWithActivities', 'snippetTestActivitiesCount']);
    
    const guidanceBanner = document.querySelector('.test-warning');
    
    if (testContext.snippetTestWithActivities && testContext.snippetTestActivitiesCount > 0) {
      // Show success message - activities detected!
      guidanceBanner.innerHTML = `
        <div class="warning-icon">✅</div>
        <div class="warning-content">
          <strong>Ready to Test!</strong> Detected ${testContext.snippetTestActivitiesCount} Adobe Target ${testContext.snippetTestActivitiesCount === 1 ? 'activity' : 'activities'}.
          <ul style="margin: 8px 0 0 20px; font-size: 12px;">
            <li>Test 1: Page will reload WITH prehiding snippet</li>
            <li>Test 2: Page will reload WITHOUT prehiding snippet</li>
            <li>Results will show real flicker difference for your activities</li>
          </ul>
        </div>
      `;
      guidanceBanner.style.background = '#d1fae5';
      guidanceBanner.style.borderColor = '#10b981';
      
      // Enable test button
      const testBtn = document.getElementById('runFlickerTest');
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.style.opacity = '1';
      }
      
    } else {
      // Show standard warning - no activities context
      guidanceBanner.innerHTML = `
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <strong>Important:</strong> For accurate flicker testing, make sure Adobe Target activities are loaded on this page.
          <ul style="margin: 8px 0 0 20px; font-size: 12px;">
            <li><strong>Recommended:</strong> Go to Activities tab first, scan for activities, then click "🧪 Test Flicker Impact"</li>
            <li>Or: Continue anyway to test without activity validation</li>
            <li>Results may show "N/A" if no activities are detected during test</li>
          </ul>
        </div>
      `;
      guidanceBanner.style.background = '#fef3c7';
      guidanceBanner.style.borderColor = '#fbbf24';
    }
  }

  async detectPrehidingSnippet() {
    console.log('🔍 Detecting prehiding snippet...');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Search for prehiding snippet in all scripts
          const scripts = document.querySelectorAll('script');
          let snippetFound = false;
          let snippetDetails = null;
          
          for (const script of scripts) {
            const content = script.textContent;
            
            // Look for prehiding snippet patterns
            if (content.includes('prehiding') || 
                content.includes('body { opacity: 0') ||
                content.includes('body{opacity:0') ||
                (content.includes('opacity') && content.includes('setTimeout') && content.includes('adobe'))) {
              
              snippetFound = true;
              
              // Extract timeout value
              const timeoutMatch = content.match(/setTimeout.*?(\d{3,4})/);
              const timeout = timeoutMatch ? timeoutMatch[1] + 'ms' : 'Unknown';
              
              // Determine style
              let style = 'body { opacity: 0 }';
              if (content.includes('visibility: hidden')) {
                style = 'body { visibility: hidden }';
              }
              
              // Determine location
              let location = 'Inline script in <head>';
              if (script.src) {
                location = script.src;
              } else if (script.id) {
                location = `Inline script (ID: ${script.id})`;
              }
              
              snippetDetails = {
                timeout,
                style,
                location,
                fullContent: content.substring(0, 500) // First 500 chars for logging
              };
              
              break;
            }
          }
          
          return {
            detected: snippetFound,
            details: snippetDetails
          };
        }
      });
      
      const snippetInfo = result[0].result;
      console.log('Snippet detection result:', snippetInfo);
      
      this.updateSnippetStatus(snippetInfo);
      
    } catch (error) {
      console.error('Error detecting snippet:', error);
      this.updateSnippetStatus({ detected: false, error: true });
    }
  }

  updateSnippetStatus(snippetInfo) {
    const statusElement = document.getElementById('snippetDetected');
    const detailsElement = document.getElementById('snippetDetails');
    const runTestBtn = document.getElementById('runFlickerTest');
    
    if (snippetInfo.error) {
      statusElement.innerHTML = '<span class="status-value" style="color: #dc2626;">❌ Error detecting snippet</span>';
      if (runTestBtn) runTestBtn.disabled = true;
      return;
    }
    
    if (snippetInfo.detected) {
      statusElement.innerHTML = '<span class="status-value detected">✅ Detected</span>';
      
      // Show details
      if (detailsElement && snippetInfo.details) {
        detailsElement.style.display = 'block';
        document.getElementById('snippetTimeout').textContent = snippetInfo.details.timeout;
        document.getElementById('snippetStyle').textContent = snippetInfo.details.style;
        document.getElementById('snippetLocation').textContent = snippetInfo.details.location;
      }
      
      // Enable test button
      if (runTestBtn) runTestBtn.disabled = false;
      
    } else {
      statusElement.innerHTML = '<span class="status-value not-detected">❌ Not Found</span>';
      if (detailsElement) detailsElement.style.display = 'none';
      
      // Still allow test to run
      if (runTestBtn) {
        runTestBtn.disabled = false;
        runTestBtn.textContent = '🚀 Run Test (No snippet detected)';
      }
    }
  }

  async loadSavedSnippetTestResults() {
    try {
      const storage = await chrome.storage.local.get(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl']);
      
      // Check if results exist AND match current tab/URL
      if (storage.flickerTestResults && storage.flickerTestTabId === this.currentTabId) {
        // Verify URL hasn't changed
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tab.url;
        
        // Simple URL comparison (ignore query params and hash)
        const savedUrlBase = storage.flickerTestUrl ? storage.flickerTestUrl.split('?')[0].split('#')[0] : '';
        const currentUrlBase = currentUrl ? currentUrl.split('?')[0].split('#')[0] : '';
        
        if (savedUrlBase === currentUrlBase) {
          console.log('📂 Loading saved snippet test results for current page:', storage.flickerTestResults);
          
          // Show the results section
          const resultsSection = document.getElementById('resultsSection');
          if (resultsSection) {
            resultsSection.style.display = 'block';
          }
          
          // Display the results
          this.displayFlickerTestResults(storage.flickerTestResults);
          
          // Update button text
          const testBtn = document.getElementById('runFlickerTest');
          if (testBtn) {
            testBtn.textContent = '🔄 Run Test Again';
          }
          
          return true;
        } else {
          console.log('📂 Saved results are for different URL, clearing...');
          await chrome.storage.local.remove(['flickerTestResults', 'flickerTestTabId', 'flickerTestUrl']);
          return false;
        }
      } else {
        console.log('📂 No saved snippet test results found for current page');
        return false;
      }
    } catch (error) {
      console.error('Error loading saved results:', error);
      return false;
    }
  }

  async runFlickerTest() {
    console.log('🧪 Starting Flicker Test...');
    
    const testBtn = document.getElementById('runFlickerTest');
    const testStatus = document.getElementById('testStatus');
    const progressFill = document.getElementById('testProgress');
    const progressText = document.getElementById('testProgressText');
    
    try {
      // Check if chrome.storage is available
      if (!chrome.storage || !chrome.storage.local) {
        throw new Error('Storage API not available. Please reload the extension from chrome://extensions/');
      }

      // Disable button
      testBtn.disabled = true;
      testStatus.style.display = 'block';
      
      // CRITICAL: Detect if page HAS prehiding snippet
      progressFill.style.width = '10%';
      progressText.textContent = 'Detecting existing prehiding snippet...';
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const snippetDetection = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Check for prehiding snippet patterns
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            const content = script.textContent || '';
            if (content.includes('prehiding') || 
                content.includes('body{opacity:0') ||
                content.includes('at-body-style') ||
                content.includes('alloy-prehiding')) {
              return true;
            }
          }
          
          // Check for existing prehiding style
          const prehidingStyles = document.querySelectorAll('style[id*="prehiding"], style[id*="at-body-style"]');
          if (prehidingStyles.length > 0) {
            return true;
          }
          
          return false;
        }
      });
      
      const hasSnippet = snippetDetection && snippetDetection[0] && snippetDetection[0].result;
      console.log('🔍 SNIPPET DETECTION: Page has snippet:', hasSnippet);
      
      // Store test state based on snippet existence
      const testStateData = {
        flickerTestState: 'test_with_snippet',
        flickerTestTabId: this.currentTabId,
        flickerTestStartTime: Date.now(),
        pageHasSnippet: hasSnippet,
        // Phase 1 logic:
        blockPrehidingSnippet: false,  // Never block in phase 1
        injectPrehidingSnippet: !hasSnippet  // INJECT if page doesn't have one
      };
      
      await chrome.storage.local.set(testStateData);
      console.log('✅ SNIPPET TEST: Stored test state for Phase 1:', testStateData);
      
      // Phase 1: Test WITH snippet
      progressFill.style.width = '25%';
      progressText.textContent = 'Step 1/4: Ensuring debugger is active...';
      
      // Make SURE debugger is attached and monitoring
      await this.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      progressFill.style.width = '35%';
      if (hasSnippet) {
        progressText.textContent = 'Step 2/4: Testing WITH existing snippet...';
      } else {
        progressText.textContent = 'Step 2/4: Injecting & testing WITH snippet...';
      }
      
      // Clear previous test RESULTS (but keep current test state)
      await chrome.storage.local.remove(['flickerTestResults', 'flickerTestUrl']);
      await chrome.runtime.sendMessage({ 
        type: 'CLEAR_FLICKER_TEST_DATA',
        tabId: this.currentTabId 
      });
      
      // Reload page to measure WITH snippet
      await chrome.tabs.reload(this.currentTabId);
      
      progressFill.style.width = '40%';
      progressText.textContent = 'Waiting for page to load...';
      
      progressFill.style.width = '50%';
      progressText.textContent = 'Step 3/4: Waiting for page & Target to load...';
      
      // Wait for page load AND Target call to complete (8 seconds total)
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Manually trigger first collection (in case webNavigation didn't fire)
      console.log('🧪 FLICKER TEST: Manually collecting WITH snippet metrics...');
      console.log('🧪 FLICKER TEST: Sending message with tabId:', this.currentTabId);
      const response1 = await chrome.runtime.sendMessage({ 
        type: 'COLLECT_FLICKER_METRICS',
        tabId: this.currentTabId 
      });
      console.log('🧪 FLICKER TEST: WITH snippet collection response:', response1);
      
      // Update state for second test
      const testContext = await chrome.storage.local.get(['pageHasSnippet']);
      const phase2StateData = {
        flickerTestState: 'test_without_snippet',
        flickerTestTabId: this.currentTabId,  // ✅ Keep tab ID set
        // Phase 2 logic:
        blockPrehidingSnippet: testContext.pageHasSnippet,  // BLOCK only if page had snippet
        injectPrehidingSnippet: false  // Never inject in phase 2
      };
      
      await chrome.storage.local.set(phase2StateData);
      console.log('✅ SNIPPET TEST: Stored test state for Phase 2:', phase2StateData);
      
      progressFill.style.width = '65%';
      if (testContext.pageHasSnippet) {
        progressText.textContent = 'Step 4/4: Blocking & testing WITHOUT snippet...';
      } else {
        progressText.textContent = 'Step 4/4: Testing WITHOUT snippet (baseline)...';
      }
      
      // Reload page again to measure WITHOUT snippet
      await chrome.tabs.reload(this.currentTabId);
      
      progressFill.style.width = '75%';
      progressText.textContent = 'Step 4/4: Waiting for second test...';
      
      // Wait for second test (same duration as first)
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Manually trigger second collection
      console.log('🧪 FLICKER TEST: Manually collecting WITHOUT snippet metrics...');
      console.log('🧪 FLICKER TEST: Sending message with tabId:', this.currentTabId);
      const response2 = await chrome.runtime.sendMessage({ 
        type: 'COLLECT_FLICKER_METRICS',
        tabId: this.currentTabId 
      });
      console.log('🧪 FLICKER TEST: WITHOUT snippet collection response:', response2);
      
      progressFill.style.width = '100%';
      progressText.textContent = 'Test complete! Loading results...';
      
      // Retrieve test results
      const results = await chrome.storage.local.get(['flickerTestResults']);
      
      if (results.flickerTestResults) {
        this.displayFlickerTestResults(results.flickerTestResults);
      }
      
      // Clean up test state AND context flags
      await chrome.storage.local.remove(['flickerTestState', 'flickerTestTabId', 'flickerTestStartTime', 'blockPrehidingSnippet', 'injectPrehidingSnippet', 'pageHasSnippet', 'snippetTestWithActivities', 'snippetTestActivitiesCount']);
      
      // Hide progress, show results
      setTimeout(() => {
        testStatus.style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        testBtn.disabled = false;
        testBtn.textContent = '🔄 Run Test Again';
      }, 1000);
      
    } catch (error) {
      console.error('Error running flicker test:', error);
      progressText.textContent = '❌ ' + error.message;
      progressText.style.color = '#dc2626';
      
      // Show user-friendly message
      alert('⚠️ Extension Error\n\n' + error.message + '\n\nSteps to fix:\n1. Go to chrome://extensions/\n2. Find "Adobe Target Activity Inspector"\n3. Click the 🔄 Reload button\n4. Try again');
      
      testBtn.disabled = false;
      testStatus.style.display = 'none';
    }
  }

  displayFlickerTestResults(results) {
    console.log('📊 Displaying flicker test results:', results);
    
    const { withSnippet, withoutSnippet } = results;
    
    // Check if we have valid data
    const hasValidWithData = withSnippet && (withSnippet.fcp || withSnippet.activityTime);
    const hasValidWithoutData = withoutSnippet && (withoutSnippet.fcp || withoutSnippet.activityTime);
    
    console.log('📊 Data validity check:', {
      hasValidWithData,
      hasValidWithoutData,
      withSnippet,
      withoutSnippet
    });
    
    // WITH Snippet metrics
    document.getElementById('flickerWith').textContent = 
      (withSnippet?.flicker !== null && withSnippet?.flicker !== undefined) ? `${withSnippet.flicker}ms` : 'No Activity';
    document.getElementById('fcpWith').textContent = 
      withSnippet?.fcp ? `${withSnippet.fcp}ms` : 'N/A';
    document.getElementById('activityWith').textContent = 
      withSnippet?.activityTime !== null && withSnippet?.activityTime !== undefined ? `${withSnippet.activityTime}ms` : 'No Activity';
    document.getElementById('pageLoadWith').textContent = 
      withSnippet?.pageLoad ? `${withSnippet.pageLoad}ms` : 'N/A';
    
    // Status badge
    const statusWith = document.getElementById('statusWith');
    if (withSnippet?.activityTime === null) {
      statusWith.innerHTML = '<span class="status-badge">ℹ️ No Target Activity Detected</span>';
    } else if (withSnippet?.flicker !== null && withSnippet?.flicker !== undefined) {
      if (withSnippet.flicker < 300) {
        statusWith.innerHTML = '<span class="status-badge low-risk">✅ Low Flicker Risk</span>';
      } else {
        statusWith.innerHTML = '<span class="status-badge high-risk">⚠️ High Flicker Risk</span>';
      }
    } else {
      statusWith.innerHTML = '<span class="status-badge">⚠️ No Data Available</span>';
    }
    
    // WITHOUT Snippet metrics
    document.getElementById('flickerWithout').textContent = 
      (withoutSnippet?.flicker !== null && withoutSnippet?.flicker !== undefined) ? `${withoutSnippet.flicker}ms` : 'No Activity';
    document.getElementById('fcpWithout').textContent = 
      withoutSnippet?.fcp ? `${withoutSnippet.fcp}ms` : 'N/A';
    document.getElementById('activityWithout').textContent = 
      withoutSnippet?.activityTime !== null && withoutSnippet?.activityTime !== undefined ? `${withoutSnippet.activityTime}ms` : 'No Activity';
    document.getElementById('pageLoadWithout').textContent = 
      withoutSnippet?.pageLoad ? `${withoutSnippet.pageLoad}ms` : 'N/A';
    
    // Status badge
    const statusWithout = document.getElementById('statusWithout');
    if (withoutSnippet?.activityTime === null) {
      statusWithout.innerHTML = '<span class="status-badge">ℹ️ No Target Activity Detected</span>';
    } else if (withoutSnippet?.flicker !== null && withoutSnippet?.flicker !== undefined) {
      if (withoutSnippet.flicker < 300) {
        statusWithout.innerHTML = '<span class="status-badge low-risk">✅ Low Flicker Risk</span>';
      } else {
        statusWithout.innerHTML = '<span class="status-badge high-risk">⚠️ High Flicker Risk</span>';
      }
    } else {
      statusWithout.innerHTML = '<span class="status-badge">⚠️ No Data Available</span>';
    }
    
    // Calculate difference
    const flickerDiff = document.getElementById('flickerDifference');
    let difference = null;
    
    if (withoutSnippet?.flicker !== null && withoutSnippet?.flicker !== undefined && 
        withSnippet?.flicker !== null && withSnippet?.flicker !== undefined) {
      difference = withoutSnippet.flicker - withSnippet.flicker;
      
      if (difference > 0) {
        flickerDiff.textContent = `${difference}ms`;
        flickerDiff.style.color = '#059669';
      } else if (difference < 0) {
        flickerDiff.textContent = `${Math.abs(difference)}ms worse`;
        flickerDiff.style.color = '#dc2626';
      } else {
        flickerDiff.textContent = 'No difference';
        flickerDiff.style.color = '#6b7280';
      }
    } else {
      flickerDiff.textContent = 'N/A';
      flickerDiff.style.color = '#9ca3af';
    }
    
    // Detailed analysis
    this.generateFlickerAnalysis(withSnippet, withoutSnippet, difference);
    
    // Recommendations
    this.generateFlickerRecommendations(withSnippet, withoutSnippet, difference);
  }

  generateFlickerAnalysis(withSnippet, withoutSnippet, difference) {
    const analysisContainer = document.getElementById('detailedAnalysis');
    
    let analysis = '<div style="font-size: 13px; line-height: 1.7;">';
    
    // Check if activities were present
    if (withSnippet?.activityTime === null || withoutSnippet?.activityTime === null) {
      analysis += `<p><strong>ℹ️ No Target Activities Detected</strong></p>`;
      analysis += `<p>Adobe Target API calls were detected, but <strong>no actual personalization activities were delivered</strong>. This means:</p>`;
      analysis += `<ul style="margin-left: 20px; margin-top: 8px;">`;
      analysis += `<li>The page loaded Target libraries (at.js or alloy.js)</li>`;
      analysis += `<li>Target API calls were made to Adobe servers</li>`;
      analysis += `<li>But the response contained no activities/offers</li>`;
      analysis += `</ul>`;
      analysis += `<p style="margin-top: 12px;"><strong>Why This Happens:</strong></p>`;
      analysis += `<ul style="margin-left: 20px;">`;
      analysis += `<li>No activities are targeted to this page URL</li>`;
      analysis += `<li>Activities exist but you don't qualify for the audience</li>`;
      analysis += `<li>Activities are paused or in draft mode</li>`;
      analysis += `</ul>`;
      analysis += `<p style="margin-top: 12px;"><strong>Result:</strong> Without activities, there's no flicker to measure. The prehiding snippet would have no impact on this page.</p>`;
      analysis += `<p style="margin-top: 12px; font-size: 12px; color: #6b7280;"><em>Tip: Go to the Activities tab to confirm if activities are present. Test on a page where activities are actively delivering.</em></p>`;
      analysis += '</div>';
      analysisContainer.innerHTML = analysis;
      return;
    }
    
    // Check if we have valid data
    if (!withSnippet || !withoutSnippet || difference === null) {
      analysis += `<p><strong>⚠️ Unable to Generate Analysis</strong></p>`;
      analysis += `<p>The test was unable to collect complete performance metrics. This could happen because:</p>`;
      analysis += `<ul style="margin-left: 20px; margin-top: 8px;">`;
      analysis += `<li>Page loaded too quickly (metrics not yet available)</li>`;
      analysis += `<li>Target API calls occurred before performance measurement</li>`;
      analysis += `</ul>`;
      analysis += `<p style="margin-top: 12px;"><strong>Suggestions:</strong></p>`;
      analysis += `<ul style="margin-left: 20px;">`;
      analysis += `<li>Make sure the page has active Adobe Target activities (check Activities tab)</li>`;
      analysis += `<li>Open browser console (F12) to see detailed logs</li>`;
      analysis += `<li>Try running the test again</li>`;
      analysis += `</ul>`;
      analysis += '</div>';
      analysisContainer.innerHTML = analysis;
      return;
    }
    
    analysis += `<p><strong>Test Summary:</strong></p>`;
    analysis += `<p>We measured flicker in two scenarios:</p>`;
    analysis += `<ul style="margin-left: 20px; margin-top: 8px;">`;
    analysis += `<li><strong>WITH Snippet:</strong> ${withSnippet.flicker || 'N/A'}ms of visible flicker (FCP to Activity Applied)</li>`;
    analysis += `<li><strong>WITHOUT Snippet:</strong> ${withoutSnippet.flicker || 'N/A'}ms of visible flicker</li>`;
    analysis += `</ul>`;
    
    if (difference > 0) {
      analysis += `<p style="margin-top: 12px;"><strong>✅ Verdict:</strong> The prehiding snippet <strong>reduces flicker by ${difference}ms</strong>. This represents a ${Math.round((difference/withoutSnippet.flicker)*100)}% improvement in user experience.</p>`;
    } else if (difference < 0) {
      analysis += `<p style="margin-top: 12px;"><strong>⚠️ Unexpected Result:</strong> The test shows ${Math.abs(difference)}ms <em>more</em> flicker with the snippet. This could indicate the snippet timeout is too long or other performance issues.</p>`;
    } else {
      analysis += `<p style="margin-top: 12px;"><strong>Neutral Result:</strong> No measurable difference in flicker between the two scenarios.</p>`;
    }
    
    analysis += `<p style="margin-top: 12px; font-size: 12px; color: #6b7280;"><em>Note: Network variance may affect results. For accurate measurement, run the test multiple times and average the results.</em></p>`;
    
    analysis += '</div>';
    
    analysisContainer.innerHTML = analysis;
  }

  generateFlickerRecommendations(withSnippet, withoutSnippet, difference) {
    const recsContainer = document.getElementById('recommendationsContent');
    
    let recs = '<div style="font-size: 13px; line-height: 1.7;"><ul style="margin-left: 20px;">';
    
    if (difference > 100) {
      recs += `<li><strong>Keep the prehiding snippet</strong> - It's effectively preventing ${difference}ms of flicker.</li>`;
      recs += `<li>Current timeout (${withSnippet.snippetTimeout || '3000ms'}) seems appropriate.</li>`;
    } else if (difference > 0 && difference <= 100) {
      recs += `<li>The snippet provides <strong>marginal improvement</strong> (${difference}ms).</li>`;
      recs += `<li>Consider if the added complexity is worth the small benefit.</li>`;
      recs += `<li>Alternatively, focus on optimizing Target delivery speed instead.</li>`;
    } else if (difference < 0) {
      recs += `<li><strong>⚠️ Consider removing or adjusting the snippet</strong> - It may be causing more harm than good.</li>`;
      recs += `<li>Check if the snippet timeout is too long for your Target response time.</li>`;
      recs += `<li>Review snippet implementation - ensure it's the Adobe-recommended version.</li>`;
    } else {
      recs += `<li>No significant difference detected between scenarios.</li>`;
      recs += `<li>The snippet may not be necessary for your current Target setup.</li>`;
    }
    
    recs += `<li><strong>General recommendation:</strong> Run this test multiple times at different times of day for accurate results.</li>`;
    
    recs += '</ul></div>';
    
    recsContainer.innerHTML = recs;
  }

  async clearCacheAndReload() {
    console.log('🧹 Clearing cache and reloading...');
    
    const btn = document.getElementById('clearCacheBtn');
    const originalText = btn.textContent;
    
    try {
      // Check if browsingData API is available
      if (!chrome.browsingData) {
        throw new Error('Browsing Data API not available. Please reload the extension from chrome://extensions/');
      }

      btn.textContent = '🧹 Clearing cache...';
      btn.disabled = true;
      
      // Clear cache for current origin
      await chrome.browsingData.removeCache({});
      
      btn.textContent = '🔄 Reloading...';
      
      // Reload page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.reload(tab.id);
      
      // Reset button
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      btn.textContent = '❌ Error';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  }

  async generateAuditReport() {
    // Collect all necessary data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const pageTitle = tab.title;
    const timestamp = new Date().toLocaleString();
    
    // Get performance data
    let performanceData = {
      pageLoadTime: '-',
      firstPaint: '-',
      firstContentfulPaint: '-',
      domInteractive: '-',
      domComplete: '-'
    };
    
    try {
      const perfResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const nav = performance.getEntriesByType('navigation')[0];
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          const fp = paintEntries.find(entry => entry.name === 'first-paint');
          
          return {
            pageLoadTime: nav ? Math.round(nav.loadEventEnd - nav.fetchStart) : null,
            firstPaint: fp ? Math.round(fp.startTime) : null,
            firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
            domInteractive: nav ? Math.round(nav.domInteractive - nav.fetchStart) : null,
            domComplete: nav ? Math.round(nav.domComplete - nav.fetchStart) : null
          };
        }
      });
      
      if (perfResults && perfResults[0] && perfResults[0].result) {
        const data = perfResults[0].result;
        performanceData.pageLoadTime = data.pageLoadTime ? `${(data.pageLoadTime / 1000).toFixed(2)}s` : '-';
        performanceData.firstPaint = data.firstPaint ? `${data.firstPaint}ms` : '-';
        performanceData.firstContentfulPaint = data.firstContentfulPaint ? `${data.firstContentfulPaint}ms` : '-';
        performanceData.domInteractive = data.domInteractive ? `${data.domInteractive}ms` : '-';
        performanceData.domComplete = data.domComplete ? `${data.domComplete}ms` : '-';
      }
    } catch (error) {
      console.error('Error collecting performance data:', error);
    }
    
    // Calculate audit score
    const activitiesCount = this.activities.length;
    const networkEventsCount = this.networkEvents ? this.networkEvents.length : 0;
    const hasActivities = activitiesCount > 0;
    
    // Score calculation (0-100)
    let auditScore = 50; // Base score
    if (hasActivities) auditScore += 20; // Has activities
    if (networkEventsCount > 0) auditScore += 10; // Has network events
    if (performanceData.pageLoadTime !== '-') auditScore += 10; // Has performance data
    if (parseFloat(performanceData.pageLoadTime) < 3) auditScore += 10; // Good load time
    
    // Generate HTML report with charts
    const reportHTML = this.generateAuditReportHTML({
      url,
      pageTitle,
      timestamp,
      activitiesCount,
      networkEventsCount,
      performanceData,
      auditScore,
      activities: this.activities
    });
    
    // Download the report
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `adobe-target-audit-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }

  generateAuditReportHTML(data) {
    const { url, pageTitle, timestamp, activitiesCount, networkEventsCount, performanceData, auditScore, activities } = data;
    
    // Calculate successful calls
    const successfulCalls = activities.filter(a => a.statusCode === 200 || a.statusCode === 'detected').length;
    const successRate = activitiesCount > 0 ? Math.round((successfulCalls / activitiesCount) * 100) : 0;
    
    // Parse load time for display
    const loadTimeValue = performanceData.pageLoadTime.replace('s', '');
    const loadTimeNum = parseFloat(loadTimeValue) || 0;
    
    // Generate circular progress SVG with proper calculations
    const generateCircularChart = (value, label, color, description, subtitle = '') => {
      // For circular charts, we'll show full circle (100%) as they're display metrics
      const circumference = 2 * Math.PI * 45;
      const offset = 0; // Full circle for display metrics
      
      return `
        <div class="audit-chart-card">
          <div class="chart-container">
            <svg viewBox="0 0 120 120" class="circular-chart">
              <circle class="circle-bg" cx="60" cy="60" r="45" />
              <circle class="circle-progress" cx="60" cy="60" r="45" 
                style="stroke: ${color}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};" />
              <text x="60" y="65" class="chart-value">${value}</text>
            </svg>
          </div>
          <div class="chart-info">
            <div class="chart-label">${label}</div>
            ${subtitle ? `<div class="chart-subtitle">${subtitle}</div>` : ''}
            <div class="chart-description">${description}</div>
          </div>
        </div>
      `;
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adobe Target Audit Report - ${this.escapeHtml(pageTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 40px 20px;
      line-height: 1.6;
      color: #2c3e50;
    }
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .report-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .report-header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .report-header .url {
      font-size: 14px;
      opacity: 0.9;
      word-break: break-all;
    }
    .report-header .timestamp {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 10px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      padding: 40px;
      background: white;
    }
    .audit-chart-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      border: 2px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.3s ease;
    }
    .audit-chart-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      border-color: #cbd5e1;
    }
    .chart-container {
      margin-bottom: 16px;
    }
    .circular-chart {
      width: 140px;
      height: 140px;
      transform: rotate(-90deg);
    }
    .circle-bg {
      fill: none;
      stroke: #e2e8f0;
      stroke-width: 10;
    }
    .circle-progress {
      fill: none;
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease;
    }
    .chart-value {
      transform: rotate(90deg);
      transform-origin: center;
      font-size: 32px;
      font-weight: 800;
      fill: #1e293b;
    }
    .chart-info {
      width: 100%;
    }
    .chart-label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .chart-subtitle {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .chart-description {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      margin-top: 8px;
      text-align: left;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #cbd5e1;
    }
    .audit-score-section {
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }
    .audit-score-circle {
      display: inline-block;
      position: relative;
      margin-bottom: 24px;
    }
    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 56px;
      font-weight: 900;
      color: #10b981;
      z-index: 1;
    }
    .audit-score-title {
      font-size: 32px;
      font-weight: 800;
      margin-top: 20px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .audit-score-subtitle {
      font-size: 18px;
      color: #64748b;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .score-explanation {
      max-width: 600px;
      margin: 24px auto 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      text-align: left;
    }
    .score-explanation-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .score-explanation-text {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .score-breakdown {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .score-breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      color: #64748b;
    }
    .score-breakdown-label {
      font-weight: 500;
    }
    .score-breakdown-value {
      font-weight: 700;
      color: #10b981;
    }
    .highlights-section {
      padding: 40px;
      background: white;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
      color: #1e293b;
      border-bottom: 3px solid #667eea;
      padding-bottom: 12px;
    }
    .highlight-item {
      padding: 16px;
      margin-bottom: 12px;
      background: #f8fafc;
      border-left: 4px solid #667eea;
      border-radius: 6px;
    }
    .highlight-item strong {
      color: #667eea;
    }
    .activities-section {
      padding: 40px;
      background: #fafafa;
    }
    .activity-card {
      background: white;
      padding: 20px;
      margin-bottom: 16px;
      border-radius: 8px;
      border-left: 4px solid #FA0F00;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .activity-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .activity-meta {
      font-size: 14px;
      color: #64748b;
    }
    .recommendations-section {
      padding: 40px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }
    .recommendation-item {
      padding: 20px;
      margin-bottom: 16px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .recommendation-title {
      font-size: 16px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 8px;
    }
    .recommendation-description {
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #1e293b;
      color: white;
      font-size: 14px;
    }
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      .circular-chart {
        width: 120px;
        height: 120px;
      }
      .chart-value {
        font-size: 28px;
      }
      .audit-score-circle svg {
        width: 180px;
        height: 180px;
      }
      .score-value {
        font-size: 48px;
      }
    }
    @media print {
      body { background: white; padding: 0; }
      .report-container { box-shadow: none; }
      .audit-chart-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <div class="report-header">
      <h1>🎯 Adobe Target Audit Report</h1>
      <div class="url">${this.escapeHtml(url)}</div>
      <div class="timestamp">Scanned: ${timestamp}</div>
    </div>
    
    <!-- Metrics Grid -->
    <div class="metrics-grid">
      ${generateCircularChart(
        activitiesCount, 
        'Activities Detected', 
        '#667eea',
        'The total number of Adobe Target personalization activities detected on this page. Each activity represents a test or personalization campaign that is delivering customized content to visitors based on targeting rules, audience segments, and experience variations.',
        activitiesCount > 0 ? `${activitiesCount} ${activitiesCount === 1 ? 'activity' : 'activities'} found` : 'No activities detected'
      )}
      ${generateCircularChart(
        performanceData.pageLoadTime, 
        'Average Load Time', 
        '#f59e0b',
        'The total time taken for the page to fully load, measured from the initial navigation start to when the load event completes. This includes DNS lookup, TCP connection, request/response time, DOM parsing, and resource loading. Lower is better - aim for under 3 seconds for optimal user experience.',
        loadTimeNum > 0 ? (loadTimeNum < 3 ? 'Good performance' : loadTimeNum < 5 ? 'Moderate performance' : 'Needs optimization') : 'Not measured'
      )}
      ${generateCircularChart(
        networkEventsCount, 
        'Network Events', 
        '#10b981',
        'The total number of Adobe Target API calls captured during page load. This includes both "interact" calls (Alloy.js/Web SDK) and "delivery" calls (at.js). Each event represents a network request to Adobe Target servers to fetch personalized content or track user interactions.',
        networkEventsCount > 0 ? `${networkEventsCount} ${networkEventsCount === 1 ? 'event' : 'events'} captured` : 'No events captured'
      )}
      ${generateCircularChart(
        successfulCalls, 
        'Successful Calls', 
        '#3b82f6',
        'The number of Adobe Target API calls that completed successfully (HTTP 200 status). This indicates that Target was able to process the request and return personalized content. A high success rate ensures visitors receive the intended personalization experiences without errors.',
        activitiesCount > 0 ? `${successRate}% success rate (${successfulCalls}/${activitiesCount})` : 'No calls to verify'
      )}
    </div>
    
    <!-- Audit Score -->
    <div class="audit-score-section">
      <div class="audit-score-circle">
        <svg viewBox="0 0 200 200" style="width: 220px; height: 220px; transform: rotate(-90deg);">
          <circle cx="100" cy="100" r="85" fill="none" stroke="#e2e8f0" stroke-width="14" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="#10b981" stroke-width="14" 
            stroke-dasharray="${2 * Math.PI * 85}" 
            stroke-dashoffset="${2 * Math.PI * 85 * (1 - auditScore / 100)}"
            stroke-linecap="round" />
        </svg>
        <div class="score-value">${auditScore}</div>
      </div>
      <div class="audit-score-title">Audit Score</div>
      <div class="audit-score-subtitle">${auditScore >= 80 ? 'Excellent' : auditScore >= 60 ? 'Good' : auditScore >= 40 ? 'Fair' : 'Needs Improvement'}</div>
      
      <div class="score-explanation">
        <div class="score-explanation-title">📊 What This Score Means</div>
        <div class="score-explanation-text">
          The audit score (0-100) evaluates Adobe Target's implementation and performance on this page. 
          It considers multiple factors including activity detection, network performance, API call success rates, 
          and page load impact. Higher scores indicate better implementation and optimization.
        </div>
        <div class="score-breakdown">
          <div class="score-breakdown-item">
            <span class="score-breakdown-label">Base Score:</span>
            <span class="score-breakdown-value">50 points</span>
          </div>
          <div class="score-breakdown-item">
            <span class="score-breakdown-label">Activities Detected:</span>
            <span class="score-breakdown-value">${activitiesCount > 0 ? '+20 points' : '+0 points'}</span>
          </div>
          <div class="score-breakdown-item">
            <span class="score-breakdown-label">Network Events:</span>
            <span class="score-breakdown-value">${networkEventsCount > 0 ? '+10 points' : '+0 points'}</span>
          </div>
          <div class="score-breakdown-item">
            <span class="score-breakdown-label">Performance Data:</span>
            <span class="score-breakdown-value">${performanceData.pageLoadTime !== '-' ? '+10 points' : '+0 points'}</span>
          </div>
          <div class="score-breakdown-item">
            <span class="score-breakdown-label">Fast Load Time:</span>
            <span class="score-breakdown-value">${loadTimeNum > 0 && loadTimeNum < 3 ? '+10 points' : '+0 points'}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Highlights -->
    <div class="highlights-section">
      <h2 class="section-title">📊 Highlights About the Scan</h2>
      <div class="highlight-item">
        <strong>${activitiesCount}</strong> Adobe Target activities detected on this page
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ${activitiesCount > 0 ? 
            `Activities include: ${activities.map(a => this.escapeHtml(a.name)).slice(0, 3).join(', ')}${activities.length > 3 ? '...' : ''}` : 
            'No personalization activities are currently active on this page.'}
        </div>
      </div>
      <div class="highlight-item">
        <strong>${networkEventsCount}</strong> network events captured (interact/delivery calls)
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ${networkEventsCount > 0 ? 
            `These events represent API calls to Adobe Target servers for content delivery and tracking.` : 
            'No Adobe Target network requests were detected during page load.'}
        </div>
      </div>
      <div class="highlight-item">
        Page load time: <strong>${performanceData.pageLoadTime}</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ${loadTimeNum > 0 ? 
            (loadTimeNum < 3 ? '✅ Excellent - Page loads quickly' : 
             loadTimeNum < 5 ? '⚠️ Moderate - Consider optimization' : 
             '❌ Slow - Needs performance improvements') : 
            'Performance metrics not available'}
        </div>
      </div>
      <div class="highlight-item">
        First Contentful Paint: <strong>${performanceData.firstContentfulPaint}</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Time when the first text or image is rendered. Lower values indicate faster perceived performance.
        </div>
      </div>
      <div class="highlight-item">
        DOM Interactive: <strong>${performanceData.domInteractive}</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Time when the browser finishes parsing the document and DOM is ready for interaction.
        </div>
      </div>
      ${performanceData.domComplete !== '-' ? `
      <div class="highlight-item">
        DOM Complete: <strong>${performanceData.domComplete}</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Time when the document and all sub-resources have finished loading.
        </div>
      </div>
      ` : ''}
      ${successRate > 0 ? `
      <div class="highlight-item">
        API Success Rate: <strong>${successRate}%</strong>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ${successfulCalls} out of ${activitiesCount} Target API calls completed successfully.
          ${successRate === 100 ? '✅ Perfect - All calls successful' : successRate >= 90 ? '⚠️ Good - Most calls successful' : '❌ Issues detected - Some calls failed'}
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- Activities List -->
    ${activitiesCount > 0 ? `
    <div class="activities-section">
      <h2 class="section-title">🎯 Detected Activities</h2>
      ${activities.map((activity, index) => `
        <div class="activity-card">
          <div class="activity-name">${index + 1}. ${this.escapeHtml(activity.name)}</div>
          <div class="activity-meta">
            Experience: ${this.escapeHtml(activity.experience)} | 
            Type: ${activity.type} | 
            Implementation: ${activity.implementationType} | 
            Status: ${activity.statusCode}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Recommendations -->
    <div class="recommendations-section">
      <h2 class="section-title">💡 Key Recommendations</h2>
      ${auditScore < 80 ? `
      <div class="recommendation-item">
        <div class="recommendation-title">Optimize Page Load Performance</div>
        <div class="recommendation-description">
          Current load time is ${performanceData.pageLoadTime}. Consider implementing lazy loading, 
          code splitting, and optimizing images to improve performance.
        </div>
      </div>
      ` : ''}
      ${activitiesCount === 0 ? `
      <div class="recommendation-item">
        <div class="recommendation-title">No Activities Detected</div>
        <div class="recommendation-description">
          No Adobe Target activities were found on this page. Ensure that Adobe Target is properly 
          implemented and that activities are published and targeting this page correctly.
        </div>
      </div>
      ` : ''}
      <div class="recommendation-item">
        <div class="recommendation-title">Monitor Performance Regularly</div>
        <div class="recommendation-description">
          Run this audit report regularly to track Adobe Target's impact on page performance and 
          ensure optimal user experience.
        </div>
      </div>
      <div class="recommendation-item">
        <div class="recommendation-title">Test Prehiding Snippet Impact</div>
        <div class="recommendation-description">
          Use the "Snippet Test" tab in the extension to measure the impact of Adobe Target's 
          prehiding snippet on flicker and page performance.
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Generated by Adobe Target Inspector Extension<br>
      ${timestamp}
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new TargetPopup();
  window.popup.init();
});