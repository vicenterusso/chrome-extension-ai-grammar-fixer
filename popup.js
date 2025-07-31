// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey', 'model']);

  if (settings.apiUrl) document.getElementById('apiUrl').value = settings.apiUrl;
  if (settings.apiKey) document.getElementById('apiKey').value = settings.apiKey;
  if (settings.model) document.getElementById('model').value = settings.model;
});

// Preset configurations
const presets = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo'
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229'
  },
  local: {
    url: 'http://localhost:1234/v1/chat/completions',
    model: ''
  }
};

// Handle preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = presets[btn.dataset.preset];
    document.getElementById('apiUrl').value = preset.url;
    document.getElementById('model').value = preset.model;
  });
});

// Save settings
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const apiUrl = document.getElementById('apiUrl').value;
  const apiKey = document.getElementById('apiKey').value;
  const model = document.getElementById('model').value;

  try {
    await chrome.storage.sync.set({
      apiUrl: apiUrl,
      apiKey: apiKey,
      model: model || ''
    });

    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
});

// Test API connection
document.getElementById('testBtn').addEventListener('click', async () => {
  const apiUrl = document.getElementById('apiUrl').value;
  const apiKey = document.getElementById('apiKey').value;
  const model = document.getElementById('model').value;

  if (!apiUrl || !apiKey) {
    showStatus('Please enter API URL and key first', 'error');
    return;
  }

  showStatus('Testing connection...', 'info');

  try {
    const testResult = await testApiConnection(apiUrl, apiKey, model);
    showStatus('✓ Connection successful! Response: ' + testResult.substring(0, 50) + '...', 'success');
  } catch (error) {
    showStatus('✗ Connection failed: ' + error.message, 'error');
  }
});

// Test API connection function
async function testApiConnection(apiUrl, apiKey, model) {
  const testText = "This are a test sentence with grammar error.";

  // Determine API type based on URL
  const isAnthropic = apiUrl.includes('anthropic');
  const isOpenAI = apiUrl.includes('openai') || !isAnthropic;

  let requestBody, headers;

  if (isAnthropic) {
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    requestBody = {
      model: model || 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Fix grammar: ${testText}`
        }
      ]
    };
  } else {
    // OpenAI-compatible
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    requestBody = {
      model: model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Fix grammar: ${testText}`
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
  }

  const data = await response.json();

  if (isAnthropic) {
    return data.content[0].text;
  } else {
    return data.choices[0].message.content;
  }
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}
