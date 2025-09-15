# Adobe Target Activity Inspector

A Chrome extension that detects and explains Adobe Target activities on websites in simple, non-technical terms.

## Features

- 🎯 **Detects Adobe Target Activities**: Automatically identifies both at.js (delivery calls) and Alloy.js (interact calls)
- 📊 **Real Activity Names**: Shows actual campaign names like "Holiday Promotion 2025" instead of generic placeholders
- 🔍 **Detailed Information**: Displays response tokens, page modifications, metrics, and more
- 📚 **Non-Technical Explanations**: Explains complex Adobe Target parameters in simple terms
- 🎨 **Clean UI**: Modern, readable interface with organized tabs and sections
- 🔄 **Live Monitoring**: Real-time detection with debugger API for accurate data

## How It Works

1. **Install the extension** from the Chrome Web Store
2. **Navigate to any website** that uses Adobe Target
3. **Click the extension icon** to see detected activities
4. **View Details** to see technical parameters
5. **Read Explanations** to understand what everything means

## Supported Adobe Target Implementations

- ✅ **at.js** (Traditional implementation using delivery calls)
- ✅ **Alloy.js** (Modern Web SDK using interact calls)

## Privacy & Permissions

- **debugger**: Required to read network response bodies for accurate activity names
- **activeTab**: Only works on the current tab you're viewing
- **storage**: Saves detected activities locally in your browser
- **tabs**: Allows page reload functionality

**No data is sent to external servers - everything stays in your browser.**

## For Adobe Target Users

This extension is perfect for:
- **Marketers** who want to see what tests are running
- **QA Teams** verifying campaign implementations
- **Developers** debugging Adobe Target activities
- **Anyone** curious about website personalization

## Installation

Install from the Chrome Web Store: [Link will be added after publication]

## Support

If you encounter issues or have questions, please create an issue on our GitHub repository.

---

**Made for the Adobe Target community** 🎯
