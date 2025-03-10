import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Button } from '../../ui/button';
import { SpotifyWidgetProps, SpotifyWidgetConfig, PlaybackState, SpotifyTrack, SpotifyAuthState, WebPlaybackSDK } from './types';
import { Play, Pause, SkipBack, SkipForward, Music, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { 
  authorizeSpotify, 
  exchangeCodeForToken, 
  refreshAccessToken,
  initializeAuthState,
  saveAuthState,
  clearAuthState
} from './spotifyAuth';
import {
  getCurrentPlayback,
  getRecentlyPlayed,
  controlPlayback,
  skipToNext,
  skipToPrevious
} from './spotifyApi';
import {
  loadSpotifyWebPlaybackSDK,
  createSpotifyPlayer,
  convertWebPlaybackTrack
} from './spotifyWebPlayback';

/**
 * Size categories for widget content rendering
 */
enum WidgetSizeCategory {
  SMALL = 'small',         // 2x2
  WIDE_SMALL = 'wideSmall', // 3x2 
  TALL_SMALL = 'tallSmall', // 2x3
  MEDIUM = 'medium',       // 3x3
  WIDE_MEDIUM = 'wideMedium', // 4x3
  TALL_MEDIUM = 'tallMedium', // 3x4
  LARGE = 'large'          // 4x4
}

/**
 * Spotify Widget Component
 * 
 * Displays currently playing Spotify track and playback controls,
 * with options to show recently played tracks in larger sizes.
 * 
 * @param {SpotifyWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: SpotifyWidgetConfig = {
    title: 'Spotify',
    showControls: true,
    showRecentlyPlayed: true,
    useWebPlaybackSDK: true
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<SpotifyWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    isAuthenticating: false
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [player, setPlayer] = useState<WebPlaybackSDK | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  
  // Refs for timeouts and intervals
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const tokenRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: SpotifyWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);
  
  // Initialize auth state from stored tokens on mount
  useEffect(() => {
    if (config?.id) {
      // Initialize from localStorage
      const initialAuthState = initializeAuthState(config.id);
      setAuthState(initialAuthState);
      
      // If there's config.auth from props, use that
      if (config.auth) {
        setAuthState(prev => ({
          ...prev,
          ...config.auth
        }));
      }
    }
  }, [config?.id]);
  
  // Save auth state to config when it changes
  useEffect(() => {
    if (config?.onUpdate && config.id && authState) {
      // Only update auth in configuration after successful authentication
      if (authState.isAuthenticated || (authState.refreshToken && !authState.isAuthenticating)) {
        saveAuthState(config.id, authState);
        
        config.onUpdate({
          ...localConfig,
          auth: authState
        });
      }
    }
  }, [authState, config, localConfig]);
  
  // Set up automatic token refresh
  useEffect(() => {
    const setupTokenRefresh = () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
      
      if (authState.accessToken && authState.expiresAt && authState.refreshToken) {
        const now = Date.now();
        const expiresAt = authState.expiresAt;
        
        // Refresh token 5 minutes before it expires
        const refreshDelay = Math.max(0, expiresAt - now - 5 * 60 * 1000);
        
        tokenRefreshTimeoutRef.current = setTimeout(() => {
          refreshTokens();
        }, refreshDelay);
      }
    };
    
    setupTokenRefresh();
    
    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
    };
  }, [authState.accessToken, authState.expiresAt, authState.refreshToken]);
  
  // Initialize Web Playback SDK if enabled and authenticated
  useEffect(() => {
    let isMounted = true;
    
    const initPlayer = async () => {
      if (!authState.isAuthenticated || !authState.accessToken || !localConfig.useWebPlaybackSDK) {
        return;
      }
      
      try {
        // Load the SDK
        await loadSpotifyWebPlaybackSDK();
        
        // Create player instance
        const newPlayer = await createSpotifyPlayer(
          'Boxento Spotify Player',
          authState.accessToken
        );
        
        // Set up player state change listener
        newPlayer.addListener('player_state_changed', state => {
          if (!state) return;
          
          // Convert to our internal format
          const track = state.track_window.current_track;
          if (track) {
            setPlaybackState({
              isPlaying: !state.paused,
              currentTrack: convertWebPlaybackTrack(track),
              progress: state.position,
              device: 'Boxento Player'
            });
          }
        });
        
        // Handle ready event to capture device ID
        newPlayer.addListener('ready', ({ device_id }) => {
          if (isMounted) {
            setDeviceId(device_id);
            setPlayer(newPlayer);
          }
        });
        
        console.log('Spotify Web Playback SDK initialized');
      } catch (err) {
        console.error('Failed to initialize Spotify Web Playback SDK:', err);
        // Fall back to normal API mode if SDK fails
      }
    };
    
    initPlayer();
    
    return () => {
      isMounted = false;
      // Clean up player when component unmounts
      if (player) {
        player.disconnect();
      }
    };
  }, [authState.isAuthenticated, authState.accessToken, localConfig.useWebPlaybackSDK]);
  
  // Refresh tokens when auth state changes or token expires
  const refreshTokens = () => {
    if (!authState.refreshToken) {
      return;
    }
    
    const doRefresh = async () => {
      try {
        const tokenResponse = await refreshAccessToken(
          authState.refreshToken!,
          localConfig.clientId
        );
        
        // Update auth state with new access token and expiry
        setAuthState(prev => ({
          ...prev,
          accessToken: tokenResponse.access_token,
          // If we get a new refresh token, use it, otherwise keep the old one
          refreshToken: tokenResponse.refresh_token || prev.refreshToken,
          expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
          isAuthenticated: true,
          isAuthenticating: false
        }));
        
        setAuthError(null);
      } catch (err) {
        console.error('Error refreshing token:', err);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isAuthenticating: false
        }));
        setAuthError('Failed to refresh authentication token');
      }
    };
    
    doRefresh();
  };
  
  // Fetch data when auth state changes
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    const fetchData = async () => {
      if (authState.isAuthenticated && authState.accessToken) {
        setIsLoading(true);
        setError(null);
        
        try {
          // Skip fetching playback if using Web Playback SDK
          if (!player) {
            // Fetch current playback
            const playback = await getCurrentPlayback(authState.accessToken);
            setPlaybackState(playback);
          }
          
          // Fetch recently played if enabled
          if (localConfig.showRecentlyPlayed) {
            const recent = await getRecentlyPlayed(authState.accessToken);
            setRecentlyPlayed(recent);
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error fetching Spotify data:', err);
          
          // Handle token expiration error
          if (err instanceof Error && err.message === 'Authentication token expired') {
            if (authState.refreshToken) {
              // Try to refresh the token
              refreshTokens();
            } else {
              setAuthState(prev => ({
                ...prev,
                isAuthenticated: false
              }));
              setError('Authentication token expired. Please reconnect your Spotify account.');
            }
          } else {
            setError(`Failed to fetch Spotify data: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          
          setIsLoading(false);
        }
      } else if (!authState.isAuthenticating) {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling interval for current playback (not needed if using Web Playback SDK)
    if (authState.isAuthenticated && authState.accessToken && !player) {
      pollIntervalRef.current = setInterval(fetchData, 30000); // Poll every 30 seconds
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [
    authState.isAuthenticated, 
    authState.accessToken, 
    authState.isAuthenticating,
    localConfig.showRecentlyPlayed,
    player
  ]);
  
  // Start Spotify OAuth flow
  const startSpotifyAuth = async () => {
    setAuthError(null);
    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true
    }));
    
    try {
      // Open popup for Spotify authorization
      const authCode = await authorizeSpotify(localConfig.clientId);
      
      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForToken(
        authCode,
        localConfig.clientId
      );
      
      // Update auth state with tokens
      setAuthState({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        isAuthenticated: true,
        isAuthenticating: false
      });
      
    } catch (err) {
      console.error('Authentication error:', err);
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false
      });
      setAuthError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Logout from Spotify
  const handleLogout = () => {
    // Clean up player if exists
    if (player) {
      player.disconnect();
      setPlayer(null);
      setDeviceId(null);
    }
    
    // Clear tokens from state
    setAuthState({
      isAuthenticated: false,
      isAuthenticating: false
    });
    
    // Clear from storage
    if (config?.id) {
      clearAuthState(config.id);
    }
    
    // Reset playback state
    setPlaybackState({ isPlaying: false });
    setRecentlyPlayed([]);
  };
  
  /**
   * Determines the appropriate size category based on width and height
   */
  const getWidgetSizeCategory = (width: number, height: number): WidgetSizeCategory => {
    if (width >= 4 && height >= 4) {
      return WidgetSizeCategory.LARGE;
    } else if (width >= 4 && height >= 3) {
      return WidgetSizeCategory.WIDE_MEDIUM;
    } else if (width >= 3 && height >= 4) {
      return WidgetSizeCategory.TALL_MEDIUM;
    } else if (width >= 3 && height >= 3) {
      return WidgetSizeCategory.MEDIUM;
    } else if (width >= 3 && height >= 2) {
      return WidgetSizeCategory.WIDE_SMALL;
    } else if (width >= 2 && height >= 3) {
      return WidgetSizeCategory.TALL_SMALL;
    } else {
      return WidgetSizeCategory.SMALL;
    }
  };
  
  /**
   * Handles play/pause button click
   */
  const handlePlayPause = async () => {
    if (!authState.accessToken) return;
    
    try {
      if (player) {
        // Use Web Playback SDK
        if (playbackState.isPlaying) {
          await player.pause();
        } else {
          await player.resume();
        }
      } else {
        // Use API
        await controlPlayback(
          authState.accessToken,
          !playbackState.isPlaying
        );
        
        // Optimistically update state (will be corrected on next poll)
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: !prev.isPlaying
        }));
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      
      // Handle token expiration
      if (err instanceof Error && err.message === 'Authentication token expired') {
        if (authState.refreshToken) {
          refreshTokens();
        }
      } else {
        setError(`Failed to control playback: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };
  
  /**
   * Handles skip to next track
   */
  const handleSkipNext = async () => {
    if (!authState.accessToken) return;
    
    try {
      if (player) {
        // Use Web Playback SDK
        await player.nextTrack();
      } else {
        // Use API
        await skipToNext(authState.accessToken);
        
        // Will update state on next poll
        setTimeout(() => {
          if (authState.accessToken) {
            getCurrentPlayback(authState.accessToken)
              .then(setPlaybackState)
              .catch(console.error);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error skipping to next track:', err);
      
      // Handle token expiration
      if (err instanceof Error && err.message === 'Authentication token expired') {
        if (authState.refreshToken) {
          refreshTokens();
        }
      } else {
        setError(`Failed to skip track: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };
  
  /**
   * Handles skip to previous track
   */
  const handleSkipPrevious = async () => {
    if (!authState.accessToken) return;
    
    try {
      if (player) {
        // Use Web Playback SDK
        await player.previousTrack();
      } else {
        // Use API
        await skipToPrevious(authState.accessToken);
        
        // Will update state on next poll
        setTimeout(() => {
          if (authState.accessToken) {
            getCurrentPlayback(authState.accessToken)
              .then(setPlaybackState)
              .catch(console.error);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error skipping to previous track:', err);
      
      // Handle token expiration
      if (err instanceof Error && err.message === 'Authentication token expired') {
        if (authState.refreshToken) {
          refreshTokens();
        }
      } else {
        setError(`Failed to skip track: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };
  
  /**
   * Format milliseconds to mm:ss format
   */
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Calculate progress percentage
   */
  const calculateProgress = (): number => {
    if (!playbackState.currentTrack?.duration || !playbackState.progress) return 0;
    return (playbackState.progress / playbackState.currentTrack.duration) * 100;
  };
  
  /**
   * Renders the now playing view with track info and controls
   */
  const renderNowPlaying = () => {
    const { currentTrack } = playbackState;
    
    if (!currentTrack) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Music className="w-8 h-8 mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">
            {player ? 'Ready to play' : 'Not currently playing'}
          </p>
          {player && deviceId && (
            <p className="text-xs text-gray-400 mt-1">Boxento Player active</p>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-2">
          {currentTrack.albumArt ? (
            <img 
              src={currentTrack.albumArt} 
              alt={`${currentTrack.album} cover`} 
              className="w-12 h-12 rounded mr-3"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded mr-3 flex items-center justify-center">
              <Music className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{currentTrack.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentTrack.artist}</p>
            {deviceId && (
              <p className="text-xs text-green-500 mt-1">Playing on Boxento</p>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
          <div 
            className="h-full bg-green-500 rounded-full" 
            style={{ width: `${calculateProgress()}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={calculateProgress()}
            role="progressbar"
          ></div>
        </div>
        
        {/* Time indicators */}
        {playbackState.progress && (
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{formatTime(playbackState.progress)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        )}
        
        {/* Playback controls */}
        {localConfig.showControls && (
          <div className="flex items-center justify-center space-x-4 mt-auto">
            <button 
              onClick={handleSkipPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="size-5" />
            </button>
            <button 
              onClick={handlePlayPause}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
              aria-label={playbackState.isPlaying ? "Pause" : "Play"}
            >
              {playbackState.isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>
            <button 
              onClick={handleSkipNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="size-5" />
            </button>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Renders the recently played tracks
   */
  const renderRecentlyPlayed = () => {
    if (!localConfig.showRecentlyPlayed || recentlyPlayed.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Recently Played</h3>
        <div className="space-y-2">
          {recentlyPlayed.slice(0, 3).map(track => (
            <div key={track.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              {track.albumArt ? (
                <img 
                  src={track.albumArt} 
                  alt={`${track.album} cover`} 
                  className="w-10 h-10 rounded mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded mr-3 flex items-center justify-center">
                  <Music className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{track.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  /**
   * Renders the full-size view with more recently played tracks
   */
  const renderFullRecentlyPlayed = () => {
    if (!localConfig.showRecentlyPlayed || recentlyPlayed.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Recently Played</h3>
        <div className="grid grid-cols-2 gap-3">
          {recentlyPlayed.map(track => (
            <div key={track.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              {track.albumArt ? (
                <img 
                  src={track.albumArt} 
                  alt={`${track.album} cover`} 
                  className="w-10 h-10 rounded mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded mr-3 flex items-center justify-center">
                  <Music className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{track.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  /**
   * Renders the authentication view
   */
  const renderAuthView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Music className="w-12 h-12 mb-3 text-green-500" />
        <h3 className="text-lg font-medium mb-2">Connect to Spotify</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Log in to your Spotify account to display your current playback and control your music
        </p>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          onClick={startSpotifyAuth}
          aria-label="Connect to Spotify"
          disabled={authState.isAuthenticating}
        >
          {authState.isAuthenticating ? (
            <>
              <span className="inline-block mr-2 animate-spin">⟳</span>
              Connecting...
            </>
          ) : (
            'Connect to Spotify'
          )}
        </button>
      </div>
    );
  };
  
  /**
   * Renders the loading state
   */
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  };
  
  /**
   * Renders the error state
   */
  const renderError = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <div className="flex space-x-2">
          <button
            className="text-sm flex items-center text-blue-500 hover:underline"
            onClick={() => {
              if (authState.isAuthenticated && authState.accessToken) {
                setIsLoading(true);
                getCurrentPlayback(authState.accessToken)
                  .then(setPlaybackState)
                  .catch(console.error)
                  .finally(() => setIsLoading(false));
              }
            }}
            aria-label="Retry fetching playback data"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </button>
          
          <button
            className="text-sm flex items-center text-blue-500 hover:underline"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
          >
            Settings
          </button>
        </div>
      </div>
    );
  };
  
  /**
   * Main content renderer based on current size
   */
  const renderContent = () => {
    const sizeCategory = getWidgetSizeCategory(width, height);
    
    // If not authenticated, show auth view
    if (!authState.isAuthenticated) {
      return renderAuthView();
    }
    
    // If loading, show loading state
    if (isLoading) {
      return renderLoading();
    }
    
    // If error, show error state
    if (error) {
      return renderError();
    }
    
    // Render based on size category
    switch (sizeCategory) {
      case WidgetSizeCategory.SMALL:
        return renderNowPlaying();
        
      case WidgetSizeCategory.WIDE_SMALL:
      case WidgetSizeCategory.MEDIUM:
        return (
          <>
            {renderNowPlaying()}
            {renderRecentlyPlayed()}
          </>
        );
        
      case WidgetSizeCategory.TALL_SMALL:
      case WidgetSizeCategory.TALL_MEDIUM:
        return (
          <>
            {renderNowPlaying()}
            {renderRecentlyPlayed()}
          </>
        );
        
      case WidgetSizeCategory.WIDE_MEDIUM:
      case WidgetSizeCategory.LARGE:
        return (
          <>
            {renderNowPlaying()}
            {renderFullRecentlyPlayed()}
          </>
        );
        
      default:
        return renderNowPlaying();
    }
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };
  
  // Settings dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spotify Widget Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title setting */}
            <div className="space-y-2">
              <Label htmlFor="title-input">Widget Title</Label>
              <Input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, title: e.target.value})
                }
              />
            </div>
            
            {/* Authentication status */}
            <div className="pt-2 pb-1">
              <h3 className="text-sm font-medium mb-2">Authentication Status</h3>
              {authState.isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Connected to Spotify</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Not connected to Spotify</p>
                  </div>
                  
                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mb-2">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        {authError}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-white w-full"
                    disabled={authState.isAuthenticating}
                    onClick={startSpotifyAuth}
                  >
                    {authState.isAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      'Connect to Spotify'
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Web Playback SDK Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="webplayback-toggle">
                <div>
                  <span>Use Web Playback SDK</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a Spotify player directly in this widget
                  </p>
                </div>
              </Label>
              <Switch
                id="webplayback-toggle"
                checked={localConfig.useWebPlaybackSDK || false}
                onCheckedChange={(checked: boolean) => 
                  setLocalConfig({...localConfig, useWebPlaybackSDK: checked})
                }
              />
            </div>
            
            {/* Show Controls Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="controls-toggle">Show Playback Controls</Label>
              <Switch
                id="controls-toggle"
                checked={localConfig.showControls || false}
                onCheckedChange={(checked: boolean) => 
                  setLocalConfig({...localConfig, showControls: checked})
                }
              />
            </div>
            
            {/* Show Recently Played Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="recent-toggle">Show Recently Played</Label>
              <Switch
                id="recent-toggle"
                checked={localConfig.showRecentlyPlayed || false}
                onCheckedChange={(checked: boolean) => {
                  setLocalConfig({...localConfig, showRecentlyPlayed: checked});
                  
                  // Fetch recently played if toggling on and authenticated
                  if (checked && authState.isAuthenticated && authState.accessToken) {
                    getRecentlyPlayed(authState.accessToken)
                      .then(setRecentlyPlayed)
                      .catch(console.error);
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (config.onDelete) {
                      config.onDelete();
                    }
                  }}
                  aria-label="Delete this widget"
                >
                  Delete Widget
                </Button>
              )}
              <Button
                variant="default"
                onClick={saveSettings}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Main render
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col relative">
      <WidgetHeader 
        title={localConfig.title || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default SpotifyWidget; 