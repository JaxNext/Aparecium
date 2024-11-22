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
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      chrome.runtime.sendMessage({ 
        type: 'textSelected', 
        text: selectedText 
      });
    }
  });
}
