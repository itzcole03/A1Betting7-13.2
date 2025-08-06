import React, { useEffect, useState } from 'react';

interface PlayerAvatarProps {
  playerName: string;
  playerId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerName,
  playerId,
  size = 'md',
  className = '',
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Define size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-xl',
  };

  // URL formats to try in order of preference
  const getImageUrls = (id: string): string[] => {
    return [
      // MLB static format (confirmed working via curl test)
      `https://midfield.mlbstatic.com/v1/people/${id}/spots/120`,
      // Try larger resolution as backup
      `https://midfield.mlbstatic.com/v1/people/${id}/spots/240`,
      // Generic player silhouette as final fallback
      `https://midfield.mlbstatic.com/v1/people/generic/spots/120`,
    ];
  };

  // Get player initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Test image URLs sequentially
  useEffect(() => {
    if (!playerId) {
      setImageState('error');
      return;
    }

    const testImage = (urls: string[], index = 0): void => {
      if (index >= urls.length) {
        console.log(`[PlayerAvatar] All image URLs failed for ${playerName} (ID: ${playerId})`);
        setImageState('error');
        return;
      }

      const img = new Image();
      const url = urls[index];

      img.onload = () => {
        console.log(
          `[PlayerAvatar] ✅ Image loaded successfully for ${playerName} (ID: ${playerId}) from: ${url}`
        );
        setCurrentSrc(url);
        setImageState('loaded');
      };

      img.onerror = () => {
        console.log(
          `[PlayerAvatar] ❌ Image failed to load for ${playerName} (ID: ${playerId}) from: ${url}`
        );
        // Try next URL
        testImage(urls, index + 1);
      };

      console.log(
        `[PlayerAvatar] 🔄 Testing image URL for ${playerName} (ID: ${playerId}): ${url}`
      );
      img.src = url;
    };

    setImageState('loading');
    const urls = getImageUrls(playerId);
    testImage(urls);
  }, [playerId, playerName]);

  const baseClasses = `${sizeClasses[size]} rounded-full flex-shrink-0 ${className}`;

  // Show image if loaded successfully
  if (imageState === 'loaded' && currentSrc) {
    return (
      <img
        src={currentSrc}
        alt={playerName}
        className={`${baseClasses} object-cover border-2 border-green-500`}
        onError={() => {
          console.log(`[PlayerAvatar] ❌ Image error during display for ${playerName}`);
          setImageState('error');
        }}
        title={`${playerName} (ID: ${playerId}) - Image loaded`}
      />
    );
  }

  // Show loading state
  if (imageState === 'loading') {
    return (
      <div
        className={`${baseClasses} bg-blue-600 flex items-center justify-center text-white font-bold animate-pulse border-2 border-blue-400`}
        title={`${playerName} (ID: ${playerId}) - Loading image...`}
      >
        {getInitials(playerName)}
      </div>
    );
  }

  // Show fallback with initials (error state)
  return (
    <div
      className={`${baseClasses} bg-gray-700 flex items-center justify-center text-white font-bold border-2 border-gray-500`}
      title={`${playerName} (ID: ${playerId || 'N/A'}) - No image available`}
    >
      {getInitials(playerName)}
    </div>
  );
};

export default PlayerAvatar;
