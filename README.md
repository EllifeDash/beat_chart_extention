# BeatChart - بیٹ چارٹ

A modern Chrome extension for quickly searching and viewing police beat chart information in Urdu.

## Features

- **Smart Search**: Search by village name, beat, or officer with debounced input for smooth performance
- **Filter Tabs**: Quickly filter results by All, Beat, Officers, or Villages
- **Dark Mode**: Toggle between light and dark themes (auto-detects system preference)
- **Copy to Clipboard**: One-click copy of beat information with visual feedback
- **Recent Searches**: Access your recent searches with clickable tags
- **Search Highlighting**: Matching villages are highlighted in search results
- **Export Data**: Download filtered or complete beat chart data as JSON
- **Responsive Design**: Clean card-based UI optimized for popup window

## Installation

### From Source

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `beat_chart_extention` folder
6. The extension icon will appear in your browser toolbar

### Updating

1. Navigate to `chrome://extensions/`
2. Click the **Refresh** icon on the BeatChart extension card
3. Or remove and re-add the extension

## Usage

1. Click the BeatChart icon in your browser toolbar to open the popup
2. Use the search bar to find villages, beats, or officers
3. Use filter tabs to narrow your search scope
4. Click the **کاپی** (Copy) button on any beat card to copy information
5. Click **ایکسپورٹ** (Export) to download data as JSON
6. Toggle dark mode with the moon icon in the header

## Keyboard Shortcuts

- **Escape**: Clear search and reset view

## File Structure

```
beat_chart_extention/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html             # Main popup interface
├── popup.css              # Styles with dark mode support
├── popup.js               # Application logic (ES6 class-based)
├── beat_chart.json        # Beat chart data (Urdu)
└── Icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Data Format

The `beat_chart.json` file contains an array of beat objects:

```json
[
  {
    "beat": "بیٹ نام",
    "officers": ["افسر 1", "افسر 2"],
    "village": ["گاؤں 1", "گاؤں 2"]
  }
]
```

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `clipboardWrite` (for copy functionality)
- **Storage**: Uses `localStorage` for theme preference and recent searches
- **No external dependencies**: Pure HTML, CSS, and JavaScript

## Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers (Opera, Brave, Vivaldi)

## License

MIT
