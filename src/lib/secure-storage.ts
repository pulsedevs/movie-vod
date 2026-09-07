'use client'

/**
 * Secure Storage Utility
 * Provides encrypted localStorage with validation and security features
 */

interface SecureStorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
}

interface StoredData {
  data: any;
  timestamp: number;
  ttl?: number;
  checksum: string;
}

class SecureStorage {
  private readonly prefix: string = 'streamvibe_';
  private readonly encryptionKey: string;

  constructor() {
    // Generate or retrieve a client-specific encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): string {
    const keyName = `${this.prefix}encryption_key`;
    let key = localStorage.getItem(keyName);
    
    if (!key) {
      // Generate a new encryption key based on browser fingerprint
      key = this.generateEncryptionKey();
      localStorage.setItem(keyName, key);
    }
    
    return key;
  }

  private generateEncryptionKey(): string {
    // Create a browser-specific key using available entropy
    const entropy = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      Math.random().toString(36)
    ].join('|');
    
    return this.simpleHash(entropy);
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private encrypt(data: string): string {
    // Simple XOR encryption (for client-side security, not cryptographically secure)
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      const dataChar = data.charCodeAt(i);
      result += String.fromCharCode(dataChar ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  private decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData); // Base64 decode
      let result = '';
      for (let i = 0; i < data.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        const dataChar = data.charCodeAt(i);
        result += String.fromCharCode(dataChar ^ keyChar);
      }
      return result;
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  private calculateChecksum(data: string): string {
    return this.simpleHash(data + this.encryptionKey);
  }

  private validateChecksum(data: string, checksum: string): boolean {
    return this.calculateChecksum(data) === checksum;
  }

  private sanitizeKey(key: string): string {
    // Remove potentially dangerous characters and limit length
    return key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  }

  private validateData(data: any): boolean {
    // Prevent storage of functions, symbols, or potentially dangerous objects
    if (typeof data === 'function' || typeof data === 'symbol') {
      return false;
    }
    
    // Check for potential XSS in string data
    if (typeof data === 'string') {
      const dangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i
      ];
      
      return !dangerousPatterns.some(pattern => pattern.test(data));
    }
    
    return true;
  }

  setItem(key: string, value: any, options: SecureStorageOptions = {}): boolean {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      
      if (!sanitizedKey || !this.validateData(value)) {
        console.warn('[SecureStorage] Invalid key or data provided');
        return false;
      }

      const serializedData = JSON.stringify(value);
      const timestamp = Date.now();
      const checksum = this.calculateChecksum(serializedData);
      
      const storageData: StoredData = {
        data: options.encrypt !== false ? this.encrypt(serializedData) : serializedData,
        timestamp,
        ttl: options.ttl,
        checksum
      };

      const finalData = JSON.stringify(storageData);
      
      // Check storage quota (approximate)
      if (finalData.length > 1024 * 1024) { // 1MB limit per item
        console.warn('[SecureStorage] Data too large to store');
        return false;
      }

      localStorage.setItem(this.prefix + sanitizedKey, finalData);
      return true;
    } catch (error) {
      console.error('[SecureStorage] Failed to store data:', error);
      return false;
    }
  }

  getItem<T = any>(key: string, options: { decrypt?: boolean } = {}): T | null {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const rawData = localStorage.getItem(this.prefix + sanitizedKey);
      
      if (!rawData) {
        return null;
      }

      const storageData: StoredData = JSON.parse(rawData);
      
      // Check TTL
      if (storageData.ttl && Date.now() - storageData.timestamp > storageData.ttl) {
        this.removeItem(key);
        return null;
      }

      // Decrypt if needed
      const serializedData = options.decrypt !== false && typeof storageData.data === 'string' 
        ? this.decrypt(storageData.data)
        : storageData.data;

      // Validate checksum
      if (!this.validateChecksum(serializedData, storageData.checksum)) {
        console.warn('[SecureStorage] Data integrity check failed');
        this.removeItem(key);
        return null;
      }

      return JSON.parse(serializedData);
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve data:', error);
      return null;
    }
  }

  removeItem(key: string): boolean {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      localStorage.removeItem(this.prefix + sanitizedKey);
      return true;
    } catch (error) {
      console.error('[SecureStorage] Failed to remove data:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('[SecureStorage] Failed to clear data:', error);
      return false;
    }
  }

  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('[SecureStorage] Failed to get keys:', error);
      return [];
    }
  }

  getStorageInfo(): { totalSize: number; itemCount: number; items: Array<{ key: string; size: number }> } {
    const items: Array<{ key: string; size: number }> = [];
    let totalSize = 0;

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key) || '';
          const size = new Blob([value]).size;
          items.push({ 
            key: key.replace(this.prefix, ''), 
            size 
          });
          totalSize += size;
        }
      });
    } catch (error) {
      console.error('[SecureStorage] Failed to get storage info:', error);
    }

    return {
      totalSize,
      itemCount: items.length,
      items: items.sort((a, b) => b.size - a.size)
    };
  }

  // Cleanup expired items
  cleanup(): number {
    let cleanedCount = 0;
    
    try {
      const keys = this.getAllKeys();
      
      keys.forEach(key => {
        const data = this.getItem(key);
        if (data === null) {
          cleanedCount++;
        }
      });
    } catch (error) {
      console.error('[SecureStorage] Cleanup failed:', error);
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Utility functions for common use cases
export const secureLocalStorage = {
  // Store user preferences securely
  setUserPreference: (key: string, value: any) => 
    secureStorage.setItem(`user_pref_${key}`, value, { encrypt: true }),
    
  getUserPreference: <T = any>(key: string): T | null => 
    secureStorage.getItem<T>(`user_pref_${key}`),

  // Store watch data with TTL
  setWatchData: (key: string, value: any, ttlHours: number = 24) => 
    secureStorage.setItem(`watch_${key}`, value, { 
      encrypt: true, 
      ttl: ttlHours * 60 * 60 * 1000 
    }),
    
  getWatchData: <T = any>(key: string): T | null => 
    secureStorage.getItem<T>(`watch_${key}`),

  // Store session data with short TTL
  setSessionData: (key: string, value: any, ttlMinutes: number = 30) => 
    secureStorage.setItem(`session_${key}`, value, { 
      encrypt: true, 
      ttl: ttlMinutes * 60 * 1000 
    }),
    
  getSessionData: <T = any>(key: string): T | null => 
    secureStorage.getItem<T>(`session_${key}`),

  // Periodic cleanup
  performMaintenance: () => secureStorage.cleanup()
};
