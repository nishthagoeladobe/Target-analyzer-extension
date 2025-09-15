# Adobe Target Activity Inspector - Demo Guide

## 🎯 Extension Overview

The **Adobe Target Activity Inspector** is a powerful Chrome extension designed for marketers, developers, and analysts who work with Adobe Target. It provides real-time visibility into Adobe Target activities running on any webpage, making personalization testing and debugging effortless.

---

## 🌟 Key Benefits

### For Marketers
- **Instant Activity Visibility**: See all running A/B tests and personalization campaigns at a glance
- **Non-Technical Explanations**: Understand complex response data in plain English
- **Campaign Verification**: Confirm your activities are running correctly on live pages
- **Experience Tracking**: Know exactly which version of a test you're seeing

### For Developers
- **Real-Time Debugging**: Monitor Adobe Target calls without opening DevTools
- **Implementation Validation**: Verify both at.js and Alloy.js implementations
- **Response Analysis**: Deep dive into request/response data with detailed JSON views
- **Network Call Monitoring**: Track delivery and interact calls with full payload details

### For Analysts
- **Data Export**: Generate Excel reports with all activity data for analysis
- **Response Token Analysis**: View all targeting criteria and user segments
- **Performance Monitoring**: Track activity load times and success rates
- **Comprehensive Reporting**: Export structured data for stakeholder presentations

---

## 🚀 Demo Flow - Step by Step

### Step 1: Installation and Setup
**What to Show**: Extension installation from Chrome Web Store
**Key Points**:
- One-click installation from Chrome Web Store
- No configuration required - works immediately
- Compatible with all Adobe Target implementations

### Step 2: Detecting Activities
**What to Show**: Opening extension on a page with Adobe Target
**Key Points**:
- Automatic activity detection upon page load
- Real-time activity counter in header
- Clean, professional interface with red/black Adobe-inspired theme

**Expected Result**: 
```
"15 Activities Detected" with activity count and mbox summary
```

### Step 3: Activity List Overview
**What to Show**: Activities tab with list of detected activities
**Key Points**:
- Each activity shows: Name, Experience, Implementation Type (at.js/Alloy.js), Timestamp
- Color-coded badges: Red for at.js, Black for Alloy.js
- Clickable activity items for detailed inspection
- Summary cards showing total activities and active mboxes

**Screenshot Focus**: 
- Activity list with multiple entries
- Implementation type badges
- Summary statistics

### Step 4: Activity Details Deep Dive
**What to Show**: Clicking on an activity to view details
**Key Points**:
- **Activity Overview**: Name, experience, ID, URL, timestamp
- **Response Details**: Complete Adobe Target response data
- **Response Tokens**: All targeting criteria and user attributes
- **Request Details**: Full request payload including ID, execute, and analytics sections
- **Mboxes**: All mboxes involved in the activity
- **Page Modifications**: What content is being changed on the page

**Screenshot Focus**:
- Detailed JSON response data
- Response tokens section
- Request payload structure

### Step 5: Implementation Type Differences
**What to Show**: Comparing at.js vs Alloy.js activities
**Key Points**:

**at.js (Red Badge)**:
- Uses delivery calls to `tt.omtrdc.net`
- Shows mbox-based structure
- Response tokens in metadata
- Traditional Target implementation

**Alloy.js (Black Badge)**:
- Uses interact calls to `/ee/` endpoints
- Shows scope-based structure (e.g., `__view__`, custom scopes)
- Handle array with personalization decisions
- Modern Adobe Experience Platform Web SDK

### Step 6: Excel Report Generation
**What to Show**: Clicking "Download Excel Report" button
**Key Points**:
- One-click Excel report generation
- Structured data with columns: Activity Name, Experience, Activity ID, Implementation Type, URL, Timestamp, Status Code, Mboxes, Response Tokens, Page Modifications, Request Details
- Professional filename: `adobe-target-activities-2024-01-15.csv`
- Opens directly in Excel for analysis

**Expected Result**: 
```
Button shows "Generating..." → "Downloaded!" → CSV file downloads
```

### Step 7: Explanation Tab for Non-Technical Users
**What to Show**: Explanation tab with parameter definitions
**Key Points**:
- Plain English explanations of Adobe Target concepts
- Parameter definitions for response tokens
- Implementation type differences explained
- Helpful for stakeholders who need to understand the data

**Screenshot Focus**:
- Clear, non-technical explanations
- Parameter definitions
- User-friendly language

---

## 📊 Technical Capabilities

### Supported Adobe Target Implementations
- **at.js (all versions)**: Traditional Adobe Target implementation
- **Alloy.js (Web SDK)**: Modern Adobe Experience Platform implementation
- **Server-side**: Detects server-side Target calls
- **Hybrid implementations**: Works with mixed at.js/Alloy setups

### Network Call Detection
- **Delivery Calls**: `tt.omtrdc.net/rest/v1/delivery` endpoints
- **Interact Calls**: `/ee/or2/v1/interact` endpoints  
- **Real-time Monitoring**: Uses Chrome debugger API for accurate detection
- **Response Body Capture**: Full request/response payload analysis

### Data Export Capabilities
- **CSV Format**: Excel-compatible files with proper formatting
- **Structured Columns**: All JSON data flattened into readable columns
- **Automatic Downloads**: Files save to default download folder
- **Professional Naming**: Date-stamped filenames for organization

---

## 🎪 Demo Script

### Opening Hook (30 seconds)
*"Ever wondered what Adobe Target activities are running on your website? Or struggled to debug why a test isn't showing up? The Adobe Target Activity Inspector solves these problems instantly."*

### Problem Statement (30 seconds)
*"Traditional Adobe Target debugging requires opening DevTools, finding network calls, and parsing complex JSON responses. This is time-consuming for marketers and frustrating for developers."*

### Solution Demo (2-3 minutes)
1. **Install & Open**: *"One click install, and it works immediately on any page"*
2. **Activity Detection**: *"Instantly see all running activities - 15 detected on this page"*
3. **Detailed Analysis**: *"Click any activity for complete details - response tokens, targeting criteria, page modifications"*
4. **Excel Export**: *"Generate professional reports in one click for stakeholder sharing"*
5. **Non-Technical View**: *"Built-in explanations make the data accessible to everyone"*

### Value Proposition (30 seconds)
*"Save hours of debugging time, improve collaboration between teams, and ensure your Adobe Target implementation is working perfectly."*

---

## 🏆 Competitive Advantages

### vs. Manual DevTools Debugging
- **10x Faster**: No need to navigate complex network tabs
- **User-Friendly**: Clean interface vs. raw JSON
- **Non-Technical Accessible**: Explanations for all users
- **Export Capability**: Professional reporting built-in

### vs. Other Adobe Target Tools
- **Real-Time**: Live activity detection, not just configuration
- **Comprehensive**: Supports both at.js and Alloy.js
- **Free**: No licensing costs or enterprise requirements
- **Instant**: No setup or configuration needed

### vs. Adobe Target Debugger
- **Modern UI**: Clean, professional interface
- **Better Data Export**: Excel reports with structured data
- **Enhanced Explanations**: Non-technical parameter definitions
- **Improved Reliability**: Uses debugger API for accurate detection

---

## 📈 Use Cases

### Marketing Team
- **Campaign Verification**: "Is my holiday promotion test running correctly?"
- **Experience Validation**: "Which version of the test am I seeing?"
- **Stakeholder Reporting**: "Generate reports showing all active campaigns"

### Development Team  
- **Implementation Debugging**: "Are all Target calls firing properly?"
- **Response Analysis**: "What data is Adobe Target returning?"
- **Performance Monitoring**: "Are activities loading without errors?"

### Analytics Team
- **Data Collection**: "Export all activity data for analysis"
- **Targeting Analysis**: "What audience segments are being targeted?"
- **Performance Reporting**: "Generate comprehensive activity reports"

---

## 🎯 Call to Action

**For the Demo**: 
*"Ready to streamline your Adobe Target workflow? Install the Adobe Target Activity Inspector from the Chrome Web Store today and transform how your team works with Adobe Target."*

**Key Takeaways**:
1. **Instant Visibility** - See all Adobe Target activities immediately
2. **Professional Reports** - One-click Excel exports for stakeholders  
3. **Universal Access** - Technical and non-technical explanations
4. **Time Savings** - Eliminate manual debugging workflows
5. **Free & Easy** - No cost, no setup, works immediately

---

## 📱 Installation Instructions

1. Visit Chrome Web Store
2. Search "Adobe Target Activity Inspector"
3. Click "Add to Chrome"
4. Navigate to any webpage with Adobe Target
5. Click the extension icon in your toolbar
6. Start exploring your Adobe Target activities!

---

*Ready to revolutionize your Adobe Target debugging and analysis workflow? Get started today!*
