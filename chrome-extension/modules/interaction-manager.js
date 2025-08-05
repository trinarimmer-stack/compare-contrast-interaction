// Interaction management logic
import { StorageManager } from './storage-manager.js';
import { UIManager } from './ui-manager.js';
import { DOMUtils } from './dom-utils.js';

export class InteractionManager {
  constructor() {
    this.storageManager = new StorageManager();
    this.uiManager = new UIManager();
    this.currentEditingId = null;
    this.eventHandlers = new Map();
  }

  async saveConfiguration(config, interactionId = null) {
    try {
      const id = interactionId || this.generateInteractionId();
      const success = await this.storageManager.saveInteraction(id, config);
      
      if (success) {
        this.uiManager.showToast('Configuration saved successfully', 'success');
        return id;
      } else {
        this.uiManager.showToast('Failed to save configuration', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.uiManager.showToast('Error saving configuration', 'error');
      return null;
    }
  }

  async loadConfiguration(interactionId) {
    try {
      const config = await this.storageManager.getInteraction(interactionId);
      if (config) {
        return config;
      } else {
        this.uiManager.showToast('Configuration not found', 'warning');
        return null;
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.uiManager.showToast('Error loading configuration', 'error');
      return null;
    }
  }

  async deleteInteraction(interactionId) {
    try {
      const success = await this.storageManager.deleteInteraction(interactionId);
      
      if (success) {
        // Remove from DOM
        const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
        if (element) {
          DOMUtils.safeRemove(element);
        }
        
        this.uiManager.showToast('Interaction deleted successfully', 'success');
        return true;
      } else {
        this.uiManager.showToast('Failed to delete interaction', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error deleting interaction:', error);
      this.uiManager.showToast('Error deleting interaction', 'error');
      return false;
    }
  }

  async insertInteractionBlock(config, targetElement = null) {
    try {
      const interactionId = await this.saveConfiguration(config);
      if (!interactionId) {
        return false;
      }

      const html = this.uiManager.createInteractionHTML(interactionId, config);
      const blockElement = DOMUtils.createElement(html);
      
      if (!blockElement) {
        this.uiManager.showToast('Failed to create interaction element', 'error');
        return false;
      }

      // Find lesson container directly and append to it
      const lessonContainer = document.querySelector('[data-testid="lesson-content"], .lesson-content, .lesson-body, .content-area, .main-content');
      
      if (lessonContainer) {
        console.log('✅ Appending interaction to lesson container:', lessonContainer);
        lessonContainer.appendChild(blockElement);
      } else {
        console.warn('❌ No Rise lesson container found - using fallback');
        this.uiManager.showToast('Cannot find lesson content area', 'error');
        return false;
      }

      // Add controls and initialize
      this.addInteractionControls(blockElement, interactionId);
      this.initializeInteraction(blockElement);
      
      this.uiManager.showToast('Interaction added successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error inserting interaction block:', error);
      this.uiManager.showToast('Error inserting interaction block', 'error');
      return false;
    }
  }

  addInteractionControls(container, interactionId) {
    try {
      const controls = this.uiManager.createInteractionControls(interactionId);
      container.appendChild(controls);

      // Add event listeners
      this.addControlEventListeners(controls, interactionId);
    } catch (error) {
      console.error('Error adding interaction controls:', error);
    }
  }

  addControlEventListeners(controls, interactionId) {
    const handlers = {
      '.edit-btn': () => this.editInteraction(interactionId),
      '.move-up-btn': () => this.moveInteraction(interactionId, 'up'),
      '.move-down-btn': () => this.moveInteraction(interactionId, 'down'),
      '.delete-btn': () => this.confirmDeleteInteraction(interactionId)
    };

    Object.entries(handlers).forEach(([selector, handler]) => {
      const button = controls.querySelector(selector);
      if (button) {
        const wrappedHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handler();
        };
        
        DOMUtils.addEventListenerSafe(button, 'click', wrappedHandler);
        
        // Store handler for cleanup
        if (!this.eventHandlers.has(interactionId)) {
          this.eventHandlers.set(interactionId, []);
        }
        this.eventHandlers.get(interactionId).push({
          element: button,
          event: 'click',
          handler: wrappedHandler
        });
      }
    });
  }

  async editInteraction(interactionId) {
    try {
      const config = await this.loadConfiguration(interactionId);
      if (!config) {
        return;
      }

      this.currentEditingId = interactionId;
      this.openConfigModal(config);
    } catch (error) {
      console.error('Error editing interaction:', error);
      this.uiManager.showToast('Error editing interaction', 'error');
    }
  }

  moveInteraction(interactionId, direction) {
    try {
      const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
      if (!element) {
        this.uiManager.showToast('Interaction element not found', 'error');
        return;
      }

      // Find the lesson container
      const lessonContainer = document.querySelector('[data-testid="lesson-content"], .lesson-content, .lesson-body, .content-area, .main-content');
      if (!lessonContainer) {
        this.uiManager.showToast('Cannot find lesson content area', 'error');
        return;
      }

      // Get all content blocks within the lesson container (including interaction blocks)
      const contentBlocks = Array.from(lessonContainer.children).filter(child => {
        // Include interaction blocks and typical Rise content blocks
        return child.hasAttribute('data-interaction-id') || 
               child.classList.contains('block') ||
               child.classList.contains('content-block') ||
               child.tagName === 'DIV' && child.children.length > 0;
      });

      const currentIndex = contentBlocks.indexOf(element);
      if (currentIndex === -1) {
        this.uiManager.showToast('Interaction not found in content blocks', 'error');
        return;
      }

      let targetIndex;
      if (direction === 'up') {
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) {
          this.uiManager.showToast('Cannot move up - already at the top', 'warning');
          return;
        }
      } else {
        targetIndex = currentIndex + 1;
        if (targetIndex >= contentBlocks.length) {
          this.uiManager.showToast('Cannot move down - already at the bottom', 'warning');
          return;
        }
      }

      const targetElement = contentBlocks[targetIndex];
      
      if (direction === 'up') {
        DOMUtils.insertBefore(element, targetElement);
      } else {
        DOMUtils.insertAfter(element, targetElement);
      }

      this.uiManager.showToast(`Interaction moved ${direction} successfully`, 'success');
    } catch (error) {
      console.error('Error moving interaction:', error);
      this.uiManager.showToast('Error moving interaction', 'error');
    }
  }

  confirmDeleteInteraction(interactionId) {
    if (confirm('Are you sure you want to delete this interaction? This action cannot be undone.')) {
      this.deleteInteraction(interactionId);
    }
  }

  openConfigModal(existingConfig = null) {
    const modal = this.uiManager.createConfigModal();
    document.body.appendChild(modal);

    // Populate form if editing
    if (existingConfig) {
      document.getElementById('interaction-title').value = existingConfig.title || '';
      document.getElementById('interaction-prompt').value = existingConfig.prompt || '';
      document.getElementById('ideal-response').value = existingConfig.idealResponse || '';
      document.getElementById('response-placeholder').value = existingConfig.placeholder || '';
    }

    // Add event listeners
    this.addModalEventListeners(modal);
  }

  addModalEventListeners(modal) {
    const closeModal = () => {
      DOMUtils.safeRemove(modal);
      this.currentEditingId = null;
    };

    // Close button
    const closeBtn = modal.querySelector('#close-modal');
    DOMUtils.addEventListenerSafe(closeBtn, 'click', closeModal);

    // Cancel button
    const cancelBtn = modal.querySelector('#cancel-config');
    DOMUtils.addEventListenerSafe(cancelBtn, 'click', closeModal);

    // Click outside to close
    DOMUtils.addEventListenerSafe(modal, 'click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Form submission
    const form = modal.querySelector('#config-form');
    DOMUtils.addEventListenerSafe(form, 'submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmission(modal);
    });
  }

  async handleFormSubmission(modal) {
    try {
      const config = {
        title: document.getElementById('interaction-title').value.trim(),
        prompt: document.getElementById('interaction-prompt').value.trim(),
        idealResponse: document.getElementById('ideal-response').value.trim(),
        placeholder: document.getElementById('response-placeholder').value.trim()
      };

      // Validation
      if (!config.title || !config.prompt || !config.idealResponse) {
        this.uiManager.showToast('Please fill in all required fields', 'warning');
        return;
      }

      if (this.currentEditingId) {
        // Update existing
        const success = await this.updateExistingInteraction(this.currentEditingId, config);
        if (success) {
          DOMUtils.safeRemove(modal);
          this.currentEditingId = null;
        }
      } else {
        // Create new
        const success = await this.insertInteractionBlock(config);
        if (success) {
          DOMUtils.safeRemove(modal);
        }
      }
    } catch (error) {
      console.error('Error handling form submission:', error);
      this.uiManager.showToast('Error saving configuration', 'error');
    }
  }

  async updateExistingInteraction(interactionId, config) {
    try {
      const success = await this.storageManager.saveInteraction(interactionId, config);
      if (!success) {
        return false;
      }

      // Update DOM element
      const element = document.querySelector(`[data-interaction-id="${interactionId}"]`);
      if (element) {
        const interactionDiv = element.querySelector('[data-compare-contrast-interaction]');
        if (interactionDiv) {
          interactionDiv.setAttribute('data-title', config.title);
          interactionDiv.setAttribute('data-prompt', config.prompt);
          interactionDiv.setAttribute('data-ideal-response', config.idealResponse);
          interactionDiv.setAttribute('data-placeholder', config.placeholder);
          
          // Reinitialize the interaction
          this.initializeInteraction(element);
        }
      }

      this.uiManager.showToast('Interaction updated successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error updating interaction:', error);
      this.uiManager.showToast('Error updating interaction', 'error');
      return false;
    }
  }

  initializeInteraction(container) {
    try {
      const interactionDiv = container.querySelector('[data-compare-contrast-interaction]');
      if (interactionDiv && window.initializeCompareContrastInteraction) {
        window.initializeCompareContrastInteraction(interactionDiv);
      }
    } catch (error) {
      console.error('Error initializing interaction:', error);
    }
  }

  async findInsertionPoint() {
    console.log('🔍 Looking for Rise insertion point...');
    
    // First, try to find the actual Rise lesson content container
    const lessonContainer = document.querySelector('[data-testid="lesson-content"], .lesson-content, .lesson-body, .content-area, .main-content');
    
    if (!lessonContainer) {
      console.warn('❌ No Rise lesson container found');
      return null;
    }

    console.log('📍 Found lesson container:', lessonContainer);

    // Look for actual content blocks within the lesson container, excluding overlays
    const contentBlocks = Array.from(lessonContainer.children).filter(child => {
      const isOverlay = this.isGuideOverlay(child);
      const isFloatingButton = child.id === 'rise-compare-contrast-fab';
      const isCustomContent = child.classList.contains('rise-custom-content-container');
      
      console.log(`🔍 Checking element:`, child.tagName, child.className, {
        isOverlay,
        isFloatingButton, 
        isCustomContent
      });
      
      return !isOverlay && !isFloatingButton && !isCustomContent;
    });

    if (contentBlocks.length > 0) {
      const lastBlock = contentBlocks[contentBlocks.length - 1];
      console.log('✅ Found last content block:', lastBlock);
      return lastBlock;
    }

    // If no content blocks found, use the lesson container itself as insertion point
    console.log('⚠️ No content blocks found, using lesson container as insertion point');
    return lessonContainer;
  }

  isGuideOverlay(element) {
    return element.classList.contains('apt-guide-overlay') || 
           element.className.includes('overlay') ||
           element.className.includes('guide') ||
           element.closest('.apt-guide-overlay');
  }

  generateInteractionId() {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  cleanup(interactionId) {
    // Clean up event listeners
    const handlers = this.eventHandlers.get(interactionId);
    if (handlers) {
      handlers.forEach(({ element, event, handler }) => {
        DOMUtils.removeEventListenerSafe(element, event, handler);
      });
      this.eventHandlers.delete(interactionId);
    }
  }

  async restoreAllInteractions() {
    try {
      // Avoid duplicate restoration in preview mode
      if (document.querySelector('[data-interaction-id]')) {
        console.log('🔄 Interactions already restored, skipping...');
        return;
      }

      const interactions = await this.storageManager.syncFromChromeStorage();
      
      for (const [interactionId, config] of Object.entries(interactions)) {
        await this.restoreInteractionToDOM(interactionId, config);
      }
    } catch (error) {
      console.error('Error restoring interactions:', error);
    }
  }

  async restoreInteractionToDOM(interactionId, config) {
    try {
      // Check if already exists
      const existing = document.querySelector(`[data-interaction-id="${interactionId}"]`);
      if (existing) {
        return;
      }

      // Find insertion point
      const insertionPoint = await this.findInsertionPoint();
      if (!insertionPoint) {
        return;
      }

      // Create and insert
      const html = this.uiManager.createInteractionHTML(interactionId, config);
      const blockElement = DOMUtils.createElement(html);
      
      if (blockElement && DOMUtils.insertAfter(blockElement, insertionPoint)) {
        this.addInteractionControls(blockElement, interactionId);
        this.initializeInteraction(blockElement);
      }
    } catch (error) {
      console.error('Error restoring interaction to DOM:', error);
    }
  }
}