# Grammar Fixer Chrome Extension

A Chrome extension that adds AI-powered grammar correction to any website via right-click context menu.

## Features

- **Universal**: Works on any website
- **Context Menu Integration**: Right-click selected text to fix grammar
- **Multiple LLM Support**: Works with OpenAI, Anthropic Claude, local LLMs, and other compatible APIs
- **Smart Text Replacement**: Handles both regular text and input fields (textareas, input boxes)
- **Visual Feedback**: Shows loading states and error messages
- **Secure**: API keys stored locally in your browser

## Installation

1. **Download/Clone** this extension to a folder on your computer

2. **Open Chrome Extensions Page**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**:
   - Click "Load unpacked"
   - Select the folder containing the extension files

4. **Configure API Settings**:
   - Click the extension icon in the toolbar
   - Enter your API URL and API key
   - Test the connection
   - Save settings

## Configuration

### Supported APIs

#### OpenAI
- **URL**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-3.5-turbo` or `gpt-4`
- **API Key**: Get from [OpenAI Dashboard](https://platform.openai.com/api-keys)

#### Anthropic Claude
- **URL**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-3-sonnet-20240229` or `claude-3-opus-20240229`
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

#### Local LLMs (LM Studio, Ollama, etc.)
- **URL**: `http://localhost:1234/v1/chat/completions` (adjust port as needed)
- **Model**: Your local model name
- **API Key**: Usually not required for local setups (enter any value)

## Usage

1. **Select Text**: Highlight any text on any website
2. **Right-Click**: Open the context menu
3. **Choose "Fix Grammar with AI"**: Click the menu item
4. **Wait**: The extension will call your configured LLM
5. **Text Replaced**: The selected text will be replaced with the corrected version

## File Structure

```
grammar-fixer-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles API calls)
├── content.js            # Content script (handles text replacement)
├── popup.html            # Settings popup UI
├── popup.js              # Settings popup logic
└── README.md             # This file
```

## How It Works

1. **Context Menu**: Created in `background.js` when extension loads
2. **Text Selection**: Captured in `content.js` when right-clicking
3. **API Call**: Made in `background.js` with your configured LLM
4. **Text Replacement**: Handled in `content.js` for both regular text and input fields
5. **Feedback**: Visual notifications show loading states and errors

## Customization

You can modify the grammar correction prompt in `background.js`:

```javascript
// In the fixGrammar function, modify this system message:
{
  role: 'system',
  content: 'Your custom prompt here...'
}
```

## Privacy & Security

- API keys are stored locally in Chrome's sync storage
- No data is sent to any servers except your configured LLM API
- The extension only activates when you explicitly use the context menu
- All network requests are made directly to your chosen API

## Troubleshooting

### "Please configure API settings" Error
- Click the extension icon and enter your API URL and key
- Use the "Test" button to verify your configuration

### "API request failed" Error
- Check your API key is valid and has sufficient credits/quota
- Verify the API URL is correct for your chosen service
- For local LLMs, ensure the server is running

### Text Not Replacing
- Make sure you have text selected when right-clicking
- Some websites may prevent text modification (rare)
- Try refreshing the page and trying again

### Rate Limiting
- Most APIs have rate limits; wait a moment before retrying
- Consider upgrading your API plan for higher limits

## Development

To modify or extend the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension card
4. Test your changes

## License

This extension is for personal use. Make sure to comply with your chosen LLM provider's terms of service.
