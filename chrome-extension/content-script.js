// Rise Compare & Contrast Extension - Content Script v2.1
// All modules bundled for Chrome extension compatibility
console.log('Content script version 2.1 loaded - no error throwing waitForRise');

// ========= DOM UTILS MODULE =========
class DOMUtils {
  static createElement(tagName, className = null, textContent = null) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static addEventListenerSafe(element, event, handler) {
    if (element && typeof handler === 'function') {
      element.addEventListener(event, handler);
    }
  }

  static removeEventListenerSafe(element, event, handler) {
    if (element && typeof handler === 'function') {
      element.removeEventListener(event, handler);
    }
  }

  static findElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const foundElement = document.querySelector(selector);
        if (foundElement) {
          observer.disconnect();
          resolve(foundElement);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  static waitForElement(selector, timeout = 10000) {
    return this.findElement(selector, timeout);
  }
}

// ========= STORAGE MANAGER MODULE =========
class StorageManager {
  static async saveInteraction(interactionId, config) {
    try {
      // Save to Chrome storage
      if (chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          [`interaction_${interactionId}`]: {
            id: interactionId,
            config: config,
            timestamp: Date.now()
          }
        });
      }
      
      // Also save to localStorage as backup
      const interactions = StorageManager.getLocalInteractions();
      interactions[interactionId] = {
        id: interactionId,
        config: config,
        timestamp: Date.now()
      };
      localStorage.setItem('rise_interactions', JSON.stringify(interactions));
      
      console.log('Interaction saved:', interactionId);
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  }

  static async getInteraction(interactionId) {
    try {
      // Try Chrome storage first
      if (chrome && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(`interaction_${interactionId}`);
        if (result[`interaction_${interactionId}`]) {
          return result[`interaction_${interactionId}`];
        }
      }
      
      // Fallback to localStorage
      const interactions = StorageManager.getLocalInteractions();
      return interactions[interactionId] || null;
    } catch (error) {
      console.error('Error getting interaction:', error);
      // Fallback to localStorage
      const interactions = StorageManager.getLocalInteractions();
      return interactions[interactionId] || null;
    }
  }

  static async deleteInteraction(interactionId) {
    try {
      // Remove from Chrome storage
      if (chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(`interaction_${interactionId}`);
      }
      
      // Remove from localStorage
      const interactions = StorageManager.getLocalInteractions();
      delete interactions[interactionId];
      localStorage.setItem('rise_interactions', JSON.stringify(interactions));
      
      console.log('Interaction deleted:', interactionId);
    } catch (error) {
      console.error('Error deleting interaction:', error);
    }
  }

  static getAllInteractions() {
    return StorageManager.getLocalInteractions();
  }

  static getLocalInteractions() {
    try {
      const stored = localStorage.getItem('rise_interactions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing stored interactions:', error);
      return {};
    }
  }

  static async syncFromChromeStorage() {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        const allData = await chrome.storage.local.get(null);
        const interactions = {};
        
        Object.keys(allData).forEach(key => {
          if (key.startsWith('interaction_')) {
            const interactionId = key.replace('interaction_', '');
            interactions[interactionId] = allData[key];
          }
        });
        
        localStorage.setItem('rise_interactions', JSON.stringify(interactions));
        return interactions;
      }
    } catch (error) {
      console.error('Error syncing from Chrome storage:', error);
    }
    return StorageManager.getLocalInteractions();
  }
}

// ========= UI MANAGER MODULE =========
class UIManager {
  constructor() {
    this.riseClasses = {
      floatingButton: 'rise-compare-contrast-fab',
      interactionContainer: 'rise-compare-contrast-interaction',
      modal: 'rise-compare-contrast-modal',
      controls: 'rise-compare-contrast-controls',
      toast: 'rise-compare-contrast-toast'
    };
  }

  createFloatingButton() {
    const button = document.createElement('button');
    button.className = this.riseClasses.floatingButton;
    button.id = 'rise-compare-contrast-fab';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
    button.title = 'Add Compare & Contrast Block';
    
    this.applyFloatingButtonStyles(button);
    return button;
  }

  applyFloatingButtonStyles(button) {
    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
      zIndex: '999999',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
    });
  }

  createInteractionControls(interactionId) {
    const controls = document.createElement('div');
    controls.className = this.riseClasses.controls;
    controls.style.cssText = `
      position: absolute;
      top: -40px;
      right: 0;
      display: flex;
      gap: 8px;
      background: white;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      z-index: 1000;
    `;

    const createButton = (text, color, action) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background: ${color};
        color: white;
        cursor: pointer;
        font-size: 12px;
        transition: opacity 0.2s ease;
      `;
      btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
      btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
      btn.addEventListener('click', action);
      return btn;
    };

    controls.appendChild(createButton('✏️', '#4CAF50', () => window.editInteraction(interactionId)));
    controls.appendChild(createButton('↑', '#2196F3', () => window.moveInteraction && window.moveInteraction(interactionId, 'up')));
    controls.appendChild(createButton('↓', '#2196F3', () => window.moveInteraction && window.moveInteraction(interactionId, 'down')));
    controls.appendChild(createButton('🗑️', '#f44336', () => window.deleteInteraction && window.deleteInteraction(interactionId)));

    return controls;
  }

  createConfigModal() {
    const modal = document.createElement('div');
    modal.className = this.riseClasses.modal;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #333; font-size: 24px;">Configure Compare & Contrast Block</h2>
        <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
      </div>
      
      <form class="config-form">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Title:</label>
          <input type="text" name="title" value="Compare & Contrast" style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;" />
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Prompt:</label>
          <textarea name="prompt" rows="3" style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; resize: vertical; transition: border-color 0.2s ease;">Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.</textarea>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Ideal Response:</label>
          <textarea name="idealResponse" rows="4" style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; resize: vertical; transition: border-color 0.2s ease;">An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.</textarea>
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Placeholder Text:</label>
          <input type="text" name="placeholder" value="Type your response here..." style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;" />
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="cancel-btn" style="padding: 12px 24px; border: 2px solid #e1e5e9; background: white; color: #666; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s ease;">Cancel</button>
          <button type="submit" style="padding: 12px 24px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s ease;">Save Block</button>
        </div>
      </form>
    `;

    // Add focus styles
    const inputs = content.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#667eea';
        input.style.outline = 'none';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#e1e5e9';
      });
    });

    modal.appendChild(content);
    return modal;
  }

  createInteractionHTML(interactionId, config) {
    return `
      <div class="block block--mounted block--playbook-mode-slides compare-contrast-container" 
           style="position: relative; margin: 20px 0; padding: 20px; border: 2px solid #007bff; border-radius: 8px; background: #f8f9fa;" 
           data-block-type="compare-contrast"
           data-interaction-id="${interactionId}">
        <div class="compare-contrast-content" style="min-height: 100px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">
            ${config.title || 'Compare & Contrast'}
          </h3>
          <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              ${config.prompt || 'Compare and contrast exercise'}
            </p>
            <div style="min-height: 60px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin-top: 10px;">
              <em style="color: #999; font-size: 13px;">Interactive content will load here during playback</em>
            </div>
          </div>
        </div>
        <div data-compare-contrast-interaction
             data-title="${config.title || 'Compare & Contrast'}"
             data-prompt="${config.prompt || ''}"
             data-ideal-response="${config.idealResponse || ''}"
             data-placeholder="${config.placeholder || 'Type your response here...'}">
        </div>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = this.riseClasses.toast;
    
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000000;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// ========= RISE INTEGRATION MODULE =========
class RiseIntegration {
  constructor() {
    this.riseSelectors = {
      // Different Rise 360 UI states
      authoring: {
        blockList: '[data-testid="block-list"], .block-list, [class*="block-list"]',
        lessonContent: '[data-testid="lesson-content"], .lesson-content, [class*="lesson-content"]',
        addBlockButton: '[data-testid="add-block"], .add-block-button, [class*="add-block"]'
      },
      preview: {
        contentFrame: 'iframe[src*="preview"], iframe[title*="preview"]',
        lessonView: '.lesson-view, [class*="lesson-view"]'
      },
      general: {
        riseApp: '#rise-app, .rise-app, [data-app="rise"]',
        toolbar: '.toolbar, [class*="toolbar"]',
        sidebar: '.sidebar, [class*="sidebar"]'
      }
    };
  }

  async waitForRise(timeout = 5000) {
    console.log('waitForRise called - should never throw error');
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkForRise = () => {
        console.log('checkForRise iteration - elapsed:', Date.now() - startTime);
        // Always resolve, never reject
        if (this.checkForRiseElements() || document.readyState === 'complete' || (Date.now() - startTime > timeout)) {
          console.log('Rise detection completed:', this.checkForRiseElements() ? 'elements found' : 'timeout reached, continuing anyway');
          resolve(true);
          return;
        }
        setTimeout(checkForRise, 200);
      };
      
      checkForRise();
    });
  }

  checkForRiseElements() {
    // More comprehensive check for Rise or any web authoring environment
    const selectors = [
      // Rise-specific selectors
      ...Object.values(this.riseSelectors.authoring),
      ...Object.values(this.riseSelectors.general),
      // Generic selectors that might indicate an authoring environment
      'main', '#root', '.app', '[role="main"]', 'body'
    ];
    
    // Also check URL patterns
    const url = window.location.href;
    const isRiseUrl = url.includes('rise.articulate.com') || url.includes('articulate.com');
    
    const hasElements = selectors.some(selector => document.querySelector(selector));
    return hasElements || isRiseUrl || document.readyState === 'complete';
  }

  isPreviewMode() {
    // Check URL patterns for preview/published content
    const url = window.location.href;
    const isPreviewUrl = /\/preview\/|\/published\/|\/share\//.test(url);
    
    if (isPreviewUrl) return true;
    
    // Check for preview-specific DOM elements
    const hasPreviewFrame = document.querySelector(this.riseSelectors.preview.contentFrame);
    const hasLessonView = document.querySelector(this.riseSelectors.preview.lessonView);
    
    // If we find authoring elements, we're definitely not in preview
    const hasAuthoringElements = document.querySelector(this.riseSelectors.authoring.blockList);
    
    return (hasPreviewFrame || hasLessonView) && !hasAuthoringElements;
  }

  isAuthoringMode() {
    return !this.isPreviewMode();
  }

  async injectCustomStyles() {
    const styles = `
      .compare-contrast-interaction {
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 24px;
        margin: 16px 0;
        position: relative;
        transition: all 0.3s ease;
      }
      
      .compare-contrast-interaction:hover {
        border-color: #667eea;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
      }
      
      .compare-contrast-interaction h3 {
        margin: 0 0 16px 0;
        color: #2c3e50;
        font-size: 20px;
        font-weight: 600;
      }
      
      .compare-contrast-interaction p {
        margin: 0 0 16px 0;
        color: #5a6c7d;
        line-height: 1.6;
      }
      
      .compare-contrast-interaction textarea {
        width: 100%;
        min-height: 120px;
        padding: 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-family: inherit;
        font-size: 16px;
        resize: vertical;
        transition: border-color 0.2s ease;
      }
      
      .compare-contrast-interaction textarea:focus {
        outline: none;
        border-color: #667eea;
      }
      
      .show-ideal-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 16px;
        transition: all 0.2s ease;
      }
      
      .show-ideal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .ideal-response {
        background: #e8f5e8;
        border-left: 4px solid #4CAF50;
        padding: 16px;
        margin-top: 16px;
        border-radius: 0 8px 8px 0;
      }
      
      .ideal-response h4 {
        margin: 0 0 8px 0;
        color: #2e7d32;
        font-size: 16px;
      }
      
      .ideal-response p {
        margin: 0;
        color: #1b5e20;
      }
      
      /* Rise-specific adjustments */
      .rise-lesson-content .compare-contrast-interaction {
        margin: 20px 0;
      }
      
      /* Authoring mode styles */
      .compare-contrast-interaction:hover .rise-compare-contrast-controls {
        opacity: 1;
        visibility: visible;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  createCustomBlockButton() {
    const button = document.createElement('div');
    button.className = 'custom-block-button compare-contrast-block';
    button.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin: 4px 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    button.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M7 8h10M7 12h6M7 16h8M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="white" stroke-width="2" fill="none"/>
          <path d="M6 9h4v6H6zM14 9h4v6h-4z" fill="white" opacity="0.8"/>
          <rect x="9" y="11" width="6" height="2" fill="white"/>
        </svg>
      </div>
      <div>
        <div style="
          font-weight: 600;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
        ">Compare & Contrast</div>
        <div style="
          color: #666;
          font-size: 12px;
        ">Interactive learning activity</div>
      </div>
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.borderColor = '#667eea';
      button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.15)';
      button.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.borderColor = '#e0e0e0';
      button.style.boxShadow = 'none';
      button.style.transform = 'translateY(0)';
    });

    return button;
  }

  async injectInteractiveScript() {
    // The interaction functionality is now bundled in this script
    // This method is kept for compatibility but doesn't need to inject external scripts
    console.log('Interactive functionality is bundled with content script');
  }

  observeNavigationChanges(callback) {
    let lastUrl = window.location.href;
    
    // Watch for URL changes (for SPA navigation)
    const urlObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        callback();
      }
    });
    
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also listen for popstate events
    window.addEventListener('popstate', callback);
    
    // Watch for major DOM changes that might indicate navigation
    const domObserver = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(mutation => {
        return mutation.addedNodes.length > 3 || mutation.removedNodes.length > 3;
      });
      
      if (hasSignificantChanges) {
        callback();
      }
    });
    
    domObserver.observe(document.body, {
      childList: true,
      subtree: false
    });
  }
}

// ========= INTERACTION MANAGER MODULE =========
class InteractionManager {
  constructor() {
    this.uiManager = new UIManager();
    this.currentEditingId = null;
    this.eventHandlers = new Map();
  }

  async saveConfiguration(config, interactionId = null) {
    const id = interactionId || this.generateInteractionId();
    await StorageManager.saveInteraction(id, config);
    return id;
  }

  async loadConfiguration(interactionId) {
    const data = await StorageManager.getInteraction(interactionId);
    return data ? data.config : null;
  }

  async deleteInteraction(interactionId) {
    // Remove from storage
    await StorageManager.deleteInteraction(interactionId);
    
    // Remove from DOM
    const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
    if (element) {
      element.remove();
    }
    
    // Clean up event handlers
    this.cleanup(interactionId);
    
    this.uiManager.showToast('Interaction deleted successfully', 'success');
  }

  addInteractionControls(container, interactionId) {
    // Remove any existing controls
    const existingControls = container.querySelector('.rise-compare-contrast-controls');
    if (existingControls) {
      existingControls.remove();
    }
    
    const controls = this.uiManager.createInteractionControls(interactionId);
    container.style.position = 'relative';
    container.appendChild(controls);
    this.addControlEventListeners(controls, interactionId);
    
    // Show controls on hover
    container.addEventListener('mouseenter', () => {
      controls.style.opacity = '1';
      controls.style.visibility = 'visible';
    });
    
    container.addEventListener('mouseleave', () => {
      controls.style.opacity = '0';
      controls.style.visibility = 'hidden';
    });
  }

  generateInteractionId() {
    return 'interaction_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async insertInteractionBlock(config, targetElement = null) {
    try {
      const interactionId = await this.saveConfiguration(config);
      const insertionPoint = targetElement || this.findInsertionPoint();
      
      if (!insertionPoint) {
        throw new Error('Could not find suitable insertion point');
      }

      const interactionHTML = this.uiManager.createInteractionHTML(interactionId, config);
      
      // Create container and insert
      const container = document.createElement('div');
      container.innerHTML = interactionHTML;
      const interactionElement = container.firstElementChild;
      
      if (!interactionElement) {
        throw new Error('Failed to create interaction element from HTML');
      }
      
      // Use the global riseIntegration instance instead of creating new one
      if (riseIntegration.isAuthoringMode()) {
        this.addInteractionControls(interactionElement, interactionId);
      }
      
      // Insert into DOM
      insertionPoint.parentNode.insertBefore(interactionElement, insertionPoint.nextSibling);
      
      // Initialize interaction functionality
      this.initializeInteraction(interactionElement);
      
      this.uiManager.showToast('Compare & Contrast block added successfully!', 'success');
      
      return interactionId;
    } catch (error) {
      console.error('Error inserting interaction block:', error);
      this.uiManager.showToast('Error adding interaction block', 'error');
      throw error;
    }
  }

  addControlEventListeners(controls, interactionId) {
    const buttons = controls.querySelectorAll('button');
    buttons.forEach(button => {
      const handler = (e) => {
        e.stopPropagation();
        const action = button.textContent.toLowerCase();
        
        switch(action) {
          case 'edit':
            this.editInteraction(interactionId);
            break;
          case '↑':
            this.moveInteraction(interactionId, 'up');
            break;
          case '↓':
            this.moveInteraction(interactionId, 'down');
            break;
          case 'delete':
            if (confirm('Are you sure you want to delete this interaction?')) {
              this.deleteInteraction(interactionId);
            }
            break;
        }
      };
      
      button.addEventListener('click', handler);
      
      // Store handler reference for cleanup
      if (!this.eventHandlers.has(interactionId)) {
        this.eventHandlers.set(interactionId, []);
      }
      this.eventHandlers.get(interactionId).push({element: button, event: 'click', handler});
    });
  }

  async editInteraction(interactionId) {
    const config = await this.loadConfiguration(interactionId);
    if (config) {
      this.currentEditingId = interactionId;
      this.openConfigModal(config);
    }
  }

  moveInteraction(interactionId, direction) {
    const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
    if (!element) {
      this.uiManager.showToast('Interaction element not found', 'error');
      return;
    }
    
    console.log('🔄 Starting move operation for:', interactionId, direction);
    
    // Try to find Rise's actual lesson content area (excluding headers, titles, etc.)
    const riseContentSelectors = [
      '[data-testid="lesson-content"]',
      '.lesson-content', 
      '.lesson-body',
      '.content-area',
      '.main-content',
      '[class*="lesson-content"]',
      '[class*="content-area"]'
    ];

    let lessonContentContainer = null;
    
    // Try each selector to find the actual lesson content area
    for (const selector of riseContentSelectors) {
      const container = document.querySelector(selector);
      if (container && container.contains(element)) {
        console.log(`✅ Found lesson content with selector: ${selector}`);
        lessonContentContainer = container;
        break;
      }
    }

    // If no specific lesson container found, walk up from the element but stop before going too high
    if (!lessonContentContainer) {
      let current = element.parentElement;
      let depth = 0;
      const maxDepth = 5; // Prevent going too high in the DOM
      
      while (current && depth < maxDepth) {
        const children = Array.from(current.children);
        
        // Look for containers that have multiple content blocks but aren't the whole page
        const contentChildren = children.filter(child => {
          return child.tagName !== 'SCRIPT' && 
                 child.tagName !== 'STYLE' && 
                 child.tagName !== 'LINK' &&
                 !child.classList.contains('apt-guide-overlay') &&
                 child.id !== 'rise-compare-contrast-fab' &&
                 (child.offsetHeight > 0 || child.offsetWidth > 0 || child.hasAttribute('data-interaction-id'));
        });

        // Check if this looks like a lesson content area by various indicators
        const isLessonArea = current.className.includes('lesson') || 
                            current.className.includes('content') ||
                            current.className.includes('block-list') ||
                            current.className.includes('player') ||
                            current.className.includes('container') ||
                            current.hasAttribute('data-testid') ||
                            current.hasAttribute('role') ||
                            current.tagName === 'MAIN' ||
                            current.id.includes('content') ||
                            current.id.includes('lesson');

        console.log(`📦 Checking container at depth ${depth}:`, {
          tag: current.tagName,
          classes: current.className.substring(0, 50),
          contentChildren: contentChildren.length,
          isLessonArea: isLessonArea,
          hasOurElement: contentChildren.includes(element)
        });

        // Don't use body as container - too broad
        if (current.tagName === 'BODY') {
          console.log(`⚠️ Skipping BODY element, looking deeper for lesson content`);
          current = current.firstElementChild;
          depth++;
          continue;
        }
        
        // Accept container if it has our element and either has multiple content children or looks like a lesson area
        // Also accept if container has fewer children but still contains our element (for newly inserted blocks)
        if (contentChildren.includes(element) && (contentChildren.length >= 1 || isLessonArea)) {
          console.log('✅ Found suitable lesson container at depth', depth);
          lessonContentContainer = current;
          break;
        }

        current = current.parentElement;
        depth++;
      }
    }

    if (!lessonContentContainer) {
      this.uiManager.showToast('Cannot find content container', 'error');
      return;
    }

    console.log('📍 Using container:', lessonContentContainer);

    // Get all content blocks within the lesson content area
    const allChildren = Array.from(lessonContentContainer.children);
    const contentBlocks = allChildren.filter(child => {
      // Exclude technical elements and title/header areas
      const isScript = child.tagName === 'SCRIPT';
      const isStyle = child.tagName === 'STYLE';
      const isLink = child.tagName === 'LINK';
      const isOverlay = child.classList.contains('apt-guide-overlay');
      const isFloatingButton = child.id === 'rise-compare-contrast-fab';
      const isTitle = child.classList.contains('title') || 
                     child.classList.contains('header') ||
                     child.classList.contains('lesson-title') ||
                     child.classList.contains('page-title') ||
                     child.classList.contains('block-title') ||
                     child.querySelector('h1, h2, .title, .header, .lesson-title') ||
                     child.textContent.trim().length < 100 && child.querySelector('h1, h2, h3');
      const hasVisibleDimensions = child.offsetHeight > 0 || child.offsetWidth > 0;
      const isInteraction = child.hasAttribute('data-interaction-id');
      
      // Include if it's our interaction or if it has visible dimensions and isn't excluded
      return (isInteraction || hasVisibleDimensions) && 
             !isScript && !isStyle && !isLink && !isOverlay && !isFloatingButton && !isTitle;
    });

    console.log('📝 Content blocks found:', contentBlocks.length);
    console.log('Content blocks:', contentBlocks.map((child, index) => ({
      index,
      tag: child.tagName,
      classes: child.className.substring(0, 30),
      isInteraction: child.hasAttribute('data-interaction-id'),
      isCurrentElement: child === element,
      hasTitle: child.querySelector('h1, .title, .header') !== null
    })));

    const currentIndex = contentBlocks.indexOf(element);
    if (currentIndex === -1) {
      this.uiManager.showToast('Interaction not found in content blocks', 'error');
      return;
    }

    console.log('📊 Current position:', currentIndex + 1, 'of', contentBlocks.length);

    let targetIndex;
    if (direction === 'up') {
      if (currentIndex === 0) {
        this.uiManager.showToast('Cannot move up - already at the top', 'warning');
        return;
      }
      
      targetIndex = currentIndex - 1;
      
      // Don't allow moving above title-like content
      const targetElement = contentBlocks[targetIndex];
      if (targetElement && (
        targetElement.classList.contains('title') || 
        targetElement.classList.contains('header') ||
        targetElement.classList.contains('lesson-title') ||
        targetElement.querySelector('h1, h2, .title, .header, .lesson-title')
      )) {
        this.uiManager.showToast('Cannot move above title content', 'warning');
        return;
      }
    } else {
      if (currentIndex >= contentBlocks.length - 1) {
        this.uiManager.showToast('Cannot move down - already at the bottom', 'warning');
        return;
      }
      
      targetIndex = currentIndex + 1;
    }

    const targetElement = contentBlocks[targetIndex];
    console.log('🎯 Moving relative to:', {
      tag: targetElement.tagName,
      classes: targetElement.className.substring(0, 30),
      targetIndex: targetIndex
    });

    // Perform the move within the lesson content container
    const parent = element.parentNode;
    parent.removeChild(element);
    
    if (direction === 'up') {
      parent.insertBefore(element, targetElement);
    } else {
      if (targetElement.nextSibling) {
        parent.insertBefore(element, targetElement.nextSibling);
      } else {
        parent.appendChild(element);
      }
    }

    // Verify the move
    const newContentBlocks = Array.from(lessonContentContainer.children).filter(child => {
      const isScript = child.tagName === 'SCRIPT';
      const isStyle = child.tagName === 'STYLE';
      const isLink = child.tagName === 'LINK';
      const isOverlay = child.classList.contains('apt-guide-overlay');
      const isFloatingButton = child.id === 'rise-compare-contrast-fab';
      const isTitle = child.classList.contains('title') || 
                     child.classList.contains('header') ||
                     child.querySelector('h1, .title, .header');
      const hasVisibleDimensions = child.offsetHeight > 0 || child.offsetWidth > 0;
      const isInteraction = child.hasAttribute('data-interaction-id');
      
      return (isInteraction || hasVisibleDimensions) && 
             !isScript && !isStyle && !isLink && !isOverlay && !isFloatingButton && !isTitle;
    });

    const newIndex = newContentBlocks.indexOf(element);
    console.log('✅ Move completed. New position:', newIndex + 1, 'of', newContentBlocks.length);

    this.uiManager.showToast(`Interaction moved ${direction} successfully`, 'success');
  }

  findInsertionPoint() {
    // Try multiple strategies to find where to insert the block
    const selectors = [
      '[data-testid="lesson-content"] > *:last-child',
      '.lesson-content > *:last-child',
      '[class*="lesson-content"] > *:last-child',
      '[data-testid="block-list"] > *:last-child',
      '.block-list > *:last-child',
      '[class*="block-list"] > *:last-child',
      'main > *:last-child',
      '#content > *:last-child',
      'body > *:last-child'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found insertion point with selector:', selector);
        return element;
      }
    }
    
    console.warn('No suitable insertion point found, using document.body');
    return document.body.lastElementChild;
  }

  openConfigModal(existingConfig = null) {
    // Remove any existing modal
    const existingModal = document.querySelector('.rise-compare-contrast-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = this.uiManager.createConfigModal();
    document.body.appendChild(modal);

    // Populate form if editing existing config
    if (existingConfig) {
      const form = modal.querySelector('.config-form');
      form.title.value = existingConfig.title || '';
      form.prompt.value = existingConfig.prompt || '';
      form.idealResponse.value = existingConfig.idealResponse || '';
      form.placeholder.value = existingConfig.placeholder || '';
    }

    // Add event listeners
    this.addModalEventListeners(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      const content = modal.querySelector('div > div');
      content.style.transform = 'scale(1)';
    }, 10);
  }

  addModalEventListeners(modal) {
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('.config-form');

    const closeModal = () => {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
      this.currentEditingId = null;
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission(modal);
    });
  }

  async handleFormSubmission(modal) {
    const form = modal.querySelector('.config-form');
    const formData = new FormData(form);
    
    const config = {
      title: formData.get('title'),
      prompt: formData.get('prompt'),
      idealResponse: formData.get('idealResponse'),
      placeholder: formData.get('placeholder')
    };

    try {
      if (this.currentEditingId) {
        // Update existing interaction
        await this.updateExistingInteraction(this.currentEditingId, config);
        this.uiManager.showToast('Interaction updated successfully!', 'success');
      } else {
        // Create new interaction
        await this.insertInteractionBlock(config);
      }

      // Close modal
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
      
      this.currentEditingId = null;
    } catch (error) {
      console.error('Error saving interaction:', error);
      this.uiManager.showToast('Error saving interaction', 'error');
    }
  }

  async updateExistingInteraction(interactionId, config) {
    // Save updated config
    await this.saveConfiguration(config, interactionId);
    
    // Update DOM element
    const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
    if (element) {
      // Update data attributes
      element.setAttribute('data-title', config.title || '');
      element.setAttribute('data-prompt', config.prompt || '');
      element.setAttribute('data-ideal-response', config.idealResponse || '');
      element.setAttribute('data-placeholder', config.placeholder || '');
      
      // Update content
      const titleElement = element.querySelector('h3');
      const promptElement = element.querySelector('p');
      const textareaElement = element.querySelector('textarea');
      const idealResponseElement = element.querySelector('.ideal-response p');
      
      if (titleElement) titleElement.textContent = config.title || 'Compare & Contrast';
      if (promptElement) promptElement.textContent = config.prompt || '';
      if (textareaElement) textareaElement.placeholder = config.placeholder || 'Type your response here...';
      if (idealResponseElement) idealResponseElement.textContent = config.idealResponse || '';
    }
  }

  initializeInteraction(container) {
    const showIdealBtn = container.querySelector('.show-ideal-btn');
    const idealResponse = container.querySelector('.ideal-response');
    
    if (showIdealBtn && idealResponse) {
      const handler = () => {
        const isVisible = idealResponse.style.display !== 'none';
        idealResponse.style.display = isVisible ? 'none' : 'block';
        showIdealBtn.textContent = isVisible ? 'Show Ideal Response' : 'Hide Ideal Response';
      };
      
      showIdealBtn.addEventListener('click', handler);
      
      // Store handler for cleanup
      const interactionId = container.getAttribute('data-interaction-id');
      if (interactionId) {
        if (!this.eventHandlers.has(interactionId)) {
          this.eventHandlers.set(interactionId, []);
        }
        this.eventHandlers.get(interactionId).push({element: showIdealBtn, event: 'click', handler});
      }
    }
  }

  async restoreAllInteractions() {
    try {
      const interactions = StorageManager.getAllInteractions();
      
      for (const [interactionId, data] of Object.entries(interactions)) {
        if (data && data.config) {
          await this.restoreInteractionToDOM(interactionId, data.config);
        }
      }
      
      if (Object.keys(interactions).length > 0) {
        console.log(`Restored ${Object.keys(interactions).length} interactions`);
      }
    } catch (error) {
      console.error('Error restoring interactions:', error);
    }
  }

  async restoreInteractionToDOM(interactionId, config) {
    // Check if interaction already exists in DOM
    const existing = document.querySelector(`[data-interaction-id="${interactionId}"]`);
    if (existing) {
      return; // Already exists
    }

    // Find insertion point and create interaction
    const insertionPoint = this.findInsertionPoint();
    if (insertionPoint) {
      const interactionHTML = this.uiManager.createInteractionHTML(interactionId, config);
      
      const container = document.createElement('div');
      container.innerHTML = interactionHTML;
      const interactionElement = container.firstElementChild;
      
      // Use the global riseIntegration instance instead of creating new one
      if (riseIntegration.isAuthoringMode()) {
        this.addInteractionControls(interactionElement, interactionId);
      }
      
      // Insert into DOM
      insertionPoint.parentNode.insertBefore(interactionElement, insertionPoint.nextSibling);
      
      // Initialize interaction functionality
      this.initializeInteraction(interactionElement);
    }
  }

  cleanup(interactionId) {
    const handlers = this.eventHandlers.get(interactionId);
    if (handlers) {
      handlers.forEach(({element, event, handler}) => {
        element.removeEventListener(event, handler);
      });
      this.eventHandlers.delete(interactionId);
    }
  }
}

// ========= MAIN EXTENSION LOGIC =========

// Initialize managers
const riseIntegration = new RiseIntegration();
const interactionManager = new InteractionManager();
const uiManager = new UIManager();

// Global functions for backward compatibility and external access
window.openConfigModal = (existingConfig = null) => {
  interactionManager.openConfigModal(existingConfig);
};

window.insertCompareContrastBlock = async () => {
  console.log('🚀 insertCompareContrastBlock called');
  try {
    const success = await interactionManager.insertInteractionBlock({
      title: 'Compare & Contrast',
      prompt: 'Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.',
      idealResponse: 'An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.',
      placeholder: 'Type your response here...'
    });
    console.log('📋 Insert result:', success);
    return success;
  } catch (error) {
    console.error('❌ Error in insertCompareContrastBlock:', error);
    return false;
  }
};

window.editInteraction = (interactionId) => {
  interactionManager.editInteraction(interactionId);
};

window.moveInteraction = (interactionId, direction) => {
  interactionManager.moveInteraction(interactionId, direction);
};

window.deleteInteraction = (interactionId) => {
  if (confirm('Are you sure you want to delete this interaction?')) {
    interactionManager.deleteInteraction(interactionId);
  }
};

// Main initialization function
async function initializeExtension() {
  console.log('🚀 Compare & Contrast Extension - Rise Block Library Integration');
  
  try {
    // Wait for Rise to load (this should never throw an error now)
    await riseIntegration.waitForRise();
  } catch (error) {
    console.log('Rise detection had an issue, but continuing anyway:', error.message);
  }
  
  try {
    // Inject custom styles
    await riseIntegration.injectCustomStyles();
    
    // Inject interactive script
    await riseIntegration.injectInteractiveScript();
    
    // Check if we're in authoring mode
    if (riseIntegration.isAuthoringMode()) {
      console.log('✅ Authoring mode detected');
      
      // Primary strategy: Native Block Library Integration
      await initializeBlockLibraryIntegration();
      
      // Delay restoration to ensure Rise content is fully loaded
      setTimeout(async () => {
        await interactionManager.restoreAllInteractions();
      }, 2000);
      
    } else {
      console.log('📖 Preview mode detected - hiding authoring controls');
    }
    
    console.log('✅ Extension initialized successfully');
  } catch (error) {
    console.error('❌ Error during extension setup:', error);
    // Continue anyway - don't let setup errors prevent basic functionality
  }
}

// Rise Block Library Integration
async function initializeBlockLibraryIntegration() {
  console.log('🔍 Initializing Rise Block Library integration...');
  
  // Watch for block library to appear
  const blockLibraryObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          await checkAndInjectCustomBlock(node);
        }
      }
    }
  });

  // Start observing
  blockLibraryObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check if block library is already present
  await checkAndInjectCustomBlock(document.body);
  
  // Also check for add block buttons that might trigger the library
  setupAddBlockButtonIntegration();
}

async function checkAndInjectCustomBlock(container) {
  // Look for the exact Rise 360 Block Library structure
  const blockList = container.querySelector ? container.querySelector('.block-wizard__list[role="list"]') : null;
  
  if (blockList && !blockList.querySelector('.compare-contrast-block')) {
    console.log('📚 Found Rise Block Library, injecting custom block');
    await injectCustomBlockIntoLibrary(blockList);
    return;
  }
  
  // Fallback selectors for older Rise versions
  const blockLibrarySelectors = [
    '.block-library',
    '.add-block-menu', 
    '.block-picker',
    '[data-testid*="block"]',
    '.blocks-panel',
    '.content-blocks',
    '[class*="BlockLibrary"]',
    '[class*="block-library"]'
  ];

  for (const selector of blockLibrarySelectors) {
    const blockLibrary = container.querySelector ? container.querySelector(selector) : 
                        container.closest ? container.closest(selector) : null;
    
    if (blockLibrary && !blockLibrary.querySelector('.compare-contrast-block')) {
      console.log('📚 Found block library (fallback), injecting custom block');
      await injectCustomBlockIntoLibrary(blockLibrary);
      break;
    }
  }
}

async function injectCustomBlockIntoLibrary(blockLibrary) {
  try {
    // Use the new Rise-native block structure
    const customBlock = riseIntegration.createCustomBlockButton();
    customBlock.classList.add('compare-contrast-block');
    
    // Add click handler to insert the block at the correct insertion point
    customBlock.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🎯 Custom Rise block clicked, inserting interaction');
      
      // Find the current insertion point (where the + button was clicked)
      const insertionPoint = findCurrentInsertionPoint();
      await insertCompareContrastBlockAtPosition(insertionPoint);
      
      // Close the block library if it's in a modal/overlay
      const modal = blockLibrary.closest('.modal, .overlay, [role="dialog"], .blocks-sidebar__container');
      if (modal) {
        const closeButton = modal.querySelector('[aria-label="Close"], .close, .cancel, .blocks-sidebar__close');
        if (closeButton) closeButton.click();
      }
    });

    // For the exact Rise structure, append directly to the block list
    if (blockLibrary.classList.contains('block-wizard__list')) {
      blockLibrary.appendChild(customBlock);
      console.log('✅ Custom block added to Rise Block Library (native structure)');
    } else {
      // Fallback for older Rise versions
      const insertionPoint = findBlockLibraryInsertionPoint(blockLibrary);
      if (insertionPoint) {
        insertionPoint.appendChild(customBlock);
        console.log('✅ Custom block added to Rise Block Library (fallback)');
      } else {
        blockLibrary.appendChild(customBlock);
        console.log('✅ Custom block added to Rise Block Library (direct append)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error injecting custom block into library:', error);
  }
}

function findBlockLibraryInsertionPoint(blockLibrary) {
  // Look for common block library structures
  const possibleContainers = [
    blockLibrary.querySelector('.block-list'),
    blockLibrary.querySelector('.blocks-container'),
    blockLibrary.querySelector('.content-blocks'),
    blockLibrary.querySelector('[role="list"]'),
    blockLibrary.querySelector('ul'),
    blockLibrary.querySelector('.blocks'),
    blockLibrary.querySelector('.grid'), // Rise often uses grid layouts
    blockLibrary.querySelector('[class*="grid"]')
  ];

  // Return the first valid container
  for (const container of possibleContainers) {
    if (container) {
      return container;
    }
  }

  // If no specific container found, use the block library itself
  return blockLibrary;
}

// Global variable to store the insertion point
let currentInsertionPoint = null;

function setupAddBlockButtonIntegration() {
  // Watch for "Add Block" buttons and track where they were clicked
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for add block buttons and attach click listeners
          const addButtons = node.querySelectorAll ? 
            node.querySelectorAll('[class*="add"], [class*="plus"], [aria-label*="Add"], button[title*="Add"], button[title*="Block"]') : 
            [];
          
          addButtons.forEach(button => {
            if (!button || button.hasAttribute('data-rise-listener')) return;
            
            const buttonText = button.textContent?.toLowerCase() || '';
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
            const title = button.getAttribute('title')?.toLowerCase() || '';
            
            if (buttonText.includes('block') || buttonText.includes('add') || 
                ariaLabel.includes('block') || ariaLabel.includes('add') ||
                title.includes('block') || title.includes('add') ||
                button.classList.toString().includes('add') ||
                button.classList.toString().includes('plus')) {
              
              // Mark button to prevent duplicate listeners
              button.setAttribute('data-rise-listener', 'true');
              
              // Add click listener to capture insertion point
              button.addEventListener('click', captureInsertionPoint);
              console.log('🔘 Added click listener to add block button');
            }
          });
        }
      });
    });
  });

  // Also check existing buttons
  const existingButtons = document.querySelectorAll('[class*="add"], [class*="plus"], [aria-label*="Add"], button[title*="Add"], button[title*="Block"]');
  existingButtons.forEach(button => {
    if (!button || button.hasAttribute('data-rise-listener')) return;
    
    const buttonText = button.textContent?.toLowerCase() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    const title = button.getAttribute('title')?.toLowerCase() || '';
    
    if (buttonText.includes('block') || buttonText.includes('add') || 
        ariaLabel.includes('block') || ariaLabel.includes('add') ||
        title.includes('block') || title.includes('add') ||
        button.classList.toString().includes('add') ||
        button.classList.toString().includes('plus')) {
      
      // Mark button to prevent duplicate listeners
      button.setAttribute('data-rise-listener', 'true');
      button.addEventListener('click', captureInsertionPoint);
      console.log('🔘 Added click listener to existing add block button');
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function captureInsertionPoint(event) {
  const button = event.target.closest('button');
  if (!button) return;
  
  console.log('📍 Capturing insertion point from button click');
  
  // Find the exact Rise block structure based on DOM inspection
  // Look for the block-create container first
  let insertionPoint = button.closest('.block-create');
  
  if (!insertionPoint) {
    // Look for Rise block containers with data-block-id
    insertionPoint = button.closest('[data-block-id]');
  }
  
  if (!insertionPoint) {
    // Look for lesson-blocks container
    insertionPoint = button.closest('.lesson-blocks__block-type-container, [class*="lesson-blocks"]');
  }
  
  if (!insertionPoint) {
    // Look for any block container in the Rise structure
    let parent = button.parentElement;
    while (parent && parent !== document.body) {
      if (parent.querySelector('[data-block-id]') || parent.classList.toString().includes('block')) {
        insertionPoint = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  // Store the insertion point and the clicked button
  currentInsertionPoint = {
    element: insertionPoint,
    button: button,
    timestamp: Date.now()
  };
  
  console.log('📍 Stored insertion point:', currentInsertionPoint);
}

function findCurrentInsertionPoint() {
  // First, check if we have a stored insertion point from the button click
  if (currentInsertionPoint && (Date.now() - currentInsertionPoint.timestamp < 10000)) {
    console.log('📍 Using stored insertion point from button click');
    return currentInsertionPoint.element;
  }
  
  // Clear expired insertion point
  if (currentInsertionPoint && (Date.now() - currentInsertionPoint.timestamp >= 10000)) {
    currentInsertionPoint = null;
  }
  
  // Look for block containers with data-block-id in Rise
  const blockContainers = document.querySelectorAll('[data-block-id]');
  
  if (blockContainers.length > 0) {
    console.log(`📦 Found ${blockContainers.length} Rise blocks with data-block-id`);
    
    // If we have a stored insertion point, try to find the closest block
    if (currentInsertionPoint && currentInsertionPoint.button) {
      const buttonRect = currentInsertionPoint.button.getBoundingClientRect();
      let closestBlock = null;
      let minDistance = Infinity;
      
      blockContainers.forEach(block => {
        const blockRect = block.getBoundingClientRect();
        const distance = Math.abs(blockRect.top - buttonRect.top);
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block;
        }
      });
      
      if (closestBlock) {
        console.log(`🎯 Found closest block for insertion: ${closestBlock.getAttribute('data-block-id')}`);
        return closestBlock;
      }
    } else {
      // Default to the last block
      const lastBlock = blockContainers[blockContainers.length - 1];
      console.log(`📍 Using last block for insertion: ${lastBlock.getAttribute('data-block-id')}`);
      return lastBlock;
    }
  }
  
  // Fallback: Look for active insertion indicators in Rise
  const indicators = [
    '.insertion-indicator',
    '.add-block-indicator', 
    '.block-insertion-point',
    '[class*="insertion"]',
    '[data-insertion]',
    '.drop-zone--active',
    '.drop-target',
    '[data-testid*="insertion"]',
    '.lesson-builder__insertion',
    '.content-insertion-point'
  ];
  
  for (const selector of indicators) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('📍 Found active insertion point:', selector);
      return element;
    }
  }
  
  // Enhanced search for Rise 360 specific patterns including Froala containers
  const riseInsertionSelectors = [
    '.lesson-builder .block:last-child',
    '[data-testid="lesson-content"] > *:last-child',
    '.lesson-content > div:last-child',
    '.content-area > div:last-child',
    '.fr-box:last-child',
    '.fr-view:last-child',
    '.block-text:last-child'
  ];
  
  for (const selector of riseInsertionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('📍 Found Rise insertion point (last block):', selector);
      return element;
    }
  }
  
  return null;
}

async function insertCompareContrastBlockAtPosition(insertionPoint) {
  try {
    // Get default configuration
    const defaultConfig = {
      title: 'Compare & Contrast',
      prompt: 'Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.',
      idealResponse: 'An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.',
      placeholder: 'Type your response here...'
    };
    
    // Save the interaction
    const interactionId = Date.now().toString();
    await StorageManager.saveInteraction(interactionId, defaultConfig);
    
    // Create the HTML
    const interactionHTML = uiManager.createInteractionHTML(interactionId, defaultConfig);
    const container = document.createElement('div');
    container.innerHTML = interactionHTML;
    const interactionElement = container.firstElementChild;
    
    // Add controls for authoring mode
    if (riseIntegration.isAuthoringMode()) {
      interactionManager.addInteractionControls(interactionElement, interactionId);
    }
    
    // Insert at the specific position or fall back to lesson content
    if (insertionPoint && currentInsertionPoint) {
      console.log('📍 Inserting at button-specific insertion point');
      
      // Check if blocks sidebar is open - if so, close it after insertion
      const blocksSidebar = document.querySelector('.blocks-sidebar--open');
      
      // Use the stored insertion point from the button click
      const buttonElement = currentInsertionPoint.button;
      
      // Strategy: Insert right below the "+" button that was clicked
      // Find the block-create container (where the + button is located)
      let targetContainer = buttonElement.closest('.block-create');
      
      if (targetContainer) {
        // Insert our block right before the block-create container
        // This places it immediately below the content that precedes the + button
        targetContainer.parentNode.insertBefore(interactionElement, targetContainer);
        console.log('✅ Inserted block right below the clicked + button');
      } else {
        // Fallback: look for a data-block-id container and insert after it
        let targetBlock = buttonElement.closest('[data-block-id]');
        if (targetBlock) {
          targetBlock.parentNode.insertBefore(interactionElement, targetBlock.nextSibling);
          console.log('✅ Inserted after target block with data-block-id');
        } else {
          // Final fallback: find lesson container and append
          let lessonContainer = buttonElement.closest('[class*="lesson"], [class*="content"], [data-testid*="lesson"]');
          if (lessonContainer) {
            lessonContainer.appendChild(interactionElement);
            console.log('✅ Appended to lesson container (fallback)');
          } else {
            insertionPoint.appendChild(interactionElement);
            console.log('✅ Appended to insertion point (final fallback)');
          }
        }
      }
      
      // Close the blocks sidebar if it's open
      if (blocksSidebar) {
        const closeButton = blocksSidebar.querySelector('[class*="close"], [aria-label*="close"]');
        if (closeButton) {
          closeButton.click();
        }
      }
      
      // Clear the insertion point after successful insertion
      currentInsertionPoint = null;
      
    } else if (insertionPoint) {
      console.log('📍 Inserting at general insertion point');
      insertionPoint.appendChild(interactionElement);
    } else {
      // Fall back to finding the lesson content
      const lessonContent = await findLessonContentInsertionPoint();
      if (lessonContent) {
        lessonContent.appendChild(interactionElement);
        console.log('✅ Compare & Contrast block inserted into lesson content');
      } else {
        console.warn('⚠️ No suitable insertion point found, appending to body');
        document.body.appendChild(interactionElement);
      }
    }
    
    // Initialize interaction functionality
    interactionManager.initializeInteraction(interactionElement);
    
    uiManager.showToast('Compare & Contrast block added!', 'success');
    
  } catch (error) {
    console.error('❌ Error inserting Compare & Contrast block:', error);
    uiManager.showToast('Error adding block', 'error');
  }
}

async function insertCompareContrastBlock() {
  // Legacy function for backward compatibility
  await insertCompareContrastBlockAtPosition(null);
}

async function findLessonContentInsertionPoint() {
  // Look for the main lesson content area where blocks should be inserted
  const selectors = [
    '.lesson-content',
    '.lesson-body', 
    '.content-area',
    '.main-content',
    '[data-testid="lesson-content"]',
    '[class*="lesson"][class*="content"]',
    'main'
  ];

  for (const selector of selectors) {
    const contentArea = document.querySelector(selector);
    if (contentArea) {
      console.log('📝 Found lesson content area:', selector);
      return contentArea;
    }
  }

  return null;
}

// Legacy insertion zone functions removed - now using Block Library integration

// Old insertion zone functions removed - replaced with Block Library integration

// Legacy floating button functions removed - now using native Block Library integration

// Legacy add block button watching removed - now using native Block Library integration

// Navigation change handler
function handleNavigationChange() {
  console.log('Navigation change detected, reinitializing extension');
  setTimeout(() => {
    initializeExtension();
  }, 1000);
}

// Start the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Watch for navigation changes
riseIntegration.observeNavigationChanges(handleNavigationChange);