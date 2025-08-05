// Rise 360 specific integration utilities
import { DOMUtils } from './dom-utils.js';

export class RiseIntegration {
  constructor() {
    this.riseSelectors = {
      authoring: [
        '.authoring-view',
        '.lesson-editor',
        '.block-authoring',
        '[data-testid="lesson-editor"]'
      ],
      preview: [
        '.preview-mode',
        '.lesson-preview',
        '.published-lesson',
        '[data-testid="lesson-preview"]'
      ],
      blockList: [
        '.block-list',
        '.add-block-menu',
        '.block-picker',
        '[data-testid="block-list"]'
      ],
      lessonContent: [
        '.lesson-content',
        '.lesson-body',
        '.content-area',
        '.main-content'
      ]
    };
  }

  async waitForRise(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Check for Rise-specific elements
        const riseElements = await this.checkForRiseElements();
        if (riseElements.length > 0) {
          console.log('Rise detected with elements:', riseElements);
          return true;
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error checking for Rise elements:', error);
      }
    }

    throw new Error('Rise authoring interface not detected within timeout');
  }

  async checkForRiseElements() {
    const foundElements = [];
    
    // Check for authoring indicators
    for (const selector of this.riseSelectors.authoring) {
      const element = document.querySelector(selector);
      if (element) {
        foundElements.push({ type: 'authoring', selector, element });
      }
    }

    // Check for lesson content area
    for (const selector of this.riseSelectors.lessonContent) {
      const element = document.querySelector(selector);
      if (element) {
        foundElements.push({ type: 'content', selector, element });
      }
    }

    return foundElements;
  }

  isPreviewMode() {
    // Check URL patterns for preview/published modes
    const url = window.location.href;
    const previewPatterns = [
      /\/preview\//,
      /\/published\//,
      /\/share\//,
      /mode=preview/,
      /\/view\//
    ];

    if (previewPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check for preview-specific DOM elements
    for (const selector of this.riseSelectors.preview) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    // Check body/html classes
    const bodyClasses = document.body.className.toLowerCase();
    const htmlClasses = document.documentElement.className.toLowerCase();
    
    const previewClasses = ['preview', 'published', 'view-mode', 'learner-view'];
    return previewClasses.some(cls => 
      bodyClasses.includes(cls) || htmlClasses.includes(cls)
    );
  }

  isAuthoringMode() {
    return !this.isPreviewMode();
  }

  async findBlockInsertionPoint() {
    const selectors = [
      '.lesson-content .block:last-child',
      '.lesson-body .block:last-child',
      '.content-area .block:last-child',
      '.main-content .block:last-child',
      '[data-testid="lesson-content"] .block:last-child'
    ];

    for (const selector of selectors) {
      try {
        const element = await DOMUtils.waitForElement(selector, 2000);
        if (element) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }

    return null;
  }

  async findBlockListContainer() {
    // Look for the exact Rise 360 block list structure
    const blockList = document.querySelector('.block-wizard__list[role="list"]');
    if (blockList) {
      console.log('Found Rise 360 block list');
      return blockList;
    }
    
    // Fallback to checking the old selectors
    for (const selector of this.riseSelectors.blockList) {
      try {
        const element = await DOMUtils.waitForElement(selector, 2000);
        if (element) {
          return element;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  createCustomBlockButton() {
    // Create the exact Rise 360 block structure
    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'authoring-tooltip';
    
    const blockItem = document.createElement('li');
    blockItem.className = 'block-wizard__item';
    blockItem.setAttribute('role', 'listitem');
    
    const blockButton = document.createElement('button');
    blockButton.className = 'block-wizard__link';
    blockButton.type = 'button';
    
    // Create the icon container with SVG
    const iconDiv = document.createElement('div');
    iconDiv.className = 'block-wizard__icon';
    
    // Create a custom SVG icon for Compare & Contrast
    iconDiv.innerHTML = `
      <svg aria-hidden="true" fill="none" height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="compare-contrast-gradient" x1="2" x2="46" y1="2" y2="46">
            <stop stop-color="#667eea"></stop>
            <stop offset="1" stop-color="#764ba2"></stop>
          </linearGradient>
        </defs>
        <rect x="6" y="12" width="14" height="24" rx="2" fill="url(#compare-contrast-gradient)" stroke="white" stroke-width="2"/>
        <rect x="28" y="12" width="14" height="24" rx="2" fill="url(#compare-contrast-gradient)" stroke="white" stroke-width="2"/>
        <path d="M20 20 L28 20 M20 24 L28 24 M20 28 L28 28" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <circle cx="24" cy="8" r="3" fill="url(#compare-contrast-gradient)"/>
        <circle cx="24" cy="40" r="3" fill="url(#compare-contrast-gradient)"/>
      </svg>
    `;
    
    // Add the block name
    const blockName = document.createTextNode('Compare & Contrast');
    
    // Assemble the button
    blockButton.appendChild(iconDiv);
    blockButton.appendChild(blockName);
    blockItem.appendChild(blockButton);
    blockWrapper.appendChild(blockItem);
    
    // Add Rise-compatible styling
    blockWrapper.style.cssText = `
      position: relative;
    `;
    
    return blockWrapper;
  }

  async injectCustomStyles() {
    // Inject interaction styles if not already present
    if (document.getElementById('compare-contrast-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'compare-contrast-styles';
    style.textContent = `
      /* Compare & Contrast Interaction Styles */
      .compare-contrast-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .compare-contrast-container .interaction-controls {
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .compare-contrast-container:hover .interaction-controls {
        opacity: 1;
      }

      /* Hide interaction controls in preview mode */
      body.preview-mode .interaction-controls,
      body.published .interaction-controls,
      .preview-mode .interaction-controls,
      .published .interaction-controls {
        display: none !important;
      }

      /* Ensure interactions are visible in preview mode */
      .preview-mode [data-compare-contrast-interaction],
      .published [data-compare-contrast-interaction] {
        display: block !important;
        visibility: visible !important;
      }

      /* Rise-specific styling adjustments */
      .block.compare-contrast-container {
        margin: 20px 0;
        padding: 0;
        background: transparent;
        border: none;
      }

      /* Custom block button styling */
      .custom-block-button:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 4px rgba(102, 126, 234, 0.2) !important;
      }
    `;

    document.head.appendChild(style);
  }

  observeNavigationChanges(callback) {
    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    
    const checkForChanges = () => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        console.log('Navigation detected:', currentUrl);
        callback();
      }
    };

    // Listen for various navigation events
    window.addEventListener('popstate', checkForChanges);
    window.addEventListener('hashchange', checkForChanges);
    
    // Watch for DOM changes that might indicate navigation
    const observer = new MutationObserver((mutations) => {
      // Check if significant DOM changes occurred
      const significantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.addedNodes.length > 0 &&
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE &&
          (node.classList?.contains('lesson-content') ||
           node.classList?.contains('authoring-view') ||
           node.querySelector?.('.lesson-content, .authoring-view'))
        )
      );

      if (significantChanges) {
        setTimeout(checkForChanges, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      window.removeEventListener('popstate', checkForChanges);
      window.removeEventListener('hashchange', checkForChanges);
      observer.disconnect();
    };
  }

  async injectInteractiveScript() {
    // Check if script is already injected
    if (document.getElementById('compare-contrast-script')) {
      return;
    }

    try {
      // Get the script content from the extension
      const scriptUrl = chrome.runtime.getURL('interaction.js');
      const response = await fetch(scriptUrl);
      const scriptContent = await response.text();

      // Create and inject script element
      const script = document.createElement('script');
      script.id = 'compare-contrast-script';
      script.textContent = scriptContent;
      document.head.appendChild(script);

      console.log('Interactive script injected successfully');
    } catch (error) {
      console.error('Error injecting interactive script:', error);
    }
  }

  getRiseVersion() {
    // Try to detect Rise version from various sources
    try {
      // Check for version in meta tags
      const versionMeta = document.querySelector('meta[name*="version"], meta[name*="rise"]');
      if (versionMeta) {
        return versionMeta.content;
      }

      // Check for version in global objects
      if (window.Rise && window.Rise.version) {
        return window.Rise.version;
      }

      // Check for version in script URLs
      const scripts = Array.from(document.scripts);
      for (const script of scripts) {
        const match = script.src.match(/rise.*?(\d+\.\d+\.\d+)/i);
        if (match) {
          return match[1];
        }
      }

      return 'unknown';
    } catch (error) {
      console.error('Error detecting Rise version:', error);
      return 'unknown';
    }
  }
}