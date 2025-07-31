// Store the current selection for replacement
let currentSelection = null;
let currentRange = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "replaceText":
      replaceSelectedText(message.originalText, message.fixedText);
      hideNotification();
      break;
    case "showError":
      showNotification(message.message, 'error');
      break;
    case "showLoading":
      showNotification('Fixing grammar...', 'loading');
      break;
  }
});

// Capture selection when context menu might be used
document.addEventListener('contextmenu', (e) => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    currentSelection = selection.toString();
    currentRange = selection.getRangeAt(0).cloneRange();
  }
});

// Function to replace selected text
function replaceSelectedText(originalText, fixedText) {
  if (!currentRange || !currentSelection) {
    console.warn('No selection range available');
    return;
  }

  try {
    // Clear current selection
    window.getSelection().removeAllRanges();

    // Add back our stored range
    window.getSelection().addRange(currentRange);

    // Check if we're in an input field or textarea
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      replaceInInputField(activeElement, originalText, fixedText);
    } else {
      // Replace in regular text content
      replaceInTextNode(fixedText);
    }

    // Clear stored selection
    currentSelection = null;
    currentRange = null;

  } catch (error) {
    console.error('Error replacing text:', error);
    showNotification('Error replacing text: ' + error.message, 'error');
  }
}

// Replace text in input fields or textareas
function replaceInInputField(element, originalText, fixedText) {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const value = element.value;

  // Replace the selected text
  const newValue = value.substring(0, start) + fixedText + value.substring(end);
  element.value = newValue;

  // Set cursor position after the replaced text
  const newCursorPos = start + fixedText.length;
  element.setSelectionRange(newCursorPos, newCursorPos);

  // Trigger input event to notify any listeners
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Replace text in regular text nodes
function replaceInTextNode(fixedText) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // Create a text node with the fixed text
  const textNode = document.createTextNode(fixedText);

  // Replace the selected content
  range.deleteContents();
  range.insertNode(textNode);

  // Position cursor after the inserted text
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notification
  hideNotification();

  const notification = document.createElement('div');
  notification.id = 'grammar-fixer-notification';
  notification.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${type === 'error' ? '#ff4444' : type === 'loading' ? '#007cba' : '#4CAF50'};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  max-width: 300px;
  word-wrap: break-word;
  animation: slideIn 0.3s ease-out;
  `;

  // Add loading spinner for loading state
  if (type === 'loading') {
    const spinner = document.createElement('span');
    spinner.style.cssText = `
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
    `;
    notification.appendChild(spinner);
  }

  notification.appendChild(document.createTextNode(message));

  // Add CSS animations
  if (!document.getElementById('grammar-fixer-styles')) {
    const styles = document.createElement('style');
    styles.id = 'grammar-fixer-styles';
    styles.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(notification);

  // Auto-hide non-loading notifications after 3 seconds
  if (type !== 'loading') {
    setTimeout(hideNotification, 3000);
  }
}

function hideNotification() {
  const notification = document.getElementById('grammar-fixer-notification');
  if (notification) {
    notification.remove();
  }
}
