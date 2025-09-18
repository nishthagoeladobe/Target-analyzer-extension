class TargetPopup {
  constructor() {
    this.activities = [];
    this.selectedActivityId = null;
    this.currentTabId = null;
    this.isAfterReload = false;
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      
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
      this.showError('Failed to initialize extension');
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
      this.activities = [];
      this.updateActivityList();
    }
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

    // Refresh activities button  
    const refreshBtn = document.getElementById('refreshActivities');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        // Provide immediate visual feedback
        const originalText = refreshBtn.textContent;
        const originalDisabled = refreshBtn.disabled;
        
        // Update button to show it's working
        refreshBtn.textContent = '⏳ Reloading...';
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.7';
        refreshBtn.style.cursor = 'not-allowed';
        
        try {
          this.isAfterReload = true;
          this.switchTab('activities');
          
          // Show loading with specific message
          this.showReloadingState('Preparing to reload page...');
          
          this.activities = [];
          this.selectedActivityId = null;
          this.updateUI();
          
          await chrome.runtime.sendMessage({ 
            type: 'CLEAR_ACTIVITIES',
            tabId: this.currentTabId 
          });
          
          // Update status before reload
          this.showReloadingState('Reloading page now...');
          refreshBtn.textContent = '📄 Page Reloading...';
          
          await chrome.tabs.reload(this.currentTabId);
          
          // Update status after reload
          refreshBtn.textContent = '🔍 Monitoring...';
          this.showReloadingState('Page reloaded - starting monitoring...');
          
          setTimeout(async () => {
            await this.startMonitoring();
            this.waitForActivitiesAfterReload();
          }, 2000);
          
          // Reset button after monitoring starts
          setTimeout(() => {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
          }, 3000);
          
        } catch (error) {
          // Reset button if there's an error
          refreshBtn.textContent = originalText;
          refreshBtn.disabled = originalDisabled;
          refreshBtn.style.opacity = '1';
          refreshBtn.style.cursor = 'pointer';
          console.error('Error during reload:', error);
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

    // Error report submission
    const submitErrorBtn = document.getElementById('submitErrorReport');
    if (submitErrorBtn) {
      submitErrorBtn.addEventListener('click', () => {
        this.submitErrorReport();
      });
    }
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
      const data = this.activities.map(activity => {
        return {
          'Activity Name': activity.name || '',
          'Experience Name': activity.experience || '',
          'Activity ID': activity.activityId || '',
          'Implementation Type': activity.implementationType || '',
          'Call Type': activity.type || '',
          'Status Code': activity.statusCode || '',
          'Timestamp': new Date(activity.timestamp).toISOString(),
          'Request URL': activity.requestDetails?.url || '',
          'Request Method': activity.requestDetails?.method || '',
          'Response Tokens': JSON.stringify(activity.details?.responseTokens || {})
        };
      });

      const csv = this.convertToCSV(data);
      this.downloadCSV(csv, `adobe-target-activities-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error downloading report:', error);
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