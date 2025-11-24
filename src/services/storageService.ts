import { Event, UserSettings, UserData } from '../types/event';

export class StorageService {
  private static readonly EVENTS_KEY = 'photo2calendar-events';
  private static readonly SETTINGS_KEY = 'photo2calendar-settings';
  private static readonly USER_DATA_KEY = 'photo2calendar-user-data';
  private static readonly HISTORY_KEY = 'photo2calendar-history';

  /**
   * Save an event to localStorage
   */
  static saveEvent(event: Event): void {
    try {
      const events = this.getAllEvents();
      const existingIndex = events.findIndex(e => e.id === event.id);
      
      if (existingIndex >= 0) {
        events[existingIndex] = event;
      } else {
        events.push(event);
      }
      
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }

  /**
   * Get all events from localStorage
   */
  static getAllEvents(): Event[] {
    try {
      const eventsJson = localStorage.getItem(this.EVENTS_KEY);
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get a specific event by ID
   */
  static getEvent(id: string): Event | null {
    try {
      const events = this.getAllEvents();
      return events.find(event => event.id === id) || null;
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  /**
   * Delete an event by ID
   */
  static deleteEvent(id: string): void {
    try {
      const events = this.getAllEvents();
      const filteredEvents = events.filter(event => event.id !== id);
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(filteredEvents));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }

  /**
   * Save user settings
   */
  static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Get user settings
   */
  static getSettings(): UserSettings {
    try {
      const settingsJson = localStorage.getItem(this.SETTINGS_KEY);
      const defaultSettings: UserSettings = {
        defaultCalendar: 'Personal',
        defaultReminder: 15,
        language: 'en',
        isPremium: false
      };
      
      return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        defaultCalendar: 'Personal',
        defaultReminder: 15,
        language: 'en',
        isPremium: false
      };
    }
  }

  /**
   * Save user data/statistics
   */
  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  /**
   * Get user data/statistics
   */
  static getUserData(): UserData {
    try {
      const userDataJson = localStorage.getItem(this.USER_DATA_KEY);
      const defaultUserData: UserData = {
        totalEventsProcessed: 0,
        totalImagesProcessed: 0,
        totalTextProcessed: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      return userDataJson ? { ...defaultUserData, ...JSON.parse(userDataJson) } : defaultUserData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return {
        totalEventsProcessed: 0,
        totalImagesProcessed: 0,
        totalTextProcessed: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * Add events to history
   */
  static addToHistory(events: Event[]): void {
    try {
      const history = this.getHistory();
      const historyEntry = {
        id: Date.now().toString(),
        events: events,
        timestamp: new Date().toISOString(),
        source: 'ai_processing'
      };
      
      history.unshift(historyEntry);
      
      // Keep only last 50 history entries
      const limitedHistory = history.slice(0, 50);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  /**
   * Get processing history
   */
  static getHistory(): any[] {
    try {
      const historyJson = localStorage.getItem(this.HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Clear all data
   */
  static clearAllData(): void {
    try {
      localStorage.removeItem(this.EVENTS_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Export all data
   */
  static exportAllData(): any {
    try {
      return {
        events: this.getAllEvents(),
        settings: this.getSettings(),
        userData: this.getUserData(),
        history: this.getHistory(),
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  /**
   * Import data from backup
   */
  static importData(data: any): boolean {
    try {
      if (data.events) {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(data.events));
      }
      
      if (data.settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
      }
      
      if (data.userData) {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data.userData));
      }
      
      if (data.history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.history));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    eventsCount: number;
    historyCount: number;
    storageUsed: number;
    lastActivity: string;
  } {
    try {
      const events = this.getAllEvents();
      const history = this.getHistory();
      const userData = this.getUserData();
      
      // Calculate approximate storage usage
      const eventsSize = JSON.stringify(events).length;
      const historySize = JSON.stringify(history).length;
      const settingsSize = JSON.stringify(this.getSettings()).length;
      const userDataSize = JSON.stringify(userData).length;
      
      return {
        eventsCount: events.length,
        historyCount: history.length,
        storageUsed: eventsSize + historySize + settingsSize + userDataSize,
        lastActivity: userData.lastUsed || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        eventsCount: 0,
        historyCount: 0,
        storageUsed: 0,
        lastActivity: new Date().toISOString()
      };
    }
  }
}