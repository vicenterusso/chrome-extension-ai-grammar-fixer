// Create context menu item when extension loads
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fixGrammar",
    title: "Fix Grammar with AI",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "fixGrammar") {
    const selectedText = info.selectionText;

    try {
      // Get API settings from storage
      const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey', 'model']);

      if (!settings.apiUrl) {
        // Send message to content script to show error
        await sendMessageSafely(tab.id, {
          action: "showError",
          message: "Please configure API settings in the extension popup"
        });
        return;
      }

      // Show loading indicator
      await sendMessageSafely(tab.id, {
        action: "showLoading"
      });

      // Make API call to fix grammar
      const fixedText = await fixGrammar(selectedText, settings);

      // Send fixed text back to content script
      await sendMessageSafely(tab.id, {
        action: "replaceText",
        originalText: selectedText,
        fixedText: fixedText
      });

    } catch (error) {
      console.error('Error fixing grammar:', error);
      await sendMessageSafely(tab.id, {
        action: "showError",
        message: "Error fixing grammar: " + error.message
      });
    }
  }
});

// Function to call LLM API
async function fixGrammar(text, settings) {
  const { apiUrl, apiKey, model } = settings;

  // Example for OpenAI-compatible APIs
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a grammar correction assistant. Fix any grammatical errors in the provided text while preserving the original meaning and style. Return only the corrected text without explanations.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Alternative function for other LLM APIs (like Anthropic Claude)
async function fixGrammarClaude(text, settings) {
  const { apiUrl, apiKey, model } = settings;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Please fix any grammatical errors in this text while preserving the original meaning and style. Return only the corrected text without explanations:\n\n${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

// Safe message sending function with error handling
async function sendMessageSafely(tabId, message) {
  try {
    // First check if the tab exists and is valid
    const tab = await chrome.tabs.get(tabId);
    
    // Check if the tab URL allows content scripts
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      console.warn('Cannot inject content script into restricted page:', tab.url);
      
      // Show notification using chrome.notifications API as fallback
      if (message.action === "showError") {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          title: 'Grammar Fixer',
          message: message.message
        });
      }
      return;
    }

    // Try to send the message
    await chrome.tabs.sendMessage(tabId, message);
    
  } catch (error) {
    console.warn('Failed to send message to content script:', error);
    
    // Fallback: try to inject content script and then send message
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      
      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try sending the message again
      await chrome.tabs.sendMessage(tabId, message);
      
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
      
      // Final fallback: show browser notification for errors
      if (message.action === "showError") {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          title: 'Grammar Fixer Error',
          message: message.message
        });
      }
    }
  }
}
