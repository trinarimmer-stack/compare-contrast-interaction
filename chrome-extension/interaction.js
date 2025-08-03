// Compare & Contrast Interactive Component
// This script provides the full functionality when the course is previewed or published

(function() {
  'use strict';

  // React-like state management for vanilla JS
  function createInteraction(container, config = {}) {
    const defaultConfig = {
      title: "Compare & Contrast",
      prompt: "Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.",
      idealResponse: "An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.",
      placeholder: "Type your response here..."
    };

    const finalConfig = { ...defaultConfig, ...config };
    
    let state = {
      userResponse: "",
      isComparing: false
    };

    function setState(newState) {
      state = { ...state, ...newState };
      render();
    }

    function render() {
      const html = `
        <div class="compare-contrast-live">
          <div class="interaction-header">
            <div class="header-card">
              <h1 class="header-title">📝 Interactive Learning Activity</h1>
              <p class="header-description">Ready to test your knowledge? Complete the prompt below and compare your response with the expert answer.</p>
              <div class="header-tip">
                <span>💡 Tip: Take your time to think through your answer before comparing</span>
              </div>
            </div>
          </div>
          
          <div class="interaction-card">
            <h2 class="interaction-title">${finalConfig.title}</h2>
            <p class="interaction-prompt">${finalConfig.prompt}</p>
            
            ${!state.isComparing ? `
              <div class="input-section">
                <textarea 
                  class="response-textarea" 
                  rows="6" 
                  placeholder="${finalConfig.placeholder}"
                  id="user-response"
                >${state.userResponse}</textarea>
                <div class="button-container">
                  <button 
                    class="compare-btn ${!state.userResponse.trim() ? 'disabled' : ''}"
                    id="compare-button"
                    ${!state.userResponse.trim() ? 'disabled' : ''}
                  >
                    Compare Responses
                  </button>
                </div>
              </div>
            ` : `
              <div class="comparison-section">
                <div class="comparison-header">
                  <span class="success-indicator">✓ Responses compared</span>
                </div>
                
                <div class="responses-grid">
                  <div class="response-card user-response">
                    <div class="response-badge user-badge">Your Response</div>
                    <p class="response-text">${state.userResponse}</p>
                  </div>
                  
                  <div class="response-card ideal-response">
                    <div class="response-badge ideal-badge">Ideal Response</div>
                    <p class="response-text">${finalConfig.idealResponse}</p>
                  </div>
                </div>
                
                <div class="reset-container">
                  <button class="reset-btn" id="reset-button">
                    ↻ Try Again
                  </button>
                </div>
              </div>
            `}
          </div>
        </div>
      `;

      container.innerHTML = html;
      attachEventListeners();
    }

    function attachEventListeners() {
      const textarea = container.querySelector('#user-response');
      const compareBtn = container.querySelector('#compare-button');
      const resetBtn = container.querySelector('#reset-button');

      if (textarea) {
        textarea.addEventListener('input', (e) => {
          setState({ userResponse: e.target.value });
        });
      }

      if (compareBtn) {
        compareBtn.addEventListener('click', () => {
          if (state.userResponse.trim()) {
            setState({ isComparing: true });
          }
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          setState({ userResponse: "", isComparing: false });
        });
      }
    }

    // Initial render
    render();
  }

  // Auto-initialize any compare-contrast interactions on the page
  function initializeInteractions() {
    const interactions = document.querySelectorAll('[data-interaction-type="compare-contrast"]');
    
    interactions.forEach((element) => {
      // Check if already initialized
      if (element.dataset.initialized) return;
      
      let config = {};
      
      // Try to get configuration from element's data attribute first
      if (element.dataset.config) {
        try {
          config = JSON.parse(element.dataset.config);
          console.log('[Compare & Contrast] Using element config:', config);
        } catch (e) {
          console.log('[Compare & Contrast] Error parsing element config:', e);
        }
      }
      
      // Fallback to chrome storage (extension context)
      if (Object.keys(config).length === 0 && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['compareContrastConfig'], (result) => {
          const storageConfig = result.compareContrastConfig || {};
          const finalConfig = { ...config, ...storageConfig };
          console.log('[Compare & Contrast] Using storage config:', finalConfig);
          createInteraction(element, finalConfig);
          element.dataset.initialized = 'true';
        });
        return; // Exit early since this is async
      }
      
      // Fallback to window config (page context)
      if (Object.keys(config).length === 0) {
        config = window.compareContrastConfig || {};
        console.log('[Compare & Contrast] Using window config:', config);
      }
      
      // Initialize with whatever config we have
      console.log('[Compare & Contrast] Initializing with config:', config);
      createInteraction(element, config);
      element.dataset.initialized = 'true';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInteractions);
  } else {
    initializeInteractions();
  }

  // Also watch for dynamically added interactions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.dataset && node.dataset.interactionType === 'compare-contrast') {
            initializeInteractions();
          } else if (node.querySelector && node.querySelector('[data-interaction-type="compare-contrast"]')) {
            initializeInteractions();
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();