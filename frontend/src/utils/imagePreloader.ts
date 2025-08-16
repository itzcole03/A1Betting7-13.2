/**
 * Image Preloader Utility
 * 
 * Provides utilities for handling image loading, preloading, and error recovery.
 * Helps prevent console warnings about failed image loads and improves UX.
 */

interface PreloadOptions {
  priority?: 'high' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials' | '';
  referrerPolicy?: string;
}

interface ImageState {
  loaded: boolean;
  error: boolean;
  loading: boolean;
  src: string;
}

// Cache for image loading states to prevent duplicate requests
const imageCache = new Map<string, ImageState>();

// Default fallback images for different contexts
const fallbackImages = {
  player: '/images/player-default.svg',
  team: '/images/team-default.svg',
  avatar: '/images/avatar-default.svg',
  logo: '/images/logo-default.svg',
} as const;

/**
 * Preload a single image with error handling
 * @param src Image source URL
 * @param options Preload options
 * @returns Promise that resolves when image loads or rejects on error
 */
export const preloadImage = (
  src: string, 
  options: PreloadOptions = {}
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = imageCache.get(src);
    if (cached?.loaded) {
      const img = new Image();
      img.src = src;
      resolve(img);
      return;
    }
    
    if (cached?.error) {
      reject(new Error(`Image failed to load: ${src}`));
      return;
    }

    // Set loading state
    imageCache.set(src, { loaded: false, error: false, loading: true, src });

    const img = new Image();
    
    // Set options
    if (options.crossOrigin) {
      img.crossOrigin = options.crossOrigin;
    }
    
    if (options.referrerPolicy) {
      img.referrerPolicy = options.referrerPolicy;
    }

    img.onload = () => {
      imageCache.set(src, { loaded: true, error: false, loading: false, src });
      resolve(img);
    };

    img.onerror = () => {
      imageCache.set(src, { loaded: false, error: true, loading: false, src });
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;
  });
};

/**
 * Preload multiple images concurrently
 * @param sources Array of image source URLs
 * @param options Preload options
 * @returns Promise that resolves when all images load (or fail)
 */
export const preloadImages = async (
  sources: string[], 
  options: PreloadOptions = {}
): Promise<{ loaded: HTMLImageElement[]; failed: string[] }> => {
  const results = await Promise.allSettled(
    sources.map(src => preloadImage(src, options))
  );

  const loaded: HTMLImageElement[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      loaded.push(result.value);
    } else {
      failed.push(sources[index]);
    }
  });

  return { loaded, failed };
};

/**
 * Get a fallback image URL for a specific context
 * @param context The context type for the fallback
 * @returns Fallback image URL
 */
export const getFallbackImage = (
  context: keyof typeof fallbackImages
): string => {
  return fallbackImages[context];
};

/**
 * Smart image src with automatic fallback
 * Provides a src that automatically handles errors
 * @param primary Primary image source
 * @param fallbackContext Fallback context type
 * @returns Object with src and error handler
 */
export const createImageSrc = (
  primary: string | undefined | null, 
  fallbackContext: keyof typeof fallbackImages = 'avatar'
) => {
  const src = primary || getFallbackImage(fallbackContext);
  
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.src !== getFallbackImage(fallbackContext)) {
      target.src = getFallbackImage(fallbackContext);
      // Mark as error in cache
      if (primary) {
        imageCache.set(primary, { loaded: false, error: true, loading: false, src: primary });
      }
    }
  };

  return { src, onError: handleError };
};

/**
 * Check if an image is already loaded or cached
 * @param src Image source URL
 * @returns true if image is loaded and cached
 */
export const isImageCached = (src: string): boolean => {
  const cached = imageCache.get(src);
  return cached?.loaded === true;
};

/**
 * Clear the image cache (useful for testing or memory management)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};

/**
 * Get cache stats for debugging
 * @returns Cache statistics
 */
export const getImageCacheStats = () => {
  const stats = {
    total: imageCache.size,
    loaded: 0,
    error: 0,
    loading: 0
  };

  for (const state of imageCache.values()) {
    if (state.loaded) stats.loaded++;
    if (state.error) stats.error++;
    if (state.loading) stats.loading++;
  }

  return stats;
};

/**
 * Preload critical images for the application
 * This should be called during app initialization
 */
export const preloadCriticalImages = async (): Promise<void> => {
  const criticalImages = [
    '/vite.svg', // App favicon
    '/icon.png', // App icon
    // Add other critical images here
  ];

  try {
    const { failed } = await preloadImages(criticalImages, { priority: 'high' });
    
    if (failed.length > 0 && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to preload critical images:', failed);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Critical image preloading failed:', error);
    }
  }
};