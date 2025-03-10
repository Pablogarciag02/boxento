import React, { useState, useEffect } from 'react'
import { Plus, Moon, Sun, LogOut, LogIn } from 'lucide-react'
// Import GridLayout components - direct imports to avoid runtime issues
import GridLayout from 'react-grid-layout'
// @ts-ignore - The types don't correctly represent the module structure
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { getWidgetComponent, getWidgetConfigByType, WIDGET_REGISTRY } from '@/components/widgets'
import { 
  WidgetConfig, 
  Widget,
  LayoutItem
} from '@/types'
import WidgetErrorBoundary from '@/components/widgets/common/WidgetErrorBoundary'
import WidgetSelector from '@/components/widgets/common/WidgetSelector'
import { configManager } from '@/lib/configManager'
import { useAuth, AuthContextType } from '@/lib/AuthContext'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { saveDashboard, loadDashboard } from '@/lib/dashboardService'
import { Button } from '@/components/ui/button'

interface WidgetCategory {
  [category: string]: WidgetConfig[];
}

// Define breakpoints
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// Create responsive grid layout with width provider - once, outside the component
// This is important for performance as it prevents recreation on each render
const ResponsiveReactGridLayout = WidthProvider(Responsive);

function App() {
  // Add auth state
  const { currentUser, logout } = useAuth() as AuthContextType;
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  // Add a class to the body for dark mode background
  useEffect(() => {
    document.body.className = 'bg-gray-100 dark:bg-slate-900 min-h-screen';
    return () => {
      document.body.className = '';
    };
  }, []);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check system preference if no theme is set
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme as 'light' | 'dark';
      
      // Use system preference as default if available
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light'
  })
  
  const [layouts, setLayouts] = useState<{ [key: string]: LayoutItem[] }>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to load saved layouts
        const savedLayouts = localStorage.getItem('boxento-layouts');
        if (savedLayouts) {
          const parsedLayouts = JSON.parse(savedLayouts);
          
          // Validate all breakpoint layouts
          const validatedLayouts: { [key: string]: LayoutItem[] } = {};
          
          // Ensure all breakpoints have layouts with minimum dimensions
          Object.keys(breakpoints).forEach(breakpoint => {
            if (!parsedLayouts[breakpoint] || !Array.isArray(parsedLayouts[breakpoint])) {
              validatedLayouts[breakpoint] = []; // Default to empty layout
            } else {
              // Validate each layout item
              validatedLayouts[breakpoint] = parsedLayouts[breakpoint].map((item: LayoutItem) => ({
                ...item,
                w: Math.max(item.w, 2),
                h: Math.max(item.h, 2),
                minW: Math.max(item.minW || 1, 2),
                minH: Math.max(item.minH || 1, 2)
              }));
            }
          });
          
          return validatedLayouts;
        }
      } catch (error) {
        console.error('Error initializing layouts:', error);
      }
    }
    
    // Default layout for all breakpoints with default widgets
    const defaultLayout = {
      lg: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 5, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 8, y: 0, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      md: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 5, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      sm: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 3, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      xs: [
        { i: 'default-todo', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-weather', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 }
      ],
      xxs: [
        { i: 'default-todo', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-weather', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 }
      ]
    };
    return defaultLayout;
  });
  
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('boxento-widgets')
      const widgetsFromStorage = savedWidgets ? JSON.parse(savedWidgets) : []
      
      if (widgetsFromStorage.length === 0) {
        // Add default widgets if no widgets exist
        return [
          {
            id: 'default-todo',
            type: 'todo',
            config: getWidgetConfigByType('todo') || {}
          },
          {
            id: 'default-weather',
            type: 'weather',
            config: getWidgetConfigByType('weather') || {}
          },
          {
            id: 'default-quick-links',
            type: 'quick-links',
            config: getWidgetConfigByType('quick-links') || {}
          },
          {
            id: 'default-notes',
            type: 'notes',
            config: getWidgetConfigByType('notes') || {}
          }
        ];
      }
      
      // Load each widget's configuration from configManager
      return widgetsFromStorage.map((widget: Widget) => {
        if (widget.id) {
          const savedConfig = configManager.getWidgetConfig(widget.id);
          if (savedConfig) {
            return {
              ...widget,
              config: {
                ...widget.config,
                ...savedConfig
              }
            };
          }
        }
        return widget;
      });
    }
    return []
  })
  
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth - 40 : 1200)
  const [sidebarOpen, _setSidebarOpen] = useState<boolean>(false)
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState<boolean>(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg')
  const [widgetCategories, _setWidgetCategories] = useState<WidgetCategory>(() => {
    // Group widgets by category
    const categories: WidgetCategory = {};
    
    WIDGET_REGISTRY.forEach(widget => {
      const category = widget.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    
    return categories;
  });
  
  // Save widgets and layout to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('boxento-widgets', JSON.stringify(widgets))
      
      // Save each widget's configuration separately using configManager
      widgets.forEach(widget => {
        if (widget.config && widget.id) {
          // Don't save event handlers like onDelete
          const { onDelete, onUpdate, ...configToSave } = widget.config;
          configManager.saveWidgetConfig(widget.id, configToSave);
        }
      });
    }
  }, [widgets])
  
  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [theme])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const bodyPadding = 40; // Account for any potential body margin/padding
      setWindowWidth(window.innerWidth - (sidebarOpen ? 250 : 0) - bodyPadding);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  // Track if we're currently transitioning between breakpoints to prevent layout updates
  const [isBreakpointChanging, setIsBreakpointChanging] = useState<boolean>(false);
  
  // Listen for resize events to update the breakpoint
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let newBreakpoint = 'lg';
      
      // Find which breakpoint we're in
      for (const bp of Object.keys(breakpoints).sort((a, b) => 
        breakpoints[b as keyof typeof breakpoints] - breakpoints[a as keyof typeof breakpoints])) {
        if (width >= breakpoints[bp as keyof typeof breakpoints]) {
          newBreakpoint = bp;
          break;
        }
      }
      
      if (newBreakpoint !== currentBreakpoint) {
        setIsBreakpointChanging(true);
        setCurrentBreakpoint(newBreakpoint);
        console.log('Breakpoint changed to:', newBreakpoint);
        
        // Reset the flag after a short delay to allow the layout to settle
        setTimeout(() => {
          setIsBreakpointChanging(false);
        }, 400);
      }
    };
    
    // Initial check
    updateBreakpoint();
    
    // Add listener
    window.addEventListener('resize', updateBreakpoint);
    
    // Clean up
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [currentBreakpoint]);
  
  // Calculate row height based on window width to ensure square widgets
  const calculateRowHeight = (): number => {
    // Calculate the column width based on available width
    // Total usable width = windowWidth - (containerPadding * 2) - (margin * (cols - 1))
    const totalPadding = 40; // containerPadding (20px * 2)
    const totalMargins = 10 * (12 - 1); // margin (10px) * (cols - 1)
    const usableWidth = windowWidth - totalPadding - totalMargins;
    
    // Calculate column width (each column should be square)
    const columnWidth = usableWidth / 12;
    
    // Return the column width as row height to ensure squares
    // Apply responsiveness scaling similar to before
    if (windowWidth < 600) {
      return columnWidth * 0.8; // Smaller on mobile
    } else if (windowWidth < 1200) {
      return columnWidth * 0.9; // Slightly smaller on tablets
    } else {
      return columnWidth; // Default for desktop
    }
  };
  
  const rowHeight = calculateRowHeight();
  
  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Update addWidget function to work with ResponsiveReactGridLayout
  const addWidget = (type: string): void => {
    // Generate unique ID for this widget instance
    const widgetId = `${type}-${Date.now()}`;
    
    // Create new widget instance
    const newWidget: Widget = {
      id: widgetId,
      type,
      config: getWidgetConfigByType(type) || {}
    };
    
    // Add new widget to state
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    
    // For each breakpoint, create a layout item
    const updatedLayouts = { ...layouts };
    
    // For each breakpoint, add a layout item
    Object.keys(breakpoints).forEach((breakpoint) => {
      if (!updatedLayouts[breakpoint]) {
        updatedLayouts[breakpoint] = [];
      }
      
      // Calculate column count for this breakpoint
      const colCount = cols[breakpoint as keyof typeof cols];
      
      // Create default layout item based on the breakpoint
      const isMobile = breakpoint === 'xs' || breakpoint === 'xxs';
      const defaultItem = createDefaultLayoutItem(
        widgetId, 
        updatedLayouts[breakpoint].length, 
        colCount,
        breakpoint
      );
      
      // If on mobile, force 2x2 grid size
      if (isMobile) {
        defaultItem.w = 2;
        defaultItem.h = 2;
        defaultItem.maxW = 2;
        defaultItem.maxH = 2;
      }
      
      updatedLayouts[breakpoint].push(defaultItem);
    });
    
    // Update layout state
    setLayouts(updatedLayouts);
    
    // Close the widget selector if it's open
    if (widgetSelectorOpen) {
      setWidgetSelectorOpen(false);
    }
  };
  
  // Helper function to find the best position for a new widget
  const calculatePositions = (layout: LayoutItem[], cols: number) => {
    if (layout.length === 0) return { x: 0, y: 0 };
    
    // Find the highest y coordinate
    const maxY = Math.max(...layout.map(item => item.y + item.h), 0);
    
    // Try to position in the first row if space available
    for (let x = 0; x <= cols - 2; x++) {
      const overlapping = layout.some(item => 
        item.x <= x + 2 - 1 && 
        item.x + item.w > x && 
        item.y <= 0 + 2 - 1 && 
        item.y + item.h > 0
      );
      
      if (!overlapping) {
        return { x, y: 0 };
      }
    }
    
    // Default to positioning at the bottom
    return { x: 0, y: maxY };
  };

  const deleteWidget = (widgetId: string): void => {
    // Remove widget config from storage
    configManager.clearConfig(widgetId);
    
    // Remove widget from state
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    
    // Remove layout item from all breakpoints
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    setLayouts(newLayouts);
    
    // Save to localStorage
    localStorage.setItem('boxento-widgets', JSON.stringify(updatedWidgets));
  };
  
  // Store the last layout update timestamp to throttle updates
  const [lastLayoutUpdate, setLastLayoutUpdate] = useState<number>(0);
  
  // Add this near the top of the App component along with other state variables
  const layoutUpdateTimeout = React.useRef<any>(null);
  
  // Update handleLayoutChange function to handle all responsive layouts
  const handleLayoutChange = (currentLayout: LayoutItem[], allLayouts?: { [key: string]: LayoutItem[] }): void => {
    const validatedLayout = currentLayout.map(item => ({
      ...item,
      w: Math.max(item.w, 2), // Minimum width of 2
      h: Math.max(item.h, 2)  // Minimum height of 2
    }));

    // If we have all layouts from the responsive grid
    if (allLayouts) {
      // Use a timeout to debounce the layout update to prevent excessive state updates
      clearTimeout(layoutUpdateTimeout.current);
      layoutUpdateTimeout.current = setTimeout(() => {
        // Create a validated copy to prevent mutating the input
        const validatedLayouts = { ...allLayouts };
        
        // Ensure all breakpoints have layouts
        Object.keys(breakpoints).forEach(breakpoint => {
          if (!validatedLayouts[breakpoint]) {
            validatedLayouts[breakpoint] = validatedLayout;
          }
          
          // Enforce minimum sizes on all layouts
          validatedLayouts[breakpoint] = validatedLayouts[breakpoint].map(item => {
            return {
              ...item,
              w: Math.max(item.w, 2),
              h: Math.max(item.h, 2)
            };
          });
        });
        
        // Update layout state
        setLayouts(validatedLayouts);
        localStorage.setItem('boxento-layouts', JSON.stringify(validatedLayouts));
      }, 100); // 100ms debounce
    } else {
      // If we only have the current layout, update only the current breakpoint
      const updatedLayouts = { ...layouts };
      updatedLayouts[currentBreakpoint] = validatedLayout;
      setLayouts(updatedLayouts);
      localStorage.setItem('boxento-layouts', JSON.stringify(updatedLayouts));
    }
  };
  
  /**
   * Update a widget's configuration
   * @param widgetId The ID of the widget to update
   * @param newConfig New configuration object
   */
  const updateWidgetConfig = (widgetId: string, newConfig: any): void => {
    // Update widget in state
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, config: { ...widget.config, ...newConfig } }
        : widget
    ));
    
    // Save to configManager - excluding function properties
    const { onDelete, onUpdate, ...configToSave } = newConfig;
    configManager.saveWidgetConfig(widgetId, configToSave);
  };

  const renderWidget = (widget: Widget, isMobileView = false): React.ReactNode => {
    const WidgetComponent = getWidgetComponent(widget.type);
    
    if (!WidgetComponent) {
      return (
        <div className="widget-error">
          <p>Widget type "{widget.type}" not found</p>
        </div>
      );
    }
    
    // Find layout item for this widget
    const layoutItem = layouts[currentBreakpoint]?.find(item => item.i === widget.id);
    
    if (!layoutItem) {
      console.warn(`Layout item not found for widget ${widget.id}`);
      // Return widget with default dimensions if layout item not found
      return (
        <WidgetErrorBoundary children={
          <WidgetComponent
            width={2}
            height={2}
            config={{
              ...widget.config,
              onDelete: () => deleteWidget(widget.id),
              onUpdate: (newConfig: any) => updateWidgetConfig(widget.id, newConfig)
            }}
          />
        } />
      );
    }
    
    // Use the layout item dimensions for the widget
    return (
      <WidgetErrorBoundary children={
        <WidgetComponent
          width={isMobileView ? 2 : layoutItem.w} // On mobile, always 2
          height={isMobileView ? 2 : layoutItem.h} // On mobile, always 2
          config={{
            ...widget.config,
            onDelete: () => deleteWidget(widget.id),
            onUpdate: (newConfig: any) => updateWidgetConfig(widget.id, newConfig)
          }}
        />
      } />
    );
  };
  
  // Drag and resize event handlers
  const handleDragStart = (): void => {
    // Add a class to the body to indicate we're dragging
    document.body.classList.add('dragging');
    document.body.classList.add('react-grid-layout--dragging');
    
    // Log for debugging
    console.log('Drag started');
  };
  
  const handleDragStop = (): void => {
    // Remove classes
    document.body.classList.remove('dragging');
    document.body.classList.remove('react-grid-layout--dragging');
    
    // Force save the current layout state to ensure it's preserved
    const currentLayoutSnapshot = { ...layouts };
    localStorage.setItem('boxento-layouts', JSON.stringify(currentLayoutSnapshot));
    
    // Log for debugging
    console.log('Drag completed, layout saved');
  };
  
  const handleResizeStart = (): void => {
    document.body.classList.add('react-grid-layout--resizing');
  };
  
  const handleResizeStop = (): void => {
    document.body.classList.remove('react-grid-layout--resizing');
    
    // Force save after resize
    const currentLayoutSnapshot = { ...layouts };
    localStorage.setItem('boxento-layouts', JSON.stringify(currentLayoutSnapshot));
  };
  
  const toggleWidgetSelector = (): void => {
    setWidgetSelectorOpen(!widgetSelectorOpen);
  }
  
  // Handle escape key to close any open modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close any open modals
        if (widgetSelectorOpen) {
          setWidgetSelectorOpen(false);
        }
        // Add other modal closing logic here if needed in the future
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleEscapeKey);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [widgetSelectorOpen]);

  // Add this function to create a default layout for a widget
  const createDefaultLayoutItem = (
    widgetId: string, 
    index: number, 
    colCount: number,
    breakpoint: string
  ): LayoutItem => {
    // For desktop layouts (lg, md), create a grid layout
    if (breakpoint === 'lg' || breakpoint === 'md') {
      // Calculate a grid position that works well with vertical compacting
      // Place widgets side by side in rows of 4 (for lg screens)
      const maxItemsPerRow = Math.max(1, Math.floor(colCount / 3)); // 4 items per row for 12 cols
      const col = index % maxItemsPerRow;
      const row = Math.floor(index / maxItemsPerRow);
      
      return {
        i: widgetId,
        x: col * 3,
        y: row * 3,   // Ensure sufficient y-spacing for vertical compacting
        w: 3,         // Default width for desktop
        h: 3,         // Default height for desktop
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
        x: 0,         // Stack in a single column
        y: index * 2, // Position vertically based on index with a gap
        w: 2,         // Enforce 2x2 grid size for all widgets on mobile
        h: 2,         // Enforce 2x2 grid size for all widgets on mobile
        minW: 2,
        minH: 2,
        maxW: 2,      // Add maximum width constraint for mobile
        maxH: 2       // Add maximum height constraint for mobile
      };
    }
  };

  // In the useEffect that runs on app initialization, add this:
  // Ensure layouts exist for all widgets
  useEffect(() => {
    // Only run this if we have widgets but missing or empty layouts
    if (widgets.length > 0 && 
        (!layouts || 
         Object.keys(layouts).length === 0 || 
         Object.values(layouts).some(layout => layout.length === 0))) {
      
      console.log('Creating default layouts for widgets');
      
      // Create layouts for all breakpoints
      const newLayouts: { [key: string]: LayoutItem[] } = {};
      
      // For each breakpoint, create layout items for all widgets
      Object.keys(breakpoints).forEach(breakpoint => {
        const colsForBreakpoint = cols[breakpoint as keyof typeof cols];
        
        // Create layout items for each widget, using smart positioning based on breakpoint
        newLayouts[breakpoint] = widgets.map((widget, index) => 
          createDefaultLayoutItem(widget.id, index, colsForBreakpoint, breakpoint)
        );
      });
      
      // Update layouts state
      setLayouts(newLayouts);
      console.log('Default layouts created');
    }
  }, [widgets, layouts, breakpoints, cols]);

  // Instead of memoized widgets, we'll optimize in a different way
  const renderWidgetItems = () => {
    return widgets.map(widget => {
      // Find the layout data for this widget to pass as data-grid
      const layoutItem = layouts[currentBreakpoint]?.find(item => item.i === widget.id);
      
      // Always provide explicit positioning values
      const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'xxs';
      
      // For mobile, ensure widgets have appropriate height
      const dataGrid = {
        i: widget.id,
        x: layoutItem?.x ?? 0,
        y: layoutItem?.y ?? 0,
        w: layoutItem?.w ?? 2,
        h: isMobile ? 5 : (layoutItem?.h ?? 2), // Taller for mobile
        minW: layoutItem?.minW ?? 2,
        minH: isMobile ? 3 : (layoutItem?.minH ?? 2) // Minimum height higher for mobile
      };
      
      // Add different classes based on screen size
      const isTablet = currentBreakpoint === 'sm';
      const sizeClass = isMobile ? 'mobile-widget' : isTablet ? 'tablet-widget' : 'desktop-widget';
      
      return (
        <div 
          key={widget.id} 
          className={`widget-wrapper ${sizeClass}`} 
          data-grid={dataGrid}
          data-breakpoint={currentBreakpoint}
          style={isMobile ? { marginBottom: '16px', height: 'auto' } : undefined}
        >
          {renderWidget(widget, isMobile)}
        </div>
      );
    });
  };

  // Add debug logging for layout issues
  useEffect(() => {
    // Log layout information when the app starts
    console.log('Initial state - current breakpoint:', currentBreakpoint);
    
    // Check if layouts are properly defined for all breakpoints
    const missingLayouts = Object.keys(breakpoints).filter(bp => 
      !layouts[bp] || !Array.isArray(layouts[bp])
    );
    
    if (missingLayouts.length > 0) {
      console.warn(`Missing layouts for breakpoints: ${missingLayouts.join(', ')}`);
    }
    
    // Check if widgets have corresponding layout items
    const widgetsWithoutLayout = widgets.filter(widget => 
      !layouts[currentBreakpoint]?.some(item => item.i === widget.id)
    );
    
    if (widgetsWithoutLayout.length > 0) {
      console.warn(`Widgets without layout items: ${widgetsWithoutLayout.map(w => w.id).join(', ')}`);
    }
  }, [layouts, widgets, currentBreakpoint]);

  // Clean up orphaned layout items (layouts without corresponding widgets)
  useEffect(() => {
    // Only run cleanup if we have both widgets and layouts
    if (widgets.length > 0 && layouts && Object.keys(layouts).length > 0) {
      // Check if there are any orphaned layout items
      let hasOrphanedItems = false;
      const widgetIds = new Set(widgets.map(w => w.id));
      const cleanedLayouts = { ...layouts };
      
      // For each breakpoint, filter out layout items without a corresponding widget
      Object.keys(cleanedLayouts).forEach(breakpoint => {
        const originalLength = cleanedLayouts[breakpoint]?.length || 0;
        
        if (cleanedLayouts[breakpoint] && Array.isArray(cleanedLayouts[breakpoint])) {
          cleanedLayouts[breakpoint] = cleanedLayouts[breakpoint].filter(item => 
            widgetIds.has(item.i)
          );
          
          // Check if we removed any items
          if (cleanedLayouts[breakpoint].length < originalLength) {
            hasOrphanedItems = true;
          }
        }
      });
      
      // If we found orphaned items, update the layouts
      if (hasOrphanedItems) {
        console.log('Cleaning up orphaned layout items');
        setLayouts(cleanedLayouts);
        localStorage.setItem('boxento-layouts', JSON.stringify(cleanedLayouts));
      }
    }
  }, [widgets, layouts]);

  // Inside the App function component, add a special mobile view renderer
  const renderMobileLayout = () => {
    return (
      <div className="mobile-widget-list">
        {widgets.map(widget => (
          <div 
            key={widget.id} 
            className="mobile-widget-item"
          >
            {renderWidget(widget, true)}
          </div>
        ))}
      </div>
    );
  };

  // Load user's dashboard from Firebase when they log in
  useEffect(() => {
    const fetchUserDashboard = async () => {
      if (!currentUser) return;
      
      try {
        const savedDashboard = await loadDashboard(currentUser.uid);
        if (savedDashboard) {
          setLayouts(savedDashboard.layouts);
          setWidgets(savedDashboard.widgets);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };
    
    fetchUserDashboard();
  }, [currentUser]);
  
  // Save dashboard to Firebase when layouts or widgets change
  useEffect(() => {
    const saveDashboardToFirebase = async () => {
      if (!currentUser) return;
      
      // Don't save if there's no meaningful data
      if (Object.keys(layouts).length === 0 || widgets.length === 0) return;
      
      try {
        await saveDashboard(currentUser.uid, layouts, widgets);
      } catch (error) {
        console.error("Error saving dashboard:", error);
      }
    };
    
    // Debounce the save operation to avoid too many writes
    const timeoutId = setTimeout(saveDashboardToFirebase, 1000);
    return () => clearTimeout(timeoutId);
  }, [layouts, widgets, currentUser]);

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`} data-theme={theme}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
        <header className="app-header">
          <div className="header-container">
            <div className="header-left">
              <h1 className="app-title">Boxento</h1>
            </div>
            
            <div className="header-right">
              {currentUser ? (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm hidden md:inline">{currentUser.email}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => logout()}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAuthDialogOpen(true)}
                  className="flex items-center gap-1 mr-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden md:inline">Sign In</span>
                </Button>
              )}
              
              <button 
                onClick={toggleWidgetSelector}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 dark:bg-blue-600 text-white 
                         text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:bg-blue-600 dark:hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                title="Add Widget"
                aria-label="Add Widget"
              >
                <Plus size={16} className="transition-transform group-hover:rotate-90" />
                <span className="hidden sm:inline">Add Widget</span>
              </button>
              
              <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200
                         text-gray-700 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon size={16} className="text-slate-700" />
                ) : (
                  <Sun size={16} className="text-yellow-400" />
                )}
              </button>
            </div>
          </div>
        </header>
        
        <main className="pt-16 md:pt-20">
          <WidgetSelector 
            isOpen={widgetSelectorOpen}
            onClose={toggleWidgetSelector}
            onAddWidget={addWidget}
            widgetRegistry={WIDGET_REGISTRY}
            widgetCategories={widgetCategories}
          />
          
          <div className="px-6 max-w-[1600px] mx-auto">
            <div className="mobile-view-container">
              <div className="mobile-view">
                {renderMobileLayout()}
              </div>
            </div>
            
            <div className="desktop-view-container">
              <ResponsiveReactGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={breakpoints}
                cols={cols}
                rowHeight={rowHeight}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={(newBreakpoint: string, newCols: number) => {
                  if (newBreakpoint !== currentBreakpoint) {
                    console.log('Breakpoint changed:', newBreakpoint, newCols);
                    setCurrentBreakpoint(newBreakpoint);
                  }
                }}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                margin={[10, 10]}
                containerPadding={[10, 10]}
                draggableHandle=".widget-drag-handle"
                draggableCancel=".settings-button"
                useCSSTransforms={true}
                measureBeforeMount={false}
                compactType="vertical"
                verticalCompact={true}
                preventCollision={false}
                isResizable={true}
                isDraggable={true}
                isBounded={false}
                autoSize={true}
                transformScale={1}
                style={{ width: '100%', minHeight: '100%' }}
              >
                {renderWidgetItems()}
              </ResponsiveReactGridLayout>
            </div>
          </div>
        </main>

        {/* Auth Dialog */}
        <AuthDialog 
          isOpen={isAuthDialogOpen} 
          onClose={() => setIsAuthDialogOpen(false)} 
        />
      </div>
    </div>
  )
}

export default App