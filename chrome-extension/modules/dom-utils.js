// DOM manipulation utilities
export class DOMUtils {
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  static waitForMultipleElements(selectors, timeout = 5000) {
    const promises = selectors.map(selector => this.waitForElement(selector, timeout));
    return Promise.all(promises);
  }

  static insertAfter(newElement, referenceElement) {
    if (!referenceElement || !referenceElement.parentNode) {
      console.error('Reference element or its parent not found');
      return false;
    }
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    return true;
  }

  static insertBefore(newElement, referenceElement) {
    if (!referenceElement || !referenceElement.parentNode) {
      console.error('Reference element or its parent not found');
      return false;
    }
    referenceElement.parentNode.insertBefore(newElement, referenceElement);
    return true;
  }

  static safeRemove(element) {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        return true;
      }
    } catch (error) {
      console.error('Error removing element:', error);
    }
    return false;
  }

  static createElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  static addEventListenerSafe(element, event, handler, options = {}) {
    try {
      if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, handler, options);
        return true;
      }
    } catch (error) {
      console.error('Error adding event listener:', error);
    }
    return false;
  }

  static removeEventListenerSafe(element, event, handler, options = {}) {
    try {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler, options);
        return true;
      }
    } catch (error) {
      console.error('Error removing event listener:', error);
    }
    return false;
  }
}