/**
 * useImagePreloader Hook
 * 
 * React hook for handling image preloading and error states.
 * Integrates with the imagePreloader utility for consistent image handling.
 */

import { useState, useEffect } from 'react';
import { 
  preloadImage, 
  createImageSrc, 
  isImageCached
} from '../utils/imagePreloader';

interface PreloadOptions {
  priority?: 'high' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials' | '';
  referrerPolicy?: string;
}

interface UseImageResult {
  src: string;
  isLoading: boolean;
  hasError: boolean;
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Hook for handling a single image with automatic preloading and fallback
 * @param imageSrc Primary image source
 * @param fallbackContext Fallback context for error handling
 * @param preloadOptions Options for preloading
 * @returns Image state and handlers
 */
export const useImage = (
  imageSrc: string | undefined | null,
  fallbackContext: 'player' | 'team' | 'avatar' | 'logo' = 'avatar',
  preloadOptions: PreloadOptions = {}
): UseImageResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { src, onError } = createImageSrc(imageSrc, fallbackContext);

  useEffect(() => {
    if (!imageSrc || isImageCached(imageSrc)) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    preloadImage(imageSrc, preloadOptions)
      .then(() => {
        setIsLoading(false);
        setHasError(false);
      })
      .catch(() => {
        setIsLoading(false);
        setHasError(true);
      });
  }, [imageSrc, preloadOptions]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    onError(event);
  };

  return {
    src,
    isLoading,
    hasError,
    onError: handleError
  };
};

/**
 * Hook for preloading multiple images
 * @param imageSources Array of image sources to preload
 * @param preloadOptions Options for preloading
 * @returns Preloading state and results
 */
export const useImagePreloader = (
  imageSources: (string | undefined | null)[],
  preloadOptions: PreloadOptions = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedSources, setFailedSources] = useState<string[]>([]);

  useEffect(() => {
    const validSources = imageSources.filter(Boolean) as string[];
    
    if (validSources.length === 0) {
      setIsLoading(false);
      setLoadedCount(0);
      setFailedSources([]);
      return;
    }

    // Check which images are already cached
    const uncachedSources = validSources.filter(src => !isImageCached(src));
    
    if (uncachedSources.length === 0) {
      setIsLoading(false);
      setLoadedCount(validSources.length);
      setFailedSources([]);
      return;
    }

    setIsLoading(true);
    setLoadedCount(0);
    setFailedSources([]);

    Promise.allSettled(
      uncachedSources.map(src => preloadImage(src, preloadOptions))
    ).then(results => {
      let loaded = 0;
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded++;
        } else {
          failed.push(uncachedSources[index]);
        }
      });

      // Add already cached images to loaded count
      const cachedCount = validSources.length - uncachedSources.length;
      setLoadedCount(loaded + cachedCount);
      setFailedSources(failed);
      setIsLoading(false);
    });
  }, [imageSources, preloadOptions]);

  return {
    isLoading,
    loadedCount,
    totalCount: imageSources.filter(Boolean).length,
    failedSources,
    progress: imageSources.length > 0 ? loadedCount / imageSources.filter(Boolean).length : 0
  };
};