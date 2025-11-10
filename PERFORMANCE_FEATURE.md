# Performance Monitoring Feature - Adobe Target Inspector

## Overview
A comprehensive performance monitoring feature has been added to the Adobe Target Inspector extension to help users understand page load times, Adobe Target impact, and identify opportunities to reduce flicker and improve user experience.

## Features Implemented

### 1. Performance Tab UI
- **New Tab**: Added a "Performance" tab between "Details" and "Explanation" tabs
- **Intuitive Design**: Modern, card-based layout with color-coded metrics
- **Refresh Button**: Allows users to refresh metrics at any time

### 2. Key Metrics Collected

#### Page Performance Metrics
- **Page Load Time**: Total time from navigation start to page load complete
- **First Paint (FP)**: Time when browser first renders pixels to the screen
- **First Contentful Paint (FCP)**: Time when first DOM content is rendered
- **DNS Lookup Time**: Domain name resolution duration
- **TCP Connection Time**: TCP handshake duration
- **Request/Response Times**: Server request and response durations
- **DOM Interactive/Complete**: DOM parsing and completion times

#### Adobe Target Specific Metrics
- **Library Load Time**: How long it takes to load at.js or alloy.js
- **Activity Delivery Time**: Duration of Target API call to deliver activities
- **Flicker Duration**: Estimated time users see page flicker (prehiding duration)
- **Target Overhead**: Percentage of page load time consumed by Target
- **Total Target Calls**: Number of Target API calls made

### 3. Visual Performance Timeline
- Interactive timeline charts showing:
  - Library load duration
  - Activity delivery timing
  - Flicker duration with color-coded severity:
    - 🟢 Green: < 300ms (Good)
    - 🟡 Yellow: 300-500ms (Moderate)
    - 🔴 Red: > 500ms (Critical)

### 4. Analytics & Recommendations
The system automatically analyzes metrics and provides actionable recommendations:

#### Page Load Analysis
- Identifies slow page loads (>3s)
- Recommends server optimization and resource reduction

#### First Contentful Paint Analysis
- Detects high FCP (>2.5s)
- Suggests loading indicators and reducing render-blocking resources

#### Adobe Target Performance Analysis
- **Slow Response (>1s)**: Recommends edge servers, reducing audience complexity, async delivery
- **Moderate Response (500ms-1s)**: Suggests monitoring
- **Good Response (<500ms)**: Confirms acceptable performance

#### Flicker Risk Analysis
- **High Risk (>500ms)**: Recommends prehiding snippet, serverState for SSR, async delivery
- **Moderate Risk (300-500ms)**: Suggests optimizing prehiding timeout
- **Low Risk (<300ms)**: Confirms smooth content delivery

#### Library Load Analysis
- Identifies slow library loads (>500ms)
- Recommends CDN optimization or async loading

### 5. Impact Scoring System

#### Target Overhead Score
- Calculates percentage of page load time consumed by Target
- Status indicators:
  - ✅ Minimal Impact: <10%
  - ⚠️ Moderate Impact: 10-20%
  - ❌ High Impact: >20%

#### Flicker Risk Score
- Quantifies flicker duration
- Status indicators:
  - ✅ Low Risk: <300ms
  - ⚠️ Medium Risk: 300-500ms
  - ❌ High Risk: >500ms

#### Optimization Score (0-100)
Comprehensive score based on:
- Page load time (30 points)
- First Contentful Paint (20 points)
- Target response time (25 points)
- Flicker duration (25 points)

Status grades:
- ✅ Excellent: 80-100
- ⚠️ Good: 60-79
- ❌ Needs Improvement: 0-59

## Technical Implementation

### Files Modified

#### 1. `popup.html`
- Added Performance tab button
- Created comprehensive performance metrics UI
- Added sections for metrics, timeline, analytics, and impact analysis

#### 2. `popup.css`
- Added 380+ lines of styling for performance tab
- Responsive grid layouts for metrics
- Color-coded status indicators
- Animated timeline bars
- Mobile-responsive design

#### 3. `popup.js`
- `loadPerformanceMetrics()`: Collects performance data from page using Performance API
- `displayPerformanceMetrics()`: Renders metrics in UI
- `estimateFlickerDuration()`: Calculates flicker based on FCP and activity delivery
- `generatePerformanceAnalytics()`: Analyzes metrics and generates recommendations
- `displayRecommendations()`: Renders recommendation cards
- `calculateImpactScores()`: Computes and displays impact scores
- Event handler for refresh button

#### 4. `background.js`
- Added `performanceData` Map to store timing data per tab
- `updatePerformanceData()`: Stores Adobe Target timing metrics
- `GET_PERFORMANCE` message handler to retrieve performance data
- Tracks activity delivery timestamps and call durations
- Clears performance data when activities are cleared

#### 5. `manifest.json`
- Added `"scripting"` permission for executing performance measurement scripts in pages

### Data Collection Method
Performance data is collected using:
1. **Navigation Timing API**: For page load metrics
2. **Paint Timing API**: For FP and FCP
3. **Resource Timing API**: For Adobe Target library load times
4. **Chrome Debugger API**: For Target activity delivery timing
5. **Script Injection**: Via `chrome.scripting.executeScript()` to access page performance data

## Usage Instructions

### For Users
1. **Open the Extension**: Click the Adobe Target Inspector icon
2. **Navigate to Performance Tab**: Click the "Performance" tab
3. **Load the Page**: Ensure the page has fully loaded
4. **Click Refresh Metrics**: Press the "🔄 Refresh Metrics" button
5. **Review Results**:
   - Check the three main metrics cards (Page Load, FP, FCP)
   - Review the Adobe Target Timing timeline
   - Examine detailed metrics
   - Read analytics and recommendations
   - Check impact scores

### For Developers
The performance metrics can be accessed programmatically:

```javascript
// Get performance data for current tab
const response = await chrome.runtime.sendMessage({
  type: 'GET_PERFORMANCE',
  tabId: tabId
});

const perfData = response.performanceData;
// Contains: libraryLoadTimestamp, activityDeliveryTimestamp, targetCallDuration, etc.
```

## Performance Optimization Tips Based on Metrics

### If Target Overhead is High (>20%)
1. Implement serverState for SSR pages
2. Use edge network/CDN for at.js delivery
3. Simplify audience targeting rules
4. Consider async Target delivery

### If Flicker Duration is High (>500ms)
1. Implement proper prehiding snippet
2. Use serverState to prefetch Target content
3. Optimize Target response time
4. Consider reducing audience complexity
5. Use asynchronous at.js deployment

### If Library Load is Slow (>500ms)
1. Use CDN closer to user geography
2. Enable HTTP/2 or HTTP/3
3. Implement resource hints (preconnect, dns-prefetch)
4. Consider async library loading

### If Page Load is Slow (>3s)
1. Optimize server response time
2. Reduce total page weight
3. Implement code splitting
4. Use lazy loading for images
5. Minify and compress resources

## Browser Compatibility
- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support

## Permissions Required
- `activeTab`: Access current tab information
- `debugger`: Monitor network requests for Target timing
- `tabs`: Query tab information
- `scripting`: Execute performance measurement scripts

## Future Enhancements (Potential)
1. Historical performance tracking over time
2. Export performance reports as PDF/Excel
3. Comparison with industry benchmarks
4. Real-time monitoring with alerts
5. Integration with Core Web Vitals
6. A/B test performance comparison

## Troubleshooting

### "Unable to collect performance metrics"
- Ensure the page has fully loaded
- Refresh the page and try again
- Check that the website allows script execution

### "Not detected" for Library Load
- Adobe Target library may not be loaded
- Check if at.js or alloy.js is present on the page
- Verify the library loaded from expected domains

### "Not measured" for Activity Delivery
- No Adobe Target activities were delivered
- Click "Start Monitoring & Reload" on Activities tab first
- Ensure debugger is attached

## Credits
Feature developed to help Adobe Target users optimize performance and reduce flicker for better user experience.

## Version
Implemented in Adobe Target Inspector v1.0.4+

