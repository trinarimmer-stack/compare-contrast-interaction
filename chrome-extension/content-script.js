// Rise Compare & Contrast Extension - Content Script
// Injects custom block functionality into Rise authoring interface

(function() {
  'use strict';

  // Wait for Rise interface to load
  function waitForRise() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 200; // Increase attempts for slower loading
      
      const checkForRise = () => {
        attempts++;
        
        // First check if we're on the right URL (authoring interface)
        const isAuthoringUrl = window.location.href.includes('/authoring/') || 
                              window.location.href.includes('/author/') ||
                              window.location.href.includes('/lessons/') ||
                              window.location.href.includes('/course/');
        
        if (!isAuthoringUrl) {
          console.log(`[Rise Extension] Not on authoring page, URL: ${window.location.href}`);
          if (attempts < maxAttempts) {
            setTimeout(checkForRise, 2000); // Wait longer for navigation
            return;
          }
        }
        
        console.log(`[Rise Extension] Attempt ${attempts}: Looking for Rise interface...`);
        
        // Wait for substantial page content to load (Rise editor is complex)
        const elementCount = document.querySelectorAll('*').length;
        if (elementCount < 500) {
          console.log(`[Rise Extension] Page still loading (${elementCount} elements), waiting...`);
          if (attempts < maxAttempts) {
            setTimeout(checkForRise, 1000);
            return;
          }
        }
        
        // Look for various Rise interface elements with more specific course editor selectors
        const selectors = [
          // Course editor specific
          '[data-testid="lesson-editor"]',
          '[data-testid="course-editor"]', 
          '[data-testid="authoring-workspace"]',
          '[data-testid="content-editor"]',
          '[data-testid="lesson-content"]',
          '[data-testid="editor-content"]',
          '[class*="lesson-editor"]',
          '[class*="course-editor"]',
          '[class*="editor-container"]',
          '[class*="authoring"]',
          '[class*="workspace"]',
          // Block/content areas
          '[data-testid="block-menu"]',
          '[data-testid="content-blocks"]',
          '[data-testid="block-palette"]',
          '[data-testid="lesson-blocks"]',
          '.block-menu',
          '[class*="block-menu"]',
          '[class*="block-list"]',
          '[class*="block-palette"]',
          '[class*="content-area"]',
          '[data-testid="content-area"]',
          '.content-area',
          // Sidebars and panels
          '[data-testid="sidebar"]',
          '[data-testid="left-sidebar"]',
          '[data-testid="right-sidebar"]',
          '[class*="sidebar"]',
          '.lesson-sidebar',
          '[class*="panel"]',
          '[class*="toolbar"]',
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
        
        // Log diagnostic info every attempt for now to understand the page structure
        let totalElements = 0;
        if (attempts === 1 || attempts % 5 === 0) {
          // Get first 20 data-testid attributes
          const dataTestIds = Array.from(document.querySelectorAll('[data-testid]')).slice(0, 20).map(el => el.getAttribute('data-testid'));
          console.log(`[Rise Extension] Found data-testids:`, dataTestIds);
          
          // Test each data-testid as a potential target
          
          // Get first 30 relevant class names
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
                c.includes('authoring') || c.includes('Authoring') ||
                c.includes('menu') || c.includes('Menu') ||
                c.includes('toolbar') || c.includes('Toolbar')
              );
            }
            return [];
          }).flat().filter(c => c).slice(0, 30);
          
          // Get page structure info
          totalElements = document.querySelectorAll('*').length;
          console.log(`[Rise Extension] Page analysis:`, {
            url: window.location.href,
            title: document.title,
            totalElements: totalElements,
            divCount: document.querySelectorAll('div').length,
            dataTestIds: dataTestIds,
            relevantClasses: [...new Set(relevantClasses)],
            hasReactRoot: !!document.querySelector('#root, [data-reactroot]'),
            mainElement: !!document.querySelector('main, [role="main"]'),
            bodyId: document.body?.id || 'no-id',
            htmlClasses: document.documentElement?.className || 'no-classes',
            bodyFirstChild: document.body?.firstElementChild?.tagName,
            bodyFirstChildId: document.body?.firstElementChild?.id,
            bodyFirstChildClasses: document.body?.firstElementChild?.className
          });
          
          // Look for any buttons or navigation elements
          const buttons = Array.from(document.querySelectorAll('button')).slice(0, 10).map(btn => ({
            text: btn.textContent?.trim().substring(0, 50),
            classes: btn.className,
            dataTestId: btn.getAttribute('data-testid')
          }));
          console.log(`[Rise Extension] Found buttons:`, buttons);
        } else {
          // Still need to check element count on every attempt
          totalElements = document.querySelectorAll('*').length;
        }
        
        // Check if page has loaded enough content
        if (totalElements < 500) {
          console.log(`[Rise Extension] Page still loading (${totalElements} elements), waiting...`);
          if (attempts < maxAttempts) {
            const delay = attempts < 20 ? 1000 : 500;
            setTimeout(checkForRise, delay);
            return;
          }
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
          // Wait longer for React app to load
          const delay = attempts < 20 ? 1000 : 500; // 1 second for first 20 attempts, then 500ms
          setTimeout(checkForRise, delay);
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
    
    // Method 1: Try to find and add to Block Library
    const tryAddToBlockMenu = () => {
      // First, let's search for any elements containing "Block Library" text
      const allElements = document.querySelectorAll('*');
      const blockLibraryElements = Array.from(allElements).filter(el => {
        const text = el.textContent || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        return text.includes('Block Library') || ariaLabel.includes('Block Library') || title.includes('Block Library');
      });
      
      if (blockLibraryElements.length > 0) {
        console.log('[Rise Extension] Found elements containing "Block Library":', blockLibraryElements.map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100),
          ariaLabel: el.getAttribute('aria-label'),
          dataTestId: el.getAttribute('data-testid'),
          parent: el.parentElement?.tagName,
          parentClass: el.parentElement?.className?.substring(0, 100)
        })));
        
        // Look for the actual Block Library sidebar/panel
        const potentialPanels = blockLibraryElements.filter(el => {
          // Skip the HTML root element
          if (el.tagName === 'HTML') return false;
          
          // Look for elements that are likely sidebar containers
          const isPanel = el.tagName === 'DIV' || el.tagName === 'ASIDE' || el.tagName === 'SECTION';
          const hasBlockLibraryText = el.textContent?.includes('Block Library');
          const hasChildren = el.children && el.children.length > 0;
          const hasReasonableSize = el.offsetHeight > 50 && el.offsetWidth > 200;
          const notTooLarge = el.offsetHeight < window.innerHeight && el.offsetWidth < window.innerWidth;
          
          return isPanel && hasBlockLibraryText && hasChildren && hasReasonableSize && notTooLarge;
        });
        
        console.log('[Rise Extension] Potential Block Library panels:', potentialPanels.map(panel => ({
          tag: panel.tagName,
          className: panel.className,
          id: panel.id,
          size: `${panel.offsetWidth}x${panel.offsetHeight}`,
          childCount: panel.children.length,
          firstChild: panel.children[0]?.tagName,
          textPreview: panel.textContent?.substring(0, 100)
        })));
        
        const blockLibraryPanel = potentialPanels[0]; // Take the first viable candidate
        
        if (blockLibraryPanel) {
          console.log('[Rise Extension] Selected Block Library panel:', {
            element: blockLibraryPanel,
            className: blockLibraryPanel.className,
            id: blockLibraryPanel.id,
            size: `${blockLibraryPanel.offsetWidth}x${blockLibraryPanel.offsetHeight}`,
            children: Array.from(blockLibraryPanel.children).slice(0, 5).map(child => ({
              tag: child.tagName,
              className: child.className,
              id: child.id,
              textContent: child.textContent?.substring(0, 50)
            }))
          });
        }
      }
      
      const selectors = [
        // Block Library specific selectors
        '[data-testid*="block-library"]',
        '[data-testid*="Block-Library"]',
        '[aria-label*="Block Library"]',
        '[title*="Block Library"]',
        '.block-library',
        '[class*="block-library"]',
        '[class*="Block-Library"]',
        // Legacy selectors
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
      
      console.log('[Rise Extension] Searching for Block Library with selectors...');
      
      for (const selector of selectors) {
        const menu = document.querySelector(selector);
        if (menu) {
          console.log(`[Rise Extension] Found potential menu with selector: ${selector}`);
          console.log('[Rise Extension] Menu element details:', {
            tagName: menu.tagName,
            className: menu.className,
            id: menu.id,
            childCount: menu.children.length,
            textContent: menu.textContent?.substring(0, 100),
            size: `${menu.offsetWidth}x${menu.offsetHeight}`
          });
          
          // Check if button already exists
          if (menu.querySelector('.compare-contrast-block-btn')) {
            console.log('[Rise Extension] Button already exists in menu');
            return true;
          }
          
          // Log what we're about to do
          console.log('[Rise Extension] Attempting to create and append button...');
          
          try {
            const customButton = createCompareContrastButton();
            console.log('[Rise Extension] Button created successfully:', customButton);
            
            menu.appendChild(customButton);
            console.log('[Rise Extension] Button appended successfully to menu');
            
            // Verify it was actually added
            const verifyButton = menu.querySelector('.compare-contrast-block-btn');
            if (verifyButton) {
              console.log('[Rise Extension] Button verified in DOM');
              return true;
            } else {
              console.log('[Rise Extension] Button not found after append - continuing search...');
            }
          } catch (error) {
            console.log('[Rise Extension] Error creating/appending button:', error);
          }
        }
      }
      console.log('[Rise Extension] No suitable block menu found');
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