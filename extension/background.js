chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for text selection changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Get the tab info to check URL
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // Skip chrome:// URLs
    if (tab.url?.startsWith('chrome://')) return;

    chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      function: injectSelectionListener,
    }).catch((err) => console.error('Failed to inject selection listener:', err));
  });
});

// Function to inject into the page
function injectSelectionListener() {
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString()) return;
    
    const selectedText = selection.toString();
    
    // Get the containing element's text
    const container = selection.anchorNode?.parentElement;
    
    const fullText = container?.textContent || '';
    let beforeText = '';
    let afterText = '';
    if (fullText) {
      const selectionStart = fullText?.indexOf?.(selectedText);
      
      if (selectionStart === -1) return;
      
      // Get words before and after
      const halfLength = 20;
      beforeText = fullText.slice(0, selectionStart).split(/\s+/).slice(-halfLength).join(' ');
      afterText = fullText.slice(selectionStart + selectedText.length).split(/\s+/).slice(0, halfLength).join(' ');
    };
    chrome.runtime.sendMessage({ 
      type: 'textSelected',
      text: selectedText,
      context: {
        before: beforeText,
        after: afterText
      }
    });
  });
}
