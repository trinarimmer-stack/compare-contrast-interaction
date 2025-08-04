// Compare & Contrast Interactive Component
// This script provides the full functionality when the course is previewed or published

(function() {
  'use strict';

  // React-like state management for vanilla JS
  function createInteraction(container, config = {}) {
    const defaultConfig = {
      title: "Compare & Contrast",
      activityInstructions: "It's time to reflect on the last SME conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to Julie's recommended approach.",
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
              <h1 class="header-title">📝 Compare and Contrast</h1>
              <p class="header-description">${finalConfig.activityInstructions}</p>
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
                    class="compare-btn"
                    id="compare-button"
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
        // Ensure textarea is focusable and not blocked by overlays
        textarea.style.pointerEvents = 'auto';
        textarea.style.position = 'relative';
        textarea.style.zIndex = '10';
        textarea.disabled = false;
        textarea.readOnly = false;
        
        // Remove any existing listeners to prevent conflicts
        textarea.removeEventListener('input', handleTextareaChange);
        textarea.addEventListener('input', handleTextareaChange);
        
        // Also listen for other input events that might be interfered with
        textarea.addEventListener('keyup', handleTextareaChange);
        textarea.addEventListener('paste', (e) => {
          setTimeout(() => handleTextareaChange(e), 10);
        });
      }

      if (compareBtn && !compareBtn.hasAttribute('data-listener-added')) {
        compareBtn.addEventListener('click', handleCompareClick);
        compareBtn.setAttribute('data-listener-added', 'true');
      }

      if (resetBtn && !resetBtn.hasAttribute('data-listener-added')) {
        resetBtn.addEventListener('click', handleResetClick);
        resetBtn.setAttribute('data-listener-added', 'true');
      }
    }

    function handleTextareaChange(e) {
      // Update state without triggering re-render to preserve focus
      state.userResponse = e.target.value;
      
      // Update button state based on content
      const compareBtn = container.querySelector('#compare-button');
      if (compareBtn) {
        const hasText = state.userResponse.trim();
        compareBtn.disabled = !hasText;
        compareBtn.style.opacity = hasText ? '1' : '0.5';
        compareBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
        compareBtn.style.backgroundColor = hasText ? '#0066cc' : '#cccccc';
      }
    }

    function handleCompareClick() {
      if (state.userResponse.trim()) {
        setState({ isComparing: true });
      }
    }

    function handleResetClick() {
      setState({ userResponse: "", isComparing: false });
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
      
      // Try to get configuration from element's base64 data attribute first
      if (element.dataset.configBase64) {
        try {
          const decodedConfig = atob(element.dataset.configBase64);
          config = JSON.parse(decodedConfig);
          console.log('[Compare & Contrast] Using base64 element config:', config);
        } catch (e) {
          console.log('[Compare & Contrast] Error parsing base64 element config:', e);
        }
      }
      
      // Fallback: Try to get configuration from element's data attribute
      if (Object.keys(config).length === 0 && element.dataset.config) {
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

  // Export initialization function for external access
  window.initializeCompareContrastInteraction = function(element) {
    if (element && !element.dataset.initialized) {
      try {
        let config = {};
        
        // Try to get configuration from element's base64 data attribute first
        if (element.dataset.configBase64) {
          try {
            const decodedConfig = atob(element.dataset.configBase64);
            config = JSON.parse(decodedConfig);
            console.log('[Compare & Contrast] External init using base64 config:', config);
          } catch (e) {
            console.log('[Compare & Contrast] Error parsing base64 config in external init:', e);
          }
        }
        
        // Fallback to element config or window config
        if (Object.keys(config).length === 0) {
          config = element.dataset.config ? JSON.parse(element.dataset.config) : (window.compareContrastConfig || {});
        }
        
        createInteraction(element, config);
        element.dataset.initialized = 'true';
        console.log('[Compare & Contrast] External initialization successful');
      } catch (error) {
        console.error('[Compare & Contrast] External initialization failed:', error);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInteractions);
  } else {
    initializeInteractions();
  }

  // Enhanced observer for dynamically added interactions
  const observer = new MutationObserver((mutations) => {
    let shouldInitialize = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node itself is an interaction
          if (node.dataset && node.dataset.interactionType === 'compare-contrast') {
            shouldInitialize = true;
          }
          // Check if the node contains interactions
          else if (node.querySelector && node.querySelector('[data-interaction-type="compare-contrast"]')) {
            shouldInitialize = true;
          }
          // Also check for class-based selectors that might be used
          else if (node.classList && node.classList.contains('compare-contrast-interaction')) {
            shouldInitialize = true;
          }
          else if (node.querySelector && node.querySelector('.compare-contrast-interaction')) {
            shouldInitialize = true;
          }
        }
      });
    });
    
    if (shouldInitialize) {
      // Small delay to ensure DOM is fully updated
      setTimeout(initializeInteractions, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();