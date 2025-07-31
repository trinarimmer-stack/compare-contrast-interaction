// Rise Compare & Contrast Extension - Content Script
// Injects custom block functionality into Rise authoring interface

(function() {
  'use strict';

  // Wait for Rise interface to load
  function waitForRise() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 25 seconds total
      
      const checkForRise = () => {
        attempts++;
        console.log(`[Rise Extension] Attempt ${attempts}: Looking for Rise interface...`);
        console.log(`[Rise Extension] Current URL: ${window.location.href}`);
        console.log(`[Rise Extension] Document ready state: ${document.readyState}`);
        
        // Log what we can find in the page
        const bodyClasses = document.body ? document.body.className : 'no body';
        console.log(`[Rise Extension] Body classes: ${bodyClasses}`);
        
        // Look for various Rise interface elements with more specific course editor selectors
        const selectors = [
          // Course editor specific
          '[data-testid="lesson-editor"]',
          '[data-testid="course-editor"]',
          '[class*="lesson-editor"]',
          '[class*="course-editor"]',
          '[class*="editor-container"]',
          '[class*="authoring"]',
          // Block/content areas
          '[data-testid="block-menu"]',
          '.block-menu',
          '[class*="block-menu"]',
          '[class*="block-list"]',
          '[class*="content-area"]',
          '[data-testid="content-area"]',
          '.content-area',
          // Sidebars and panels
          '[data-testid="sidebar"]',
          '[class*="sidebar"]',
          '.lesson-sidebar',
          '[class*="panel"]',
          // Generic Rise elements
          '[class*="rise"]',
          '[data-cy="block-menu"]',
          // React and main elements
          '#root',
          '[data-reactroot]',
          'main',
          '[role="main"]',
          '.main-content'
        ];
        
        // Log diagnostic info every few attempts
        if (attempts % 3 === 0) {
          // Get all elements with meaningful attributes
          const allDataAttrs = Array.from(document.querySelectorAll('[data-*]')).slice(0, 10).map(el => {
            const attrs = {};
            for (let attr of el.attributes) {
              if (attr.name.startsWith('data-')) attrs[attr.name] = attr.value;
            }
            return { tagName: el.tagName, attrs };
          });
          
          // Get all class names that might be relevant
          const relevantClasses = Array.from(document.querySelectorAll('*')).map(el => {
            const className = el.className;
            if (typeof className === 'string' && className) {
              return className.split(' ').filter(c => 
                c.includes('rise') || c.includes('Rise') || 
                c.includes('lesson') || c.includes('Lesson') ||
                c.includes('editor') || c.includes('Editor') ||
                c.includes('course') || c.includes('Course') ||
                c.includes('content') || c.includes('Content') ||
                c.includes('block') || c.includes('Block') ||
                c.includes('sidebar') || c.includes('Sidebar') ||
                c.includes('authoring') || c.includes('Authoring')
              );
            }
            return [];
          }).flat().filter(c => c).slice(0, 20);
          
          console.log(`[Rise Extension] Comprehensive diagnostic:`, {
            totalElements: document.querySelectorAll('*').length,
            divCount: document.querySelectorAll('div').length,
            dataTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
            allDataAttrs: allDataAttrs,
            relevantClasses: [...new Set(relevantClasses)],
            hasReactRoot: !!document.querySelector('#root, [data-reactroot]'),
            mainElement: !!document.querySelector('main, [role="main"]'),
            bodyId: document.body?.id || 'no-id',
            htmlClasses: document.documentElement?.className || 'no-classes'
          });
        }
        
        let riseInterface = null;
        for (const selector of selectors) {
          riseInterface = document.querySelector(selector);
          if (riseInterface) {
            console.log(`[Rise Extension] Found Rise interface using selector: ${selector}`);
            console.log(`[Rise Extension] Element classes: ${riseInterface.className}`);
            break;
          }
        }
        
        if (riseInterface || attempts >= maxAttempts) {
          if (riseInterface) {
            resolve(riseInterface);
          } else {
            console.log('[Rise Extension] Max attempts reached, resolving with body');
            resolve(document.body);
          }
        } else {
          setTimeout(checkForRise, 500);
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

  // Make insertCompareContrastBlock globally available
  window.insertCompareContrastBlock = function() {
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

    // Store configuration for the interaction with error handling
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          compareContrastConfig: { title, prompt, ideal, placeholder }
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('[Rise Extension] Storage error:', chrome.runtime.lastError);
          }
        });
      } else {
        console.log('[Rise Extension] Chrome storage API not available');
      }
    } catch (error) {
      console.log('[Rise Extension] Storage access error:', error);
    }

    closeConfigModal();
  };

  // Initialize the extension
  function initializeExtension() {
    console.log('[Rise Extension] Initializing on:', window.location.href);
    
    // Add custom CSS if not already added
    if (!document.getElementById('compare-contrast-styles')) {
      const style = document.createElement('link');
      style.id = 'compare-contrast-styles';
      style.rel = 'stylesheet';
      style.href = chrome.runtime.getURL('styles.css');
      document.head.appendChild(style);
    }

    // Try multiple approaches to add the custom block
    console.log('[Rise Extension] Starting block insertion attempts...');
    
    // Method 1: Try to find and add to existing block menu
    const tryAddToBlockMenu = () => {
      const selectors = [
        '[data-testid="block-menu"]',
        '.block-menu', 
        '[class*="block-palette"]',
        '[class*="block-list"]',
        '[class*="sidebar"]',
        '.lesson-sidebar',
        '[data-testid="sidebar"]',
        '[class*="lesson"]',
        '[class*="editor"]'
      ];
      
      for (const selector of selectors) {
        const menu = document.querySelector(selector);
        if (menu) {
          // Check if button already exists
          if (menu.querySelector('.compare-contrast-block-btn')) {
            console.log('[Rise Extension] Button already exists in menu');
            return true;
          }
          console.log(`[Rise Extension] Found block menu with selector: ${selector}`);
          const customButton = createCompareContrastButton();
          menu.appendChild(customButton);
          return true;
        }
      }
      return false;
    };
    
    // Method 2: Create floating action button if block menu not found
    const createFloatingButton = () => {
      // Check if floating button already exists
      if (document.getElementById('rise-compare-contrast-fab')) {
        console.log('[Rise Extension] Floating button already exists');
        return;
      }
      
      console.log('[Rise Extension] Creating floating action button...');
      const floatingBtn = document.createElement('div');
      floatingBtn.id = 'rise-compare-contrast-fab';
      floatingBtn.innerHTML = `
        <button style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0066cc;
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="insertCompareContrastBlock()" title="Add Compare & Contrast Block">
          📝
        </button>
      `;
      document.body.appendChild(floatingBtn);
    };
    
    // Try both methods with delays
    setTimeout(() => {
      if (!tryAddToBlockMenu()) {
        console.log('[Rise Extension] Block menu not found, trying floating button...');
        createFloatingButton();
      }
    }, 2000);
    
    // Try again after longer delay for course editor
    setTimeout(() => {
      if (!document.getElementById('rise-compare-contrast-fab') && !document.querySelector('.compare-contrast-block-btn')) {
        tryAddToBlockMenu() || createFloatingButton();
      }
    }, 5000);
  }

  // Watch for navigation changes (SPA routing)
  function watchForNavigation() {
    let currentUrl = window.location.href;
    
    // Watch for URL changes
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('[Rise Extension] Navigation detected to:', currentUrl);
        
        // Re-initialize when navigating to course editor
        if (currentUrl.includes('/lessons/') || currentUrl.includes('/course/')) {
          setTimeout(() => {
            waitForRise().then(initializeExtension);
          }, 1000);
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also listen for pushstate/popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        waitForRise().then(initializeExtension);
      }, 1000);
    });
  }

  // Initial load
  waitForRise().then(() => {
    initializeExtension();
    watchForNavigation();
  });

})();