import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Eye,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Check,
  Star,
  Zap,
  Crown,
  Trophy,
} from 'lucide-react';
import {
  THEMES,
  Theme,
  THEME_CATEGORIES,
  getThemeById,
  getThemesByCategory,
  applyCSSVariables,
  saveTheme,
  loadTheme,
  getSystemTheme,
  getRecommendedTheme,
} from '../../theme';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  showPreview?: boolean;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  isOpen,
  onToggle,
  showPreview = true,
  compact = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>([]);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  useEffect(() => {
    // Load favorite themes from localStorage
    const saved = localStorage.getItem('a1betting-favorite-themes');
    if (saved) {
      setFavoriteThemes(JSON.parse(saved));
    }

    // Load custom themes from localStorage
    const savedCustom = localStorage.getItem('a1betting-custom-themes');
    if (savedCustom) {
      setCustomThemes(JSON.parse(savedCustom));
    }
  }, []);

  const saveFavoriteThemes = (themes: string[]) => {
    setFavoriteThemes(themes);
    localStorage.setItem('a1betting-favorite-themes', JSON.stringify(themes));
  };

  const toggleFavorite = (themeId: string) => {
    const newFavorites = favoriteThemes.includes(themeId)
      ? favoriteThemes.filter(id => id !== themeId)
      : [...favoriteThemes, themeId];
    saveFavoriteThemes(newFavorites);
  };

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    saveTheme(themeId);
    setPreviewTheme(null);
  };

  const handleThemePreview = (themeId: string | null) => {
    if (!showPreview) return;

    setPreviewTheme(themeId);
    if (themeId) {
      const theme = getThemeById(themeId);
      if (theme) {
        applyCSSVariables(theme);
      }
    } else {
      // Restore current theme
      const theme = getThemeById(currentTheme);
      if (theme) {
        applyCSSVariables(theme);
      }
    }
  };

  const resetToSystemTheme = () => {
    const recommended = getRecommendedTheme();
    handleThemeSelect(recommended);
  };

  const exportThemes = () => {
    const data = {
      currentTheme,
      favoriteThemes,
      customThemes,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'a1betting-themes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.favoriteThemes) {
          saveFavoriteThemes(data.favoriteThemes);
        }
        if (data.customThemes) {
          setCustomThemes(data.customThemes);
          localStorage.setItem('a1betting-custom-themes', JSON.stringify(data.customThemes));
        }
        if (data.currentTheme) {
          handleThemeSelect(data.currentTheme);
        }
      } catch (error) {
        console.error('Failed to import themes:', error);
      }
    };
    reader.readAsText(file);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cyber':
        return <Zap className='w-4 h-4' />;
      case 'modern':
        return <Monitor className='w-4 h-4' />;
      case 'premium':
        return <Crown className='w-4 h-4' />;
      case 'sport':
        return <Trophy className='w-4 h-4' />;
      default:
        return <Palette className='w-4 h-4' />;
    }
  };

  const getThemeIcon = (theme: Theme) => {
    if (theme.category === 'cyber') return <Zap className='w-4 h-4' />;
    if (theme.category === 'premium') return <Crown className='w-4 h-4' />;
    if (theme.category === 'sport') return <Trophy className='w-4 h-4' />;
    return theme.isDark ? <Moon className='w-4 h-4' /> : <Sun className='w-4 h-4' />;
  };

  const filteredThemes =
    selectedCategory === 'all'
      ? THEMES
      : selectedCategory === 'favorites'
        ? THEMES.filter(theme => favoriteThemes.includes(theme.id))
        : getThemesByCategory(selectedCategory as any);

  const ThemeCard: React.FC<{ theme: Theme; isActive: boolean; isPreview: boolean }> = ({
    theme,
    isActive,
    isPreview,
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => handleThemePreview(theme.id)}
      onMouseLeave={() => handleThemePreview(null)}
      onClick={() => handleThemeSelect(theme.id)}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border-2 ${
        isActive
          ? 'border-cyan-400 bg-cyan-400/10'
          : isPreview
            ? 'border-purple-400 bg-purple-400/10'
            : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50'
      }`}
    >
      {/* Theme Preview */}
      <div className='relative mb-3 h-20 rounded-lg overflow-hidden'>
        <div className='absolute inset-0' style={{ background: theme.colors.background }} />
        <div className='absolute inset-0 flex items-center justify-center space-x-2'>
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: theme.colors.accent }} />
        </div>
        {theme.glassMorphism && (
          <div className='absolute inset-2 bg-white/10 backdrop-blur-sm rounded border border-white/20' />
        )}
      </div>

      {/* Theme Info */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {getThemeIcon(theme)}
            <h3 className='font-medium text-white'>{theme.name}</h3>
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              toggleFavorite(theme.id);
            }}
            className={`p-1 rounded transition-colors ${
              favoriteThemes.includes(theme.id)
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Star
              className={`w-4 h-4 ${favoriteThemes.includes(theme.id) ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        <p className='text-xs text-gray-400 line-clamp-2'>{theme.description}</p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-1'>
            {theme.animations && <Sparkles className='w-3 h-3 text-purple-400' />}
            {theme.glassMorphism && <Eye className='w-3 h-3 text-blue-400' />}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              theme.category === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-400'
                : theme.category === 'premium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : theme.category === 'sport'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {theme.category}
          </span>
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className='absolute top-2 right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center'>
          <Check className='w-4 h-4 text-black' />
        </div>
      )}
    </motion.div>
  );

  if (compact) {
    return (
      <div className='relative'>
        <button
          onClick={onToggle}
          className='flex items-center space-x-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-white transition-all'
        >
          <Palette className='w-4 h-4' />
          <span className='hidden sm:inline'>Theme</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className='absolute top-full right-0 mt-2 w-80 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 z-50'
            >
              <div className='grid grid-cols-2 gap-2'>
                {THEMES.slice(0, 4).map(theme => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={currentTheme === theme.id}
                    isPreview={previewTheme === theme.id}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  /* Open full theme selector */
                }}
                className='w-full mt-3 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors'
              >
                View All Themes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Theme Selector</h2>
          <p className='text-gray-400'>Customize your A1Betting experience</p>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={resetToSystemTheme}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors'
          >
            <RotateCcw className='w-4 h-4' />
            <span>System</span>
          </button>
          <button
            onClick={exportThemes}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors'
          >
            <Download className='w-4 h-4' />
            <span>Export</span>
          </button>
          <label className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer'>
            <Upload className='w-4 h-4' />
            <span>Import</span>
            <input type='file' accept='.json' onChange={importThemes} className='hidden' />
          </label>
        </div>
      </div>

      {/* Category Filter */}
      <div className='flex flex-wrap gap-2'>
        {[
          { id: 'all', label: 'All Themes', count: THEMES.length },
          { id: 'favorites', label: 'Favorites', count: favoriteThemes.length },
          ...THEME_CATEGORIES.filter(cat => cat.id !== 'all'),
        ].map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              selectedCategory === category.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
            }`}
          >
            {getCategoryIcon(category.id)}
            <span>{category.label}</span>
            <span className='text-xs opacity-70'>({category.count})</span>
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <motion.div
        layout
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      >
        <AnimatePresence>
          {filteredThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme === theme.id}
              isPreview={previewTheme === theme.id}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredThemes.length === 0 && (
        <div className='text-center py-12'>
          <Palette className='w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50' />
          <h3 className='text-lg font-medium text-gray-300 mb-2'>No themes found</h3>
          <p className='text-gray-400'>Try selecting a different category</p>
        </div>
      )}

      {/* Current Theme Info */}
      {previewTheme ||
        (currentTheme && (
          <div className='bg-slate-800/30 rounded-xl p-4 border border-slate-700/50'>
            <h3 className='text-lg font-bold text-white mb-3'>
              {previewTheme ? 'Previewing' : 'Current Theme'}
            </h3>
            {(() => {
              const theme = getThemeById(previewTheme || currentTheme);
              if (!theme) return null;

              return (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <div className='flex items-center space-x-2 mb-2'>
                      {getThemeIcon(theme)}
                      <span className='font-medium text-white'>{theme.name}</span>
                    </div>
                    <p className='text-sm text-gray-400 mb-3'>{theme.description}</p>
                    <div className='flex flex-wrap gap-2'>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme.isDark
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {theme.isDark ? 'Dark Mode' : 'Light Mode'}
                      </span>
                      {theme.animations && (
                        <span className='text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400'>
                          Animated
                        </span>
                      )}
                      {theme.glassMorphism && (
                        <span className='text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400'>
                          Glass Effect
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className='text-sm font-medium text-white mb-2'>Color Palette</h4>
                    <div className='grid grid-cols-3 gap-2'>
                      <div className='text-center'>
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span className='text-xs text-gray-400'>Primary</span>
                      </div>
                      <div className='text-center'>
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <span className='text-xs text-gray-400'>Secondary</span>
                      </div>
                      <div className='text-center'>
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                        <span className='text-xs text-gray-400'>Accent</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
    </div>
  );
};

export default ThemeSelector;
