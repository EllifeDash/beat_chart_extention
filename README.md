# BeatChart - بیٹ چارٹ

A modern Chrome extension for managing police beat chart information in Urdu with full CRUD capabilities.

## Features

- **CRUD Operations**: Create, read, update, and delete beat entries directly from the popup
- **Smart Search**: Search by village name, beat, or officer with real-time filtering
- **Filter Tabs**: Dedicated views for All, Beats, Officers, or Villages
  - **سب (All)**: Full beat cards with officers and villages
  - **بیٹ (Beat)**: Simple list of beat names with counts
  - **افسران (Officers)**: Flat list of all officers with name, beat, phone, and CNIC
  - **گاؤں (Villages)**: Flat list of all villages with parent beat
- **Dark Mode**: Toggle between light and dark themes (auto-detects system preference)
- **Copy to Clipboard**: One-click copy of officer info with visual feedback
- **Search Highlighting**: Matching terms are highlighted in search results
- **Import/Export**: Import JSON data (merge or overwrite) and export filtered or complete data
- **Persistent Storage**: All data saved to `chrome.storage.local`
- **Responsive Design**: Clean UI optimized for extension popup window

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

### Viewing Data

1. Click the BeatChart icon in your browser toolbar to open the popup
2. Use the search bar to filter results
3. Switch between filter tabs for different views:
   - **سب**: Full cards with all details
   - **بیٹ**: Quick list of beats
   - **افسران**: Officer directory with copy support
   - **گاؤں**: Village list with beat references

### Managing Data

- **Add Beat**: Click the `+` button in the header to open the create form
  - Enter beat name
  - Add officers with name, phone, and CNIC fields
  - Add villages one by one
  - Click **محفوظ کریں** (Save) to persist
- **Edit Beat**: Click the edit icon (pencil) on any entry to modify
- **Delete Beat**: Click the delete icon (trash) and confirm removal
- **Import**: Click **امپورٹ** (Import) in footer to load a JSON file
  - If data exists, choose **OK** to merge or **Cancel** to overwrite
- **Export**: Click **ایکسپورٹ** (Export) to download current view as JSON

### Keyboard Shortcuts

- **Escape**: Clear search or close modal

## File Structure

```
beat_chart_extention/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html             # Main popup interface with modal
├── popup.css              # Styles with dark mode and modal support
├── popup.js               # Application logic with CRUD operations
├── beat_chart.json        # Initial seed data (Urdu)
└── Icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Data Format

### Stored Format

Data in `chrome.storage.local` uses structured officer objects:

```json
[
  {
    "beat": "بیٹ نام",
    "officers": [
      {
        "name": "افسر کا نام",
        "contact": "03001234567",
        "cnic": "35201-1234567-1"
      }
    ],
    "village": ["گاؤں 1", "گاؤں 2"]
  }
]
```

### Seed Data Format

The `beat_chart.json` file supports both string and object officer formats for backward compatibility:

```json
[
  {
    "beat": "بیٹ نام",
    "officers": ["افسر 1", "افسر 2 - 03001234567 - 35201-1234567-1"],
    "village": ["گاؤں 1", "گاؤں 2"]
  }
]
```

String officers are automatically parsed into name/contact/CNIC on first load.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `storage` (for persistent data and theme)
- **Storage**: Uses `chrome.storage.local` for all beat data and theme preference
- **No external dependencies**: Pure HTML, CSS, and JavaScript

## Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers (Opera, Brave, Vivaldi)

## License

MIT
