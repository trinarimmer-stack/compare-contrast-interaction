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
    for (const selector of this.riseSelectors.blockList) {
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

  createCustomBlockButton() {
    const button = document.createElement('div');
    button.className = 'custom-block-button compare-contrast-block';
    button.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 16px;
      margin: 4px 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    button.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: white;
        font-size: 18px;
      ">
        ⚖️
      </div>
      <div>
        <div style="
          font-weight: 600;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
        ">Compare & Contrast</div>
        <div style="
          color: #666;
          font-size: 12px;
        ">Interactive learning activity</div>
      </div>
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.borderColor = '#667eea';
      button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.15)';
      button.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.borderColor = '#e0e0e0';
      button.style.boxShadow = 'none';
      button.style.transform = 'translateY(0)';
    });

    return button;
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