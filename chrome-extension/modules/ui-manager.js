// UI creation and styling utilities
export class UIManager {
  constructor() {
    this.riseClasses = {
      button: 'btn btn--primary btn--small',
      secondaryButton: 'btn btn--secondary btn--small',
      dangerButton: 'btn btn--danger btn--small',
      block: 'block block--mounted block--playback-mode-slides',
      controls: 'block-controls',
      modal: 'modal modal--large',
      input: 'form-control',
      textarea: 'form-control form-control--textarea'
    };
  }

  createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'compare-contrast-fab';
    button.innerHTML = `
      <button class="fab-button" title="Add Compare & Contrast Block">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
    `;
    
    this.applyFloatingButtonStyles(button);
    return button;
  }

  applyFloatingButtonStyles(button) {
    const style = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    `;
    
    button.style.cssText = style;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px) scale(1.05)';
      button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
  }

  createInteractionControls(interactionId) {
    const controls = document.createElement('div');
    controls.className = 'interaction-controls';
    controls.style.cssText = `
      position: absolute;
      top: -10px;
      right: 0;
      z-index: 10002;
      display: flex;
      gap: 4px;
      padding: 4px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    `;

    const buttons = [
      { icon: '✏️', action: 'edit', title: 'Edit', color: '#28a745' },
      { icon: '↑', action: 'move-up', title: 'Move Up', color: '#007bff' },
      { icon: '↓', action: 'move-down', title: 'Move Down', color: '#007bff' },
      { icon: '🗑️', action: 'delete', title: 'Delete', color: '#dc3545' }
    ];

    buttons.forEach(({ icon, action, title, color }) => {
      const button = document.createElement('button');
      button.className = `${action}-btn`;
      button.setAttribute('data-interaction-id', interactionId);
      button.title = title;
      button.textContent = icon;
      
      button.style.cssText = `
        background: ${color};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Add hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        button.style.filter = 'brightness(1.1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
        button.style.filter = 'brightness(1)';
      });

      controls.appendChild(button);
    });

    return controls;
  }

  createConfigModal() {
    const modal = document.createElement('div');
    modal.id = 'compare-contrast-config-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 10003;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
    `;

    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
      ">
        <div class="modal-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e5e5;
        ">
          <h2 style="margin: 0; color: #333; font-size: 20px; font-weight: 600;">Configure Compare & Contrast</h2>
          <button id="close-modal" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          " title="Close">&times;</button>
        </div>
        
        <form id="config-form">
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="interaction-title" style="
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #333;
            ">Title:</label>
            <input type="text" id="interaction-title" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              transition: border-color 0.2s;
            " placeholder="Enter interaction title">
          </div>
          
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="interaction-prompt" style="
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #333;
            ">Prompt:</label>
            <textarea id="interaction-prompt" rows="3" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              resize: vertical;
              transition: border-color 0.2s;
            " placeholder="Enter the prompt/question for learners"></textarea>
          </div>
          
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="ideal-response" style="
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #333;
            ">Ideal Response:</label>
            <textarea id="ideal-response" rows="4" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              resize: vertical;
              transition: border-color 0.2s;
            " placeholder="Enter the ideal/expected response"></textarea>
          </div>
          
          <div class="form-group" style="margin-bottom: 24px;">
            <label for="response-placeholder" style="
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #333;
            ">Response Placeholder:</label>
            <input type="text" id="response-placeholder" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              transition: border-color 0.2s;
            " placeholder="Type your response here...">
          </div>
          
          <div class="modal-actions" style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          ">
            <button type="button" id="cancel-config" style="
              padding: 10px 20px;
              border: 1px solid #ddd;
              background: white;
              color: #666;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            ">Cancel</button>
            <button type="submit" id="save-config" style="
              padding: 10px 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s;
            ">Save Configuration</button>
          </div>
        </form>
      </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalSlideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      #close-modal:hover {
        background-color: #f5f5f5;
      }
      
      #interaction-title:focus,
      #interaction-prompt:focus,
      #ideal-response:focus,
      #response-placeholder:focus {
        border-color: #667eea;
        outline: none;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
      
      #cancel-config:hover {
        background-color: #f8f9fa;
        border-color: #adb5bd;
      }
      
      #save-config:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
    `;
    
    if (!document.getElementById('modal-styles')) {
      style.id = 'modal-styles';
      document.head.appendChild(style);
    }

    return modal;
  }

  createInteractionHTML(interactionId, config) {
    return `
      <div class="block block--mounted block--playbook-mode-slides compare-contrast-container" 
           style="position: relative; margin: 20px 0; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa;" 
           data-block-type="compare-contrast"
           data-interaction-id="${interactionId}">
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
    const existingToast = document.getElementById('extension-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'extension-toast';
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 10004;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: toastSlideIn 0.3s ease-out;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Add animation styles if not already present
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toastSlideIn {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }
}