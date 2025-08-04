// Rise Compare & Contrast Extension - Content Script
// Injects custom block functionality into Rise authoring interface

(function() {
  'use strict';

  // Function to check if we're in preview mode - available globally
  function isPreviewMode() {
    const url = window.location.href;
    
    // Check URL patterns for actual preview/published content
    const isPreviewUrl = url.includes('/preview') || // Fixed: removed trailing slash requirement
                        url.includes('?preview=') ||
                        url.includes('/share/') ||
                        url.includes('/published/') ||
                        url.includes('/player/') ||
                        url.includes('preview=true') ||
                        url.includes('mode=preview');
    
    // Check for Rise's preview button being active/selected
    const previewButtonActive = document.querySelector('button[data-testid*="preview"]:not([aria-pressed="false"])') ||
                               document.querySelector('button[aria-label*="Preview"]:not([aria-pressed="false"])') ||
                               document.querySelector('button[title*="Preview"]:not([aria-pressed="false"])') ||
                               document.querySelector('.preview-button.active') ||
                               document.querySelector('.preview-button.selected') ||
                               document.querySelector('[role="tab"][aria-selected="true"][data-testid*="preview"]') ||
                               Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]')).find(tab => tab.textContent.includes('Preview'));
    
    // Check for specific preview mode indicators
    const hasPreviewModeIndicator = document.querySelector('[data-testid="PreviewModeIndicator"]') ||
                                   document.querySelector('[data-testid="preview-mode-indicator"]') ||
                                   document.querySelector('[data-mode="preview"]') ||
                                   document.querySelector('[class*="preview-mode"]') ||
                                   document.body.classList.contains('preview-mode') ||
                                   document.documentElement.classList.contains('preview-mode') ||
                                   document.querySelector('.rise-player') ||
                                   document.querySelector('[data-view="preview"]');
    
    // Check if we're in a preview iframe or specific preview context
    const isInPreviewContext = window.top !== window.self || // In iframe
                              document.querySelector('iframe[src*="preview"]') ||
                              document.querySelector('iframe.preview-content__frame') || // Found in logs
                              document.title.toLowerCase().includes('preview') ||
                              document.querySelector('[data-testid*="PreviewFrame"]');
    
    // Check for authoring interface absence (might indicate preview)
    const noAuthoringInterface = !document.querySelector('.blocks-authoring') && 
                                 !document.querySelector('[data-testid*="authoring"]') &&
                                 !document.querySelector('[data-testid*="editor"]') &&
                                 document.querySelectorAll('*').length > 100; // Ensure page is loaded
    
    // Look for preview-specific content or layout
    const hasPreviewContent = document.querySelector('[class*="course-preview"]') ||
                             document.querySelector('[data-testid*="course-preview"]') ||
                             document.querySelector('[class*="lesson-preview"]') ||
                             document.querySelector('[data-testid*="lesson-preview"]');
    
    const isPreview = isPreviewUrl || hasPreviewModeIndicator || isInPreviewContext || previewButtonActive || hasPreviewContent;
    
    // Enhanced logging for debugging
    console.log('[Rise Extension] Preview mode check:', {
      url, 
      isPreviewUrl, 
      previewButtonActive: !!previewButtonActive,
      hasPreviewModeIndicator: !!hasPreviewModeIndicator, 
      isInPreviewContext,
      noAuthoringInterface,
      hasPreviewContent: !!hasPreviewContent,
      isPreview,
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className,
      title: document.title,
      isInIframe: window.top !== window.self,
      allTestIds: Array.from(document.querySelectorAll('[data-testid]')).slice(0, 15).map(el => el.getAttribute('data-testid')),
      authElements: !!document.querySelector('.blocks-authoring'),
      elementCount: document.querySelectorAll('*').length
    });
    
    return isPreview;
  }

  // Wait for Rise interface to load
  function waitForRise() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 200; // Increase attempts for slower loading
      
      const checkForRise = () => {
        attempts++;
        
        console.log(`[Rise Extension] Attempt ${attempts}: Looking for Rise interface...`);
        
        // First check if we're in preview mode - if so, resolve quickly
        if (isPreviewMode()) {
          console.log(`[Rise Extension] Preview mode detected, resolving immediately (attempt ${attempts})`);
          resolve(document.body);
          return;
        }
        
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
        // In preview mode, accept lower element count since there's less UI
        const minElementsRequired = 200;
        if (totalElements < minElementsRequired) {
          console.log(`[Rise Extension] Page still loading (${totalElements} elements, need ${minElementsRequired}), waiting...`);
          if (attempts < maxAttempts) {
            const delay = attempts < 20 ? 1000 : 500;
            setTimeout(checkForRise, delay);
            return;
          }
        }

        let riseInterface = null;
        
        // For authoring mode, look for interface elements
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
            <button class="edit-btn" onclick="editInteraction(this)" style="display: none;">✏️ Edit</button>
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
      
      // Always inject the interactive script so it works in preview mode
      injectInteractiveScript();
      console.log('[Rise Extension] Interactive script injected');
      
      // Force initialization of any interactions on the page
      setTimeout(() => {
        if (window.initializeCompareContrastInteraction) {
          const newInteraction = document.querySelector('[data-interaction-type="compare-contrast"]:not([data-initialized])');
          if (newInteraction) {
            window.initializeCompareContrastInteraction(newInteraction);
          }
        }
      }, 100);
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
    
    // Also add a data attribute to the body to indicate script is loaded
    script.onload = () => {
      document.body.setAttribute('data-compare-contrast-loaded', 'true');
      console.log('[Rise Extension] Interactive script loaded successfully');
    };
    
    document.head.appendChild(script);
    
    // Also inject CSS for the interaction
    if (!document.getElementById('compare-contrast-interaction-css')) {
      const css = document.createElement('style');
      css.id = 'compare-contrast-interaction-css';
      css.textContent = `
        /* Ensure interaction is visible in all modes */
        .compare-contrast-interaction {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          min-height: 200px !important;
        }
        
        /* Hide authoring controls in preview mode */
        body[data-rise-mode="preview"] .interaction-controls,
        body[data-mode="preview"] .interaction-controls,
        body[data-rise-mode="preview"] .interaction-config,
        body[data-mode="preview"] .interaction-config {
          display: none !important;
        }
        
        /* Hide the floating button in preview mode */
        body[data-rise-mode="preview"] #rise-compare-contrast-fab,
        body[data-mode="preview"] #rise-compare-contrast-fab,
        body[data-rise-mode="preview"] .compare-contrast-block-btn,
        body[data-mode="preview"] .compare-contrast-block-btn {
          display: none !important;
        }
        
        /* Ensure interactions show in preview mode with specific selectors */
        .rise-player .compare-contrast-interaction,
        [data-testid="PreviewModeIndicator"] ~ * .compare-contrast-interaction,
        body.preview-mode .compare-contrast-interaction,
        html.preview-mode .compare-contrast-interaction {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          background: #f0f8ff !important;
          border: 2px solid #0066cc !important;
          padding: 20px !important;
          margin: 20px 0 !important;
          border-radius: 8px !important;
        }
      `;
      document.head.appendChild(css);
    }
  }

  // Configuration modal for customizing the interaction
  function createConfigModal(existingConfig = {}) {
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
              <label>Activity Instructions:</label>
              <textarea id="interaction-instructions" rows="3">${existingConfig.activityInstructions || "It's time to reflect on the last SME conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to Julie's recommended approach."}</textarea>
            </div>
            <div class="form-group">
              <label>Prompt:</label>
              <textarea id="interaction-prompt" rows="3">${existingConfig.prompt || "Think about a specific situation and describe your approach."}</textarea>
            </div>
            <div class="form-group">
              <label>Ideal Response:</label>
              <textarea id="interaction-ideal" rows="4">${existingConfig.idealResponse || "An effective response would typically include clear reasoning and specific examples."}</textarea>
            </div>
            <div class="form-group">
              <label>Placeholder Text:</label>
              <input type="text" id="interaction-placeholder" value="${existingConfig.placeholder || "Type your response here..."}" />
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

  // Edit existing interaction function
  window.editInteraction = function(element) {
    const interactionContainer = element.closest('.compare-contrast-interaction');
    if (!interactionContainer) return;
    
    // Get current configuration from the interaction
    const currentConfig = getInteractionConfig(interactionContainer);
    const modal = createConfigModal(currentConfig);
    modal.dataset.editingInteraction = 'true';
    modal.dataset.targetInteraction = interactionContainer.id || 'current';
    document.body.appendChild(modal);
  };

  // Edit interaction by ID function
  function editInteractionById(interactionId) {
    const interactionContainer = document.querySelector(`#${interactionId}`);
    if (!interactionContainer) return;
    
    // Get current configuration from the interaction
    const currentConfig = getInteractionConfig(interactionContainer);
    const modal = createConfigModal(currentConfig);
    modal.dataset.editingInteraction = 'true';
    modal.dataset.targetInteraction = interactionId;
    document.body.appendChild(modal);
  }

  // Helper function to extract current config from interaction
  function getInteractionConfig(interactionElement) {
    try {
      // Try to get from data attribute first
      if (interactionElement.dataset.configBase64) {
        const decodedConfig = atob(interactionElement.dataset.configBase64);
        return JSON.parse(decodedConfig);
      }
      if (interactionElement.dataset.config) {
        return JSON.parse(interactionElement.dataset.config);
      }
    } catch (e) {
      console.log('[Rise Extension] Error parsing existing config:', e);
    }
    
    // Fallback to default values
    return {
      activityInstructions: "It's time to reflect on the last SME conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to Julie's recommended approach.",
      prompt: "Think about a specific situation and describe your approach.",
      idealResponse: "An effective response would typically include clear reasoning and specific examples.",
      placeholder: "Type your response here..."
    };
  }

  window.closeConfigModal = function() {
    const modal = document.querySelector('.compare-contrast-config-modal');
    if (modal) modal.remove();
  };

  window.saveConfiguration = function() {
    const modal = document.querySelector('.compare-contrast-config-modal');
    const isEditing = modal && modal.dataset.editingInteraction === 'true';
    
    // Get configuration values from the form
    const activityInstructions = document.getElementById('interaction-instructions').value;
    const prompt = document.getElementById('interaction-prompt').value;
    const ideal = document.getElementById('interaction-ideal').value;
    const placeholder = document.getElementById('interaction-placeholder').value;

    console.log('[Rise Extension] Saving configuration:', { activityInstructions, prompt, ideal, placeholder });

    // Store configuration for future use
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          compareContrastConfig: { activityInstructions, prompt, idealResponse: ideal, placeholder }
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('[Rise Extension] Storage error:', chrome.runtime.lastError);
          }
        });
      }
    } catch (error) {
      console.log('[Rise Extension] Storage access error:', error);
    }

    // Close modal
    closeConfigModal();
    
    if (isEditing) {
      // Update existing interaction
      updateExistingInteraction(activityInstructions, prompt, ideal, placeholder);
    } else {
      // Insert new interaction with custom values
      insertCompareContrastBlockWithConfig(activityInstructions, prompt, ideal, placeholder);
    }
  };
  
  // Updated function to insert interaction with custom configuration
  function insertCompareContrastBlockWithConfig(activityInstructions, prompt, ideal, placeholder) {
    console.log('[Rise Extension] Inserting configured interaction:', { activityInstructions, prompt, ideal, placeholder });
    
    // Check if we're already in the process of adding an interaction to prevent rapid duplicates
    if (window.insertingInteraction) {
      console.log('[Rise Extension] Already inserting interaction, waiting briefly...');
      setTimeout(() => insertCompareContrastBlockWithConfig(activityInstructions, prompt, ideal, placeholder), 100);
      return;
    }
    
    window.insertingInteraction = true;
    
    // Store the configuration globally so the injected script can access it
    window.compareContrastConfig = { activityInstructions, prompt, idealResponse: ideal, placeholder };
    // Generate unique ID for this interaction
    const interactionId = 'compare-contrast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const configData = JSON.stringify({ activityInstructions, prompt, idealResponse: ideal, placeholder });
    // Use base64 encoding to avoid HTML attribute parsing issues
    const encodedConfigData = btoa(configData);
    
    // Store configuration in localStorage for persistence across mode switches
    const storageKey = `rise-interaction-${interactionId}`;
    localStorage.setItem(storageKey, configData);
    console.log('[Rise Extension] Stored interaction config in localStorage:', storageKey);
    
    const interactionHtml = createInteractionHTML(interactionId, encodedConfigData, prompt, ideal, placeholder);
    
    // Find the correct content insertion point in Rise 360 with detailed analysis
    console.log('[Rise Extension] Analyzing DOM structure to find lesson content...');
    
    // First, let's analyze the blocks-authoring structure
    const blocksAuthoring = document.querySelector('.blocks-authoring');
    if (blocksAuthoring) {
      console.log('[Rise Extension] Blocks authoring structure:', {
        className: blocksAuthoring.className,
        childCount: blocksAuthoring.children.length,
        children: Array.from(blocksAuthoring.children).map((child, index) => ({
          index,
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          childCount: child.children.length,
          textPreview: child.textContent?.substring(0, 100)
        }))
      });
      
      // Look for lesson blocks within the authoring area
      const lessonBlocks = blocksAuthoring.querySelector('.lesson-blocks') ||
                          blocksAuthoring.querySelector('[class*="lesson-blocks"]') ||
                          blocksAuthoring.querySelector('[class*="blocks-container"]') ||
                          blocksAuthoring.querySelector('[class*="content-blocks"]');
      
      if (lessonBlocks) {
        console.log('[Rise Extension] Found lesson blocks container:', {
          className: lessonBlocks.className,
          childCount: lessonBlocks.children.length,
          parent: lessonBlocks.parentElement.className
        });
      }
    }

    const possibleTargets = [
      // Try very specific lesson content areas first
      '.blocks-authoring .lesson-blocks',
      '.lesson-blocks',
      '.blocks-authoring [class*="lesson-blocks"]',
      '.blocks-authoring [class*="blocks-container"]',
      '.blocks-authoring [class*="content-blocks"]',
      '.blocks-authoring .blocks',
      // Try other content areas
      '.lesson-content .blocks',
      '.lesson-content',
      '.blocks-content',
      '.content-blocks',
      '[data-testid="lesson-content"]',
      '[data-testid="content-area"]',
      '.content-area',
      // Then try the second child of blocks-authoring (often the content area)
      '.blocks-authoring > div:nth-child(2)',
      '.blocks-authoring > div:last-child',
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
          firstChildClass: activeArea.children[0]?.className,
          size: `${activeArea.offsetWidth}x${activeArea.offsetHeight}`,
          hasExistingBlocks: activeArea.querySelector('[class*="block"]') ? 'Yes' : 'No',
          existingBlockTypes: Array.from(activeArea.querySelectorAll('[class*="block"]')).slice(0, 3).map(block => block.className)
        });
        
        // If this area has existing blocks, it's likely the right place
        if (activeArea.querySelector('[class*="block"]') || selector.includes('lesson-blocks') || selector.includes('content-blocks')) {
          console.log('[Rise Extension] This looks like the correct content area!');
          break;
        }
      }
    }
    
    if (!activeArea) {
      activeArea = document.body;
      console.log('[Rise Extension] No specific content area found, using body as fallback');
    }

    console.log('[Rise Extension] Active area found:', activeArea);

    // Look for existing blocks and insertion points in Rise 360
    const existingBlocks = activeArea.querySelectorAll('[class*="block"]:not(.compare-contrast)');
    const insertionPoints = activeArea.querySelectorAll('[class*="insert"], [class*="add-block"], .block-insert, .add-button');
    
    console.log('[Rise Extension] Found existing blocks:', existingBlocks.length);
    console.log('[Rise Extension] Found insertion points:', insertionPoints.length);
    
    if (existingBlocks.length > 0) {
      console.log('[Rise Extension] Existing block structure:', Array.from(existingBlocks).slice(0, 3).map(block => ({
        className: block.className,
        tagName: block.tagName,
        parent: block.parentElement?.className
      })));
    }

    // Create a proper Rise block structure
    const riseBlockContainer = document.createElement('div');
    riseBlockContainer.className = 'sparkle-fountain block block--mounted block--playback-mode-slides block--unlinked';
    riseBlockContainer.setAttribute('data-block-id', `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    const blockAnimationWrapper = document.createElement('div');
    blockAnimationWrapper.className = 'block__animation-wrapper';
    
    const blockWrap = document.createElement('div');
    blockWrap.className = 'block__wrap block__wrap--playback-mode-slides';
    
    const blockContent = document.createElement('div');
    blockContent.className = 'block__content';
    
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'block-wrapper bg bg--range-light bg--type-light';
    
    const blockInner = document.createElement('div');
    blockInner.className = 'block__inner';
    
    // Create the interaction container and add our interaction
    const container = document.createElement('div');
    container.innerHTML = interactionHtml;
    const interactionElement = container.firstElementChild;
    blockInner.appendChild(interactionElement);
    
    // Build the proper Rise block hierarchy
    blockWrapper.appendChild(blockInner);
    blockContent.appendChild(blockWrapper);
    blockWrap.appendChild(blockContent);
    blockAnimationWrapper.appendChild(blockWrap);
    riseBlockContainer.appendChild(blockAnimationWrapper);
    
    console.log('[Rise Extension] Created proper Rise block structure');
    
    try {
      // Strategy 1: Try to insert after the last existing sparkle-fountain block
      const existingSparkleBlocks = activeArea.querySelectorAll('.sparkle-fountain.block');
      if (existingSparkleBlocks.length > 0) {
        const lastSparkleBlock = existingSparkleBlocks[existingSparkleBlocks.length - 1];
        console.log('[Rise Extension] Attempting to insert after last sparkle-fountain block');
        activeArea.insertBefore(riseBlockContainer, lastSparkleBlock.nextSibling);
        console.log('[Rise Extension] Inserted after existing sparkle-fountain block');
      } else {
        console.log('[Rise Extension] No sparkle-fountain blocks found, appending to active area');
        activeArea.appendChild(riseBlockContainer);
        console.log('[Rise Extension] Appended to active area');
      }
      
      // Verify the element is actually in the DOM and visible
      setTimeout(() => {
        const insertedElement = document.querySelector('.compare-contrast-interaction[data-interaction-type="compare-contrast"]');
        if (insertedElement) {
          console.log('[Rise Extension] SUCCESS: Element verified in DOM!', {
            element: insertedElement,
            parent: insertedElement.parentElement,
            parentClassName: insertedElement.parentElement?.className,
            isVisible: insertedElement.offsetWidth > 0 && insertedElement.offsetHeight > 0,
            boundingRect: insertedElement.getBoundingClientRect(),
            computedDisplay: window.getComputedStyle(insertedElement).display,
            computedVisibility: window.getComputedStyle(insertedElement).visibility
          });
          
          // Scroll to the element to make sure it's visible
          insertedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a temporary highlight to make it easier to spot
          insertedElement.style.outline = '3px solid red';
          setTimeout(() => {
            insertedElement.style.outline = '';
          }, 3000);
        } else {
          console.log('[Rise Extension] ERROR: Element not found in DOM after insertion!');
          
          // Debug: Check if there are any compare-contrast elements at all
          const allCompareElements = document.querySelectorAll('[class*="compare-contrast"]');
          console.log('[Rise Extension] Found compare-contrast elements:', allCompareElements);
        }
      }, 100);
      
      console.log('[Rise Extension] Configured interactive component added to page');
      
      // Inject the actual interactive functionality for preview
      injectInteractiveScript();
      console.log('[Rise Extension] Interactive script injected');
      
      // Add event listeners for control buttons - but only in edit mode
      if (!isPreviewMode()) {
        setTimeout(() => {
          addInteractionControls();
          console.log('[Rise Extension] Added interaction controls for edit mode');
        }, 100);
      }
    } catch (error) {
      console.error('[Rise Extension] Error inserting configured component:', error);
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      window.insertingInteraction = false;
    }, 1000);
  }

  // Function to add event listeners for interaction controls
  function addInteractionControls() {
    console.log('[Rise Extension] addInteractionControls called');
    const interactions = document.querySelectorAll('.compare-contrast-interaction');
    console.log(`[Rise Extension] Found ${interactions.length} interactions to add controls to`);
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      if (!btn.hasAttribute('data-listener-added')) {
        console.log('[Rise Extension] Adding edit button listener');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const interactionId = btn.getAttribute('data-interaction-id');
          editInteractionById(interactionId);
        });
        btn.setAttribute('data-listener-added', 'true');
      }
    });

    // Move up buttons
    document.querySelectorAll('.move-up-btn').forEach(btn => {
      if (!btn.hasAttribute('data-listener-added')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const interactionId = btn.getAttribute('data-interaction-id');
          moveInteraction(interactionId, 'up');
        });
        btn.setAttribute('data-listener-added', 'true');
      }
    });

    // Move down buttons
    document.querySelectorAll('.move-down-btn').forEach(btn => {
      if (!btn.hasAttribute('data-listener-added')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const interactionId = btn.getAttribute('data-interaction-id');
          moveInteraction(interactionId, 'down');
        });
        btn.setAttribute('data-listener-added', 'true');
      }
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      if (!btn.hasAttribute('data-listener-added')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const interactionId = btn.getAttribute('data-interaction-id');
          deleteInteraction(interactionId);
        });
        btn.setAttribute('data-listener-added', 'true');
      }
    });
  }

  // Helper function to find the active content area
  function findActiveContentArea() {
    const possibleTargets = [
      '.blocks-authoring .lesson-blocks',
      '.lesson-blocks',
      '.blocks-authoring [class*="lesson-blocks"]',
      '.blocks-authoring [class*="blocks-container"]',
      '.blocks-authoring [class*="content-blocks"]',
      '.blocks-authoring .blocks',
      '.lesson-content .blocks',
      '.lesson-content',
      '.blocks-content',
      '.content-blocks',
      '[data-testid="lesson-content"]',
      '[data-testid="content-area"]',
      '.content-area',
      '.blocks-authoring > div:nth-child(2)',
      '.blocks-authoring > div:last-child',
      '.blocks-authoring'
    ];
    
    for (const selector of possibleTargets) {
      const area = document.querySelector(selector);
      if (area && area.querySelector('[class*="block"]')) {
        return area;
      }
    }
    
    return document.querySelector('.blocks-authoring') || document.body;
  }

  // Function to move interaction up or down
  function moveInteraction(interactionId, direction) {
    // Prevent rapid clicking
    if (window.movementInProgress) {
      console.log(`[Rise Extension] Movement already in progress, ignoring click`);
      return;
    }
    window.movementInProgress = true;
    
    const container = document.querySelector(`#${interactionId}`).closest('.compare-contrast-container');
    
    if (!container) {
      console.log(`[Rise Extension] Could not find interaction container for ${interactionId}`);
      window.movementInProgress = false;
      return;
    }
    
    // Find the actual Rise block that contains this interaction
    // Since we now create proper sparkle-fountain blocks, look for the closest one
    let riseBlock = container.closest('.sparkle-fountain');
    
    if (!riseBlock) {
      console.log(`[Rise Extension] Could not find containing sparkle-fountain Rise block`);
      console.log(`[Rise Extension] Container parent chain:`, container.parentElement?.className, container.parentElement?.parentElement?.className, container.parentElement?.parentElement?.parentElement?.className);
      window.movementInProgress = false;
      return;
    }
    
    console.log(`[Rise Extension] Found containing sparkle-fountain block:`, riseBlock.className);
    
    // Find the content area that contains all the blocks
    const contentArea = findActiveContentArea();
    if (!contentArea) {
      console.log(`[Rise Extension] Could not find content area`);
      window.movementInProgress = false;
      return;
    }
    
    // Get all sparkle-fountain blocks in the content area (these are the actual Rise blocks)
    const allBlocks = Array.from(contentArea.children).filter(child => 
      child.classList.contains('sparkle-fountain')
    );
    
    const currentIndex = allBlocks.indexOf(riseBlock);
    console.log(`[Rise Extension] Current sparkle-fountain block index: ${currentIndex}, Total sparkle-fountain blocks: ${allBlocks.length}`);
    
    if (currentIndex === -1) {
      console.log(`[Rise Extension] Could not find current sparkle-fountain block in content area`);
      window.movementInProgress = false;
      return;
    }
    
    if (direction === 'up' && currentIndex > 0) {
      // Move the entire Rise block before the previous block
      const targetBlock = allBlocks[currentIndex - 1];
      contentArea.insertBefore(riseBlock, targetBlock);
      console.log(`[Rise Extension] Moved sparkle-fountain block up from index ${currentIndex} to ${currentIndex - 1}`);
    } else if (direction === 'down' && currentIndex < allBlocks.length - 1) {
      // Move the entire Rise block after the next block
      const targetBlock = allBlocks[currentIndex + 1];
      if (targetBlock.nextElementSibling) {
        contentArea.insertBefore(riseBlock, targetBlock.nextElementSibling);
      } else {
        contentArea.appendChild(riseBlock);
      }
      console.log(`[Rise Extension] Moved sparkle-fountain block down from index ${currentIndex} to ${currentIndex + 1}`);
    } else {
      console.log(`[Rise Extension] Cannot move interaction ${interactionId} ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'} (index ${currentIndex})`);
    }
    
    // Re-attach event listeners after DOM manipulation
    setTimeout(() => {
      addInteractionControls();
      console.log('[Rise Extension] Re-attached interaction controls after movement');
      
      // Save the new position
      saveInteractionPosition(interactionId);
      
      window.movementInProgress = false;
    }, 200);
  }

  
  // Function to save interaction position in localStorage
  function saveInteractionPosition(interactionId) {
    const riseBlock = document.getElementById(interactionId)?.closest('.sparkle-fountain');
    if (!riseBlock) {
      console.log(`[Rise Extension] Could not find rise block for ${interactionId}`);
      return;
    }
    
    const contentArea = riseBlock.closest('.lesson-content, .content-area, [class*="content"]');
    if (!contentArea) {
      console.log(`[Rise Extension] Could not find content area for ${interactionId}`);
      return;
    }
    
    // Get all blocks including both sparkle-fountain and regular blocks
    const allBlocks = Array.from(contentArea.children);
    
    // Find the exact position by looking for the block containing our interaction
    let currentIndex = -1;
    for (let i = 0; i < allBlocks.length; i++) {
      if (allBlocks[i].contains(riseBlock) || allBlocks[i] === riseBlock) {
        currentIndex = i;
        break;
      }
    }
    
    if (currentIndex !== -1) {
      // Update the config in localStorage with position
      const storageKey = `rise-interaction-${interactionId}`;
      const existingConfig = localStorage.getItem(storageKey);
      if (existingConfig) {
        const config = JSON.parse(existingConfig);
        config.blockPosition = currentIndex;
        config.totalBlocks = allBlocks.length;
        localStorage.setItem(storageKey, JSON.stringify(config));
        console.log(`[Rise Extension] Saved position ${currentIndex}/${allBlocks.length} for interaction ${interactionId}`);
      }
    } else {
      console.log(`[Rise Extension] Could not determine position for ${interactionId}`);
    }
  }

  // Function to delete interaction
  function deleteInteraction(interactionId) {
    if (confirm('Are you sure you want to delete this interaction?')) {
      const container = document.querySelector(`#${interactionId}`).closest('.compare-contrast-container');
      
      if (container) {
        // Find the sparkle-fountain block that contains this interaction
        const riseBlock = container.closest('.sparkle-fountain');
        
        if (riseBlock) {
          // Remove the entire Rise block structure
          riseBlock.remove();
          console.log('[Rise Extension] Removed entire Rise block structure');
        } else {
          // Fallback to removing just the container
          container.remove();
          console.log('[Rise Extension] Removed interaction container (fallback)');
        }
        
        // Also remove from localStorage
        const storageKey = `rise-interaction-${interactionId}`;
        localStorage.removeItem(storageKey);
        console.log('[Rise Extension] Removed interaction from localStorage:', storageKey);
      } else {
        console.log('[Rise Extension] Could not find interaction container to delete');
      }
    }
  }

  // Initialize the extension - simplified version
  function initializeExtension() {
    console.log('[Rise Extension] ========== INITIALIZING EXTENSION ==========');
    console.log('[Rise Extension] Current URL:', window.location.href);
    console.log('[Rise Extension] Document title:', document.title);
    console.log('[Rise Extension] Body classes:', document.body.className);
    console.log('[Rise Extension] HTML classes:', document.documentElement.className);
    console.log('[Rise Extension] Window location:', {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
    
    const previewMode = isPreviewMode();
    console.log('[Rise Extension] Preview mode detected:', previewMode);
    
    // Add custom CSS if not already added
    if (!document.getElementById('compare-contrast-styles')) {
      const style = document.createElement('link');
      style.id = 'compare-contrast-styles';
      style.rel = 'stylesheet';
      style.href = chrome.runtime.getURL('styles.css');
      document.head.appendChild(style);
      console.log('[Rise Extension] Added custom styles');
    }

    // Create floating button only in editing mode
    const createFloatingButton = () => {
      console.log('[Rise Extension] createFloatingButton called');
      console.log('[Rise Extension] Current URL:', window.location.href);
      console.log('[Rise Extension] Document title:', document.title);
      console.log('[Rise Extension] Body classes:', document.body.className);
      console.log('[Rise Extension] HTML classes:', document.documentElement.className);
      
      const previewModeResult = isPreviewMode();
      console.log('[Rise Extension] isPreviewMode() returned:', previewModeResult);
      
      // Don't show floating button in preview mode
      if (isPreviewMode()) {
        console.log('[Rise Extension] Preview mode detected - hiding floating button');
        // Remove existing floating button if it exists
        const existingButton = document.getElementById('rise-compare-contrast-fab');
        if (existingButton) {
          existingButton.remove();
          console.log('[Rise Extension] Removed existing floating button in preview mode');
        }
        return;
      }

      // Check if floating button already exists
      if (document.getElementById('rise-compare-contrast-fab')) {
        console.log('[Rise Extension] Floating button already exists');
        return;
      }
      
      // Add debugging to see when floating button is created
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
      console.log('[Rise Extension] Floating button created and added to DOM - should be visible now');
    };

    // Initialize existing interactions in preview mode
    if (isPreviewMode()) {
      console.log('[Rise Extension] Preview mode detected - initializing interactions');
      
      // Remove any existing floating button in preview mode  
      const floatingButton = document.getElementById('rise-compare-contrast-fab');
      if (floatingButton) {
        floatingButton.remove();
        console.log('[Rise Extension] Removed floating button in preview mode');
      }
      
      // Ensure interaction script is loaded
      injectInteractiveScript();
      
      // Force restore interactions in preview mode with multiple attempts and better timing
      setTimeout(() => {
        console.log('[Rise Extension] First restoration attempt in preview mode');
        restoreInteractionsFromStorage();
      }, 1000);
      
      setTimeout(() => {
        console.log('[Rise Extension] Second restoration attempt in preview mode');
        restoreInteractionsFromStorage();
        
        // Also check for any existing interactions and make them visible
        const interactions = document.querySelectorAll('.compare-contrast-interaction');
        console.log(`[Rise Extension] Found ${interactions.length} existing interactions to show in preview`);
        
        interactions.forEach(interaction => {
          // Force visibility in preview mode
          interaction.style.display = 'block !important';
          interaction.style.visibility = 'visible !important';
          interaction.style.opacity = '1 !important';
          
          // Hide authoring controls in preview mode
          const container = interaction.closest('.compare-contrast-container');
          const controls = container?.querySelector('.interaction-controls');
          if (controls) {
            controls.style.display = 'none !important';
          }
          
          // Initialize interactive functionality
          if (window.initializeCompareContrastInteraction && !interaction.hasAttribute('data-initialized')) {
            console.log('[Rise Extension] Initializing interaction in preview:', interaction.id);
            window.initializeCompareContrastInteraction(interaction);
            interaction.setAttribute('data-initialized', 'true');
          }
        });
      }, 3000);
      
      setTimeout(() => {
        console.log('[Rise Extension] Final restoration attempt in preview mode');
        restoreInteractionsFromStorage();
        
        // Final check to ensure all interactions are visible
        const interactions = document.querySelectorAll('.compare-contrast-interaction');
        console.log(`[Rise Extension] Final check: Found ${interactions.length} interactions in preview`);
        
        interactions.forEach(interaction => {
          // Ensure visibility with stronger CSS
          const style = interaction.style;
          style.setProperty('display', 'block', 'important');
          style.setProperty('visibility', 'visible', 'important');
          style.setProperty('opacity', '1', 'important');
          style.setProperty('min-height', '200px', 'important');
          
          // Add a background to make it clearly visible
          if (isPreviewMode()) {
            style.setProperty('background', '#f0f8ff', 'important');
            style.setProperty('border', '2px solid #0066cc', 'important');
            style.setProperty('padding', '20px', 'important');
            style.setProperty('margin', '20px 0', 'important');
            style.setProperty('border-radius', '8px', 'important');
          }
          
          // Initialize if not already done
          if (window.initializeCompareContrastInteraction && !interaction.hasAttribute('data-initialized')) {
            console.log('[Rise Extension] Final initialization attempt for:', interaction.id);
            window.initializeCompareContrastInteraction(interaction);
            interaction.setAttribute('data-initialized', 'true');
          }
        });
      }, 6000);
    } else {
      // Only create floating button in editing mode and restore interactions
      console.log('[Rise Extension] In edit mode - creating floating button and restoring interactions');
      createFloatingButton();
      restoreInteractionsFromStorage();
      
      // Ensure all existing interactions have controls
      setTimeout(() => {
        console.log('[Rise Extension] Adding controls to all existing interactions');
        addInteractionControls();
      }, 3000);
    }
  }

  // Watch for navigation changes (SPA routing)
  function watchForNavigation() {
    let currentUrl = window.location.href;
    
    // Watch for URL changes and DOM changes that might indicate mode switches
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('[Rise Extension] Navigation detected to:', currentUrl);
        
        // Re-initialize when navigating to course editor or preview
        if (currentUrl.includes('/lessons/') || currentUrl.includes('/course/') || currentUrl.includes('/preview')) {
          setTimeout(() => {
            waitForRise().then(() => {
              initializeExtension();
              // Also try to restore interactions after navigation
              setTimeout(() => restoreInteractionsFromStorage(), 3000);
            });
          }, 1000);
        }
      }
      
      // Check for preview mode changes and hide/show floating button accordingly
      const isCurrentlyPreview = isPreviewMode();
      const floatingButton = document.getElementById('rise-compare-contrast-fab');
      
      if (isCurrentlyPreview && floatingButton) {
        floatingButton.remove();
        console.log('[Rise Extension] Removed floating button due to preview mode detection');
      } else if (!isCurrentlyPreview && !floatingButton && !window.location.href.includes('/preview')) {
        // Re-create floating button if we're back in edit mode
        setTimeout(() => {
          if (!isPreviewMode() && !document.getElementById('rise-compare-contrast-fab')) {
            const button = document.createElement('div');
            button.id = 'rise-compare-contrast-fab';
            
            const innerButton = document.createElement('button');
            innerButton.style.cssText = `
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
            innerButton.textContent = '📝';
            innerButton.title = 'Add Compare & Contrast Block';
            innerButton.addEventListener('click', () => window.openConfigModal());
            
            button.appendChild(innerButton);
            document.body.appendChild(button);
            console.log('[Rise Extension] Re-created floating button for edit mode');
          }
        }, 1000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid']
    });
    
    // Also listen for pushstate/popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        waitForRise().then(() => {
          initializeExtension();
          setTimeout(() => restoreInteractionsFromStorage(), 3000);
        });
      }, 1000);
    });
    
    // Listen for hashchange events (sometimes Rise uses hash routing)
    window.addEventListener('hashchange', () => {
      setTimeout(() => {
        waitForRise().then(() => {
          initializeExtension();
          setTimeout(() => restoreInteractionsFromStorage(), 3000);
        });
      }, 1000);
    });
  }

  // Function to restore interactions from localStorage
  function restoreInteractionsFromStorage() {
    console.log('[Rise Extension] Restoring interactions from localStorage');
    
    // Wait a bit for Rise to finish loading its content
    setTimeout(() => {
      // Find all stored interactions
      const storedInteractions = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rise-interaction-')) {
          const configData = localStorage.getItem(key);
          const interactionId = key.replace('rise-interaction-', '');
          storedInteractions.push({ id: interactionId, config: JSON.parse(configData) });
        }
      }
      
      console.log('[Rise Extension] Found stored interactions:', storedInteractions.length);
      
      // Check if interactions already exist in DOM to avoid duplicates
      const existingInteractions = document.querySelectorAll('.compare-contrast-interaction');
      const existingIds = Array.from(existingInteractions).map(el => el.id);
      
      console.log('[Rise Extension] Existing interaction IDs in DOM:', existingIds);
      
      storedInteractions.forEach(({ id, config }) => {
        if (!existingIds.includes(id)) {
          console.log('[Rise Extension] Restoring interaction:', id);
          restoreInteractionToDOM(id, config);
        } else {
          console.log('[Rise Extension] Interaction already exists, skipping:', id);
          // Add controls to existing interactions that might be missing them
          setTimeout(() => {
            addInteractionControls();
            console.log('[Rise Extension] Added missing controls to existing interaction:', id);
          }, 100);
        }
      });
    }, 2000); // Increased delay to ensure Rise content is fully loaded
  }
  
  // Function to restore a single interaction to the DOM
  function restoreInteractionToDOM(interactionId, config) {
    const { activityInstructions, prompt, idealResponse, placeholder } = config;
    
    // Find suitable content area for restoration - use the same logic as insertion
    const activeArea = findActiveContentArea();
    if (!activeArea) {
      console.log('[Rise Extension] Could not find content area for restoration, retrying...');
      // Retry after a delay
      setTimeout(() => restoreInteractionToDOM(interactionId, config), 1000);
      return;
    }
    
    console.log('[Rise Extension] Restoring interaction to area:', activeArea.className);
    
    const configData = JSON.stringify(config);
    const encodedConfigData = btoa(configData);
    
    const interactionHtml = createInteractionHTML(interactionId, encodedConfigData, prompt, idealResponse, placeholder);
    
    // Create proper Rise block structure (same as new insertions)
    const riseBlockContainer = document.createElement('div');
    riseBlockContainer.className = 'sparkle-fountain block block--mounted block--playback-mode-slides block--unlinked';
    riseBlockContainer.setAttribute('data-block-id', `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    const blockAnimationWrapper = document.createElement('div');
    blockAnimationWrapper.className = 'block__animation-wrapper';
    
    const blockWrap = document.createElement('div');
    blockWrap.className = 'block__wrap block__wrap--playback-mode-slides';
    
    const blockContent = document.createElement('div');
    blockContent.className = 'block__content';
    
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'block-wrapper bg bg--range-light bg--type-light';
    
    const blockInner = document.createElement('div');
    blockInner.className = 'block__inner';
    
    // Create the interaction container and add our interaction
    const container = document.createElement('div');
    container.innerHTML = interactionHtml;
    const interactionElement = container.firstElementChild;
    blockInner.appendChild(interactionElement);
    
    // Build the proper Rise block hierarchy
    blockWrapper.appendChild(blockInner);
    blockContent.appendChild(blockWrapper);
    blockWrap.appendChild(blockContent);
    blockAnimationWrapper.appendChild(blockWrap);
    riseBlockContainer.appendChild(blockAnimationWrapper);
    
    // Insert the complete block structure at the saved position
    const savedPosition = config.blockPosition;
    const allContentBlocks = Array.from(activeArea.children);
    
    console.log(`[Rise Extension] Restoring interaction at position ${savedPosition} out of ${allContentBlocks.length} total blocks`);
    
    if (savedPosition === undefined || savedPosition === 'bottom' || savedPosition >= allContentBlocks.length) {
      // Insert at the end
      activeArea.appendChild(riseBlockContainer);
      console.log('[Rise Extension] Restored interaction appended to content area (end position)');
    } else {
      // Insert at the specific position
      const targetIndex = Math.max(0, parseInt(savedPosition));
      if (allContentBlocks[targetIndex]) {
        activeArea.insertBefore(riseBlockContainer, allContentBlocks[targetIndex]);
        console.log(`[Rise Extension] Restored interaction inserted at position ${targetIndex}`);
        
        // In preview mode, ensure the block and its contents are visible
        if (isPreviewMode()) {
          setTimeout(() => {
            const insertedBlock = document.getElementById(interactionId);
            if (insertedBlock) {
              // Force visibility for blocks inserted between other content
              const riseContainer = insertedBlock.closest('.sparkle-fountain');
              if (riseContainer) {
                riseContainer.style.cssText += `
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  position: relative !important;
                  z-index: 1 !important;
                `;
                
                // Ensure parent containers are also visible
                let parent = riseContainer.parentElement;
                while (parent && parent !== activeArea) {
                  parent.style.cssText += `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  `;
                  parent = parent.parentElement;
                }
                
                console.log('[Rise Extension] Applied visibility fixes for mid-content positioning');
              }
            }
          }, 100);
        }
      } else {
        activeArea.appendChild(riseBlockContainer);
        console.log('[Rise Extension] Position not found, appended to content area');
      }
    }
    
    // Add event listeners for controls in editing mode
    if (!isPreviewMode()) {
      setTimeout(() => {
        addInteractionControls();
        console.log('[Rise Extension] Added controls to restored interaction');
      }, 100);
    } else {
      // In preview mode, ensure interaction is visible and functional
      const interactionDiv = riseBlockContainer.querySelector('.compare-contrast-interaction');
      if (interactionDiv) {
        // Debug: Log current state and parent containers
        console.log('[Rise Extension] Found interaction div in preview:', {
          div: interactionDiv,
          parentBlock: riseBlockContainer,
          computedStyle: window.getComputedStyle(interactionDiv),
          parentStyle: window.getComputedStyle(riseBlockContainer),
          isConnected: riseBlockContainer.closest('.connected-blocks, .lesson-block-group, .block-group'),
          parentClasses: riseBlockContainer.className,
          parentPosition: riseBlockContainer.getBoundingClientRect()
        });
        
        // Check if parent block is part of connected blocks system
        const connectedGroup = riseBlockContainer.closest('.connected-blocks, .lesson-block-group, .block-group');
        if (connectedGroup) {
          console.log('[Rise Extension] Interaction is in connected block group:', connectedGroup);
          // Apply styles to ensure visibility in connected block context
          connectedGroup.style.setProperty('display', 'block', 'important');
          connectedGroup.style.setProperty('visibility', 'visible', 'important');
        }
        
        // Force the parent Rise block to be visible too
        riseBlockContainer.style.setProperty('display', 'block', 'important');
        riseBlockContainer.style.setProperty('visibility', 'visible', 'important');
        riseBlockContainer.style.setProperty('opacity', '1', 'important');
        riseBlockContainer.style.setProperty('height', 'auto', 'important');
        
        // Override all potential hiding styles with !important
        interactionDiv.style.setProperty('display', 'block', 'important');
        interactionDiv.style.setProperty('visibility', 'visible', 'important');
        interactionDiv.style.setProperty('opacity', '1', 'important');
        interactionDiv.style.setProperty('position', 'relative', 'important');
        interactionDiv.style.setProperty('z-index', '1000', 'important');
        interactionDiv.style.setProperty('min-height', '200px', 'important');
        interactionDiv.style.setProperty('width', '100%', 'important');
        interactionDiv.style.setProperty('max-width', 'none', 'important');
        
        // Remove editor-specific styling that might hide content in preview
        interactionDiv.style.setProperty('border', '1px solid #e5e7eb', 'important');
        interactionDiv.style.setProperty('background', 'white', 'important');
        interactionDiv.style.setProperty('border-radius', '8px', 'important');
        interactionDiv.style.setProperty('padding', '24px', 'important');
        interactionDiv.style.setProperty('margin', '20px 0', 'important');
        interactionDiv.style.setProperty('box-shadow', '0 1px 3px rgba(0,0,0,0.1)', 'important');
        
        console.log('[Rise Extension] Applied preview mode styling to interaction');
        
        // Initialize interaction functionality in preview mode
        setTimeout(() => {
          if (window.initializeCompareContrastInteraction) {
            window.initializeCompareContrastInteraction(interactionDiv);
            console.log('[Rise Extension] Initialized interaction in preview mode:', interactionId);
          }
        }, 500);
      }
    }
    
    console.log('[Rise Extension] Interaction restored to DOM:', interactionId);
  }
  
  // Helper function to create interaction HTML
  function createInteractionHTML(interactionId, encodedConfigData, prompt, ideal, placeholder) {
    return `
      <div class="block block--mounted block--playback-mode-slides compare-contrast-container" 
           style="position: relative; margin: 20px 0;" 
           data-block-type="compare-contrast">
        <div class="interaction-controls" style="position: absolute; top: -10px; right: 0; z-index: 1000; display: flex; gap: 5px;">
          <button class="edit-btn" data-interaction-id="${interactionId}" style="background: #28a745; color: white; border: none; border-radius: 4px; padding: 5px 8px; font-size: 12px; cursor: pointer;" title="Edit">✏️</button>
          <button class="move-up-btn" data-interaction-id="${interactionId}" style="background: #007bff; color: white; border: none; border-radius: 4px; padding: 5px 8px; font-size: 12px; cursor: pointer;" title="Move Up">↑</button>
          <button class="move-down-btn" data-interaction-id="${interactionId}" style="background: #007bff; color: white; border: none; border-radius: 4px; padding: 5px 8px; font-size: 12px; cursor: pointer;" title="Move Down">↓</button>
          <button class="delete-btn" data-interaction-id="${interactionId}" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 8px; font-size: 12px; cursor: pointer;" title="Delete">×</button>
        </div>
        <div class="block__inner">
          <div class="compare-contrast-interaction" 
               id="${interactionId}"
               data-interaction-type="compare-contrast" 
               data-config-base64="${encodedConfigData}"
               style="
               background: #f0f8ff;
               border: 2px solid #0066cc;
               border-radius: 8px;
               padding: 20px;
               margin: 20px 0;
               box-shadow: 0 2px 8px rgba(0,0,0,0.1);
               width: 100%;
               max-width: 100%;
               box-sizing: border-box;
               display: block;
               position: relative;
               z-index: 1;
             ">
            <div class="interaction-container" style="width: 100%;">
              <div class="interaction-preview" style="
                background: white;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
              ">
                 <div class="preview-header" style="margin-bottom: 15px;">
                   <h3 style="color: #0066cc; margin: 0 0 5px 0; font-size: 18px;">📝 Compare & Contrast</h3>
                   <p style="color: #666; margin: 0; font-size: 14px;">Interactive Learning Activity - Will be fully functional in preview/published mode</p>
                </div>
                <div class="preview-content">
                  <p style="margin: 0 0 10px 0; font-weight: bold;"><strong>Prompt:</strong> ${prompt}</p>
                  <p style="margin: 0 0 10px 0; font-size: 12px; color: #888;"><strong>Expected Response:</strong> ${ideal}</p>
                  <textarea placeholder="${placeholder}" disabled style="
                    width: 100%;
                    min-height: 80px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    resize: vertical;
                    font-family: inherit;
                    background: #f9f9f9;
                  "></textarea>
                  <button disabled style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #ccc;
                    color: #666;
                    border: none;
                    border-radius: 4px;
                    cursor: not-allowed;
                  ">Compare Responses (Preview Only)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Function to update existing interaction
  function updateExistingInteraction(activityInstructions, prompt, ideal, placeholder) {
    console.log('[Rise Extension] Updating existing interaction');
    
    // Find the interaction that was being edited
    const interactions = document.querySelectorAll('.compare-contrast-interaction');
    let targetInteraction = interactions[interactions.length - 1]; // Default to most recent
    
    if (targetInteraction) {
      const configData = JSON.stringify({ activityInstructions, prompt, idealResponse: ideal, placeholder });
      const configBase64 = btoa(configData);
      
      // Update localStorage
      const storageKey = `rise-interaction-${targetInteraction.id}`;
      localStorage.setItem(storageKey, configData);
      
      // Update the interaction's stored configuration
      targetInteraction.setAttribute('data-config-base64', configBase64);
      targetInteraction.setAttribute('data-config', configData);
      
      // Update the preview display
      const promptDisplay = targetInteraction.querySelector('p[style*="font-weight: bold"]');
      if (promptDisplay) {
        promptDisplay.innerHTML = `<strong>Prompt:</strong> ${prompt}`;
      }
      
      const idealDisplay = targetInteraction.querySelector('p[style*="color: #888"]');
      if (idealDisplay) {
        idealDisplay.innerHTML = `<strong>Expected Response:</strong> ${ideal}`;
      }
      
      const placeholderInput = targetInteraction.querySelector('textarea');
      if (placeholderInput) {
        placeholderInput.placeholder = placeholder;
      }
      
      // Update the global config for the injected script
      window.compareContrastConfig = { activityInstructions, prompt, idealResponse: ideal, placeholder };
      
      console.log('[Rise Extension] Interaction updated successfully');
    }
  }

  // Initial load
  console.log('[Rise Extension] ========== SCRIPT LOADING ==========');
  console.log('[Rise Extension] Script loaded at:', new Date().toISOString());
  console.log('[Rise Extension] Initial URL:', window.location.href);
  console.log('[Rise Extension] Initial title:', document.title);
  console.log('[Rise Extension] Is preview mode initially?', isPreviewMode());
  console.log('[Rise Extension] Document ready state:', document.readyState);
  
  waitForRise().then(() => {
    console.log('[Rise Extension] Rise interface detected, initializing...');
    initializeExtension();
    watchForNavigation();
  });

})();