# Adobe Target Inspector - Installation Instructions for Testers

**Thank you for testing the Adobe Target Inspector extension!**

This is a pre-release version for testing purposes.

---

## Quick Install (5 minutes)

### Step 1: Extract the Files
1. Download the `adobe-target-inspector-test.zip` file
2. Extract it to a folder on your computer (e.g., `Desktop/adobe-target-inspector`)
3. Remember this folder location - you'll need it in Step 3

### Step 2: Enable Developer Mode in Chrome
1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Look for the **"Developer mode"** toggle in the top-right corner
4. Turn it **ON** (it should turn blue)

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button (appears after enabling Developer mode)
2. Navigate to and select the folder where you extracted the files
3. Click **"Select"** or **"Open"**

### Step 4: Verify Installation
1. You should see **"Adobe Target Inspector"** in your extensions list
2. Look for the extension icon in your Chrome toolbar (top-right)
3. If you don't see it, click the puzzle piece icon and pin it

✅ **Installation Complete!**

---

## How to Use

### 1. Open the Extension
- Click the Adobe Target Inspector icon in your toolbar
- The extension popup will appear

### 2. Test Basic Features

**Activities Tab:**
1. Navigate to a webpage with Adobe Target
2. Click **"Scan for Activities"**
3. It should detect and display any Target activities on the page

**Performance Tab:**
1. Click **"Refresh Metrics"** for basic page metrics
2. Or go to Activities tab first, scan, then click **"Analyze Target Performance"**

**Snippet Test Tab:**
1. Best used after scanning activities
2. Click **"Test Prehiding Snippet Impact"** from Activities tab
3. Wait for the test to complete (two page reloads)
4. Review the performance comparison

### 3. View Console Logs (Optional)
- Press **F12** to open DevTools
- Go to **Console** tab
- You'll see detailed logs from the extension (useful for debugging)

---

## Testing Checklist

Please test these scenarios and report any issues:

### Basic Functionality
- [ ] Extension icon appears in toolbar
- [ ] Popup opens when clicking the icon
- [ ] All three tabs are accessible and load correctly
- [ ] No errors in console (F12 → Console tab)

### Activities Detection
- [ ] "Scan for Activities" button works
- [ ] Detects activities on Target-enabled pages
- [ ] Shows activity names, experiences, and details
- [ ] Works on your company's website

### Performance Analysis
- [ ] Basic metrics display (FCP, page load, etc.)
- [ ] Can analyze Target performance from Activities tab
- [ ] Timing data appears accurate

### Snippet Test
- [ ] Test completes both phases (WITH/WITHOUT snippet)
- [ ] Results display correctly
- [ ] Shows appropriate messages when no activities are present
- [ ] Handles pages with and without existing snippets

### Browser Compatibility
- [ ] Works on latest Chrome version
- [ ] No visual glitches or UI issues

---

## Known Behaviors

These are **expected** and not bugs:

1. **"Developer mode" warning**: Chrome will show a banner saying "Disable developer mode extensions". This is normal for test versions. You can ignore it.

2. **No auto-updates**: This test version won't auto-update. I'll send you new versions as needed.

3. **Console logs**: The extension logs detailed information to the console. This is intentional for debugging.

4. **"No Activity" messages**: If a page has no Target activities, the extension will correctly show "No Activity" rather than fake data.

---

## Reporting Issues

If you encounter problems, please include:

1. **What page were you testing?** (URL)
2. **What were you doing?** (Which feature/button)
3. **What happened?** (Describe the issue)
4. **What did you expect to happen?**
5. **Screenshots** (if applicable)
6. **Console errors** (Press F12, check Console tab, copy any red errors)
7. **Your browser version** (Chrome → Settings → About Chrome)

**Send feedback to:** [Your email or feedback channel]

---

## Uninstalling (If Needed)

1. Go to `chrome://extensions/`
2. Find "Adobe Target Inspector"
3. Click **"Remove"**
4. Confirm

---

## Privacy & Security

- ✅ This extension only runs when you open it
- ✅ It only reads Adobe Target data from the current page
- ✅ No data is sent to external servers
- ✅ All processing happens locally in your browser
- ✅ Full privacy policy included in the extension folder

---

## Tips for Best Results

1. **Test on real Target-enabled pages**: The extension works best on pages with active Adobe Target implementations

2. **Clear cache before Snippet Test**: For accurate results, clear your browser cache before running the prehiding snippet test

3. **Check console for details**: Press F12 and look at the Console for detailed logs about what the extension is doing

4. **Reload after errors**: If something doesn't work, try reloading the page and trying again

---

## Technical Details (Optional)

**Extension Capabilities:**
- Detects both at.js (legacy) and Alloy.js (Web SDK) implementations
- Analyzes network calls using Chrome Debugger API
- Measures real browser performance metrics
- Tests prehiding snippet impact with live page reloads

**Supported Adobe Technologies:**
- Adobe Target at.js
- Adobe Experience Platform Web SDK (Alloy.js)
- Adobe Launch (tag management)
- Tealium (tag management)

---

## Version Information

- **Version**: 1.0.4 (Test Build)
- **Type**: Unpacked Extension (Developer Mode)
- **Status**: Pre-release / Beta Testing
- **Chrome Version Required**: Chrome 88+

---

## Questions?

Contact: [Your contact information]

**Thank you for helping test this extension!** Your feedback is invaluable. 🙏

---

## Next Steps After Testing

Once testing is complete and we've incorporated your feedback:
1. I'll publish the extension to the Chrome Web Store
2. You'll be able to install it normally (no Developer mode needed)
3. It will auto-update when new versions are released
4. You'll be credited as a beta tester (if you'd like)!

