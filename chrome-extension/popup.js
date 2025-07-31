// Popup script for Rise Compare & Contrast Extension

document.addEventListener('DOMContentLoaded', function() {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const statusDetails = document.getElementById('status-details');
  const helpBtn = document.getElementById('help-btn');
  const configBtn = document.getElementById('config-btn');

  // Check if user is on Rise
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isOnRise = currentTab.url.includes('articulate.com') || 
                     currentTab.url.includes('rise.com');
    
    if (isOnRise) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Ready to use in Rise';
      statusDetails.textContent = 'Extension is active on this Rise page';
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not on Rise';
      statusDetails.textContent = 'Navigate to articulate.com to use this extension';
    }
  });

  // Help button
  helpBtn.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'https://github.com/yourusername/rise-compare-contrast-extension#readme'
    });
  });

  // Configuration button
  configBtn.addEventListener('click', function() {
    openConfigurationModal();
  });

  function openConfigurationModal() {
    // Create configuration modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 400px;
      max-height: 80vh;
      overflow: auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    // Load current configuration
    chrome.storage.local.get(['compareContrastConfig'], function(result) {
      const config = result.compareContrastConfig || {};
      
      modalContent.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Default Configuration</h2>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
            Set default values for new Compare & Contrast blocks
          </p>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Title:</label>
            <input type="text" id="modal-title" value="${config.title || 'Compare & Contrast'}" 
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Prompt:</label>
            <textarea id="modal-prompt" rows="3" 
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; resize: vertical;">${config.prompt || 'Think about a specific situation and describe your approach.'}</textarea>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Ideal Response:</label>
            <textarea id="modal-ideal" rows="4" 
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; resize: vertical;">${config.idealResponse || 'An effective response would typically include clear reasoning and specific examples.'}</textarea>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Placeholder Text:</label>
            <input type="text" id="modal-placeholder" value="${config.placeholder || 'Type your response here...'}" 
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
          </div>
        </div>
        <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; justify-content: flex-end;">
          <button id="modal-cancel" style="padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; border: none; background: #f3f4f6; color: #374151;">Cancel</button>
          <button id="modal-save" style="padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; border: none; background: #3b82f6; color: white;">Save</button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Event listeners
      document.getElementById('modal-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      document.getElementById('modal-save').addEventListener('click', () => {
        const newConfig = {
          title: document.getElementById('modal-title').value,
          prompt: document.getElementById('modal-prompt').value,
          idealResponse: document.getElementById('modal-ideal').value,
          placeholder: document.getElementById('modal-placeholder').value
        };

        chrome.storage.local.set({
          compareContrastConfig: newConfig
        }, () => {
          document.body.removeChild(modal);
          
          // Show success message
          const success = document.createElement('div');
          success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1001;
          `;
          success.textContent = 'Configuration saved!';
          document.body.appendChild(success);
          
          setTimeout(() => {
            if (document.body.contains(success)) {
              document.body.removeChild(success);
            }
          }, 3000);
        });
      });

      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    });
  }
});