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
        // Reduced threshold - Rise 360 may not need 500+ elements to be functional
        if (elementCount < 150) {
          console.log(`[Rise Extension] Page still loading (${elementCount} elements), waiting...`);
          if (attempts < maxAttempts) {
            setTimeout(checkForRise, 1000);
            return;
          }
        }
        
        // Also check if Rise-specific elements are present - if so, proceed regardless of element count
        const hasRiseElements = document.querySelector('[class*="authoring"]') || 
                               document.querySelector('[data-testid*="course"]') ||
                               document.querySelector('[data-testid*="lesson"]') ||
                               document.querySelector('.blocks-authoring');
        
        if (!hasRiseElements && elementCount < 300 && attempts < maxAttempts) {
          console.log(`[Rise Extension] No Rise elements detected yet (${elementCount} elements), waiting...`);
          setTimeout(checkForRise, 1000);
          return;
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
    
    button.addEventListener('click', () => {
      console.log('[Rise Extension] Compare & Contrast button clicked - opening config modal');
      window.openConfigModal();
    });
    return button;
  }

  // Make insertCompareContrastBlock globally available
  window.insertCompareContrastBlock = function() {
    console.log('[Rise Extension] insertCompareContrastBlock called');
    
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

    // Find the current cursor position or active block area - try multiple Rise 360 selectors
    const activeArea = document.querySelector('.blocks-authoring .blocks-content') ||
                      document.querySelector('.lesson-content') ||
                      document.querySelector('.blocks-content') ||
                      document.querySelector('[data-testid="lesson-content"]') ||
                      document.querySelector('[data-testid="content-area"]') || 
                      document.querySelector('.content-area') ||
                      document.querySelector('.blocks-authoring') ||
                      document.body;

    console.log('[Rise Extension] Active area found:', activeArea);

    // Create a container and insert the interaction
    const container = document.createElement('div');
    container.innerHTML = interactionHtml;
    console.log('[Rise Extension] Container created with HTML');
    
    try {
      activeArea.appendChild(container.firstElementChild);
      console.log('[Rise Extension] Interactive component added to page');
      
      // Inject the actual interactive functionality for preview
      injectInteractiveScript();
      console.log('[Rise Extension] Interactive script injected');
    } catch (error) {
      console.error('[Rise Extension] Error inserting component:', error);
    }
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
            <button class="close-btn">&times;</button>
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
            <button class="save-btn">Save</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for buttons
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');
    const overlay = modal.querySelector('.modal-overlay');
    
    // Close modal events
    closeBtn.addEventListener('click', () => window.closeConfigModal());
    cancelBtn.addEventListener('click', () => window.closeConfigModal());
    
    // Close when clicking outside the modal content
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        window.closeConfigModal();
      }
    });
    
    // Save configuration event
    saveBtn.addEventListener('click', () => window.saveConfiguration());
    
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
    // Get configuration values from the form
    const title = document.getElementById('interaction-title').value;
    const prompt = document.getElementById('interaction-prompt').value;
    const ideal = document.getElementById('interaction-ideal').value;
    const placeholder = document.getElementById('interaction-placeholder').value;

    console.log('[Rise Extension] Saving configuration:', { title, prompt, ideal, placeholder });

    // Store configuration for future use
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          compareContrastConfig: { title, prompt, ideal, placeholder }
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('[Rise Extension] Storage error:', chrome.runtime.lastError);
          }
        });
      }
    } catch (error) {
      console.log('[Rise Extension] Storage access error:', error);
    }

    // Close modal and insert the configured interaction
    closeConfigModal();
    
    // Insert the interaction with custom values
    insertCompareContrastBlockWithConfig(title, prompt, ideal, placeholder);
  };
  
  // Updated function to insert interaction with custom configuration
  function insertCompareContrastBlockWithConfig(title, prompt, ideal, placeholder) {
    console.log('[Rise Extension] Inserting configured interaction:', { title, prompt, ideal, placeholder });
    
    // Check if we're already in the process of adding an interaction to prevent duplicates
    if (window.insertingInteraction) {
      console.log('[Rise Extension] Already inserting interaction, skipping duplicate');
      return;
    }
    
    window.insertingInteraction = true;
    
    const interactionHtml = `
      <div class="compare-contrast-interaction" data-interaction-type="compare-contrast">
        <div class="interaction-container">
          <div class="interaction-preview">
            <div class="preview-header">
              <h3>${title}</h3>
              <p>This is a preview. The interaction will be fully functional when published.</p>
            </div>
            <div class="preview-content">
              <p><strong>Prompt:</strong> ${prompt}</p>
              <textarea placeholder="${placeholder}" disabled></textarea>
              <button disabled>Compare Responses</button>
            </div>
          </div>
          <div class="interaction-config">
            <button class="config-btn" onclick="window.openConfigModal()">Edit Configuration</button>
          </div>
        </div>
      </div>
    `;

    // Store the configuration in the HTML for the interaction script
    const configData = JSON.stringify({ title, prompt, ideal, placeholder });
    const fullHtml = interactionHtml.replace(
      'data-interaction-type="compare-contrast"',
      `data-interaction-type="compare-contrast" data-config='${configData}'`
    );

    // Find the correct content insertion point in Rise 360
    const possibleTargets = [
      // Try lesson content areas first
      '.lesson-blocks',
      '.lesson-content .blocks',
      '.lesson-content',
      '.blocks-content',
      '.content-blocks',
      '[data-testid="lesson-content"]',
      '[data-testid="content-area"]',
      '.content-area',
      // Then try blocks authoring areas
      '.blocks-authoring .lesson-blocks',
      '.blocks-authoring .blocks-content', 
      '.blocks-authoring .content-area',
      // Finally fallback to main authoring area
      '.blocks-authoring'
    ];
    
    let activeArea = null;
    for (const selector of possibleTargets) {
      activeArea = document.querySelector(selector);
      if (activeArea) {
        console.log(`[Rise Extension] Found content area with selector: ${selector}`);
        console.log('[Rise Extension] Content area details:', {
          className: activeArea.className,
          childCount: activeArea.children.length,
          firstChild: activeArea.children[0]?.tagName,
          size: `${activeArea.offsetWidth}x${activeArea.offsetHeight}`
        });
        break;
      }
    }
    
    if (!activeArea) {
      activeArea = document.body;
      console.log('[Rise Extension] No specific content area found, using body as fallback');
    }

    console.log('[Rise Extension] Active area found:', activeArea);

    // Create a container and insert the interaction
    const container = document.createElement('div');
    container.innerHTML = fullHtml;
    console.log('[Rise Extension] Container created with configured HTML');
    
    try {
      activeArea.appendChild(container.firstElementChild);
      console.log('[Rise Extension] Configured interactive component added to page');
      
      // Inject the actual interactive functionality for preview
      injectInteractiveScript();
      console.log('[Rise Extension] Interactive script injected');
    } catch (error) {
      console.error('[Rise Extension] Error inserting configured component:', error);
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      window.insertingInteraction = false;
    }, 1000);
  }

  // Initialize the extension - simplified version
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

    // Create floating button (simplified approach - no Block Library detection)
    const createFloatingButton = () => {
      // Check if floating button already exists
      if (document.getElementById('rise-compare-contrast-fab')) {
        console.log('[Rise Extension] Floating button already exists');
        return;
      }
      
      console.log('[Rise Extension] Creating floating action button...');
      const floatingBtn = document.createElement('div');
      floatingBtn.id = 'rise-compare-contrast-fab';
      
      const button = document.createElement('button');
      button.style.cssText = `
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
        display: block;
      `;
      button.textContent = '📝';
      button.title = 'Add Compare & Contrast Block';
      
      // Add event listeners
      button.addEventListener('click', function() {
        console.log('[Rise Extension] Floating button clicked - opening config modal');
        window.openConfigModal();
      });
      
      button.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.1)';
      });
      
      button.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
      });
      
      floatingBtn.appendChild(button);
      document.body.appendChild(floatingBtn);
      console.log('[Rise Extension] Floating button created and shown');
    };

    // Just create the floating button - simplified approach
    createFloatingButton();
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