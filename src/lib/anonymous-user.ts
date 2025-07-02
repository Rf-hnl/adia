// Anonymous User Management
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_USER_KEY = 'ai_creative_analyzer_anonymous_id';
const USER_PREFERENCES_KEY = 'ai_creative_analyzer_preferences';

export interface AnonymousUser {
  id: string;
  createdAt: Date;
  lastActive: Date;
  sessionCount: number;
  analysisCount: number;
  feedbackCount: number;
  deviceInfo: {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
  };
}

export interface UserPreferences {
  hasSeenWelcome: boolean;
  preferredLanguage: string;
  feedbackEnabled: boolean;
  trackingEnabled: boolean;
}

class AnonymousUserManager {
  private anonymousId: string | null = null;
  private preferences: UserPreferences | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Generate or get existing anonymous ID
  getAnonymousId(): string {
    if (this.anonymousId) {
      return this.anonymousId;
    }

    // Try to load from localStorage
    const stored = this.loadFromStorage();
    if (stored) {
      return stored;
    }

    // Generate new anonymous ID
    this.anonymousId = `anon_${uuidv4()}`;
    this.saveToStorage();
    
    return this.anonymousId;
  }

  // Load anonymous ID from localStorage
  private loadFromStorage(): string | null {
    try {
      const stored = localStorage.getItem(ANONYMOUS_USER_KEY);
      if (stored) {
        this.anonymousId = stored;
        return stored;
      }
    } catch (error) {
      console.error('Error loading anonymous ID:', error);
    }
    return null;
  }

  // Save anonymous ID to localStorage
  private saveToStorage(): void {
    try {
      if (this.anonymousId) {
        localStorage.setItem(ANONYMOUS_USER_KEY, this.anonymousId);
      }
    } catch (error) {
      console.error('Error saving anonymous ID:', error);
    }
  }

  // Get device information
  getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'server',
        language: 'en',
        timezone: 'UTC',
        screenResolution: '0x0'
      };
    }

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  // Get or create anonymous user data
  getAnonymousUserData(): AnonymousUser {
    const anonymousId = this.getAnonymousId();
    const now = new Date();
    
    // Try to get existing data from localStorage
    const existingData = this.getStoredUserData();
    
    if (existingData) {
      // Update last active and increment session count
      existingData.lastActive = now;
      existingData.sessionCount += 1;
      this.saveUserData(existingData);
      return existingData;
    }

    // Create new user data
    const userData: AnonymousUser = {
      id: anonymousId,
      createdAt: now,
      lastActive: now,
      sessionCount: 1,
      analysisCount: 0,
      feedbackCount: 0,
      deviceInfo: this.getDeviceInfo()
    };

    this.saveUserData(userData);
    return userData;
  }

  // Get stored user data
  private getStoredUserData(): AnonymousUser | null {
    try {
      const stored = localStorage.getItem(`${ANONYMOUS_USER_KEY}_data`);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        data.createdAt = new Date(data.createdAt);
        data.lastActive = new Date(data.lastActive);
        return data;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return null;
  }

  // Save user data to localStorage
  private saveUserData(userData: AnonymousUser): void {
    try {
      localStorage.setItem(`${ANONYMOUS_USER_KEY}_data`, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Increment analysis count
  incrementAnalysisCount(): void {
    const userData = this.getAnonymousUserData();
    userData.analysisCount += 1;
    userData.lastActive = new Date();
    this.saveUserData(userData);
  }

  // Increment feedback count
  incrementFeedbackCount(): void {
    const userData = this.getAnonymousUserData();
    userData.feedbackCount += 1;
    userData.lastActive = new Date();
    this.saveUserData(userData);
  }

  // Get user preferences
  getPreferences(): UserPreferences {
    if (this.preferences) {
      return this.preferences;
    }

    try {
      const stored = localStorage.getItem(USER_PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
        return this.preferences!;
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }

    // Default preferences
    this.preferences = {
      hasSeenWelcome: false,
      preferredLanguage: 'es',
      feedbackEnabled: true,
      trackingEnabled: true
    };

    this.savePreferences();
    return this.preferences;
  }

  // Update preferences
  updatePreferences(updates: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    this.preferences = { ...current, ...updates };
    this.savePreferences();
  }

  // Save preferences
  private savePreferences(): void {
    try {
      if (this.preferences) {
        localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  // Clear all data (for testing or privacy)
  clearAllData(): void {
    try {
      localStorage.removeItem(ANONYMOUS_USER_KEY);
      localStorage.removeItem(`${ANONYMOUS_USER_KEY}_data`);
      localStorage.removeItem(USER_PREFERENCES_KEY);
      this.anonymousId = null;
      this.preferences = null;
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

// Export singleton instance
export const anonymousUserManager = new AnonymousUserManager();