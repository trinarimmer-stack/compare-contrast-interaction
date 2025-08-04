// Storage management utilities
export class StorageManager {
  constructor() {
    this.storageKey = 'compareContrastInteractions';
  }

  async saveInteraction(interactionId, config) {
    try {
      // Save to Chrome storage
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({
          [`interaction_${interactionId}`]: config
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Also save to localStorage as backup
      const interactions = this.getLocalInteractions();
      interactions[interactionId] = config;
      localStorage.setItem(this.storageKey, JSON.stringify(interactions));
      
      return true;
    } catch (error) {
      console.error('Error saving interaction:', error);
      // Fallback to localStorage only
      try {
        const interactions = this.getLocalInteractions();
        interactions[interactionId] = config;
        localStorage.setItem(this.storageKey, JSON.stringify(interactions));
        return true;
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        return false;
      }
    }
  }

  async getInteraction(interactionId) {
    try {
      // Try Chrome storage first
      const chromeResult = await new Promise((resolve) => {
        chrome.storage.local.get([`interaction_${interactionId}`], (result) => {
          resolve(result[`interaction_${interactionId}`]);
        });
      });

      if (chromeResult) {
        return chromeResult;
      }

      // Fallback to localStorage
      const interactions = this.getLocalInteractions();
      return interactions[interactionId] || null;
    } catch (error) {
      console.error('Error getting interaction:', error);
      // Fallback to localStorage
      const interactions = this.getLocalInteractions();
      return interactions[interactionId] || null;
    }
  }

  async deleteInteraction(interactionId) {
    try {
      // Remove from Chrome storage
      await new Promise((resolve, reject) => {
        chrome.storage.local.remove([`interaction_${interactionId}`], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Remove from localStorage
      const interactions = this.getLocalInteractions();
      delete interactions[interactionId];
      localStorage.setItem(this.storageKey, JSON.stringify(interactions));
      
      return true;
    } catch (error) {
      console.error('Error deleting interaction:', error);
      return false;
    }
  }

  getAllInteractions() {
    try {
      return this.getLocalInteractions();
    } catch (error) {
      console.error('Error getting all interactions:', error);
      return {};
    }
  }

  getLocalInteractions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing stored interactions:', error);
      return {};
    }
  }

  async syncFromChromeStorage() {
    try {
      const allData = await new Promise((resolve) => {
        chrome.storage.local.get(null, resolve);
      });

      const interactions = {};
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('interaction_')) {
          const interactionId = key.replace('interaction_', '');
          interactions[interactionId] = value;
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(interactions));
      return interactions;
    } catch (error) {
      console.error('Error syncing from Chrome storage:', error);
      return this.getLocalInteractions();
    }
  }
}