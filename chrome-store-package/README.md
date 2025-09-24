# Adobe Target Activity Inspector

A Chrome extension that detects and explains Adobe Target activities on websites in simple, non-technical terms.

## ✨ Features

- 🎯 **Detects Adobe Target Activities**: Automatically identifies both at.js (delivery calls) and Alloy.js (interact calls)
- 📊 **Real Activity Names**: Shows actual campaign names like "Holiday Promotion 2025" instead of generic placeholders
- 🔍 **Detailed Information**: Displays response tokens, page modifications, metrics, and more
- 📚 **Non-Technical Explanations**: Explains complex Adobe Target parameters in simple terms
- 🎨 **Clean UI**: Modern, readable interface with organized tabs and sections
- 🔄 **Live Monitoring**: Real-time detection with debugger API for accurate data
- 📊 **Excel Export**: Download detailed reports of all detected activities
- 🐛 **Built-in Support**: Report issues directly from the extension
- 🔒 **Privacy First**: All data stays in your browser - nothing sent to external servers

## 🚀 How It Works

1. **Install the extension** from the Chrome Web Store
2. **Navigate to any website** that uses Adobe Target
3. **Click the extension icon** to see detected activities
4. **Explore three tabs**:
   - **Activities**: View all detected campaigns with Excel export
   - **Details**: Deep dive into technical parameters and network calls
   - **Explanation**: Learn what everything means in simple terms
5. **Use controls**: Clear activities or reload the page to detect new ones

## 🔧 Supported Adobe Target Implementations

- ✅ **at.js** (Traditional implementation using delivery calls)
- ✅ **Alloy.js** (Modern Web SDK using interact calls)
- ✅ **Hybrid setups** (Both implementations on the same page)
- ✅ **All major versions** (at.js 1.x, 2.x and Alloy.js/Web SDK)

## 🔒 Privacy & Permissions

- **debugger**: Required to read network response bodies for accurate activity names
- **activeTab**: Only works on the current tab you're viewing
- **storage**: Saves detected activities locally in your browser
- **tabs**: Allows page reload functionality

**🛡️ Privacy Guarantee**: No data is sent to external servers - everything stays in your browser.

📄 **Privacy Policy**: [View our complete privacy policy](https://nishthagoeladobe.github.io/Target-analyzer-extension/)

## 👥 For Adobe Target Users

This extension is perfect for:
- **Marketers** who want to see what tests are running
- **QA Teams** verifying campaign implementations  
- **Developers** debugging Adobe Target activities
- **Product Managers** understanding personalization strategies
- **Anyone** curious about website personalization and A/B testing

## 📥 Installation

1. **Chrome Web Store**: Install from the [Chrome Web Store](https://chrome.google.com/webstore) (search for "Adobe Target Activity Inspector")
2. **Manual Installation** (Development):
   ```bash
   git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
   cd Target-analyzer-extension
   # Load unpacked extension in Chrome from the 'publication' folder
   ```

## 🆘 Support & Bug Reports

### Built-in Support
- **Report Issues Directly**: Use the "🐛 Report Error or Issue" section in the Explanation tab
- **Automatic Context**: Reports include your current website, browser info, and extension state
- **Direct Email**: Issues are sent directly to our support team

### Other Support Options
- **GitHub Issues**: [Create an issue](https://github.com/nishthagoeladobe/Target-analyzer-extension/issues) for feature requests or detailed bug reports
- **Email**: nishtha.venice@gmail.com for direct support

## 📊 What You Can Export

- **Activity Names & IDs**: Complete campaign information
- **Experience Details**: Which variation you're seeing
- **Response Tokens**: All targeting and segmentation data
- **Network Requests**: Full request/response data for debugging
- **Timestamps**: When activities were detected
- **Implementation Details**: at.js vs Alloy.js identification

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/nishthagoeladobe/Target-analyzer-extension.git
cd Target-analyzer-extension

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select the 'publication' folder
```

## 🆕 Recent Updates

### Version 1.0.0
- ✅ **New Report Bug Feature**: Report issues directly from the extension
- ✅ **Improved UI**: Controls moved to appropriate tabs for better UX
- ✅ **Enhanced Loading**: Better feedback when reloading pages
- ✅ **Excel Export**: Download comprehensive activity reports
- ✅ **Privacy Policy**: Hosted online for Chrome Web Store compliance
- ✅ **Production Ready**: Optimized code with minimal logging

## 🤝 Contributing

We welcome contributions from the Adobe Target community!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Keep the UI simple and user-friendly
- Maintain privacy-first approach (no external data sending)
- Test with both at.js and Alloy.js implementations
- Follow Chrome Extension best practices

---

**Made with ❤️ for the Adobe Target community** 🎯
