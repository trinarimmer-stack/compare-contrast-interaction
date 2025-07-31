// Background script for Rise Compare & Contrast Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Rise Compare & Contrast Extension installed');
  
  // Set default configuration
  chrome.storage.local.set({
    compareContrastConfig: {
      title: "Compare & Contrast",
      prompt: "Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.",
      idealResponse: "An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.",
      placeholder: "Type your response here..."
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getConfig') {
    chrome.storage.local.get(['compareContrastConfig'], (result) => {
      sendResponse(result.compareContrastConfig || {});
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'saveConfig') {
    chrome.storage.local.set({
      compareContrastConfig: request.config
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});