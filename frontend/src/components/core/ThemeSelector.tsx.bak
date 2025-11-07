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
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'THE... Remove this comment to see the full error message
  THEMES,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'The... Remove this comment to see the full error message
  Theme,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'THE... Remove this comment to see the full error message
  THEME_CATEGORIES,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'get... Remove this comment to see the full error message
  getThemeById,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'get... Remove this comment to see the full error message
  getThemesByCategory,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'app... Remove this comment to see the full error message
  applyCSSVariables,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'sav... Remove this comment to see the full error message
  saveTheme,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'loa... Remove this comment to see the full error message
  loadTheme,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'get... Remove this comment to see the full error message
  getSystemTheme,
  // @ts-expect-error TS(2305): Module '"../../theme"' has no exported member 'get... Remove this comment to see the full error message
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

const _ThemeSelector: React.FC<ThemeSelectorProps> = ({
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
    const _saved = localStorage.getItem('a1betting-favorite-themes');
    if (saved) {
      setFavoriteThemes(JSON.parse(saved));
    }

    // Load custom themes from localStorage
    const _savedCustom = localStorage.getItem('a1betting-custom-themes');
    if (savedCustom) {
      setCustomThemes(JSON.parse(savedCustom));
    }
  }, []);

  const _saveFavoriteThemes = (themes: string[]) => {
    setFavoriteThemes(themes);
    localStorage.setItem('a1betting-favorite-themes', JSON.stringify(themes));
  };

  const _toggleFavorite = (themeId: string) => {
    const _newFavorites = favoriteThemes.includes(themeId)
      ? favoriteThemes.filter(id => id !== themeId)
      : [...favoriteThemes, themeId];
    saveFavoriteThemes(newFavorites);
  };

  const _handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    saveTheme(themeId);
    setPreviewTheme(null);
  };

  const _handleThemePreview = (themeId: string | null) => {
    if (!showPreview) return;

    setPreviewTheme(themeId);
    if (themeId) {
      const _theme = getThemeById(themeId);
      if (theme) {
        applyCSSVariables(theme);
      }
    } else {
      // Restore current theme
      const _theme = getThemeById(currentTheme);
      if (theme) {
        applyCSSVariables(theme);
      }
    }
  };

  const _resetToSystemTheme = () => {
    const _recommended = getRecommendedTheme();
    handleThemeSelect(recommended);
  };

  const _exportThemes = () => {
    const _data = {
      currentTheme,
      favoriteThemes,
      customThemes,
      timestamp: new Date().toISOString(),
    };

    const _blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const _url = URL.createObjectURL(blob);
    const _link = document.createElement('a');
    link.href = url;
    link.download = 'a1betting-themes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const _importThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const _file = event.target.files?.[0];
    if (!file) return;

    const _reader = new FileReader();
    reader.onload = e => {
      try {
        const _data = JSON.parse(e.target?.result as string);
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

  const _getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cyber':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Zap className='w-4 h-4' />;
      case 'modern':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Monitor className='w-4 h-4' />;
      case 'premium':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Crown className='w-4 h-4' />;
      case 'sport':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Trophy className='w-4 h-4' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Palette className='w-4 h-4' />;
    }
  };

  const _getThemeIcon = (theme: Theme) => {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (theme.category === 'cyber') return <Zap className='w-4 h-4' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (theme.category === 'premium') return <Crown className='w-4 h-4' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    if (theme.category === 'sport') return <Trophy className='w-4 h-4' />;
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return theme.isDark ? <Moon className='w-4 h-4' /> : <Sun className='w-4 h-4' />;
  };

  const _filteredThemes =
    selectedCategory === 'all'
      ? THEMES
      : selectedCategory === 'favorites'
        ? THEMES.filter((theme: unknown) => favoriteThemes.includes(theme.id))
        : getThemesByCategory(selectedCategory as unknown);

  const _ThemeCard: React.FC<{ theme: Theme; isActive: boolean; isPreview: boolean }> = ({
    theme,
    isActive,
    isPreview,
  }) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative mb-3 h-20 rounded-lg overflow-hidden'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0' style={{ background: theme.colors.background }} />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 flex items-center justify-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: theme.colors.secondary }}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: theme.colors.accent }} />
        </div>
        {theme.glassMorphism && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-2 bg-white/10 backdrop-blur-sm rounded border border-white/20' />
        )}
      </div>

      {/* Theme Info */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            {getThemeIcon(theme)}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='font-medium text-white'>{theme.name}</h3>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Star
              className={`w-4 h-4 ${favoriteThemes.includes(theme.id) ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p className='text-xs text-gray-400 line-clamp-2'>{theme.description}</p>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-1'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {theme.animations && <Sparkles className='w-3 h-3 text-purple-400' />}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {theme.glassMorphism && <Eye className='w-3 h-3 text-blue-400' />}
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute top-2 right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Check className='w-4 h-4 text-black' />
        </div>
      )}
    </motion.div>
  );

  if (compact) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={onToggle}
          className='flex items-center space-x-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-white transition-all'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Palette className='w-4 h-4' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='hidden sm:inline'>Theme</span>
        </button>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AnimatePresence>
          {isOpen && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className='absolute top-full right-0 mt-2 w-80 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 z-50'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-2 gap-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                {THEMES.slice(0, 4).map((theme: unknown) => <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={currentTheme === theme.id}
                  isPreview={previewTheme === theme.id}
                />)}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-2xl font-bold text-white'>Theme Selector</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Customize your A1Betting experience</p>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={resetToSystemTheme}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <RotateCcw className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>System</span>
          </button>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={exportThemes}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Download className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Export</span>
          </button>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <label className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Upload className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>Import</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input type='file' accept='.json' onChange={importThemes} className='hidden' />
          </label>
        </div>
      </div>

      {/* Category Filter */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex flex-wrap gap-2'>
        {[
          { id: 'all', label: 'All Themes', count: THEMES.length },
          { id: 'favorites', label: 'Favorites', count: favoriteThemes.length },
          ...THEME_CATEGORIES.filter((cat: unknown) => cat.id !== 'all'),
        ].map(category => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{category.label}</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-xs opacity-70'>({category.count})</span>
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        layout
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AnimatePresence>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {filteredThemes.map((theme: unknown) => <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme === theme.id}
            isPreview={previewTheme === theme.id}
          />)}
        </AnimatePresence>
      </motion.div>

      {filteredThemes.length === 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center py-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Palette className='w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-lg font-medium text-gray-300 mb-2'>No themes found</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Try selecting a different category</p>
        </div>
      )}

      {/* Current Theme Info */}
      {previewTheme ||
        (currentTheme && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='bg-slate-800/30 rounded-xl p-4 border border-slate-700/50'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-3'>
              {previewTheme ? 'Previewing' : 'Current Theme'}
            </h3>
            {(() => {
              const _theme = getThemeById(previewTheme || currentTheme);
              if (!theme) return null;

              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2 mb-2'>
                      {getThemeIcon(theme)}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium text-white'>{theme.name}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-400 mb-3'>{theme.description}</p>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex flex-wrap gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400'>
                          Animated
                        </span>
                      )}
                      {theme.glassMorphism && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400'>
                          Glass Effect
                        </span>
                      )}
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4 className='text-sm font-medium text-white mb-2'>Color Palette</h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-3 gap-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-xs text-gray-400'>Primary</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-xs text-gray-400'>Secondary</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-center'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className='w-8 h-8 rounded-full mx-auto mb-1'
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
