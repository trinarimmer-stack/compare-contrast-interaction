// Rise Compare & Contrast Extension - Refactored Content Script
import { RiseIntegration } from './modules/rise-integration.js';
import { InteractionManager } from './modules/interaction-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { DOMUtils } from './modules/dom-utils.js';

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