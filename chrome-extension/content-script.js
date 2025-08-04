// Rise Compare & Contrast Extension - Content Script
// All modules bundled for Chrome extension compatibility

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
      const interactions = this.getLocalInteractions();
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
      const interactions = this.getLocalInteractions();
      return interactions[interactionId] || null;
    } catch (error) {
      console.error('Error getting interaction:', error);
      // Fallback to localStorage
      const interactions = this.getLocalInteractions();
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
      const interactions = this.getLocalInteractions();
      delete interactions[interactionId];
      localStorage.setItem('rise_interactions', JSON.stringify(interactions));
      
      console.log('Interaction deleted:', interactionId);
    } catch (error) {
      console.error('Error deleting interaction:', error);
    }
  }

  static getAllInteractions() {
    return this.getLocalInteractions();
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
    return this.getLocalInteractions();
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
    const container = document.createElement('div');
    container.className = 'compare-contrast-interaction';
    container.setAttribute('data-interaction-id', interactionId);
    container.setAttribute('data-title', config.title || 'Compare & Contrast');
    container.setAttribute('data-prompt', config.prompt || '');
    container.setAttribute('data-ideal-response', config.idealResponse || '');
    container.setAttribute('data-placeholder', config.placeholder || 'Type your response here...');
    
    container.innerHTML = `
        <div class="interaction-content">
          <h3>${config.title || 'Compare & Contrast'}</h3>
          <p>${config.prompt || ''}</p>
          <textarea placeholder="${config.placeholder || 'Type your response here...'}"></textarea>
          <div class="ideal-response" style="display: none;">
            <h4>Ideal Response:</h4>
            <p>${config.idealResponse || ''}</p>
          </div>
          <button class="show-ideal-btn">Show Ideal Response</button>
        </div>
    `;
    
    return container;
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
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkForRise = () => {
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
    this.storageManager = StorageManager;
    this.uiManager = new UIManager();
    this.currentEditingId = null;
    this.eventHandlers = new Map();
  }

  async saveConfiguration(config, interactionId = null) {
    const id = interactionId || this.generateInteractionId();
    await this.storageManager.saveInteraction(id, config);
    return id;
  }

  async loadConfiguration(interactionId) {
    const data = await this.storageManager.getInteraction(interactionId);
    return data ? data.config : null;
  }

  async deleteInteraction(interactionId) {
    // Remove from storage
    await this.storageManager.deleteInteraction(interactionId);
    
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
      
      // Add controls for authoring mode
      const riseIntegration = new RiseIntegration();
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
    if (!element) return;
    
    const sibling = direction === 'up' ? element.previousElementSibling : element.nextElementSibling;
    if (!sibling) return;
    
    if (direction === 'up') {
      element.parentNode.insertBefore(element, sibling);
    } else {
      element.parentNode.insertBefore(sibling, element);
    }
    
    this.uiManager.showToast(`Interaction moved ${direction}`, 'success');
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
      const interactions = this.storageManager.getAllInteractions();
      
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
      
      // Add controls for authoring mode
      const riseIntegration = new RiseIntegration();
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
  return await interactionManager.insertInteractionBlock({
    title: 'Compare & Contrast',
    prompt: 'Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.',
    idealResponse: 'An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.',
    placeholder: 'Type your response here...'
  });
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
  try {
    console.log('Initializing Compare & Contrast Extension');
    
    // Wait for Rise to load
    await riseIntegration.waitForRise();
    
    // Inject custom styles
    await riseIntegration.injectCustomStyles();
    
    // Inject interactive script
    await riseIntegration.injectInteractiveScript();
    
    // Check if we're in authoring mode
    if (riseIntegration.isAuthoringMode()) {
      console.log('Authoring mode detected');
      
      // Create and add floating action button
      const fab = uiManager.createFloatingButton();
      DOMUtils.addEventListenerSafe(fab, 'click', () => {
        window.openConfigModal();
      });
      document.body.appendChild(fab);
      
      // Restore any saved interactions
      await interactionManager.restoreAllInteractions();
    } else {
      console.log('Preview mode detected - hiding authoring controls');
    }
    
    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

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