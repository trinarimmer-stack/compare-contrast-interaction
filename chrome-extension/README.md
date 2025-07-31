# Rise Compare & Contrast Chrome Extension

A Chrome extension that adds custom Compare & Contrast interactive blocks to Articulate Rise courses.

## 🚀 Features

- **Seamless Integration**: Adds "Compare & Contrast" block directly to Rise's authoring interface
- **No External Dependencies**: Works entirely within Rise - no iframes or external links needed
- **Fully Customizable**: Configure prompts, ideal responses, and placeholder text
- **Professional UI**: Matches Rise's design language and user experience
- **Easy Installation**: Simple Chrome extension installation process

## 📦 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
*Extension will be published to the Chrome Web Store*

### Option 2: Install Locally (Developer Mode)

1. **Download the Extension**
   - Download or clone this repository
   - Extract the `chrome-extension` folder

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in your Chrome toolbar
   - Find "Rise Compare & Contrast Block" and click the pin icon

## 🎯 How to Use

### In Rise Authoring Interface:

1. **Navigate to your Rise course**
   - Open any Articulate Rise course in edit mode

2. **Add the Block**
   - Look for the "Compare & Contrast" option in the block menu
   - Click to add it to your course content

3. **Configure the Content**
   - Click the ⚙️ Configure button on the block
   - Set your custom:
     - Title
     - Prompt question
     - Ideal response
     - Placeholder text

4. **Preview/Publish**
   - The interaction will be fully functional in preview and published courses
   - Students can type responses and compare with the ideal answer

### Extension Configuration:

1. **Click the Extension Icon**
   - Use the popup to set default configurations
   - These defaults will apply to new blocks you create

2. **Individual Block Settings**
   - Each block can be customized independently
   - Use the Configure button on each block

## 🛠️ Technical Details

### Files Structure:
```
chrome-extension/
├── manifest.json          # Extension configuration
├── content-script.js      # Injects into Rise interface
├── background.js          # Extension background services
├── interaction.js         # Interactive component logic
├── styles.css            # All extension styling
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons (16px, 48px, 128px)
└── README.md             # This file
```

### Compatibility:
- **Chrome**: Version 88+
- **Rise**: All current versions on articulate.com
- **Devices**: Desktop and tablet (mobile responsive)

### Permissions:
- `activeTab`: To interact with Rise pages
- `storage`: To save configuration settings
- `host_permissions`: Access to articulate.com and rise.com domains

## 🎨 Customization

### Default Configuration:
Set default values for all new blocks through the extension popup.

### Per-Block Configuration:
Each block can have unique:
- Custom prompts and instructions
- Tailored ideal responses
- Specific placeholder text
- Unique titles

### Styling:
The extension automatically matches Rise's design system and supports both light and dark themes.

## 🔧 Development

### Local Development:
1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Reload any open Rise pages to see changes

### Publishing:
To publish to Chrome Web Store:
1. Create a Developer Account
2. Upload the extension package
3. Complete store listing and privacy details
4. Submit for review

## 📋 Roadmap

- [ ] Chrome Web Store publication
- [ ] Additional interaction types (drag & drop, matching, etc.)
- [ ] Advanced analytics and reporting
- [ ] Bulk configuration import/export
- [ ] Integration with Rise templates

## 🐛 Troubleshooting

### Extension Not Working:
1. Ensure you're on articulate.com or rise.com
2. Refresh the page after installing
3. Check that Developer Mode is enabled (for local installation)

### Block Not Appearing:
1. Wait a few seconds for Rise to fully load
2. Try refreshing the Rise page
3. Check the browser console for any errors

### Configuration Not Saving:
1. Ensure the extension has storage permissions
2. Try refreshing and reconfiguring
3. Check for any browser storage limitations

## 📞 Support

For issues, feature requests, or contributions:
- Create an issue on GitHub
- Email: your-email@example.com
- Documentation: [Link to full docs]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the instructional design community
- Inspired by tools like Mighty Maestro
- Designed to enhance Articulate Rise's capabilities

---

**Made with ❤️ for instructional designers everywhere**