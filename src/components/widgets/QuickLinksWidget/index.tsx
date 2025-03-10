import React, { useState, useRef } from 'react'
import { ExternalLink, Plus, Trash, Edit } from 'lucide-react'
import WidgetHeader from '../../widgets/common/WidgetHeader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog'
import { Input } from '@/components/ui/input'
import { QuickLinksWidgetProps, LinkItem, QuickLinksWidgetConfig } from './types'
import './styles.css'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'

/**
 * Fetches metadata from a URL including title and favicon
 * @param url The URL to fetch metadata from
 * @returns Promise with title and favicon extracted from favicon
 */
const fetchUrlMetadata = async (url: string): Promise<{ title: string; favicon: string }> => {
  try {
    // Validate and normalize the URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);

    // Get favicon using Google's favicon service
    const favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;

    // Try to fetch the page directly first
    try {
      const response = await fetch(normalizedUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Direct fetch failed');
      }
    } catch (error) {
      console.warn('Direct fetch failed, using fallback:', error);
    }

    // Use a more reliable service for metadata
    const response = await fetch(`https://jsonlink.io/api/extract?url=${encodeURIComponent(normalizedUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL metadata: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract the title from the response
    let title = data.title || '';
    
    // If no title is found, use the hostname
    if (!title) {
      title = urlObj.hostname;
    }

    return { 
      title: title.trim(),
      favicon
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    // Return a basic fallback using the URL's hostname
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return {
        title: urlObj.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      };
    } catch (e) {
      // If URL parsing fails, return the raw URL
      return {
        title: url,
        favicon: `https://www.google.com/s2/favicons?domain=unknown&sz=32`
      };
    }
  }
};

/**
 * QuickLinks Widget Component
 * 
 * A widget that displays a collection of customizable links for quick access.
 * Supports different layouts based on widget dimensions (minimum size 2x2) and provides a settings
 * interface for adding, editing, and removing links.
 * 
 * @component
 * @param {QuickLinksWidgetProps} props - Component props
 * @returns {JSX.Element} QuickLinks widget component
 */
const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({ width, height, config }) => {
  const [links, setLinks] = useState<LinkItem[]>(config?.links || []);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const newLinkInputRef = useRef<HTMLInputElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [loadingLinkIds, setLoadingLinkIds] = useState<number[]>([]);

  // Check if there are any links in the configuration
  React.useEffect(() => {
    if (config?.links) {
      setLinks(config.links);
    }
  }, [config]);
  
  /**
   * Adds or updates a link in the links collection
   * 
   * If the editingLink has an id, it updates the existing link.
   * Otherwise, it creates a new link with a unique id.
   */
  const addLink = () => {
    if (editingLink && editingLink.title && editingLink.url) {
      let updatedLinks: LinkItem[];

      if (editingLink.id) {
        // Update existing link
        updatedLinks = links.map(link => 
          link.id === editingLink.id ? editingLink : link
        );
      } else {
        // Add new link
        const newId = Math.max(0, ...links.map(link => link.id)) + 1;
        updatedLinks = [...links, { ...editingLink, id: newId }];
      }

      // Update state
      setLinks(updatedLinks);
      
      // Save using onUpdate callback to persist
      if (config?.onUpdate) {
        config.onUpdate({
          ...config,
          links: updatedLinks
        });
      }
      
      setEditingLink(null);
    }
  }

  /**
   * Removes a link from the links collection
   * 
   * @param {number} id - The id of the link to remove
   */
  const removeLink = (id: number) => {
    const updatedLinks = links.filter(link => link.id !== id);
    
    // Update state
    setLinks(updatedLinks);
    
    // Save using onUpdate callback to persist
    if (config?.onUpdate) {
      config.onUpdate({
        ...config,
        links: updatedLinks
      });
    }
  }

  /**
   * Starts editing a link or creates a new one
   * 
   * @param {LinkItem | null} link - The link to edit, or null to create a new one
   */
  const startEdit = (link: LinkItem | null = null) => {
    setEditingLink(link || { id: 0, title: '', url: '', favicon: '' }) // Use a blue color that works in both light/dark modes
  }

  /**
   * Adds a new link from the quick input
   */
  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawUrl = newLinkUrl.trim();
    if (!rawUrl) return;

    // Generate new ID outside try block
    const newId = Math.max(0, ...links.map(link => link.id)) + 1;

    try {
      // Validate and normalize the URL
      let normalizedUrl = rawUrl;
      if (!rawUrl.match(/^https?:\/\//)) {
        normalizedUrl = `https://${rawUrl}`;
      }

      // Basic URL validation
      try {
        new URL(normalizedUrl);
      } catch (error) {
        console.error('Invalid URL:', error);
        return;
      }

      const urlObj = new URL(normalizedUrl);
      // Add link immediately with basic info
      const newLink: LinkItem = {
        id: newId,
        url: normalizedUrl,
        title: urlObj.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      };

      // Update state and clear input
      setLinks(prev => [...prev, newLink]);
      setNewLinkUrl('');
      setLoadingLinkIds(prev => [...prev, newId]);

      // Focus the input field after adding
      if (newLinkInputRef.current) {
        newLinkInputRef.current.focus();
      }

      // Update config with basic info
      if (config?.onUpdate) {
        config.onUpdate({
          ...config,
          links: [...links, newLink]
        });
      }

      // Fetch metadata asynchronously
      try {
        const metadata = await fetchUrlMetadata(normalizedUrl);
        
        // Only update if the title is different from the hostname
        if (metadata.title !== newLink.title) {
          const finalLink = {
            ...newLink,
            title: metadata.title,
            favicon: metadata.favicon
          };

          setLinks(prevLinks => 
            prevLinks.map(link => 
              link.id === newId ? finalLink : link
            )
          );

          // Update config with final metadata
          if (config?.onUpdate) {
            config.onUpdate({
              ...config,
              links: links.map(link => 
                link.id === newId ? finalLink : link
              )
            });
          }
        }
      } catch (error) {
        console.error('Error fetching link metadata:', error);
        // Link is already added with basic info, so we just remove the loading state
      }
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setLoadingLinkIds(prev => prev.filter(id => id !== newId));
    }
  };

  /**
   * Renders the main content of the widget
   */
  const renderContent = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No links yet. Add one below!</p>
            </div>
          ) : (
            <div className="space-y-2 pr-1">
              {links.map(link => (
                <a 
                  key={link.id}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all relative text-gray-800 dark:text-gray-100 group ${
                    loadingLinkIds.includes(link.id) ? 'opacity-50' : ''
                  }`}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  aria-label={`Visit ${link.title} at ${link.url}`}
                >
                  <img 
                    src={link.favicon}
                    alt=""
                    className={`size-4 mr-2.5 ${
                      loadingLinkIds.includes(link.id) ? 'animate-pulse' : ''
                    }`}
                    loading="lazy"
                  />
                  <span className="font-medium flex-grow truncate">
                    {loadingLinkIds.includes(link.id) ? 'Loading...' : link.title}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(link);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={`Edit ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeLink(link.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      aria-label={`Remove ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Trash size={14} />
                    </button>
                    <ExternalLink size={14} className="text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Integrated add link form */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form 
            onSubmit={handleQuickAdd}
            className="flex items-center gap-2"
          >
            <Input
              ref={newLinkInputRef}
              type="url"
              value={newLinkUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLinkUrl(e.target.value)}
              placeholder="Paste a URL and press Enter..."
              className="flex-grow"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              disabled={!newLinkUrl.trim() || isLoading}
              aria-label="Add link"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={widgetRef} 
      className="widget-container quicklinks-widget h-full flex flex-col rounded-lg shadow overflow-hidden"
    >
      <WidgetHeader 
        title="Quick Links" 
      />
      <div className="flex-1 overflow-hidden p-3">
        {renderContent()}
      </div>
      
      {/* Settings Dialog */}
      {showSettings && (
        <Dialog
          open={showSettings}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setShowSettings(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Widget Settings</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <div className="flex justify-between w-full pt-6 border-t border-gray-100 dark:border-gray-800">
                <div>
                  {config?.onDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (config.onDelete) {
                          config.onDelete();
                        }
                      }}
                    >
                      Delete Widget
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Link Dialog */}
      {editingLink && (
        <Dialog
          open={true}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingLink(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src={editingLink.favicon}
                  alt=""
                  className="size-5"
                  loading="lazy"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {editingLink.url}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-input">URL</Label>
                <Input 
                  id="url-input"
                  type="url" 
                  value={editingLink.url} 
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const url = e.target.value;
                    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                    const favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                    
                    setEditingLink({...editingLink, url, favicon});
                    
                    if (url && url.match(/^https?:\/\/.+/)) {
                      try {
                        const metadata = await fetchUrlMetadata(url);
                        setEditingLink(prev => ({
                          ...prev!,
                          url,
                          title: metadata.title,
                          favicon
                        }));
                      } catch (error) {
                        console.error('Error fetching URL metadata:', error);
                      }
                    }
                  }}
                  placeholder="https://google.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-input">Display Title</Label>
                <Input 
                  id="title-input"
                  type="text" 
                  value={editingLink.title} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, title: e.target.value})}
                  placeholder="Override auto-detected title"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={() => {
                    if (editingLink.url) {
                      addLink();
                      setEditingLink(null);
                    }
                  }}
                  disabled={!editingLink.url}
                >
                  {editingLink.id ? 'Update' : 'Add'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default QuickLinksWidget

// Export types for use in other files
export * from './types' 