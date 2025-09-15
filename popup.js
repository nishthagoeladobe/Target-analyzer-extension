class TargetPopup {
  constructor() {
    this.activities = [];
    this.selectedActivityId = null;
    this.currentTabId = null;
    this.isAfterReload = false;
  }

  async init() {
    try {
      // Test connection to background script
      const connectionTest = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      console.log('🔗 DEBUGGER-POPUP: Connection test result:', connectionTest);
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      console.log('📍 DEBUGGER-POPUP: Current tab ID:', this.currentTabId);
      
      // Bind events first
      this.bindEvents();
      
      // Show loading initially
      this.showLoading();
      
      // Start monitoring
      await this.startMonitoring();
      
      // Load activities
      await this.loadActivities();
      
      // Update UI
      this.updateUI();
      
    } catch (error) {
      console.error('❌ DEBUGGER-POPUP: Error initializing popup:', error);
      this.showError('Failed to initialize extension');
    }
  }

  async startMonitoring() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'START_MONITORING',
        tabId: this.currentTabId 
      });
      console.log('✅ DEBUGGER-POPUP: Monitoring started:', response);
    } catch (error) {
      console.error('❌ DEBUGGER-POPUP: Error starting monitoring:', error);
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
        console.log(`✅ DEBUGGER-POPUP: Found ${this.activities.length} activities`);
      } else {
        this.activities = [];
      }
      
      this.updateActivityList();
      this.updateDetailsDropdown();
      
      // Auto-select first activity if none selected and activities exist
      if (!this.selectedActivityId && this.activities.length > 0) {
        this.selectActivity(this.activities[0].id);
      }
      
    } catch (error) {
      console.error('❌ DEBUGGER-POPUP: Error loading activities:', error);
      this.activities = [];
      this.updateActivityList();
    }
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.onclick = (e) => {
        this.switchTab(e.target.dataset.tab);
      };
    });

    // Clear activities
    const clearBtn = document.getElementById('clearActivities');
    if (clearBtn) {
      clearBtn.onclick = async () => {
        // Switch to activities tab first
        this.switchTab('activities');
        
        await chrome.runtime.sendMessage({ 
          type: 'CLEAR_ACTIVITIES',
          tabId: this.currentTabId 
        });
        this.activities = [];
        this.selectedActivityId = null;
        this.updateUI();
      };
    }

    // Refresh activities
    const refreshBtn = document.getElementById('refreshActivities');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        // Set flag to indicate we're after a reload
        this.isAfterReload = true;
        
        // Switch to activities tab first
        this.switchTab('activities');
        
        // Show loading immediately
        this.showLoading();
        this.activities = [];
        this.selectedActivityId = null;
        this.updateUI();
        
        // Clear existing activities
        await chrome.runtime.sendMessage({ 
          type: 'CLEAR_ACTIVITIES',
          tabId: this.currentTabId 
        });
        
        // Reload the page
        await chrome.tabs.reload(this.currentTabId);
        
        // Start monitoring after page reload
        setTimeout(async () => {
          await this.startMonitoring();
          
          // Keep checking for activities until they're loaded or timeout
          this.waitForActivitiesAfterReload();
        }, 2000);
      };
    }

    // Excel download
    const downloadBtn = document.getElementById('copyAllActivities');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        this.downloadExcelReport();
      };
    }
  }

  async waitForActivitiesAfterReload() {
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds max wait
    
    const checkForActivities = async () => {
      attempts++;
      console.log(`🔄 DEBUGGER-POPUP: Checking for activities (attempt ${attempts}/${maxAttempts})`);
      
      await this.loadActivities();
      
      if (this.activities.length > 0) {
        console.log('✅ DEBUGGER-POPUP: Activities found after reload!');
        this.hideLoading();
        this.updateUI();
        // Clear the reload flag after successful load
        this.isAfterReload = false;
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ DEBUGGER-POPUP: Timeout waiting for activities after reload');
        this.hideLoading();
        this.updateUI();
        // Clear the reload flag after timeout
        this.isAfterReload = false;
        return;
      }
      
      // Check again in 1 second
      setTimeout(checkForActivities, 1000);
    };
    
    checkForActivities();
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabName);
    });
  }

  updateActivityList() {
    const activityList = document.getElementById('activityList');
    const emptyState = document.getElementById('emptyState');
    const activityActions = document.getElementById('activityActions');
    
    if (this.activities.length === 0) {
      if (activityList) activityList.innerHTML = '';
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
        item.onclick = () => {
          const activityId = item.dataset.activityId;
          this.selectActivity(activityId);
        };
      });
    }
  }

  selectActivity(activityId) {
    console.log('🎯 DEBUGGER-POPUP: Activity selected:', activityId);
    console.log('🎯 DEBUGGER-POPUP: Total activities available:', this.activities.length);
    
    this.selectedActivityId = activityId;
    
    // Find the selected activity
    const selectedActivity = this.activities.find(a => a.id === activityId);
    console.log('🎯 DEBUGGER-POPUP: Selected activity object:', selectedActivity);
    
    // Update visual selection
    document.querySelectorAll('.activity-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.activityId === activityId);
    });
    
    // Switch to details tab only if not currently on activities tab after reload
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

    selector.onchange = (e) => {
      this.selectActivity(e.target.value);
    };

    this.updateDetailsView();
  }

  updateDetailsView() {
    console.log('📊 DEBUGGER-POPUP: Updating details view');
    console.log('📊 DEBUGGER-POPUP: Selected activity ID:', this.selectedActivityId);
    console.log('📊 DEBUGGER-POPUP: Available activities:', this.activities.map(a => a.id));
    
    const detailsContent = document.getElementById('detailsContent');
    if (!detailsContent) {
      console.error('❌ DEBUGGER-POPUP: detailsContent element not found!');
      return;
    }

    if (!this.selectedActivityId) {
      console.log('📊 DEBUGGER-POPUP: No activity selected');
      detailsContent.innerHTML = '<p class="no-selection">Select an activity to view details</p>';
      return;
    }

    const activity = this.activities.find(a => a.id === this.selectedActivityId);
    if (!activity) {
      console.error('❌ DEBUGGER-POPUP: Activity not found with ID:', this.selectedActivityId);
      detailsContent.innerHTML = '<p class="no-selection">Activity not found</p>';
      return;
    }

    console.log('📊 DEBUGGER-POPUP: Found activity for details:', activity.name);
    console.log('📊 DEBUGGER-POPUP: Activity details object:', activity.details);
    console.log('📊 DEBUGGER-POPUP: Activity response tokens:', activity.details?.responseTokens);

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
      newSelector.onchange = (e) => {
        this.selectActivity(e.target.value);
      };
    }

    // Bind detail tab switching
    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tabName = e.target.dataset.tab;
        this.switchDetailTab(tabName);
      };
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

  formatJsonViewer(data, type) {
    if (!data) {
      return '<div class="no-data">No data available</div>';
    }

    try {
      // Parse data if it's a string
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      
      return `
        <div class="json-table-container">
          <div class="json-table-header">
            <span class="json-table-title">${type === 'request' ? 'Request' : 'Response'} Data</span>
            <button class="copy-json-btn" onclick="popup.copyJsonData('${type}', this)" title="Copy JSON">📋</button>
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

  copyJsonData(type, button) {
    // Find the activity data to copy the original JSON
    const activity = this.activities.find(a => a.id === this.selectedActivityId);
    if (!activity) return;
    
    let dataToCopy = '';
    if (type === 'request' && activity.requestDetails?.payload) {
      dataToCopy = JSON.stringify(activity.requestDetails.payload, null, 2);
    } else if (type === 'response' && activity.responseDetails) {
      dataToCopy = JSON.stringify(activity.responseDetails, null, 2);
    }
    
    if (!dataToCopy) {
      button.textContent = '❌';
      setTimeout(() => {
        button.textContent = '📋';
      }, 1000);
      return;
    }
    
    navigator.clipboard.writeText(dataToCopy).then(() => {
      const originalText = button.textContent;
      button.textContent = '✅';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }).catch(err => {
      console.error('Failed to copy JSON:', err);
      button.textContent = '❌';
      setTimeout(() => {
        button.textContent = '📋';
      }, 1000);
    });
  }

  formatMboxInfo(mboxes) {
    if (!mboxes || mboxes.length === 0) {
      return '<p class="no-data">No mbox information available</p>';
    }
    return mboxes.map(mbox => `
      <div class="mbox-item">
        <span class="mbox-name">${this.escapeHtml(mbox)}</span>
        <span class="mbox-description">Target location where content is delivered</span>
      </div>
    `).join('');
  }

  formatResponseTokensReadable(tokens) {
    if (!tokens || Object.keys(tokens).length === 0) {
      return '<p class="no-data">No targeting data available</p>';
    }
    
    const categories = {
      activity: [],
      experience: [],
      user: [],
      geo: [],
      profile: [],
      other: []
    };
    
    Object.entries(tokens).forEach(([key, value]) => {
      const item = { key, value: String(value) };
      if (key.includes('activity')) categories.activity.push(item);
      else if (key.includes('experience')) categories.experience.push(item);
      else if (key.includes('user') || key.includes('profile')) categories.user.push(item);
      else if (key.includes('geo')) categories.geo.push(item);
      else if (key.includes('profile')) categories.profile.push(item);
      else categories.other.push(item);
    });

    let html = '';
    if (categories.activity.length > 0) {
      html += '<div class="token-category"><h4>🎯 Activity Information</h4>';
      html += categories.activity.map(item => `
        <div class="token-item">
          <span class="token-label">${this.formatTokenLabel(item.key)}:</span>
          <span class="token-value">${this.escapeHtml(item.value)}</span>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (categories.experience.length > 0) {
      html += '<div class="token-category"><h4>🎨 Experience Details</h4>';
      html += categories.experience.map(item => `
        <div class="token-item">
          <span class="token-label">${this.formatTokenLabel(item.key)}:</span>
          <span class="token-value">${this.escapeHtml(item.value)}</span>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (categories.geo.length > 0) {
      html += '<div class="token-category"><h4>🌍 Location Information</h4>';
      html += categories.geo.map(item => `
        <div class="token-item">
          <span class="token-label">${this.formatTokenLabel(item.key)}:</span>
          <span class="token-value">${this.escapeHtml(item.value)}</span>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (categories.user.length > 0 || categories.profile.length > 0) {
      html += '<div class="token-category"><h4>👤 User Profile</h4>';
      html += [...categories.user, ...categories.profile].map(item => `
        <div class="token-item">
          <span class="token-label">${this.formatTokenLabel(item.key)}:</span>
          <span class="token-value">${this.escapeHtml(item.value)}</span>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (categories.other.length > 0) {
      html += '<div class="token-category"><h4>📋 Other Data</h4>';
      html += categories.other.map(item => `
        <div class="token-item">
          <span class="token-label">${this.formatTokenLabel(item.key)}:</span>
          <span class="token-value">${this.escapeHtml(item.value)}</span>
        </div>
      `).join('');
      html += '</div>';
    }
    
    return html || '<p class="no-data">No targeting data available</p>';
  }

  formatTokenLabel(key) {
    return key.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatRequestDetailsReadable(requestDetails) {
    if (!requestDetails) {
      return '<p class="no-data">No request information available</p>';
    }
    
    return `
      <div class="request-item">
        <h4>🌐 Request URL</h4>
        <div class="url-display">${this.escapeHtml(requestDetails.url || 'Not available')}</div>
      </div>
      <div class="request-item">
        <h4>📨 Method</h4>
        <span class="method-badge">${requestDetails.method || 'Unknown'}</span>
      </div>
      <div class="request-item">
        <h4>📋 Request Parameters</h4>
        <div class="json-display">
          ${requestDetails.payload ? this.formatObjectReadable(requestDetails.payload) : '<p class="no-data">No parameters sent</p>'}
        </div>
      </div>
    `;
  }

  formatResponseBodyReadable(responseDetails) {
    if (!responseDetails) {
      return '<p class="no-data">No response body available</p>';
    }
    
    let html = `
      <div class="response-item">
        <h4>📊 Response Status</h4>
        <span class="status-badge status-${responseDetails.statusCode}">${responseDetails.statusCode || 'Unknown'}</span>
      </div>
    `;
    
    if (responseDetails.mbox) {
      html += `
        <div class="response-item">
          <h4>📦 Target Mbox</h4>
          <span class="mbox-name">${this.escapeHtml(responseDetails.mbox)}</span>
        </div>
      `;
    }
    
    if (responseDetails.option) {
      html += `
        <div class="response-item">
          <h4>🎯 Delivered Content</h4>
          <div class="json-display">
            ${this.formatObjectReadable(responseDetails.option)}
          </div>
        </div>
      `;
    }
    
    if (responseDetails.handle) {
      html += `
        <div class="response-item">
          <h4>🔄 Alloy.js Response Handle</h4>
          <div class="json-display">
            ${this.formatObjectReadable(responseDetails.handle)}
          </div>
        </div>
      `;
    }
    
    return html;
  }

  formatObjectReadable(obj) {
    if (!obj) return '<p class="no-data">No data</p>';
    
    if (typeof obj === 'string') {
      return `<div class="simple-value">${this.escapeHtml(obj)}</div>`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<p class="no-data">Empty array</p>';
      return obj.map((item, index) => `
        <div class="array-item">
          <strong>Item ${index + 1}:</strong>
          ${this.formatObjectReadable(item)}
        </div>
      `).join('');
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '<p class="no-data">No data</p>';
    
    return entries.map(([key, value]) => `
      <div class="object-item">
        <span class="object-key">${this.formatTokenLabel(key)}:</span>
        <span class="object-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : this.escapeHtml(String(value))}</span>
      </div>
    `).join('');
  }

  formatResponseTokens(tokens) {
    if (!tokens || Object.keys(tokens).length === 0) {
      return '<p class="no-data">No response tokens available</p>';
    }
    return Object.entries(tokens).map(([key, value]) => `
      <div class="json-item">
        <span class="json-key">${this.escapeHtml(key)}:</span>
        <span class="json-value">${this.escapeHtml(String(value))}</span>
      </div>
    `).join('');
  }

  formatPageModifications(modifications) {
    if (!modifications || modifications.length === 0) {
      return '<p class="no-data">No page modifications detected</p>';
    }
    return modifications.map(mod => `
      <div class="modification-item">
        <div class="mod-header">
          <span class="mod-type">${mod.type}</span>
          <span class="mod-selector">${mod.selector}</span>
        </div>
        <div class="mod-content">
          <pre>${this.escapeHtml(mod.content || 'No content')}</pre>
        </div>
      </div>
    `).join('');
  }

  formatRequestPayload(requestDetails) {
    if (!requestDetails) {
      return '<p class="no-data">No request details available</p>';
    }
    return `
      <div class="json-item">
        <span class="json-key">URL:</span>
        <span class="json-value">${this.escapeHtml(requestDetails.url || '')}</span>
      </div>
      <div class="json-item">
        <span class="json-key">Method:</span>
        <span class="json-value">${requestDetails.method || ''}</span>
      </div>
      <div class="json-item">
        <span class="json-key">Payload:</span>
        <pre class="json-value">${JSON.stringify(requestDetails.payload || {}, null, 2)}</pre>
      </div>
    `;
  }

  downloadExcelReport() {
    try {
      const data = this.activities.map(activity => {
        // Flatten request payload for CSV columns
        const requestPayload = activity.requestDetails?.payload || {};
        const responsePayload = activity.responseDetails || {};
        
        // Create base activity data
        const activityData = {
          'Activity Name': activity.name || '',
          'Experience Name': activity.experience || '',
          'Activity ID': activity.activityId || '',
          'Experience ID': activity.experienceId || '',
          'Implementation Type': activity.implementationType || '',
          'Call Type': activity.type || '',
          'Status Code': activity.statusCode || '',
          'Timestamp': new Date(activity.timestamp).toISOString(),
          'Request URL': activity.requestDetails?.url || '',
          'Request Method': activity.requestDetails?.method || '',
          'Client Code': activity.details?.clientCode || '',
          'Request ID': activity.details?.requestId || '',
          'Mboxes': (activity.details?.mboxes || []).join('; '),
          'Response Tokens': JSON.stringify(activity.details?.responseTokens || {}),
          'Page Modifications': JSON.stringify(activity.details?.pageModifications || [])
        };

        // Add flattened request payload data
        if (requestPayload && typeof requestPayload === 'object') {
          this.flattenObject(requestPayload, 'Request_', activityData);
        }

        // Add flattened response payload data
        if (responsePayload && typeof responsePayload === 'object') {
          this.flattenObject(responsePayload, 'Response_', activityData);
        }

        return activityData;
      });

      const csv = this.convertToCSV(data);
      this.downloadCSV(csv, `adobe-target-activities-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  }

  // Helper method to flatten nested objects for CSV
  flattenObject(obj, prefix = '', result = {}, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
      return result;
    }

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix + key.replace(/[^a-zA-Z0-9_]/g, '_');
      
      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        // Recursively flatten nested objects
        this.flattenObject(value, `${newKey}_`, result, maxDepth, currentDepth + 1);
      } else {
        result[newKey] = String(value);
      }
    }
    
    return result;
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
    }
    
    // Hide other elements to show loading in empty area
    if (activityList) activityList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (activityActions) activityActions.style.display = 'none';
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
      if (statusIndicator) statusIndicator.style.background = '#dc2626';
    } else {
      if (statusText) statusText.textContent = 'Monitoring Active - Refresh page to detect activities';
      if (statusIndicator) statusIndicator.style.background = '#ff9800';
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

    this.hideLoading();
    this.updateActivityList();
  }

  showError(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = `Error: ${message}`;
    console.error('Error:', message);
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new TargetPopup();
  window.popup.init();
});