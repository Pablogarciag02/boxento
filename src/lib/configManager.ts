/**
 * Configuration Manager for Boxento widgets
 * 
 * Handles storing and retrieving widget configurations from Firestore when logged in
 * and localStorage when not, providing a central point for managing persistent widget data
 */

import { encryptionUtils } from './encryption';
import { userDashboardService } from './firestoreService';
import { auth } from './firebase';

/**
 * Interface for the widget configuration store
 */
export interface WidgetConfigStore {
  [widgetId: string]: Record<string, unknown>;
}

/**
 * Default sensitive fields that should be encrypted
 */
const DEFAULT_SENSITIVE_FIELDS = ['apiKey', 'token', 'secret', 'password', 'key'];

/**
 * Configuration Manager
 * Provides methods to save, retrieve, and manage widget configurations
 */
export const configManager = {
  /**
   * Save a widget's configuration to Firestore when logged in, otherwise localStorage
   * 
   * @param widgetId - Unique identifier for the widget
   * @param config - Configuration object to save
   * @param sensitiveFields - Optional array of field names that should be encrypted
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   */
  saveWidgetConfig: async (
    widgetId: string, 
    config: Record<string, unknown>, 
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    dashboardId?: string
  ): Promise<void> => {
    try {
      // Process sensitive fields (like API keys) for encryption
      const processedConfig = encryptionUtils.processObjectForStorage(config, sensitiveFields);
      
      // If user is logged in, save to Firestore
      if (auth.currentUser) {
        await userDashboardService.saveWidgetConfig(widgetId, processedConfig, dashboardId);
      } else {
        // Fallback to localStorage
        const storageKey = dashboardId 
          ? `boxento-widget-configs-${dashboardId}` 
          : 'boxento-widget-configs';
          
        const configs = configManager.getConfigsFromLocalStorage(dashboardId);
        configs[widgetId] = processedConfig;
        localStorage.setItem(storageKey, JSON.stringify(configs));
      }
    } catch (e) {
      console.error('Error saving widget configuration', e);
    }
  },
  
  /**
   * Retrieve a widget's configuration from Firestore when logged in, otherwise localStorage
   * 
   * @param widgetId - Unique identifier for the widget
   * @param sensitiveFields - Optional array of field names that should be decrypted
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   * @returns The widget's configuration or null if not found
   */
  getWidgetConfig: async (
    widgetId: string, 
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS, 
    dashboardId?: string
  ): Promise<Record<string, unknown> | null> => {
    try {
      let config: Record<string, unknown> | null = null;
      
      // If user is logged in, try to get from Firestore
      if (auth.currentUser) {
        config = await userDashboardService.loadWidgetConfig(widgetId, dashboardId);
      }
      
      // If no config from Firestore or user not logged in, try localStorage
      if (!config) {
        const configs = configManager.getConfigsFromLocalStorage(dashboardId);
        config = configs[widgetId] || null;
      }
      
      if (!config) return null;
      
      // Process and decrypt any sensitive fields
      const decryptedConfig = encryptionUtils.processObjectFromStorage(config, sensitiveFields);
      
      // Restore Date objects for TodoWidget and other widgets
      return configManager.restoreDates(decryptedConfig);
    } catch (e) {
      console.error('Error getting widget configuration', e);
      return null;
    }
  },
  
  /**
   * Get all stored widget configurations
   * 
   * @param decryptSensitiveFields - Whether to decrypt sensitive fields in all configs
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   * @returns Object containing all widget configurations
   */
  getConfigs: async (
    decryptSensitiveFields = false, 
    dashboardId?: string
  ): Promise<WidgetConfigStore> => {
    try {
      let configs: WidgetConfigStore = {};
      
      // If user is logged in, try to get from Firestore
      if (auth.currentUser) {
        const firestoreConfigs = await userDashboardService.loadAllWidgetConfigs(dashboardId);
        if (firestoreConfigs) {
          configs = firestoreConfigs;
        }
      }
      
      // If no configs from Firestore or user not logged in, try localStorage
      if (Object.keys(configs).length === 0) {
        configs = configManager.getConfigsFromLocalStorage(dashboardId);
      }
      
      if (!decryptSensitiveFields) return configs;
      
      // Decrypt sensitive fields if requested
      const decryptedConfigs: WidgetConfigStore = {};
      
      Object.keys(configs).forEach(widgetId => {
        const decryptedConfig = encryptionUtils.processObjectFromStorage(
          configs[widgetId], 
          DEFAULT_SENSITIVE_FIELDS
        );
        
        // Restore Date objects
        decryptedConfigs[widgetId] = configManager.restoreDates(decryptedConfig);
      });
      
      return decryptedConfigs;
    } catch (e) {
      console.error('Error loading widget configurations', e);
      return {};
    }
  },
  
  /**
   * Get configs from localStorage (helper method)
   * 
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   */
  getConfigsFromLocalStorage: (dashboardId?: string): WidgetConfigStore => {
    try {
      const storageKey = dashboardId 
        ? `boxento-widget-configs-${dashboardId}` 
        : 'boxento-widget-configs';
        
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error parsing localStorage configs', e);
      return {};
    }
  },
  
  /**
   * Clear a widget's configuration from storage
   * 
   * @param widgetId - Unique identifier for the widget to clear
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   */
  clearConfig: async (widgetId: string, dashboardId?: string): Promise<void> => {
    try {
      // If user is logged in, delete from Firestore
      if (auth.currentUser) {
        await userDashboardService.deleteWidgetConfig(widgetId, dashboardId);
      }
      
      // Also clear from localStorage
      const storageKey = dashboardId 
        ? `boxento-widget-configs-${dashboardId}` 
        : 'boxento-widget-configs';
        
      const configs = configManager.getConfigsFromLocalStorage(dashboardId);
      delete configs[widgetId];
      localStorage.setItem(storageKey, JSON.stringify(configs));
    } catch (e) {
      console.error('Error clearing widget configuration', e);
    }
  },
  
  /**
   * Clear all widget configurations from storage
   * 
   * @param dashboardId - Optional dashboard ID for multi-dashboard support
   */
  clearAllConfigs: async (dashboardId?: string): Promise<void> => {
    try {
      // Clear from localStorage
      const storageKey = dashboardId 
        ? `boxento-widget-configs-${dashboardId}` 
        : 'boxento-widget-configs';
        
      localStorage.removeItem(storageKey);
      
      // If user is logged in, clear from Firestore
      if (auth.currentUser) {
        const configs = await userDashboardService.loadAllWidgetConfigs(dashboardId);
        if (configs) {
          for (const widgetId of Object.keys(configs)) {
            await userDashboardService.deleteWidgetConfig(widgetId, dashboardId);
          }
        }
      }
    } catch (e) {
      console.error('Error clearing all widget configurations', e);
    }
  },
  
  /**
   * Helper method to restore Date objects in a configuration object
   * Looks for objects with date-like string properties and converts them to Date objects
   * 
   * @param config - Configuration object to process
   * @returns Processed configuration with restored Date objects
   */
  restoreDates: (config: Record<string, unknown>): Record<string, unknown> => {
    // Helper function to check if a string is a valid ISO date format
    const isISODateString = (str: string): boolean => {
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/;
      return isoDatePattern.test(str);
    };
    
    // Helper function to recursively process objects
    const processObject = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
      }
      
      if (typeof obj === 'object') {
        // Type guard to ensure obj is a Record<string, unknown>
        const objRecord = obj as Record<string, unknown>;
        
        // Handle objects with special date properties
        if (
          objRecord.createdAt && 
          typeof objRecord.createdAt === 'string' && 
          isISODateString(objRecord.createdAt)
        ) {
          return {
            ...objRecord,
            createdAt: new Date(objRecord.createdAt)
          };
        }
        
        // Process all properties of the object
        const result: Record<string, unknown> = {};
        for (const key in objRecord) {
          if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
            result[key] = processObject(objRecord[key]);
          }
        }
        return result;
      }
      
      return obj;
    };
    
    return processObject(config) as Record<string, unknown>;
  }
};