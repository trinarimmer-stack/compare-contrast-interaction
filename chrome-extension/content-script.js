// Rise Compare & Contrast Extension - Content Script
// Injects custom block functionality into Rise authoring interface

(function() {
  'use strict';

  // Wait for Rise interface to load
  function waitForRise() {
    return new Promise((resolve) => {
      const checkForRise = () => {
        // Look for Rise's block menu or authoring interface
        const riseInterface = document.querySelector('[data-testid="block-menu"]') || 
                             document.querySelector('.block-menu') ||
                             document.querySelector('[class*="block"]');
        
        if (riseInterface) {
          resolve(riseInterface);
        } else {
          setTimeout(checkForRise, 1000);
        }
      };
      checkForRise();
    });
  }

  // Create custom block button
  function createCompareContrastButton() {
    const button = document.createElement('div');
    button.className = 'compare-contrast-block-btn';
    button.innerHTML = `
      <div class="custom-block-item">
        <div class="block-icon">📝</div>
        <div class="block-label">Compare & Contrast</div>
        <div class="block-description">Interactive comparison activity</div>
      </div>
    `;
    
    button.addEventListener('click', insertCompareContrastBlock);
    return button;
  }

  // Insert the interaction into the course
  function insertCompareContrastBlock() {
    const interactionHtml = `
      <div class="compare-contrast-interaction" data-interaction-type="compare-contrast">
        <div class="interaction-container">
          <div class="interaction-preview">
            <div class="preview-header">
              <h3>📝 Compare & Contrast Activity</h3>
              <p>Interactive learning component - will be functional in published course</p>
            </div>
            <div class="preview-content">
              <textarea placeholder="Students will type their response here..." readonly></textarea>
              <button disabled>Compare Responses</button>
            </div>
          </div>
          <div class="interaction-config">
            <button class="config-btn" onclick="openConfigModal(this)">⚙️ Configure</button>
          </div>
        </div>
      </div>
    `;

    // Find the current cursor position or active block area
    const activeArea = document.querySelector('[data-testid="content-area"]') || 
                      document.querySelector('.content-area') ||
                      document.body;

    // Create a container and insert the interaction
    const container = document.createElement('div');
    container.innerHTML = interactionHtml;
    activeArea.appendChild(container.firstElementChild);

    // Inject the actual interactive functionality for preview
    injectInteractiveScript();
  }

  // Inject the full interactive component for course preview/publish
  function injectInteractiveScript() {
    if (document.getElementById('compare-contrast-script')) return;

    const script = document.createElement('script');
    script.id = 'compare-contrast-script';
    script.src = chrome.runtime.getURL('interaction.js');
    document.head.appendChild(script);
  }

  // Configuration modal for customizing the interaction
  function createConfigModal() {
    const modal = document.createElement('div');
    modal.className = 'compare-contrast-config-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Configure Compare & Contrast</h3>
            <button class="close-btn" onclick="closeConfigModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Title:</label>
              <input type="text" id="interaction-title" value="Compare & Contrast" />
            </div>
            <div class="form-group">
              <label>Prompt:</label>
              <textarea id="interaction-prompt" rows="3">Think about a specific situation and describe your approach.</textarea>
            </div>
            <div class="form-group">
              <label>Ideal Response:</label>
              <textarea id="interaction-ideal" rows="4">An effective response would typically include clear reasoning and specific examples.</textarea>
            </div>
            <div class="form-group">
              <label>Placeholder Text:</label>
              <input type="text" id="interaction-placeholder" value="Type your response here..." />
            </div>
          </div>
          <div class="modal-footer">
            <button onclick="saveConfiguration()">Save</button>
            <button onclick="closeConfigModal()">Cancel</button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  // Make functions globally available
  window.openConfigModal = function(element) {
    const modal = createConfigModal();
    document.body.appendChild(modal);
  };

  window.closeConfigModal = function() {
    const modal = document.querySelector('.compare-contrast-config-modal');
    if (modal) modal.remove();
  };

  window.saveConfiguration = function() {
    // Save configuration and update the interaction
    const title = document.getElementById('interaction-title').value;
    const prompt = document.getElementById('interaction-prompt').value;
    const ideal = document.getElementById('interaction-ideal').value;
    const placeholder = document.getElementById('interaction-placeholder').value;

    // Store configuration for the interaction
    chrome.storage.local.set({
      compareContrastConfig: { title, prompt, ideal, placeholder }
    });

    closeConfigModal();
  };

  // Initialize when Rise loads
  waitForRise().then(() => {
    console.log('Rise interface detected, initializing Compare & Contrast extension...');
    
    // Add custom CSS
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = chrome.runtime.getURL('styles.css');
    document.head.appendChild(style);

    // Try to add the custom block to Rise's interface
    // This will need to be adapted based on Rise's actual DOM structure
    setTimeout(() => {
      const blockMenu = document.querySelector('[data-testid="block-menu"]') || 
                       document.querySelector('.block-menu');
      
      if (blockMenu) {
        const customButton = createCompareContrastButton();
        blockMenu.appendChild(customButton);
      }
    }, 2000);
  });

})();