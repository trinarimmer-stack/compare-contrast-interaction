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

      // Find insertion point
      const insertionPoint = targetElement || await this.findInsertionPoint();
      if (!insertionPoint) {
        this.uiManager.showToast('Could not find suitable insertion point', 'error');
        return false;
      }

      // Insert the block
      const inserted = DOMUtils.insertAfter(blockElement, insertionPoint);
      if (!inserted) {
        this.uiManager.showToast('Failed to insert interaction block', 'error');
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

      const sibling = direction === 'up' ? element.previousElementSibling : element.nextElementSibling;
      if (!sibling) {
        this.uiManager.showToast(`Cannot move ${direction} - no adjacent element`, 'warning');
        return;
      }

      if (direction === 'up') {
        DOMUtils.insertBefore(element, sibling);
      } else {
        DOMUtils.insertAfter(element, sibling);
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
    // Use Rise integration to find proper insertion point
    if (window.riseIntegration) {
      const insertionPoint = await window.riseIntegration.findBlockInsertionPoint();
      if (insertionPoint) {
        return insertionPoint;
      }
    }

    // Fallback to basic selectors if Rise integration isn't available
    const selectors = [
      '.lesson-content .block:last-child',
      '.lesson-body .block:last-child', 
      '.content-area .block:last-child',
      '.main-content .block:last-child',
      '[data-testid="lesson-content"] .block:last-child'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    return null;
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