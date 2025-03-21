import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  deleteDoc,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { WidgetConfigStore } from './configManager';
import { LayoutItem } from '@/types';
import { Dashboard } from '@/components/dashboard/DashboardSelector';

// Breakpoints and columns configuration - must match App.tsx
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// Helper function to create a default layout item for a widget
const createDefaultLayoutItem = (
  widgetId: string, 
  index: number, 
  colCount: number,
  breakpoint: string
): LayoutItem => {
  // For desktop layouts (lg, md), create a grid layout
  if (breakpoint === 'lg' || breakpoint === 'md') {
    // Calculate a grid position that works well with vertical compacting
    const maxItemsPerRow = Math.max(1, Math.floor(colCount / 3)); 
    const col = index % maxItemsPerRow;
    const row = Math.floor(index / maxItemsPerRow);
    
    return {
      i: widgetId,
      x: col * 3,
      y: row * 3,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2
    };
  } 
  // For medium tablet layouts
  else if (breakpoint === 'sm') {
    // For tablet, use 2 items per row
    const itemsPerRow = 2;
    const col = index % itemsPerRow;
    const row = Math.floor(index / itemsPerRow);
    
    return {
      i: widgetId,
      x: col * 3,
      y: row * 3,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2
    };
  }
  // For mobile layouts (xs, xxs), force 2x2 grid size and stack vertically
  else {
    return {
      i: widgetId,
      x: 0,
      y: index * 2,
      w: 2,
      h: 2,
      minW: 2,
      minH: 2,
      maxW: 2,
      maxH: 2
    };
  }
};

// Utility to get current user ID safely
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// User dashboard data service
export const userDashboardService = {
  // Save the user's dashboard layouts
  saveLayouts: async (layouts: { [key: string]: LayoutItem[] }, dashboardId?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the layouts object to remove undefined values
      // Firestore doesn't accept undefined values
      const sanitizedLayouts = JSON.parse(JSON.stringify(layouts));
      
      if (dashboardId) {
        // Store layouts in new multi-dashboard structure
        await setDoc(
          doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'layouts'), 
          sanitizedLayouts, 
          { merge: true }
        );
      } else {
        // Backward compatibility: Store layouts in the old structure
        await setDoc(
          doc(db, 'users', userId, 'dashboard', 'layouts'), 
          sanitizedLayouts, 
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error saving layouts to Firestore:', error);
      throw error;
    }
  },

  // Load the user's dashboard layouts
  loadLayouts: async (dashboardId?: string): Promise<{ [key: string]: LayoutItem[] } | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      let docRef;
      
      if (dashboardId) {
        // Load from new multi-dashboard structure
        docRef = doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'layouts');
      } else {
        // Backward compatibility: Load from old structure
        docRef = doc(db, 'users', userId, 'dashboard', 'layouts');
      }
      
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Return the document data directly, not nested under 'layouts'
        return docSnap.data() as { [key: string]: LayoutItem[] };
      }
      return null;
    } catch (error) {
      console.error('Error loading layouts from Firestore:', error);
      throw error;
    }
  },

  // Save a widget configuration
  saveWidgetConfig: async (widgetId: string, config: Record<string, unknown>, dashboardId?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the config object to remove undefined values
      const sanitizedConfig = JSON.parse(JSON.stringify(config));
      
      if (dashboardId) {
        // Save to new multi-dashboard structure
        await setDoc(
          doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs', widgetId),
          { config: sanitizedConfig },
          { merge: true }
        );
      } else {
        // Backward compatibility: Save to old structure
        await setDoc(
          doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId),
          { config: sanitizedConfig },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error saving widget config to Firestore:', error);
      throw error;
    }
  },

  // Load a widget configuration
  loadWidgetConfig: async (widgetId: string, dashboardId?: string): Promise<Record<string, unknown> | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      let docRef;
      
      if (dashboardId) {
        // Load from new multi-dashboard structure
        docRef = doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs', widgetId);
      } else {
        // Backward compatibility: Load from old structure
        docRef = doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId);
      }
      
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.config || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading widget config from Firestore:', error);
      throw error;
    }
  },

  // Save all widget configurations at once
  saveAllWidgetConfigs: async (configs: WidgetConfigStore, dashboardId?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Create a batch of operations for better performance
      const batch = writeBatch(db);
      
      // Add each widget config to the batch
      Object.entries(configs).forEach(([widgetId, config]) => {
        let docRef;
        
        if (dashboardId) {
          // Save to new multi-dashboard structure
          docRef = doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs', widgetId);
        } else {
          // Backward compatibility: Save to old structure
          docRef = doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId);
        }
        
        batch.set(docRef, { config }, { merge: true });
      });
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error saving all widget configs to Firestore:', error);
      throw error;
    }
  },

  // Load all widget configurations
  loadAllWidgetConfigs: async (dashboardId?: string): Promise<WidgetConfigStore | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      let colRef;
      
      if (dashboardId) {
        // Load from new multi-dashboard structure
        colRef = collection(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs');
      } else {
        // Backward compatibility: Load from old structure
        colRef = collection(db, 'users', userId, 'dashboard', 'widget-configs', 'configs');
      }
      
      const querySnapshot = await getDocs(colRef);
      
      const configs: WidgetConfigStore = {};
      querySnapshot.forEach((doc) => {
        configs[doc.id] = doc.data()?.config || {};
      });
      
      return configs;
    } catch (error) {
      console.error('Error loading all widget configs from Firestore:', error);
      throw error;
    }
  },

  // Save the list of installed widgets
  saveWidgets: async (widgets: Record<string, unknown>[], dashboardId?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Strip out configuration data to avoid redundancy
      const essentialWidgetData = widgets.map(widget => {
        // Extract only the essential fields
        return {
          id: widget.id,
          type: widget.type,
          // Add any other essential metadata fields here (but NOT config)
        };
      });
      
      // Sanitize the widgets array to remove undefined values
      const sanitizedWidgets = JSON.parse(JSON.stringify(essentialWidgetData));
      
      if (dashboardId) {
        // Save to new multi-dashboard structure
        await setDoc(
          doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-list'),
          { widgets: sanitizedWidgets },
          { merge: true }
        );
      } else {
        // Backward compatibility: Save to old structure
        await setDoc(
          doc(db, 'users', userId, 'dashboard', 'widget-list'),
          { widgets: sanitizedWidgets },
          { merge: true }
        );
      }
      
      // Update dashboard lastModified timestamp if using multi-dashboard
      if (dashboardId) {
        await updateDoc(doc(db, 'users', userId, 'dashboards', dashboardId), {
          lastModified: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving widgets to Firestore:', error);
      throw error;
    }
  },

  // Load the list of installed widgets
  loadWidgets: async (dashboardId?: string): Promise<Record<string, unknown>[] | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      let docRef;
      
      if (dashboardId) {
        // Load from new multi-dashboard structure
        docRef = doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-list');
      } else {
        // Backward compatibility: Load from old structure
        docRef = doc(db, 'users', userId, 'dashboard', 'widget-list');
      }
      
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.widgets || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading widgets from Firestore:', error);
      throw error;
    }
  },

  // Delete a widget configuration
  deleteWidgetConfig: async (widgetId: string, dashboardId?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      if (dashboardId) {
        // Delete from new multi-dashboard structure
        await deleteDoc(doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs', widgetId));
      } else {
        // Backward compatibility: Delete from old structure
        await deleteDoc(doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId));
      }
    } catch (error) {
      console.error('Error deleting widget config from Firestore:', error);
      throw error;
    }
  },

  // Get all dashboards for a user
  getDashboards: async (): Promise<Dashboard[]> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // First check for dashboards in the new structure
      const dashboardsCollection = collection(db, 'users', userId, 'dashboards');
      const dashboardsSnapshot = await getDocs(dashboardsCollection);
      
      if (!dashboardsSnapshot.empty) {
        // Return dashboards from the new structure
        return dashboardsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Dashboard',
          createdAt: doc.data().createdAt || Date.now(),
          lastModified: doc.data().lastModified || Date.now()
        }));
      }
      
      // If no dashboards in new structure, check for legacy dashboard
      const legacyDashboardRef = doc(db, 'users', userId, 'dashboard');
      const legacyDashboardSnap = await getDoc(legacyDashboardRef);
      
      if (legacyDashboardSnap.exists()) {
        // If legacy dashboard exists, migrate it to the new structure
        const defaultDashboard: Dashboard = {
          id: 'default',
          name: 'My Dashboard',
          createdAt: Date.now(),
          lastModified: Date.now()
        };
        
        // Create the default dashboard in the new structure
        await setDoc(
          doc(db, 'users', userId, 'dashboards', defaultDashboard.id),
          {
            name: defaultDashboard.name,
            createdAt: defaultDashboard.createdAt,
            lastModified: defaultDashboard.lastModified
          }
        );
        
        return [defaultDashboard];
      }
      
      // If no dashboards at all, create a default one
      return [await userDashboardService.createDashboard('My Dashboard')];
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      throw error;
    }
  },

  // Create a new dashboard
  createDashboard: async (name: string): Promise<Dashboard> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const dashboardData = {
        name,
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      
      // Create a new dashboard document with auto-generated ID
      const dashboardRef = doc(collection(db, 'users', userId, 'dashboards'));
      const dashboardId = dashboardRef.id;
      
      await setDoc(dashboardRef, dashboardData);
      
      // Create empty collections for the new dashboard
      await setDoc(
        doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'layouts'),
        {}
      );
      
      await setDoc(
        doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-list'),
        { widgets: [] }
      );
      
      return {
        ...dashboardData,
        id: dashboardId
      };
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  },

  // Rename a dashboard
  renameDashboard: async (dashboardId: string, name: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await updateDoc(doc(db, 'users', userId, 'dashboards', dashboardId), {
        name,
        lastModified: Date.now()
      });
    } catch (error) {
      console.error('Error renaming dashboard:', error);
      throw error;
    }
  },

  // Delete a dashboard
  deleteDashboard: async (dashboardId: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Delete widget configs
      const configsCollection = collection(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs', 'configs');
      const configsSnapshot = await getDocs(configsCollection);
      
      const batch = writeBatch(db);
      
      configsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete widget configs collection
      batch.delete(doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-configs'));
      
      // Delete layouts, widget-list
      batch.delete(doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'layouts'));
      batch.delete(doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard', 'widget-list'));
      
      // Delete dashboard collection
      batch.delete(doc(db, 'users', userId, 'dashboards', dashboardId, 'dashboard'));
      
      // Delete the dashboard document
      batch.delete(doc(db, 'users', userId, 'dashboards', dashboardId));
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  },

  // Migrate legacy dashboard to the multi-dashboard structure
  migrateToDashboards: async (): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Check if dashboards already exist in new structure
      const dashboardsCollection = collection(db, 'users', userId, 'dashboards');
      const dashboardsSnapshot = await getDocs(dashboardsCollection);
      
      // If dashboards already exist, skip migration
      if (!dashboardsSnapshot.empty) {
        console.log('Migration skipped: Dashboards already exist in new structure');
        return;
      }
      
      // Check if legacy dashboard exists
      const legacyLayoutsRef = doc(db, 'users', userId, 'dashboard', 'layouts');
      const legacyWidgetsRef = doc(db, 'users', userId, 'dashboard', 'widget-list');
      
      const [legacyLayoutsSnap, legacyWidgetsSnap] = await Promise.all([
        getDoc(legacyLayoutsRef),
        getDoc(legacyWidgetsRef)
      ]);
      
      // If no legacy data, don't migrate
      if (!legacyLayoutsSnap.exists() && !legacyWidgetsSnap.exists()) {
        console.log('Migration skipped: No legacy dashboard data found');
        return;
      }
      
      // Create default dashboard
      const defaultDashboard = {
        name: 'My Dashboard',
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      
      // Save default dashboard
      await setDoc(
        doc(db, 'users', userId, 'dashboards', 'default'),
        defaultDashboard
      );
      
      // Migrate layouts
      if (legacyLayoutsSnap.exists()) {
        await setDoc(
          doc(db, 'users', userId, 'dashboards', 'default', 'dashboard', 'layouts'),
          legacyLayoutsSnap.data()
        );
      }
      
      // Migrate widgets
      if (legacyWidgetsSnap.exists()) {
        await setDoc(
          doc(db, 'users', userId, 'dashboards', 'default', 'dashboard', 'widget-list'),
          legacyWidgetsSnap.data()
        );
      }
      
      // Migrate widget configs
      const legacyConfigsCollection = collection(db, 'users', userId, 'dashboard', 'widget-configs', 'configs');
      const legacyConfigsSnapshot = await getDocs(legacyConfigsCollection);
      
      if (!legacyConfigsSnapshot.empty) {
        const batch = writeBatch(db);
        
        legacyConfigsSnapshot.forEach(configDoc => {
          const configId = configDoc.id;
          batch.set(
            doc(db, 'users', userId, 'dashboards', 'default', 'dashboard', 'widget-configs', 'configs', configId),
            configDoc.data()
          );
        });
        
        await batch.commit();
      }
      
      console.log('Migration completed: Legacy dashboard migrated to multi-dashboard structure');
    } catch (error) {
      console.error('Error migrating to dashboards:', error);
      throw error;
    }
  },

  // Migrate legacy layout data structure
  migrateLayoutDataStructure: async (): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const docRef = doc(db, 'users', userId, 'dashboard', 'layouts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if layouts are nested under 'layouts' property (old format)
        if (data.layouts && typeof data.layouts === 'object') {
          console.log('Migrating legacy layout structure...');
          
          // Save layouts directly without the wrapper
          await setDoc(docRef, data.layouts, { merge: true });
          console.log('Layout data structure migration complete');
        }
      }
    } catch (error) {
      console.error('Error migrating layout data structure:', error);
      throw error;
    }
  },

  // Migrate data from localStorage to Firestore
  migrateFromLocalStorage: async (): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Migrate layouts
      const storedLayouts = localStorage.getItem('boxento-layouts');
      if (storedLayouts) {
        const layouts = JSON.parse(storedLayouts);
        await userDashboardService.saveLayouts(layouts);
      }
      
      // Migrate widgets
      const storedWidgets = localStorage.getItem('boxento-widgets');
      if (storedWidgets) {
        const widgets = JSON.parse(storedWidgets);
        await userDashboardService.saveWidgets(widgets);
      }
      
      // Migrate widget configs
      const storedConfigs = localStorage.getItem('boxento-widget-configs');
      if (storedConfigs) {
        const configs = JSON.parse(storedConfigs);
        await userDashboardService.saveAllWidgetConfigs(configs);
      }
      
      console.log('Migration from localStorage to Firestore completed');
    } catch (error) {
      console.error('Error migrating data from localStorage to Firestore:', error);
      throw error;
    }
  },

  // Validate and fix layouts to ensure they match widgets
  validateAndFixLayouts: async (widgets: { id: string, type: string }[]): Promise<{ [key: string]: LayoutItem[] }> => {
    const layouts = await userDashboardService.loadLayouts() || {};
    let layoutsNeedUpdate = false;
    
    // Create a set of widget IDs for quick lookup
    const widgetIds = new Set(widgets.map(w => w.id));
    
    // Check each breakpoint to ensure all widgets have layout items
    Object.keys(breakpoints).forEach(breakpoint => {
      if (!layouts[breakpoint]) {
        layouts[breakpoint] = [];
        layoutsNeedUpdate = true;
      }
      
      // Add layouts for widgets that don't have them
      widgets.forEach(widget => {
        if (!layouts[breakpoint].some(item => item.i === widget.id)) {
          // Create a new layout item at the end of the layout
          const colsForBreakpoint = breakpoint in cols ? cols[breakpoint as keyof typeof cols] : 12;
          const newItem = createDefaultLayoutItem(
            widget.id, 
            layouts[breakpoint].length,
            colsForBreakpoint,
            breakpoint
          );
          layouts[breakpoint].push(newItem);
          layoutsNeedUpdate = true;
          console.log(`Created missing layout for widget ${widget.id} in breakpoint ${breakpoint}`);
        }
      });
      
      // Remove layouts for widgets that don't exist
      const initialLength = layouts[breakpoint].length;
      layouts[breakpoint] = layouts[breakpoint].filter(item => widgetIds.has(item.i));
      if (layouts[breakpoint].length !== initialLength) {
        layoutsNeedUpdate = true;
        console.log(`Removed ${initialLength - layouts[breakpoint].length} orphaned layouts from breakpoint ${breakpoint}`);
      }
    });
    
    // Save updated layouts if needed
    if (layoutsNeedUpdate) {
      console.log('Updating layouts to ensure all widgets have layout items');
      await userDashboardService.saveLayouts(layouts);
    }
    
    return layouts;
  },

  // Save app settings
  saveAppSettings: async (settings: Record<string, unknown>): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the settings object to remove undefined values
      const sanitizedSettings = JSON.parse(JSON.stringify(settings));
      
      await setDoc(
        doc(db, 'users', userId, 'dashboard', 'app-settings'),
        { settings: sanitizedSettings },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving app settings to Firestore:', error);
      throw error;
    }
  },

  // Load app settings
  loadAppSettings: async (): Promise<Record<string, unknown> | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      const docRef = doc(db, 'users', userId, 'dashboard', 'app-settings');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.settings || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading app settings from Firestore:', error);
      throw error;
    }
  }
}; 